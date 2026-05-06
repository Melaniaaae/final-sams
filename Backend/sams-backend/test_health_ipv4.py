import requests
import time

print("Testing backend on 127.0.0.1 with 10s timeout...")
try:
    start = time.time()
    res = requests.get("http://127.0.0.1:8000/api/v1/health", timeout=10)
    print("Status:", res.status_code)
    print("Time:", time.time() - start)
except Exception as e:
    print("Error:", e)
