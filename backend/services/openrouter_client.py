# backend/services/openrouter_client.py

import os
import httpx
from dotenv import load_dotenv
from typing import List
from pathlib import Path
from models.chat_models import ChatMessage


# --- Correctly load the .env file ---
dotenv_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# --- Define our app's identity ---
YOUR_SITE_URL = "https://whattoprompt.com"
YOUR_APP_TITLE = "Prompt Alchemist"

async def get_ai_response(messages: List[ChatMessage], model: str) -> str:
    """
    Sends a request to the OpenRouter API and gets a response.
    """
    if not OPENROUTER_API_KEY:
        print("❌ CRITICAL ERROR: OPENROUTER_API_KEY is missing!")
        raise Exception("OPENROUTER_API_KEY is not set. Please check server configuration.")

    print(f"📡 [OpenRouter] Preparing request for model: {model}...")
    
    # Debug: Print the last message content to verify input
    if messages:
        last_msg = messages[-1].content
        preview = last_msg[:50] + "..." if isinstance(last_msg, str) else "Complex Content"
        print(f"📝 [OpenRouter] Last message preview: {preview}")

    async with httpx.AsyncClient(timeout=60.0) as client: # Added explicit timeout
        try:
            print(f"🚀 [OpenRouter] Sending POST request to {API_URL}...")
            response = await client.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": YOUR_SITE_URL, 
                    "X-Title": YOUR_APP_TITLE,      
                },
                json={
                    "model": model,
                    "messages": [msg.model_dump() for msg in messages],
                },
            )
            
            print(f"📥 [OpenRouter] Response received! Status Code: {response.status_code}")
            
            if response.status_code != 200:
                error_body = response.text
                print(f"⚠️ [OpenRouter] Error Body: {error_body}")
                raise Exception(f"OpenRouter returned {response.status_code}: {error_body}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            print(f"✅ [OpenRouter] Success! Content length: {len(content)} chars")
            return content

        except httpx.TimeoutException:
            print("⏳ [OpenRouter] Request TIMED OUT (60s). OpenRouter might be slow or down.")
            raise Exception("Request timed out waiting for AI response.")
        except httpx.HTTPStatusError as e:
            error_details = e.response.text
            print(f"❌ [OpenRouter] HTTP Error: {error_details}")
            raise Exception(f"OpenRouter API error {e.response.status_code}: {error_details}")
        except Exception as e:
            print(f"💥 [OpenRouter] Unexpected Exception: {str(e)}")
            raise