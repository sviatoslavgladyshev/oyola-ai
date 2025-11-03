# Realtor_AWS.py
import os, json, boto3

QUEUE_URL = os.environ["QUEUE_URL"]
AWS_REGION = os.getenv("AWS_REGION", "us-east-2")

def send_task(url):
    print(f"Sending to {QUEUE_URL} in {AWS_REGION}")
    sqs = boto3.client("sqs", region_name=AWS_REGION)
    sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps({"url_to_scrape": url}))
    print(f"Sent task to queue: {url}")

if __name__ == "__main__":
    send_task("https://www.realtor.com/realestateandhomes-search/New-York_NY")