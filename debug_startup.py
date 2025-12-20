
print("Starting debug_startup.py...")
try:
    print("Importing fastapi...")
    import fastapi
    print("Importing dotenv...")
    from dotenv import load_dotenv
    print("Loading dotenv...")
    load_dotenv()
    print("Importing main...")
    from backend import main
    print("Import main success!")
except Exception as e:
    print(f"Failed: {e}")
