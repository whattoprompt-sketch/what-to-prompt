# backend/services/llm_service.py

import os
import httpx
from typing import List, Tuple
from dotenv import load_dotenv
from pathlib import Path
from models.chat_models import ChatMessage
import logging

logger = logging.getLogger(__name__)

# --- Load the .env file ---
dotenv_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

# --- Load API Keys ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "").strip()
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "").strip()

YOUR_SITE_URL = "https://whattoprompt.com"
YOUR_APP_TITLE = "Prompt Alchemist"

# Map user-friendly model names to OpenRouter slugs
MODEL_MAPPING = {
    "ChatGPT": "openai/gpt-4o-mini",
    "Claude": "anthropic/claude-3-haiku",
    "Gemini": "google/gemini-2.0-flash-001",
    "Mistral": "mistralai/mistral-small",
    "Nous": "nousresearch/hermes-3-llama-3.1-70b",
    "DeepSeek": "deepseek/deepseek-chat-v3-0324:free",
    "Perplexity": "perplexity/sonar"
}

async def _call_groq(messages: List[ChatMessage], model: str = "llama-3.3-70b-versatile") -> str:
    """Calls Groq API. It uses OpenAI compatible format."""
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY missing")
    url = "https://api.groq.com/openai/v1/chat/completions"
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {"model": model, "messages": [{"role": msg.role, "content": str(msg.content)} for msg in messages]}
        logger.info(f"[Groq] Sending payload: model={model}, message_count={len(messages)}")
        response = await client.post(
            url,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=payload
        )
        if response.status_code != 200:
            logger.error(f"[Groq] Error {response.status_code}: {response.text}")
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def _call_gemini(messages: List[ChatMessage], model: str = "gemini-1.5-flash") -> str:
    """Calls Gemini REST API directly."""
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY missing")
    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    # Convert messages to Gemini format
    gemini_messages = []
    system_instruction = None
    for msg in messages:
        if msg.role == "system":
            system_instruction = {"parts": [{"text": str(msg.content)}]}
        else:
            role = "user" if msg.role == "user" else "model"
            gemini_messages.append({"role": role, "parts": [{"text": str(msg.content)}]})
            
    payload = {"contents": gemini_messages}
    if system_instruction:
        payload["systemInstruction"] = system_instruction  # Correct camelCase per Google REST API spec

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        if response.status_code != 200:
            logger.error(f"Gemini API Error: {response.text}")
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

async def _call_mistral(messages: List[ChatMessage], model: str = "mistral-large-latest") -> str:
    """Calls Mistral API directly."""
    if not MISTRAL_API_KEY:
        raise Exception("MISTRAL_API_KEY missing")
    url = "https://api.mistral.ai/v1/chat/completions"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={"Authorization": f"Bearer {MISTRAL_API_KEY}"},
            json={"model": model, "messages": [{"role": msg.role, "content": str(msg.content)} for msg in messages]}
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def _call_cohere(messages: List[ChatMessage], model: str = "command-r-plus") -> str:
    """Calls Cohere v2 API."""
    if not COHERE_API_KEY:
        raise Exception("COHERE_API_KEY missing")
    url = "https://api.cohere.com/v2/chat"
    
    # Convert messages to Cohere v2 format (OpenAI compatible)
    cohere_messages = [{"role": msg.role, "content": str(msg.content)} for msg in messages]
            
    payload = {
        "model": model,
        "messages": cohere_messages,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        if response.status_code != 200:
            logger.error(f"[Cohere] Error {response.status_code}: {response.text}")
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"][0]["text"]

async def _call_openrouter(messages: List[ChatMessage], model: str) -> str:
    """Calls OpenRouter API as fallback."""
    if not OPENROUTER_API_KEY:
        raise Exception("OPENROUTER_API_KEY missing")
    
    # Resolve the model slug
    openrouter_model = MODEL_MAPPING.get(model, model)
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": YOUR_SITE_URL,
                "X-Title": YOUR_APP_TITLE,
            },
            json={"model": openrouter_model, "messages": [{"role": msg.role, "content": str(msg.content)} for msg in messages]},
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def call_ai_with_fallback(messages: List[ChatMessage], primary_model: str) -> Tuple[str, str]:
    """
    Main entry point. Tries multiple providers in sequence to ensure delivery.
    Returns (response_text, error_string_if_failed_completely)
    """
    providers = [
        ("Groq", _call_groq, "llama-3.3-70b-versatile"),
        ("Gemini", _call_gemini, "gemini-1.5-flash"),  # stable model ID for v1 endpoint
        ("Mistral", _call_mistral, "mistral-large-latest"),
        ("Cohere", _call_cohere, "command-r-plus"),
        ("OpenRouter", _call_openrouter, primary_model)
    ]

    for name, func, model_arg in providers:
        try:
            logger.info(f"[LLM Fallback] Trying {name}...")
            content = await func(messages, model_arg)
            logger.info(f"[LLM Fallback] Success with {name}!")
            return content, ""
        except Exception as e:
            logger.warning(f"[LLM Fallback] {name} failed: {e}")
            continue

    logger.error("[LLM Fallback] ALL providers failed!")
    return "", "All LLM providers failed to respond."
