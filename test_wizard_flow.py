
import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from core.alchemy_engine import process_chat_request
from models.chat_models import ChatMessage

async def test_wizard_flow():
    print("--- Testing Wizard Logic Flow ---")
    
    # Mock data directly from the Wizard frontend
    # Note: process_chat_request now accepts a Dict for explicit inputs
    wizard_data = {
        "role": "Senior Python Developer",
        "task": "Create a script to parse CSV files",
        "context": "For a junior data analyst team to automate their daily reports",
        "constraints": "Use pandas, include comments, handle errors gracefully",
        "tone": "Professional and educational"
    }
    
    print(f"Input Data: {wizard_data}")
    
    try:
        # Simulate the call from api/v1/chat.py
        result = await process_chat_request(
            messages=wizard_data, # Passing dict directly
            model="openai/gpt-4o-mini",
            mode="visual"
        )
        
        print("\n--- Result ---")
        if result.get('expert_prompt'):
            print("✅ Expert Prompt Generated Successfully!")
            print(f"Prompt Length: {len(result['expert_prompt'])} chars")
            print(f"Explanation: {result.get('explanation')}")
            print(f"Quality Score: {result.get('quality_score')}")
        else:
            print("❌ Failed to generate prompt.")
            print(result)
            
    except Exception as e:
        print(f"❌ Error during execution: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_wizard_flow())
