
import asyncio
import sys
import os

# Ensure backend is in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.core.alchemy_engine import create_ultra_enhanced_system_prompt, classify_intent

def test_logic():
    print("--- Testing Expansion Logic (Local) ---")
    
    wizard_data = {
        "role": "Teacher",
        "task": "Explain a complex topic",
        "context": "High school students",
        "constraints": "No emojis, under 600 words"
    }
    
    combined = f"{wizard_data['role']} {wizard_data['task']} {wizard_data['context']} {wizard_data['constraints']}"
    category = classify_intent(combined)
    print(f"Classified Category: {category}")
    
    system_prompt = create_ultra_enhanced_system_prompt(wizard_data, "openai/gpt-4o-mini", category)
    
    print("\n--- Generated System Prompt ---")
    print(system_prompt)
    
    # Check if "SENIOR EXPANSION LOGIC" or "TARGETED GUIDANCE" is in the output
    if "SENIOR EXPANSION LOGIC" in system_prompt:
        print("\n✅ Success: Expansion logic found in system prompt!")
    else:
        print("\n❌ Failure: Expansion logic missing from system prompt.")

if __name__ == "__main__":
    test_logic()
