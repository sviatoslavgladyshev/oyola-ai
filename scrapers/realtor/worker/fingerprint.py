import random
import time
from typing import Dict

try:
    from fake_useragent import UserAgent
    _UA = UserAgent()
except Exception:
    _UA = None


ACCEPT_LANGS = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.8,es;q=0.6",
]


def random_user_agent() -> str:
    if _UA:
        try:
            return _UA.random
        except Exception:
            pass
    # Fallback curated list
    candidates = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ]
    return random.choice(candidates)


def build_headers() -> Dict[str, str]:
    # Minimal realistic header set for static page fetch
    ua = random_user_agent()
    lang = random.choice(ACCEPT_LANGS)
    t = str(int(time.time()))
    return {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": lang,
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "DNT": "1",
        "Sec-CH-UA": '"Chromium";v="124", "Not.A/Brand";v="24"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"macOS"',
        "Upgrade-Insecure-Requests": "1",
        "Referer": "https://www.google.com/search?q=realtor",
        "X-Request-Time": t,
    }


