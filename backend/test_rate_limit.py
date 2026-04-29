import requests
import time
import concurrent.futures

def make_request():
    url = "http://localhost:8000/api/v1/chat"
    payload = {
        "messages": [{"role": "user", "content": "Hello"}],
        "target_model": "google/gemma-7b-it:free",
        "mode": "standard"
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        return response.status_code
    except Exception as e:
        return str(e)

def main():
    print("Starting rate limit test...")
    # We need the server running! This test assumes uvicorn is running on localhost:8000
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_request) for _ in range(15)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    print(f"Results: {results}")
    if 429 in results:
        print("✅ SUCCESS: Rate limit (429) was triggered!")
    else:
        print("❌ FAILURE: Rate limit was NOT triggered. (Is the server running?)")

if __name__ == "__main__":
    main()
