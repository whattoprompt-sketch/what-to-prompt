
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock some env vars if needed
os.environ["OPENROUTER_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "mock_key")

from core.alchemy_engine import process_chat_request

async def test():
    inputs = {
        "role": "Content Writer",
        "task": "Write a blog post about AI in Healthcare",
        "context": "A medical tech blog for surgeons",
        "constraints": "Under 300 words, formal tone",
        "reader_usage_context": "I will paste this directly into ChatGPT, no editing. Give me the final blog post immediately."
    }
    print("Generating prompt with 'copy-paste' intent...")
    
    # We use a real call here if API key is present, otherwise we just test the logic assembly
    result = await process_chat_request(inputs, model="gpt-4o", mode="wizard")
    prompt = result.get("expert_prompt", "")
    
    print("\n--- GENERATED PROMPT ---")
    print(prompt)
    
    # Basic check for placeholders in the prompt itself (instructions to the LLM)
    # The PROMPT shouldn't contain placeholders, it should instruct the LLM NOT to use them.
    # But wait, the user's test was: "check whether the generated prompt contains any bracketed placeholders like [INSERT COMPANY NAME]"
    
    placeholders = ["[INSERT", "[YOUR", "[ADD", "NAME]"]
    found = [p for p in placeholders if p in prompt]
    if found:
        print(f"\n❌ Placeholder tokens found in the generated prompt: {found}")
    else:
        print("\n✅ No bracketed placeholders found in the generated prompt.")

if __name__ == "__main__":
    asyncio.run(test())
