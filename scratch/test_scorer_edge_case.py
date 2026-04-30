
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.prompt_quality_scorer import PromptQualityScorer

async def test():
    bare_prompt = "Write a story about a cat."
    print(f"Testing bare-minimum prompt: '{bare_prompt}'")
    
    scorer = PromptQualityScorer()
    result = scorer.score_prompt(bare_prompt)
    
    print("\n--- AUDIT RESULT ---")
    print(f"Overall Score: {result.overall_score}/100")
    print(f"Grade: {result.grade}")
    print(f"Dimensions:")
    for dim, data in result.dimensions.items():
        print(f"  - {dim}: {data['score']}/20 ({data['feedback']})")
    
    print("\nStrengths:")
    for s in result.strengths:
        print(f"  [+] {s}")
        
    print("\nSuggestions:")
    for s in result.suggestions:
        print(f"  [-] {s}")

if __name__ == "__main__":
    asyncio.run(test())
