
from fastapi import FastAPI
import uvicorn
import sys

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Minimal server works"}

if __name__ == "__main__":
    print("Starting minimal server...")
    uvicorn.run(app, host="127.0.0.1", port=8001) # Use different port 8001
