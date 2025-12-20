
import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from core.alchemy_engine import create_ultra_enhanced_system_prompt

def test_templates():
    models = ["mistral", "nous", "deepseek", "gemini", "claude"]
    components = {
        "role": "Tester",
        "task": "Test this",
        "context": "Context",
        "constraints": "Constraints"
    }

    print("🧪 Testing Model Templates...\n")

    for model in models:
        print(f"--- Testing {model.upper()} ---")
        prompt = create_ultra_enhanced_system_prompt(components, model)
        
        if model == "mistral" and "[INST]" in prompt:
            print("✅ Mistral: Found [INST] tags")
        elif model == "nous" and "IDENTITY:" in prompt:
            print("✅ Nous: Found IDENTITY section")
        elif model == "deepseek" and "REASONING STEPS" in prompt:
            print("✅ DeepSeek: Found REASONING STEPS")
        elif model == "gemini" and "**ROLE:**" in prompt:
            print("✅ Gemini: Found **Bold Headers**")
        elif model == "claude" and "<role>" in prompt:
            print("✅ Claude: Found <XML> tags")
        else:
            print(f"❌ {model.upper()} FAILED to match template text!")
            # print(prompt) # Uncomment to debug

if __name__ == "__main__":
    test_templates()
