import requests
import time

print("Testing backend...")
try:
    start = time.time()
    res = requests.get("http://localhost:8000/api/v1/health", timeout=2)
    print("Status:", res.status_code)
    print("Time:", time.time() - start)
except Exception as e:
    print("Error:", e)
