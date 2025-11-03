# Realtor.com High-Throughput Scraper

- Async worker: `python -m worker.worker`
- Env: `AWS_REGION`, `QUEUE_URL`, `S3_BUCKET`, `PROXY_URL`, `[optional] GEMINI_API_KEY`
- Install: `python -m pip install -r requirements.txt`

Structure:
- worker/: async SQS consumer, proxy+headers, NDJSON to S3
- etl/: optional Gemini HTML ETL (legacy)
- infra/: (kept if present)
