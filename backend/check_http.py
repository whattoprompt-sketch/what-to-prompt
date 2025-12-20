
import urllib.request
def check():
    print("Pinging http.server on 8002...")
    try:
        with urllib.request.urlopen("http://127.0.0.1:8002/", timeout=2) as response:
            print(f"Status: {response.getcode()}")
            print("OK")
    except Exception as e:
        print(f"Failed: {e}")
if __name__ == "__main__":
    check()
