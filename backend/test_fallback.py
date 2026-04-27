import asyncio
import sys
import os
from pathlib import Path
from models.chat_models import ChatMessage
from services.llm_service import call_ai_with_fallback

async def main():
    print("Testing LLM Fallback Service...")
    messages = [
        ChatMessage(role="system", content="You are a helpful assistant."),
        ChatMessage(role="user", content="Say 'Hello, Fallback Service!' and nothing else.")
    ]
    
    print("\n--- Normal Run (Should use Groq) ---")
    response, error = await call_ai_with_fallback(messages, "google/gemma-7b-it:free")
    if error:
        print(f"Error: {error}")
    else:
        print(f"Response: {response}")

    print("\n--- Simulating Groq Failure (Should fallback to Gemini) ---")
    # Temporarily invalidate Groq key
    original_groq = os.environ.get("GROQ_API_KEY", "")
    import services.llm_service
    services.llm_service.GROQ_API_KEY = "invalid_key"
    
    response, error = await call_ai_with_fallback(messages, "google/gemma-7b-it:free")
    if error:
        print(f"Error: {error}")
    else:
        print(f"Response: {response}")
        
    print("\n--- Simulating Mistral Failure (Should fallback to Cohere) ---")
    # Restore Groq temporarily, invalidate groq and gemini and mistral
    services.llm_service.GROQ_API_KEY = "invalid_key"
    services.llm_service.GEMINI_API_KEY = "invalid_key"
    services.llm_service.MISTRAL_API_KEY = "invalid_key"
    
    response, error = await call_ai_with_fallback(messages, "google/gemma-7b-it:free")
    if error:
        print(f"Error: {error}")
    else:
        print(f"Response: {response}")
        
    print("\nFallback tests completed.")

if __name__ == "__main__":
    asyncio.run(main())
