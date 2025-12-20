
import urllib.request
import time

def check():
    print("Pinging minimal server on port 8001...")
    try:
        with urllib.request.urlopen("http://127.0.0.1:8001/", timeout=2) as response:
            print(f"Minimal Server Status: {response.getcode()}")
            print(f"Response: {response.read().decode()}")
    except Exception as e:
        print(f"Minimal Server Failed: {e}")

if __name__ == "__main__":
    check()
