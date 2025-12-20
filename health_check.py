import requests
try:
    print("Pinging root...")
    r = requests.get("http://localhost:8000/", timeout=2)
    print(f"Root Status: {r.status_code}")
    print(f"Root Msg: {r.json()}")
    
    print("Pinging chat API...")
    payload = {"task": "test", "role": "tester", "target_model": "openai/gpt-4o-mini"}
    r = requests.post("http://localhost:8000/api/v1/chat", json=payload, timeout=10)
    print(f"Chat Status: {r.status_code}")
    # print(f"Chat Response: {r.text[:100]}...") # truncated
except Exception as e:
    print(f"Failed: {e}")
