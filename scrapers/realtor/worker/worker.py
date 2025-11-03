import asyncio
import gzip
import hashlib
import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Iterable
import logging

import aioboto3
import httpx
from bs4 import BeautifulSoup

from .config import load_settings
from .proxy import build_proxy_pool
from .fingerprint import build_headers

try:
    import zstandard as zstd  # type: ignore
except Exception:  # pragma: no cover
    zstd = None


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", "ignore")).hexdigest()


def _extract_listing_id(url: str) -> Optional[str]:
    # Heuristic placeholder; adapt to exact URL patterns as needed
    # e.g., https://www.realtor.com/realestateandhomes-detail/<slug>_<id>
    parts = url.split("_")
    return parts[-1] if len(parts) > 1 else None


def parse_listing_with_rules(html: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    data: Dict[str, Any] = {
        "price": None,
        "beds": None,
        "baths": None,
        "sqft": None,
        "lot_size_sqft": None,
        "address_street": None,
        "address_city": None,
        "address_state": None,
        "address_zip": None,
        "property_type": None,
        "year_built": None,
        "agent_name": None,
        "brokerage_name": None,
        "property_description": None,
    }
    # Basic fallbacks; rely on LLM when not found
    title = soup.find("title")
    if title and title.text:
        data["property_description"] = title.text.strip()
    # Realtor often embeds JSON-LD; try that first
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            obj = json.loads(script.string or "{}")
            if isinstance(obj, dict):
                if "address" in obj:
                    addr = obj["address"]
                    data["address_street"] = addr.get("streetAddress")
                    data["address_city"] = addr.get("addressLocality")
                    data["address_state"] = addr.get("addressRegion")
                    data["address_zip"] = addr.get("postalCode")
                if "floorSize" in obj and isinstance(obj["floorSize"], dict):
                    data["sqft"] = obj["floorSize"].get("value")
                if "numberOfRooms" in obj:
                    data["beds"] = obj.get("numberOfRooms")
                if "name" in obj and not data.get("property_description"):
                    data["property_description"] = obj.get("name")
            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, dict) and item.get("@type") == "SingleFamilyResidence":
                        addr = item.get("address", {})
                        data["address_street"] = addr.get("streetAddress")
                        data["address_city"] = addr.get("addressLocality")
                        data["address_state"] = addr.get("addressRegion")
                        data["address_zip"] = addr.get("postalCode")
        except Exception:
            continue
    return data


async def call_gemini(html: str, settings) -> Optional[Dict[str, Any]]:
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-pro")
        prompt = (
            "You are an expert real estate listing extraction bot. Read the provided HTML and return a compact JSON with these keys (missing => null). Include as much listing-specific info as available.\n"
            "Required keys: price, beds (int), baths (int), sqft (int), lot_size_sqft (int), address_street, address_city, address_state, address_zip, property_type, year_built, agent_name, brokerage_name, property_description.\n"
            "Also include: images (array of absolute URLs), is_foreclosure (bool), hoa_fee, property_taxes, days_on_market, mls_id, latitude, longitude, open_house (array of ISO8601 times or strings), virtual_tour_urls (array), parking, heating, cooling, flooring, amenities (array), year_renovated, listing_status, listing_source, school_info (array of objects), price_history (array), tax_history (array), lot_acres, county, parcel_number, unit_number, condo_fee, appliances (array).\n"
            "If a field is not present, return null. Use additional_attributes (object) to store any other key information specific to the listing not covered above."
        )
        # keep under token limits; chunk if needed (simple)
        html_chunk = html[:500_000]
        resp = await asyncio.to_thread(model.generate_content, [prompt, html_chunk])
        text = resp.text if hasattr(resp, "text") else None
        if not text:
            return None
        # try to find JSON in the response
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
    except Exception:
        return None
    return None


def _compress_ndjson(records: List[Dict[str, Any]], codec: str) -> bytes:
    payload = "\n".join(json.dumps(r, separators=(",", ":"), ensure_ascii=False) for r in records).encode("utf-8")
    if codec == "zstd" and zstd is not None:
        cctx = zstd.ZstdCompressor(level=10)
        return cctx.compress(payload)
    # fallback gzip
    return gzip.compress(payload, compresslevel=6)


async def fetch_url(client: httpx.AsyncClient, url: str, proxy: Optional[str], headers: Dict[str, str], timeout_s: float) -> str:
    for attempt in range(5):
        try:
            resp = await client.get(url, proxy=proxy, headers=headers, timeout=timeout_s, follow_redirects=True)
            if resp.status_code in (429, 500, 502, 503, 504):
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            resp.raise_for_status()
            return resp.text
        except Exception:
            if attempt == 4:
                raise
            await asyncio.sleep(0.5 * (attempt + 1))
    raise RuntimeError("unreachable")


def extract_listing_links(html: str) -> Iterable[str]:
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href:
            continue
        if "realtor.com" not in href:
            continue
        if "/realestateandhomes-detail/" in href:
            yield href


