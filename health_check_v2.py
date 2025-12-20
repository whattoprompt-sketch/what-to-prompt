
import urllib.request
import json
import time

def check():
    try:
        print("Pinging root...")
        with urllib.request.urlopen("http://127.0.0.1:8000/", timeout=2) as response:
            print(f"Root Status: {response.getcode()}")
            print(f"Root Msg: {response.read().decode()}")
    except Exception as e:
        print(f"Root Failed: {e}")

    try:
        print("Pinging chat API...")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/v1/chat",
            data=json.dumps({"task": "t", "role": "r", "target_model": "openai/gpt-4o-mini"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            print(f"Chat Status: {response.getcode()}")
    except Exception as e:
        print(f"Chat Failed: {e}")

if __name__ == "__main__":
    check()
