import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    aws_region: str
    sqs_queue_url: str
    s3_bucket: str
    proxy_url: str | None
    gemini_api_key: str | None
    max_concurrency: int
    request_timeout_s: float
    retry_limit: int
    backoff_base_ms: int
    s3_prefix_records: str
    compress_codec: str


def load_settings() -> Settings:
    return Settings(
        aws_region=os.getenv("AWS_REGION", "us-east-2"),
        sqs_queue_url=os.getenv("QUEUE_URL", ""),
        s3_bucket=os.getenv("S3_BUCKET", ""),
        proxy_url=os.getenv("PROXY_URL"),
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        max_concurrency=int(os.getenv("MAX_CONCURRENCY", "200")),
        request_timeout_s=float(os.getenv("REQUEST_TIMEOUT_S", "25")),
        retry_limit=int(os.getenv("RETRY_LIMIT", "5")),
        backoff_base_ms=int(os.getenv("BACKOFF_BASE_MS", "250")),
        s3_prefix_records=os.getenv("S3_PREFIX_RECORDS", "records"),
        compress_codec=os.getenv("COMPRESS_CODEC", "zstd"),  # zstd|gzip
    )


