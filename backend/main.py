import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the router from our chat endpoint file (path fixed for Render)
from api.v1 import chat

# Create an instance of the FastAPI class
app = FastAPI(
    title="Prompt Alchemist API",
    description="The backend for a conversational prompt engineering assistant.",
    version="0.1.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware ---
# Load allowed origins from environment variable
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
# Include the router from our v1 chat API.
app.include_router(chat.router, prefix="/api/v1", tags=["v1"])


# --- API Endpoints ---
@app.get("/")
def read_root():
    """
    A simple welcome endpoint for our API.
    """
    return {"message": "Welcome to the Prompt Alchemist Backend! Let's create some magic. ✨"}
