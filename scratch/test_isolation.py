
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.alchemy_engine import refine_prompt_with_framework

async def test():
    original = """### [IDENTITY]
You are a Senior Python Developer specializing in performance optimization.

### [CONTEXT]
The situation: Scaling a web scraper to handle 1M requests per day.

### [TASK]
Your primary objective: Optimize the fetch function.
Step 1: Analyze current bottlenecks.
Step 2: Refactor using asyncio.

### [OUTPUT STRUCTURE]
Structure:
[Code]: python snippet

### [EXEMPLAR]
Example:
def fast_fetch(): pass

### [CONSTRAINT]
Hard constraints:
- Use httpx library.
"""
    strategy = "Inject Chain-of-Thought reasoning (Step-by-Step) into the [TASK] block."
    print(f"Refining prompt with strategy: {strategy}")
    
    refined, explanation = await refine_prompt_with_framework(original, strategy, model="gpt-4o")
    
    print("\n--- REFINED PROMPT ---")
    print(refined)
    
    # Check for isolation
    blocks_to_check = ["Senior Python Developer", "Scaling a web scraper", "python snippet", "httpx library"]
    all_preserved = True
    for b in blocks_to_check:
        if b not in refined:
            print(f"❌ Block content modified or missing: '{b}'")
            all_preserved = False
    
    if all_preserved:
        print("\n✅ Targeted Injection Isolation working! Blocks outside [TASK] are preserved.")
    else:
        print("\n❌ Isolation failed.")

if __name__ == "__main__":
    asyncio.run(test())
