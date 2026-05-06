import requests
import time

print("Testing login on 127.0.0.1...")
try:
    start = time.time()
    payload = {
        "email": "student@example.com",
        "password": "password123",
        "role": "student"
    }
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json=payload, timeout=10)
    print("Status:", res.status_code)
    print("Response:", res.text[:200])
    print("Time:", time.time() - start)
except Exception as e:
    print("Error:", e)