async def handle_message(session_sqs, session_s3, client: httpx.AsyncClient, msg: Dict[str, Any], settings, proxy_pool) -> Optional[Dict[str, Any]]:
    body = json.loads(msg.get("Body", "{}"))
    url = body.get("url_to_scrape")
    if not url:
        return None

    headers = build_headers()
    proxy = proxy_pool.select_proxy()
    html = await fetch_url(client, url, proxy=proxy, headers=headers, timeout_s=settings.request_timeout_s)

    # If this is a search/browse page, enqueue discovered listing URLs and return None
    if "/realestateandhomes-search/" in url or "/realestateandhomes" in url:
        links = list(extract_listing_links(html))
        if links:
            entries = [
                {
                    "Id": str(i),
                    "MessageBody": json.dumps({"url_to_scrape": l})
                }
                for i, l in enumerate(links[:10])  # batch enqueue a handful to avoid explosion
            ]
            try:
                await session_sqs.send_message_batch(QueueUrl=settings.sqs_queue_url, Entries=entries)
            except Exception:
                pass
        return None

    # parse with rules first
    record = parse_listing_with_rules(html)

    # If sparse, try Gemini inline
    if not any(v for v in record.values() if v):
        llm_rec = await call_gemini(html, settings)
        if llm_rec:
            record.update({k: llm_rec.get(k) for k in record.keys()})

    listing_id = _extract_listing_id(url) or _content_hash(url)[:12]
    now = datetime.utcnow().isoformat() + "Z"
    out = {
        "listing_id": listing_id,
        "url": url,
        "ts": now,
        "content_hash": _content_hash(html)[:16],
        "parser_used": "rules+llm" if any(record.values()) else "rules",
        "confidence": 0.8 if any(record.values()) else 0.4,
        **record,
    }
    return out


async def run_worker() -> None:
    settings = load_settings()
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    log = logging.getLogger("worker")
    proxy_pool = build_proxy_pool()

    buffer: List[Dict[str, Any]] = []
    buffer_lock = asyncio.Lock()
    buffer_max = 500
    buffer_flush_s = 10

    session = aioboto3.Session()
    async with session.client("sqs", region_name=settings.aws_region) as sqs, session.client("s3", region_name=settings.aws_region) as s3, httpx.AsyncClient(http2=True) as client:
        queue: asyncio.Queue = asyncio.Queue(maxsize=settings.max_concurrency * 2)

        async def receiver():
            while True:
                try:
                    resp = await sqs.receive_message(
                        QueueUrl=settings.sqs_queue_url,
                        MaxNumberOfMessages=10,
                        WaitTimeSeconds=int(os.getenv("SQS_WAIT_TIME_SECONDS", "5")),
                        VisibilityTimeout=90,
                    )
                    messages = resp.get("Messages", [])
                    if not messages:
                        # brief sleep to avoid tight loop when no messages
                        await asyncio.sleep(float(os.getenv("SQS_IDLE_SLEEP_S", "0.5")))
                        continue
                    for m in messages:
                        await queue.put(m)
                except Exception as e:
                    log.warning("receive error: %s", e)
                    await asyncio.sleep(1.0)

        async def worker_task(worker_id: int):
            while True:
                m = await queue.get()
                try:
                    rec = await handle_message(sqs, s3, client, m, settings, proxy_pool)
                    if isinstance(rec, dict):
                        async with buffer_lock:
                            buffer.append(rec)
                    # delete message after processing
                    try:
                        await sqs.delete_message(QueueUrl=settings.sqs_queue_url, ReceiptHandle=m["ReceiptHandle"])
                    except Exception as e:
                        log.warning("delete error: %s", e)
                except Exception as e:
                    log.warning("worker %d error: %s", worker_id, e)
                finally:
                    queue.task_done()

        async def flusher():
            last_flush = time.time()
            while True:
                await asyncio.sleep(1.0)
                now = time.time()
                async with buffer_lock:
                    if buffer and (len(buffer) >= buffer_max or (now - last_flush) > buffer_flush_s):
                        await flush_buffer(buffer, s3, settings)
                        log.info("flushed %d records", len(buffer))
                        buffer.clear()
                        last_flush = now

        recv_task = asyncio.create_task(receiver())
        workers = [asyncio.create_task(worker_task(i)) for i in range(settings.max_concurrency)]
        flush_task = asyncio.create_task(flusher())

        await asyncio.gather(recv_task, *workers, flush_task)


async def flush_buffer(buffer: List[Dict[str, Any]], s3, settings) -> None:
    if not buffer:
        return
    day = datetime.utcnow().strftime("%Y%m%d")
    ts = datetime.utcnow().strftime("%H%M%S")
    key = f"{settings.s3_prefix_records}/{day}/part-{ts}-{int(time.time()*1000)}.ndjson"

    blob = _compress_ndjson(buffer, settings.compress_codec)
    extra = {"ContentType": "application/x-ndjson"}
    if settings.compress_codec == "zstd" and zstd is not None:
        extra["ContentEncoding"] = "zstd"
        key += ".zst"
    else:
        extra["ContentEncoding"] = "gzip"
        key += ".gz"

    await s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=blob, **extra)


def main() -> None:
    asyncio.run(run_worker())


if __name__ == "__main__":
    main()


