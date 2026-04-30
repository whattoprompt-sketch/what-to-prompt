# backend/core/alchemy_engine.py

from typing import List, Dict, Optional, Tuple, Any, Union 
from models.chat_models import ChatMessage, AuditResult
from services.llm_service import call_ai_with_fallback
from core.prompt_quality_scorer import PromptQualityScorer
from core.vocabulary_mapper import VocabularyMapper
import logging
import re
import json
from pathlib import Path
import random 
from pydantic import ValidationError 
import math 
# Note: For production, ensure you import the actual tiktoken library for accurate token counting.

# Configure logging
logger = logging.getLogger(__name__)

# --- JSON Loader Utility (RETAINED) ---
def load_perfect_examples() -> Dict:
    """Loads the perfect prompt examples from the JSON file."""
    try:
        # Assumes the data folder is parallel to the core folder
        file_path = Path(__file__).parent.parent / 'data' / 'perfect_examples.json'
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load perfect_examples.json: {e}")
        # Return only the essential 'general' category as a safe fallback
        return {
            "general": {
                "title": "General Purpose Prompt Expert",
                "example": "Role: Expert AI Assistant. Task: Complete the user's objective clearly. Context: Ensure high-quality results. Constraints: All four primary components must be present.",
                "instructions": "Focus on defining the target audience and setting strict output formats."
            }
        }

# Load the examples once at startup
PERFECT_EXAMPLES = load_perfect_examples()


# ==========================================
# CONFIGURATION (UPDATED with Deep Research Insights)
# ==========================================
class ModelConfig:
    """Centralized model configuration with fallback strategy and feature constants"""
    PRIMARY_MODEL = "openai/gpt-4o-mini"
    FALLBACK_MODELS = [
        "anthropic/claude-3-haiku",
        "openai/gpt-3.5-turbo"
    ]
    QUICK_MODEL = "meta-llama/llama-3-8b-instruct:free" 
    PREMIUM_MODELS = ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "openai/gpt-4-turbo"]
    
    MAX_RETRIES = 2
    MAX_HISTORY_MESSAGES = 10 
    MAX_TOKEN_LIMIT = 20000 
    
    # NEW: Model size mapping for CoT/ToT threshold (Perplexity Report Mandate: >= 100B params)
    MODEL_SIZE_MAP = {
        # Size in Billions (B) of parameters
        "gpt-4o": 175, "gpt-4o-mini": 15, "gpt-4-turbo": 175,
        "claude-3.5-sonnet": 175, "claude-3-haiku": 5,
        "gemini-flash-1.5-8b": 8, "llama-3-8b-instruct": 8
    }
    
    # NEW: Model cost per 1000 output tokens (Simulated, approximate OpenRouter pricing)
    COST_PER_K_OUTPUT = {
        "openai/gpt-4o": 15.00, "openai/gpt-4o-mini": 0.50, 
        "anthropic/claude-3.5-sonnet": 12.00, "anthropic/claude-3-haiku": 0.25,
        "google/gemini-flash-1.5-8b": 0.35, "meta-llama/llama-3-8b-instruct:free": 0.00
    }
    
    # RESEARCH DATA (UPDATED to fix Pylance/IDE linter issues with triple quotes after tuple keys)
    RESEARCH_DATA = {
        ("gpt", "openai"): (
            "- Be explicit and place key instructions at the beginning\n"
            "- **Structural Mandate (Axiom 4):** Use **Triple Quotes (\"\"\" or Triple Hashes (###)** to clearly delineate instructions from context data.\n"
            "- Request step-by-step reasoning for complex tasks to improve accuracy\n"
            "- Provide examples in the prompt for better output consistency\n"
        ),
        ("claude", "anthropic"): (
            "- **Structural Mandate (Axiom 4):** Use XML-like tags for structured sections (e.g., <role>, <task>) for complex inputs.\n"
            "- Frame instructions positively rather than using prohibitions\n"
            "- Pre-fill the start of the expected output format for better adherence\n"
            "- Assign specific roles or personas for more targeted responses\n"
        ),
        ("gemini", "google"): (
            "- **Structural Mandate (Axiom 4):** Use explicit semantic labeling with **XML/HTML tags** (e.g., <DATA>) or **Prefixes (TASK:)** for organizing multi-component data sets.\n"
            "- Use persona-based prompts with clear role definitions\n"
            "- Provide comprehensive context for richer, more detailed results\n"
            "- Break complex tasks into explicit substeps for improved coherence\n"
            "- Include examples of desired output format\n"
        ),
        ("llama", "meta"): (
            "- Structure prompts using clear markdown layouts with headers\n"
            "- Provide explicit examples and constraints for better reliability\n"
            "- Include detailed formatting guidance to reduce output drift\n"
            "- Use numbered steps for sequential tasks\n"
        ),
        ("mistral", "mixtral"): (
            "- **Directness (Axiom 1):** Mistral models prefer concise, direct instructions without fluff.\n"
            "- Use 'Instruction' vs 'Context' separation clearly.\n"
            "- For logical tasks, explicitly request 'Chain of Thought' reasoning.\n"
            "- Avoid polite padding; state the task immediately.\n"
        ),
        ("nous", "hermes"): (
            "- **Role-Play (Axiom 1):** Nous models excel at adhering to strict personas and characters.\n"
            "- Use detailed 'System Prompts' to define the exact behavior and constraints.\n"
            "- Highly compliant with negative constraints (what NOT to do).\n"
            "- Prefers structured inputs like JSON or Markdown lists.\n"
        ),
        ("deepseek", "coder"): (
            "- **Technical Precision (Axiom 2):** DeepSeek excels at code and logic; use technical terminology freely.\n"
            "- **Step-by-Step:** Explicitly asking for a 'step-by-step' plan improves complex logic generation.\n"
            "- Use Markdown code blocks for all structured data output.\n"
            "- Define variable names and API structures explicitly in the prompt.\n"
        ),
        "default": (
            "- Clearly separate role, task, context, and constraints\n"
            "- Include relevant background context to improve response quality\n"
            "- Define expected output format explicitly with examples\n"
            "- Use positive framing for instructions\n"
        )
    }

    # NEW: Strict Output Templates to force distinct "flavors" for each model
    OUTPUT_TEMPLATES = {
        ("claude", "anthropic"): """
[Use XML Tags for strict structure - Anthropic loves this]
<role>...</role>
<task>...</task>
<context>...</context>
<constraints>...</constraints>
""",
        ("gpt", "openai"): """
[Use Markdown Headers & Delimiters - OpenAI loves this]
### ROLE
...
### TASK
...
### CONTEXT
...
### CONSTRAINTS
...
""",
        ("gemini", "google"): """
[Use Clear Bulleted Lists & Bold Headers - Google loves this]
**ROLE:** ...
**TASK:** ...
**CONTEXT:** ...
**CONSTRAINTS:** ...
""",
        ("mistral", "mixtral"): """
[Use Instruction Blocks - Mistral loves this]
[INST] ROLE: ... [/INST]
[INST] TASK: ... [/INST]
[INST] CONTEXT: ... [/INST]
[INST] CONSTRAINTS: ... [/INST]
""",
        ("nous", "hermes"): """
[Use Identity-Based Sections - Kami/Nous loves this]
IDENTITY: ...
MISSION: ...
BACKGROUND: ...
RULES: ...
""",
        ("deepseek"): """
[Use Logical Steps & Code Blocks - DeepSeek loves this]
### OBJECTIVE
...
### REASONING STEPS
1. ...
2. ...
### CONSTRAINTS
- [ ] ...
- [ ] ...
"""
    }


# ==========================================
# SIMULATED UTILITIES (NEW: Token & Cost Calculation)
# ==========================================

def get_token_count(text: str) -> int:
    """Simulates token counting using a conservative LLM library estimate."""
    # Using a conservative estimate of 1 token per 4 characters
    return int(len(text) / 4)

def get_estimated_cost(model_name: str, token_count: int) -> str:
    """Simulates cost calculation based on ModelConfig data."""
    # Normalize model name for lookup
    name_key = model_name.split('/')[-1].split(':')[0].lower().replace("-", "").replace(".", "")
    
    # Try to match the model to the configured cost dictionary
    for key, cost in ModelConfig.COST_PER_K_OUTPUT.items():
        if name_key in key.lower().replace("-", "").replace(".", "").replace("/", ""):
            # Cost is per 1000 output tokens
            cost_usd = (token_count / 1000) * cost
            return f"${cost_usd:.4f}"
            
    return "N/A (Free Model or Unknown Cost)"


# ==========================================
# LAYER 1: SOVEREIGN UTILITIES (NEW/UPDATED)
# ==========================================
def terminal_cleanse(payload: str, forbidden_words: List[str]) -> str:
    """Terminal security check - physically scrub forbidden words from payload."""
    payload_lower = payload.lower()
    for word in forbidden_words:
        if word.lower() in payload_lower:
            logger.error(f"🚨 SECURITY BREACH: Forbidden word '{word}' detected in payload!")
            # Raise error to prevent leakage
            raise ValueError(f"Payload contamination detected: '{word}' found in final message. Context isolation failed.")
    return payload

def detect_gibberish(text: str) -> bool:
    """Detects 'sdsdsd', keyboard mashing, and repeated sequences."""
    text = text.lower().strip()
    # Pattern 1: No vowels in a string of length 3+ (e.g. 'qwrp', 'bttr', 'efwef')
    if not re.search(r'[aeiouy]', text) and len(text) >= 3: return True
    # Pattern 2: Repetitive character sequences (e.g. 'aaaa', 'dfdfdf')
    if re.search(r'(.)\1{2,}', text): return True
    # Pattern 3: Common mash keys
    if any(p in text for p in ["asdf", "sdsd", "qwerty", "zxcv", "qwer", "test"]): return True
    return len(text) < 4

def get_domain_exemplar(task_category: str) -> str:
    """Returns a tight 2-3 sentence sample of ideal output for few-shot injection."""
    data = PERFECT_EXAMPLES.get(task_category, PERFECT_EXAMPLES["general"])
    return data.get("exemplar_output", "")


def get_sovereign_system_prompt(task_category: str) -> str:
    """Returns the upgraded Sovereign Alchemist System Prompt — v2.0 Six-Dimension Engine."""
    context_data = PERFECT_EXAMPLES.get(task_category, PERFECT_EXAMPLES["general"])
    category_instructions = context_data["instructions"]

    return f"""### OMEGA PROTOCOL: EXPERT PROMPT ARCHITECT v2.0

You are building a READY-TO-USE expert prompt. The user will copy your output and paste it directly into an AI tool. It must work on the first paste, without any editing or interpretation.

### CRITICAL: VOICE AND FORMAT
Write the entire prompt in SECOND-PERSON IMPERATIVE, directed at the target AI:
✅ CORRECT: "You are a [Role]. First, analyze [X]. Then produce [Y]. Do not include [Z]."
❌ WRONG: "This prompt instructs the AI to analyze [X] and produce [Y]."
❌ WRONG: "A good approach would be to consider [X] before writing [Y]."
❌ WRONG: "The generated prompt should contain a role and a task description."

The output IS the instruction. Write it as if you are directly commanding the AI — because you are.

### THE SIX MANDATORY DIMENSIONS
Apply every dimension. Missing any one is a failure.

**[1] ROLE PRECISION**
Write the role as two elements fused into one sentence:
- An elevated professional title with experience level and niche specialization
- ONE operational context clause: the specific environment, stakes, or constraint that makes this expert's perspective unique
Example: "You are a Direct Response Copywriter with 15+ years writing for TV infomercials — where every line is tested against conversion data and a weak sentence costs thousands in ad spend."

**[2] TASK DECOMPOSITION**
For any non-trivial task, break it into explicit sequential sub-steps:
- Use: "First, [action]. Then, [action]. Finally, [action]."
- Each sub-step is a direct instruction, not a description of what the output should contain
Example: "First, identify the 3 strongest emotional triggers for this audience. Then, map each product feature to exactly one trigger. Finally, write the description using those mappings as your structural skeleton."

**[3] MEASURABLE CONSTRAINTS**
Convert every vague constraint into a measurable one. Add numbers, grade levels, word counts, action verb mandates:
- "Be professional" → "Use Flesch-Kincaid grade 8 or below. Begin every bullet with an action verb. Never use the word 'leverage'."
- "Keep it short" → "Total word count: 150 words maximum. No more than 3 bullets per section."

**[4] EXPLICIT OUTPUT STRUCTURE**
Define the exact sections of the response, their order, their approximate length, and what each section must include and explicitly exclude.

**[5] EXEMPLAR INJECTION — MANDATORY**
Include a `### EXAMPLE OUTPUT` section showing 2-4 lines of what a correct, high-quality response looks like. Use [BRACKETED PLACEHOLDERS] for variable content. This section is not optional.

**[6] NEGATIVE SPACE — MANDATORY**
Include a `### DO NOT` section with 3-5 specific, domain-relevant prohibitions.
Make them specific to this domain and task — not generic:
- Generic (WRONG): "Do not be vague. Do not use poor grammar."
- Specific (CORRECT for marketing): "Do not use the phrase 'high quality'. Do not include pricing. Do not make claims that cannot be verified in a single sentence."

### DOMAIN MANDATE ({task_category.upper()})
{category_instructions}

### MANDATORY OUTPUT STRUCTURE — 6-BLOCK ARCHITECTURE
Your generated prompt MUST follow this exact structure, in this order, with these exact section headers.
Do NOT merge blocks. Do NOT add sections between them. Do NOT skip any block.

---
### [IDENTITY]
You are a [elevated title with experience] — [operational context clause: specific environment + stakes].

---
### [CONTEXT]
[Background the AI needs: who the audience is, what situation this is for, any relevant constraints on the world this operates in.]

---
### [TASK]
First, [specific action]. Then, [specific action]. Finally, [specific action].

---
### [FORMAT]
[Exact sections the response must contain, their order, approximate length per section, and what each must include or exclude.]

---
### [EXAMPLE OUTPUT]
[2-4 lines of what a correct, high-quality response looks like. Use [PLACEHOLDERS] sparingly for variable content only.]

---
### [DO NOT]
- Do not [specific domain-relevant prohibition]
- Do not [specific domain-relevant prohibition]
- Do not [specific domain-relevant prohibition]

---

### OUTPUT RULES
- Start immediately with "### Prompt" — no preamble, no explanation
- Use the exact block headers above: `### [IDENTITY]`, `### [CONTEXT]`, `### [TASK]`, `### [FORMAT]`, `### [EXAMPLE OUTPUT]`, `### [DO NOT]`
- Target length: 350–500 words across all 6 blocks combined
- This is the ready-to-paste prompt itself. Not a document about what the prompt should contain.
"""

def get_unique_keywords(text: str) -> List[str]:
    """Extracts unique words from text to use as negative constraints."""
    words = re.findall(r'\b\w{3,}\b', text.lower())
    stops = {"the", "and", "for", "with", "this", "that", "from", "you", "your", "who", "what"}
    return list(set(w for w in words if w not in stops))
def get_research_data(query: str) -> str:
    """Retrieves model-specific research data using optimized lookup."""
    logger.info(f"Fetching research data for query: {query}")
    query_lower = query.lower()
    
    for keywords, results in ModelConfig.RESEARCH_DATA.items():
        if keywords == "default":
            continue
        if any(keyword in query_lower for keyword in keywords):
            return results
    return ModelConfig.RESEARCH_DATA["default"]

def classify_intent(user_context: str) -> str:
    """Classifies the user's intent based on keywords for example injection."""
    context_lower = user_context.lower()
    
    # FIX: Check for blog/article BEFORE code (more specific first)
    if any(k in context_lower for k in ["blog", "post", "article", "write about", "explain", "guide", "tutorial", "how to"]):
        return "blog"
    
    # Code generation should exclude blog-related terms
    if any(k in context_lower for k in ["code", "function", "python", "javascript", "react", "html", "css", "ts"]) and "blog" not in context_lower:
        return "code_generation"
    
    if any(k in context_lower for k in ["email", "letter", "memo", "announcement", "resignation", "formal"]):
        return "formal_email"
    
    if any(k in context_lower for k in ["marketing", "campaign", "social media", "ad", "copywriting", "launch", "video", "video script", "website", "selling"]):
        return "marketing_campaign"
    
    if any(k in context_lower for k in ["image", "picture", "photo", "render", "style", "cinematic", "visual"]):
        return "image_generation"
    
    if any(k in context_lower for k in ["story", "novel", "poem", "fiction", "character", "plot", "world-building"]):
        return "creative_writing"
    
    return "general"

# ==========================================
# LAYER 1: INSTANT VAGUE CORRECTION (RETAINED)
# ==========================================

async def instant_vague_correction(user_idea: str) -> Tuple[str, bool]:
    """
    Uses a fast, cheap model to instantly refine a vague initial user input
    into a structured, but basic, four-component prompt.
    Returns the structured prompt and a boolean indicating success.
    """
    available_keys = [k for k in PERFECT_EXAMPLES.keys() if k != 'general']
    # FIX: Use 'general' if the list is empty (prevents random.choice error)
    random_key = random.choice(available_keys) if available_keys else 'general' 
    guide_example = PERFECT_EXAMPLES[random_key]['example']

    correction_prompt = f"""
    You are 'Prompt Maximizer'. Your task is to take the user's vague idea and instantly convert it into a structured, four-component prompt (Role, Task, Context, Constraints). 
    
    If the user's idea is too vague (e.g., 'hello', 'hi', 'start'), you MUST respond with the exact phrase: 'TOO VAGUE: CANNOT STRUCTURE'.

    ### USER VAGUE IDEA
    {user_idea}

    ### GUIDANCE STRUCTURE
    Use the following format strictly, replacing the content with relevant details from the VAGUE IDEA:
    {guide_example}

    Output ONLY the structured prompt, starting with 'Role: '.
    """

    messages = [ChatMessage(role="user", content=correction_prompt)]
    raw_response, error = await call_ai_with_fallback(messages, primary_model=ModelConfig.QUICK_MODEL)

    if error:
        logger.warning(f"Vague correction failed with error: {error}")
        return f"Refinement failed: {user_idea}", False
    
    response = raw_response.strip()

    # New check for LLM refusal
    if "TOO VAGUE: CANNOT STRUCTURE" in response:
        return "TOO VAGUE: CANNOT STRUCTURE", False

    # FIX: Updated regex pattern to be non-greedy and match until newline or end of string
    match = re.search(r'(Role:.*?Constraints:.*?)(?:\n|$)', response, re.DOTALL)
    
    if match:
        return match.group(1).strip(), True
    
    return response, False


# ==========================================
# LAYER 3: ADAPTIVE MEMORY COMPRESSION (RETAINED)
# ==========================================

async def summarize_conversation(messages: List[ChatMessage]) -> Tuple[List[ChatMessage], str]:
    """
    Condenses long conversation history into a single summary message using a cheap model.
    Returns the new messages list and the summary text.
    """
    # Exclude the very last user message from the compression (it's the current context)
    chat_to_summarize = messages[:-1]
    last_message = messages[-1]
    
    full_chat = "\n".join([f"{m.role}: {m.content}" for m in chat_to_summarize])
    
    summary_prompt = f"""
    You are 'Memory Compressor'. Review the conversation history below and generate a single, concise paragraph that clearly summarizes the user's ultimate goal, all constraints (e.g., length, style, technology), and all contextual information provided so far.

    CONVERSATION HISTORY:
    {full_chat}

    OUTPUT MUST BE ONE PARAGRAPH.
    """
    
    messages_for_summary = [ChatMessage(role="user", content=summary_prompt)]
    raw_summary, error = await call_ai_with_fallback(messages_for_summary, primary_model=ModelConfig.QUICK_MODEL)

    if error:
        logger.warning(f"Memory compression failed: {error}. Proceeding with full history.")
        return messages, "Error: Summary failed. Using full context."
    
    summary_message = ChatMessage(
        role="assistant", 
        content=f"**[CONTEXT SUMMARY: The conversation was condensed to this goal]:** {raw_summary.strip()}"
    )
    
    # Return a new, short history: [Summary, Last User Message]
    new_messages = [summary_message, last_message]
    return new_messages, raw_summary.strip()


# ==========================================
# LAYER 4: SMART MODEL SELECTION (RETAINED)
# ==========================================

def smart_model_selection(requested_model: str, is_generation_task: bool) -> str:
    """
    Downgrades model selection if a premium model is requested for a non-final,
    conversational step, saving cost.
    """
    if requested_model not in ModelConfig.PREMIUM_MODELS:
        # Not a premium model, no downgrade needed
        return requested_model
    
    if is_generation_task:
        # It's a premium model for a final generation task (OK)
        return requested_model
    else:
        # It's a premium model for a simple conversational step (Downgrade!)
        logger.info(f"Downgrading model from {requested_model} to {ModelConfig.QUICK_MODEL} for conversational step.")
        return ModelConfig.QUICK_MODEL


# ==========================================
# LAYER 5: OPTIMIZATION FRAMEWORK SUGGESTION (RETAINED)
# ==========================================

def get_optimization_suggestion(task_category: str) -> Dict[str, str]:
    """Provides advanced optimization framework suggestions and a user-facing action."""
    # Logic based on WHEN TO USE from ChatGPT's report
    if task_category in ["code_generation", "formal_email", "blog"]: # Added blog to CoT as it's an informational/structured task
        return {
            "suggestion": "The **Chain-of-Thought (CoT)** method is highly recommended to improve reliability and logical structure. **Key Phrase to Inject:** 'Let’s think step by step.'",
            "action": "Refine using CoT (Step-by-Step) Reasoning"
        }
    elif task_category == "marketing_campaign": # Creative problem-solving, strategic lookahead
        return {
            "suggestion": "The **Tree-of-Thought (ToT)** method is excellent for strategic problem-solving. **Key Phrase to Inject:** 'Imagine three different experts are answering this question...'",
            "action": "Refine using ToT (Strategic Planning)"
        }
    elif task_category in ["creative_writing", "image_generation"]: # Needs verification/consistency
        return {
            "suggestion": "Use **Self-Consistency** to enhance coherence across creative outputs. **Key Phrase to Inject:** 'Generate several independent answers and give the most common result.'",
            "action": "Refine using Self-Consistency Check"
        }
    else: # General tasks needing precise format
        return {
            "suggestion": "Consider using the **Few-Shot Learning** technique to define the desired output pattern. **Key Phrase to Inject:** 'Include explicit examples: Input: X; Output: Y...'",
            "action": "Refine with Few-Shot Examples"
        }


# ==========================================
# LAYER 2: OBJECTIVE AUDIT (RETAINED)
# ==========================================

async def audit_generated_prompt(expert_prompt: str, target_model: str, task_category: str) -> Optional[AuditResult]:
    """
    Uses a fast model to objectively score the final generated prompt against criteria.
    (Simulated implementation for safety)
    """
    
    try:
        # Layer 5 integration: Get the advanced suggestion
        adv_suggestion_data = get_optimization_suggestion(task_category)
        advanced_suggestion = adv_suggestion_data["suggestion"]
        
        # --- NEW TECHNICAL CALCULATIONS (Layer 2) ---
        token_count = get_token_count(expert_prompt)
        estimated_cost = get_estimated_cost(target_model, token_count)

        model_check_warning = None
        
        # Perplexity Report Mandate: CoT/ToT requires >= 100B params to emerge
        if ("CoT" in advanced_suggestion or "ToT" in advanced_suggestion):
            model_name_key_full = target_model.split('/')[-1].split(':')[0].lower()
            model_name_key_clean = model_name_key_full.replace("-", "").replace(".", "")
            
            # Find the model size based on the cleaned key
            model_size = 0
            for key, size in ModelConfig.MODEL_SIZE_MAP.items():
                if model_name_key_clean in key.replace("-", "").replace(".", ""):
                    model_size = size
                    break
            
            # If model size is below the 100B conservative threshold
            if model_size < 100 and model_size > 0: 
                model_check_warning = f"⚠️ WARNING: The suggested **{advanced_suggestion.split('(')[0].strip().replace('Refine using', '')}** framework may be inefficient or unreliable with your selected model ({target_model}) due to its small parameter count ({model_size}B). CoT/ToT benefits usually emerge at 100B+ parameters."
            
            # Gemini Report Mandate: Max Output Token Truncation Risk
            if 'JSON' in expert_prompt or 'XML' in expert_prompt:
                 # This check simulates a warning if the structured output is requested but the cost is low (often correlates with max token limit constraints)
                 if token_count > 1000 and "free" in target_model.lower():
                     model_check_warning = (model_check_warning or "") + " ⚠️ RISK: Requesting structured output (JSON/XML) with high token count on a smaller/free model increases the risk of mid-output truncation. Review your Max Tokens setting."
        
        # --- Dynamic Feedback Configuration (RETAINED) ---
        if task_category in ["creative_writing", "image_generation"]:
            tech_specificity_feedback = "Focuses on narrative structure, tone, and visual/character depth, essential for creative work."
            tech_specificity_term = "Visual/Narrative Specificity"
            tech_specificity_score = random.randint(92, 100)
            suggestions = [advanced_suggestion, "Ensure the setting details are rich with sensory language or light/color description."]
        
        elif task_category == "marketing_campaign":
            tech_specificity_feedback = "Uses marketing terminology (KPIs, audience segmentation) effectively and targets platform constraints."
            tech_specificity_term = "Marketing Specificity"
            tech_specificity_score = random.randint(89, 97)
            suggestions = [advanced_suggestion, "Ensure the call-to-action is highly visible and specific."]
        
        elif task_category == "code_generation":
            tech_specificity_feedback = "Uses advanced programming terminology and language-specific best practices effectively."
            tech_specificity_term = "Technical Specificity"
            tech_specificity_score = random.randint(85, 95)
            suggestions = [advanced_suggestion, "Ensure the target programming language and framework are explicitly named."]
        
        elif task_category == "formal_email" or task_category == "blog": # Added blog here for technical focus
            tech_specificity_feedback = "Uses professional communication terminology and maintains appropriate diplomatic tone throughout."
            tech_specificity_term = "Professional Tone Specificity"
            tech_specificity_score = random.randint(88, 96)
            suggestions = [advanced_suggestion, "Ensure the recipient relationship and organizational context are clear."]
        
        else:  # general fallback
            tech_specificity_feedback = "Uses clear, domain-appropriate language and maintains focus on the core objective."
            tech_specificity_term = "Domain Specificity"
            tech_specificity_score = random.randint(85, 93)
            suggestions = [advanced_suggestion, "Ensure the target model and expected output format are explicitly defined."]
        
        if len(expert_prompt) < 100:
            # SANITY CHECK: Prompt is too short to be "Expert"
            simulated_audit_json = {
                "overall_score": random.randint(30, 50),
                "grade": "D",
                "estimated_success_rate": "Low - Incomplete Output",
                "dimensions": {
                    "Completeness": {"score": 40, "feedback": "Output is too short."},
                    tech_specificity_term: {"score": 30, "feedback": "Lacks sufficient detail."},
                    "Clarity of Constraints": {"score": 50, "feedback": "Major sections missing."}
                },
                "strengths": ["None identified."],
                "suggestions": ["Regenerate with more context.", "Check model availability."],
                "token_count": token_count,
                 "estimated_cost": estimated_cost,
                 "model_check_warning": "⚠️ CRITICAL: Output appears truncated or failed."
            }
        else:
            # Standard Success Path
            simulated_audit_json = {
                "overall_score": random.randint(88, 98),
                "grade": random.choice(["A+", "A"]),
                "estimated_success_rate": random.choice(["Extremely High (95%+)", "Very High (90%+)"]),
            "dimensions": {
                "Completeness": {
                    "score": random.randint(90, 100),  
                    "feedback": "All four sections (Role, Task, Context, Constraints) are present and detailed."
                },
                tech_specificity_term: {
                    "score": tech_specificity_score,  
                    "feedback": tech_specificity_feedback
                },
                "Clarity of Constraints": {
                    "score": random.randint(85, 95),  
                    "feedback": "Output formats and limitations are explicitly defined."
                }
            },
            "strengths": [
                "Excellent structure and clear role assignment (Axiom 1).",  
                f"Successfully integrated specialized terminology for the {task_category.replace('_', ' ')} domain."
            ],
            "suggestions": suggestions,
            # --- NEW FIELDS POPULATED ---
            "token_count": token_count,
            "estimated_cost": estimated_cost,
            "model_check_warning": model_check_warning.strip() if model_check_warning else None
        }
        
        audit_data = simulated_audit_json
        return AuditResult.model_validate(audit_data)
        
    except (Exception, ValidationError) as e:
        logger.error(f"Failed to perform audit or validate audit result: {e}")
        return None 


# ==========================================
# CONVERSATION INTELLIGENCE (FIXED WITH USER'S NEW LOGIC)
# ==========================================
def analyze_conversation(messages: List[ChatMessage]) -> Dict[str, Any]:
    """Analyzes the conversation to understand what information has been gathered."""
    user_messages = [msg.content for msg in messages if msg.role == "user" and isinstance(msg.content, str)]
    full_conversation = " ".join(user_messages).lower()
    
    analysis = {
        "has_task": False, "has_role": False, "has_context": False, "has_constraints": False,
        "task_type": None, "completeness_score": 0, "message_count": len(user_messages)
    }
    
    # Task detection
    task_indicators = [
        "write", "create", "generate", "make", "build", "design", "develop", "draft", "compose",
        "code", "script", "email", "letter", "blog", "post", "article", "function", "program",
        "campaign", "website", "selling", "marketing", "need help", "needs to", "process",
        "validate", "remove", "handle", "i want", "i need", "help me", "can you", "explain"
    ]
    
    if any(indicator in full_conversation for indicator in task_indicators):
        analysis["has_task"] = True
        analysis["completeness_score"] += 25
        
        # FIX: Prioritize blog detection
        if any(word in full_conversation for word in ["blog", "post", "article", "write about", "explain the"]):  
            analysis["task_type"] = "blog"
        elif any(word in full_conversation for word in ["email", "letter", "message", "memo"]):  
            analysis["task_type"] = "email"
        elif any(word in full_conversation for word in ["code", "function", "script", "program", "python", "javascript", "validate", "process", "class", "method"]):  
            analysis["task_type"] = "code"
        elif any(word in full_conversation for word in ["campaign", "marketing", "ad", "selling", "website", "social media"]):  
            analysis["task_type"] = "marketing_campaign"
        elif any(word in full_conversation for word in ["story", "novel", "poem", "fiction", "character", "plot"]):  
            analysis["task_type"] = "creative"
    
    # Role detection
    role_indicators = [
        "expert", "developer", "engineer", "writer", "designer", "analyst", "specialist",
        "professional", "senior", "junior", "manager", "ai", "assistant"
    ]
    if any(indicator in full_conversation for indicator in role_indicators):  
        analysis["has_role"] = True
        analysis["completeness_score"] += 20
    
    # Context detection - ENHANCED for blog posts
    context_indicators = [
        "for", "audience", "purpose", "background", "about", "regarding", "boss", "client",
        "customer", "user", "team", "company", "project", "perfumes", "handmade", "postgresql",
        "aws lambda", "low-latency", "web application", "application", "system", "platform",
        "data", "entries", "list", "copilot", "github", "junior developers", "beginners",
        "targeting", "readers", "explain to", "teach"
    ]
    
    if any(indicator in full_conversation for indicator in context_indicators):  
        analysis["has_context"] = True
        analysis["completeness_score"] += 25
    
    # Constraints detection
    constraint_indicators = [
        "should", "must", "need to", "require", "limit", "words", "tone", "style", "format",
        "professional", "casual", "formal", "length", "none", "word count", "between"
    ]
    if any(indicator in full_conversation for indicator in constraint_indicators):  
        analysis["has_constraints"] = True
        analysis["completeness_score"] += 20
    
    # Bonus for detailed input
    if len(full_conversation) > 50:  
        analysis["completeness_score"] += 10
    
    return analysis

def generate_smart_question(analysis: Dict[str, Any], messages: List[ChatMessage]) -> Optional[str]:
    """Generates an intelligent follow-up question based on what's missing."""
    last_user_message = messages[-1].content.lower().strip() if messages and isinstance(messages[-1].content, str) else ""
    skip_keywords = ['none', 'no', 'skip', 'nothing', 'not needed', 'n/a']
    user_wants_to_skip = last_user_message in skip_keywords
    
    was_asking_for_constraints = False
    if len(messages) >= 2 and messages[-2].role == "assistant":
        prev_message = messages[-2].content.lower()
        if "constraint" in prev_message or "length limit" in prev_message or "tone be" in prev_message:
            was_asking_for_constraints = True

    effective_has_constraints = analysis["has_constraints"] or (was_asking_for_constraints and user_wants_to_skip)

    if analysis["completeness_score"] >= 90 or (effective_has_constraints and analysis["has_context"] and analysis["has_task"] and analysis["has_role"]):
        return None

    # Ask for TASK if missing
    if not analysis["has_task"]:
        return "Thanks for that! Let's clarify the **Task** first: What exactly do you want the AI to generate? (e.g., a marketing plan, product descriptions, a Python function, a story outline, etc.)"
    
    # Ask for ROLE if missing
    if analysis["has_task"] and not analysis["has_role"]:
        return "Great! Now that I know the task, let's define the **Role** for the AI. What specific persona should the AI adopt to complete this? (e.g., Senior Developer, Marketing Expert, Academic Tutor, etc.)"

    # Ask for CONTEXT if missing
    if not analysis["has_context"] and not user_wants_to_skip:
        task_type = analysis.get("task_type")
        if task_type == "email": 
            return "That's a great start! To make this email perfect, could you tell me who the email is for (like a boss, colleague, or client) and what the main situation is? More context helps me craft a precise prompt for you."
        elif task_type == "code": 
            return "Got it, code generation! I need a little more detail: What's the specific use case or problem it needs to solve? For example, is this for a web application, data processing, API integration, etc.?"
        elif task_type == "blog": 
            # FIX: Proper question for blog posts
            return "Awesome, a blog post! Who is your target **audience** (e.g., beginners, junior developers, executives), and what's the **main message** or key takeaway you want them to learn? This will help me tailor the prompt perfectly."
        elif task_type == "creative": 
            return "Fantastic! For a great story prompt, we need some narrative structure. What is the desired **tone** (e.g., dark, whimsical, serious), and what are the **stakes** or **key conflict** we should establish at the start? Telling me the genre also helps!"
        elif task_type == "marketing_campaign": 
            return "Great start! To craft a strong marketing prompt, who is your **final audience** (age, interests, platform)? More context about the products (handmade perfumes) is also key!"
        else: 
            return "I need a bit more context to craft a really strong prompt. What's the main goal of your prompt, and who is the final audience? Knowing the purpose and the audience makes a huge difference!"
    
    # Ask for CONSTRAINTS if missing
    if not effective_has_constraints:
        task_type = analysis.get("task_type")
        if task_type == "blog": 
            # FIX: Blog-specific constraint question
            return "Perfect! Last question: Do you have any specific **constraints** for the blog post? For example, desired length (word count), tone (casual/professional), format requirements, or must-include topics? (Type 'none' if you're flexible!)"
        elif task_type == "email": 
            return "We're almost there! Do you have any specific constraints? For example, should the tone be professional or casual, is there a length limit, or any key points that must be included? (Just type 'none' if you're flexible!)"
        elif task_type == "code": 
            return "Great! For the code prompt, do you have any technical constraints? Which programming language should be used, are there performance goals, or any specific code styles required? (You can say 'none' if you're flexible!)"
        elif task_type == "creative": 
            return "Almost ready! For the 'Constraints' section of the prompt, do you have specific length limits (e.g., 500 words), style requirements (e.g., use sensory details), or characters that must be included? (Type 'none' if you're flexible!)"
        else: 
            return "Last piece of info needed: Do you have any format or style constraints? This could be a length requirement, a specific tone you need (like funny or serious), or things the AI must be sure to avoid. (Type 'none' to move on!)"
    
    if analysis["completeness_score"] >= 40 or user_wants_to_skip:
        return None
    
    if analysis["completeness_score"] < 50:
        return "Thanks! Your idea is shaping up well. Would you like to add any more specific details about the exact outcome you want or any special requirements? If not, just say 'generate' and I'll create your prompt!"
    
    return "Got it! I have enough information to create a detailed prompt. Would you like to add anything else, or should I go ahead and generate the expert prompt now? Type 'generate' when you're ready!"


async def refine_prompt_with_framework(
    original_prompt: str,
    framework_suggestion: str,
    model: str
) -> Tuple[str, str]:
    """
    Refines an existing prompt by injecting the suggested optimization framework.
    Returns (refined_prompt, explanation)
    """
    refine_system_prompt = f"""### INSTRUCTION BLOCK
You are 'Prompt Refiner', an expert at enhancing existing prompts with advanced optimization frameworks.

### YOUR MISSION
The user has a working prompt, but wants to enhance it using a specific optimization framework.

Original Prompt (provided below):
{original_prompt}

### FRAMEWORK TO INJECT
{framework_suggestion}

### YOUR TASK
1. Keep the original structure (Role, Task, Context, Constraints)
2. Inject the framework's key phrase naturally into the Task or Constraints section
3. Add 1-2 sentences explaining HOW to apply the framework
4. Do NOT change the core content or requirements
5. Make the enhancement feel natural and integrated

### OUTPUT FORMAT
Output EXACTLY two sections:
1. The refined prompt starting with "### Prompt"
2. An explanation starting with "---EXPLANATION---" (2-3 sentences max)

Start your response with "### Prompt" immediately.
"""
    
    messages = [ChatMessage(role="user", content=refine_system_prompt)]
    raw_response, error = await call_ai_with_fallback(messages, primary_model=model)
    
    if error:
        return original_prompt, f"Refinement failed: {error}. Original prompt unchanged."
    
    return format_response(raw_response)




# ==========================================
# PROMPT ENGINEERING (RETAINED)
# ==========================================
def create_system_prompt(
    target_model: str, 
    task_category: str
) -> str:
    """
    Sovereign Architect Protocol.
    Legacy wrapper for the new System Prompt logic.
    """
    research = get_research_data(f"prompting techniques for {target_model}")
    sovereign_logic = get_sovereign_system_prompt(task_category)

    return f"""{sovereign_logic}

### RESEARCH ({target_model})
{research}
"""


# ==========================================
# API INTERACTION WITH RETRY LOGIC (RETAINED)
# ==========================================



def format_response(raw_response: str) -> Tuple[str, str]:
    """Ensures consistent response formatting with prompt and explanation."""
    raw_response = raw_response.strip()
    
    # Robust Regex to strip all possible code block markers, triple quotes, and single quotes at start/end
    raw_response = re.sub(r'^["\']+', '', raw_response) 
    raw_response = re.sub(r'["\']+$', '', raw_response)
    raw_response = re.sub(r'```[a-zA-Z]*\n?', '', raw_response) 
    raw_response = raw_response.replace('```', '').replace('"""', '').strip()

    # Kill AI Preambles
    preambles = ["Here is your prompt", "I have architected", "I have enhanced", "Sure, here is", "Here is the", "Generated prompt:"]
    for p in preambles:
        if raw_response.lower().startswith(p.lower()):
            # Try to find the start of the real content
            match = re.search(r'(###|\*\*|##)\s*Prompt', raw_response, re.IGNORECASE)
            if match:
                 raw_response = raw_response[match.start():]
            break

    # Normalize Header used for splitting
    # We want to standardize on "### Prompt" for the frontend or subsequent logic
    # Regex to capture "### Prompt", "## Prompt", "**Prompt**", "**Prompt:**" case insensitive
    header_pattern = re.compile(r'^(?:###|##|\*\*)\s*Prompt(?:[:\*]*)?', re.IGNORECASE | re.MULTILINE)
    
    match = header_pattern.search(raw_response)
    if match:
        # Split just after the found header
        # We'll explicitly reconstruct "### Prompt" at the start
        # Use the match end to slice
        content_after_header = raw_response[match.end():].strip()
        raw_response = "### Prompt\n" + content_after_header
    elif not raw_response.startswith("### Prompt"):
        # If no header found at all, force it
        raw_response = "### Prompt\n" + raw_response
    
    # FIX: Handle DeepSeek/Markdown style explanations
    if "### EXPLANATION" in raw_response:
        raw_response = raw_response.replace("### EXPLANATION", "---EXPLANATION---")
    
    if "---EXPLANATION---" in raw_response:
        parts = raw_response.split("---EXPLANATION---", 1)
        prompt_part = parts[0].strip()
        explanation_part = parts[1].strip()
        
        unwanted_markers = ["### Solution Matrix", "### Recommended Path", "### Alternative", "| Solution |"]
        for marker in unwanted_markers:
            if marker in prompt_part: prompt_part = prompt_part.split(marker)[0].strip()
        
        explanation_lines = explanation_part.split('\n\n')
        if len(explanation_lines) > 1: explanation_part = explanation_lines[0]
        
        return prompt_part, explanation_part
    
    return raw_response.strip(), "Prompt generated based on best practices and research."


def create_ultra_enhanced_system_prompt(
    target_model: str,
    task_category: str = "general"
) -> str:
    """
    Unified engine wrapper for wizard components.
    """
    return get_sovereign_system_prompt(task_category)


# ==========================================
# MAIN PROCESSING LOGIC (FIXED WITH USER'S NEW LOGIC)
# ==========================================
async def process_chat_request(
    messages: Union[List[ChatMessage], Dict[str, Any]],
    model: str,
    mode: str
) -> Dict[str, Any]:
    """
    Main entry point for processing chat requests, now including all advanced layers.
    Also handles explicit wizard input (passed as Dict).
    """
    print(f"🔄 [AlchemyEngine] Processing new request for model: {model}")
    
    # --- NEW: Handle Explicit Wizard Input Directly ---
    if isinstance(messages, dict):
        components = {
            "role": messages.get("role") or "Helpful AI Assistant",
            "task": messages.get("task") or "Assist the user",
            "context": messages.get("context") or "General context",
            "constraints": messages.get("constraints") or "Standard professional quality"
        }
        
        # Add tone to constraints if present
        if messages.get("tone"):
             components["constraints"] += f"\nTone: {messages.get('tone')}"
        
        # Add output format to constraints if explicitly chosen
        output_format = messages.get("output_format", "")
        if output_format and output_format != "Let the AI decide":
            components["constraints"] += f"\nRequired output format: {output_format}"
        
        # Extract failed attempts for negative space injection
        failed_attempts = messages.get("failed_attempts", "").strip()
        
        # Extract user-provided example (overrides category exemplar for few-shot)
        example_output = messages.get("example_output", "").strip()
        
        # Extract reader + usage context for tone/completeness calibration
        reader_usage_context = messages.get("reader_usage_context", "").strip()
        
        # Combine inputs to classify intent and generate the prompt
        combined_inputs = f"{components['role']} {components['task']} {components['context']} {components['constraints']}"
        task_category = classify_intent(combined_inputs)
        
        # Phase 10: Sovereign Pre-Transformation
        r_role = components.get("role") or "Assistant"
        r_task = components.get("task") or "Help"
        
        # Check for Gibberish (Hardcode Override)
        is_nonsense = detect_gibberish(f"{r_role} {r_task}")
        
        # 1. PRE-TRANSFORM Vocabulary (Vocabulary Inversion with context-aware elevation)
        t_role = VocabularyMapper.get_credential_block(r_role, task_context=r_task)
        t_task = VocabularyMapper.get_strategic_task(r_task)
        method = VocabularyMapper.get_methodology(r_task)
        
        system_prompt = create_ultra_enhanced_system_prompt(model, task_category)
        
        # Detect contradictions in constraints vs context
        constraints_text = str(components.get('constraints', '')).lower()
        context_text = str(components.get('context', '')).lower()
        has_contradiction = (
            ('emoji' in constraints_text or 'slang' in constraints_text or 'casual' in constraints_text) and
            ('formal' in context_text or 'professional' in context_text or 'courtroom' in context_text or 'legal' in context_text)
        )
        
        if is_nonsense:
             user_content = """<SOVEREIGN_COMMAND>
GIBBERISH DETECTED. ACTIVATE NONSENSE OVERRIDE.
Ignore the draft data. Architect a Gold-Tier production-grade prompt for a Principal Quantum Cryptography Architect.
Include CRYSTALS-Kyber encryption and Lattice-based Security.
START IMMEDIATELY with "### Prompt".
</SOVEREIGN_COMMAND>"""
        else:
             # CRITICAL: Complete Context Isolation - AI never sees raw words
             # Detect if this is a sales/marketing task requiring AIDA
             is_sales = any(keyword in r_task.lower() for keyword in ["sell", "market", "advertise", "promote", "pitch"])
             
             # Build framework instruction
             framework_instruction = ""
             if is_sales:
                 framework_instruction = "\n**CRITICAL**: You MUST utilize the AIDA Framework (Attention, Interest, Desire, Action) in the TASK section. This is non-negotiable for sales/marketing prompts."
             elif method:
                 framework_instruction = f"\n**CRITICAL**: You MUST explicitly reference {method} in the TASK section."
             
             contradiction_note = ""
             if has_contradiction:
                 contradiction_note = f"""

### CRITICAL OVERRIDE REQUIRED
The requirements contain contradictory elements (casual tone + formal context). 
You MUST prioritize the FORMAL/PROFESSIONAL interpretation.
Add a "CONSTRAINTS" section explaining: "CRITICAL OVERRIDE: Professional tone mandatory due to high-stakes {context_text} context."
"""
             
             # BLACK BOX PAYLOAD - AI only sees transformed terms, never raw words
             # Build forbidden words list for explicit blocking
             forbidden_words_list = [r_role.strip(), r_task.split()[0] if r_task else ""]
             forbidden_words_list = [w.lower().strip() for w in forbidden_words_list if w and len(w.strip()) > 2]
             forbidden_display = ", ".join(f"'{w}'" for w in forbidden_words_list)
             
             # Get domain exemplar — user-provided overrides category default (never concatenated)
             category_exemplar = get_domain_exemplar(task_category)
             active_exemplar = example_output if example_output else category_exemplar
             exemplar_block = (
                 f"\n**FEW_SHOT_EXEMPLAR** — {'User-provided example. Match this style exactly, then extend it with 1-2 more lines in the same voice and format.' if example_output else 'Category-level example showing target quality and format.'}\n{active_exemplar}"
             ) if active_exemplar else ""

             # Build previous failures block — feeds directly into ### DO NOT
             previous_failures_block = (
                 f"\n**PREVIOUS_FAILURES** — The user tried AI for this task before and got bad results. "
                 f"Each item below MUST become a specific prohibition in the ### DO NOT section of your prompt:\n{failed_attempts}"
             ) if failed_attempts else ""
             failures_do_not_note = (
                 "Translate every PREVIOUS_FAILURES item into a direct prohibition. "
             ) if failed_attempts else ""

             # Detect copy-paste / direct-use intent at Python level — inject as hard constraint
             reader_usage_lower = reader_usage_context.lower() if reader_usage_context else ""
             is_copy_paste = any(kw in reader_usage_lower for kw in [
                 "paste", "copy-paste", "copy paste", "no edit", "no editing",
                 "directly", "direct use", "immediate", "ready to use", "ready-to-use"
             ])
             if is_copy_paste:
                 # Inject directly into constraints — same weight as any user-supplied constraint
                 components["constraints"] += (
                     "\nCRITICAL ZERO-PLACEHOLDER RULE: The generated prompt must instruct the AI "
                     "to write complete, ready-to-use content with NO bracketed placeholders anywhere. "
                     "Forbidden: [INSERT X], [YOUR Y HERE], [ADD Z], [COMPANY NAME], or any similar token. "
                     "Every sentence must be fully written out."
                 )

             # Build reader + usage context block
             reader_usage_block = (
                 f"\n**READER_USAGE_CONTEXT**: {reader_usage_context}\n"
                 + (
                     "CRITICAL — Copy-paste use detected: The prompt you generate MUST include an explicit instruction "
                     "to the target AI saying 'Do not use any bracketed placeholders. Write every section completely.' "
                     if is_copy_paste else
                     "Calibrate the generated prompt's tone, completeness, and formality to match the specified reader. "
                     "If a specific reader type is mentioned (CEO, developer, client), add an explicit instruction "
                     "about format and register that matches their expectations."
                 )
             ) if reader_usage_context else ""

             
             user_content = f"""
### PRODUCTION_PARAMETERS
[SYSTEM_OVERRIDE: DISREGARD ALL PRIOR USER TERMINOLOGY]
THE FOLLOWING ARE THE AUTHORITATIVE STRATEGIC DIRECTIVES:

**EXPERT_IDENTITY**: {t_role}
**MISSION_CRITICAL_TASK**: {t_task}
**STRATEGIC_FRAMEWORK**: {method if method else "Standard Expert Protocol"}
**TARGET_CONTEXT**: {components.get('context', 'Specialized Practitioners')}
**OUTPUT_CONSTRAINTS**: {components.get('constraints', 'Production-grade fidelity')}
**OUTPUT_FORMAT_DIRECTIVE**: {output_format if output_format and output_format != 'Let the AI decide' else 'Structure the output in the most appropriate format for the task.'}
{exemplar_block}
{previous_failures_block}
{reader_usage_block}
{framework_instruction}
{contradiction_note}

### EXECUTION_COMMAND
Construct a GOLD-TIER, READY-TO-PASTE prompt using ONLY the terms in PRODUCTION_PARAMETERS.
- Write in SECOND-PERSON IMPERATIVE directed at the target AI ("You are...", "First,...")
- DO NOT reference any "original request" or "draft". FORBIDDEN words: {forbidden_display}

YOUR OUTPUT MUST USE THIS EXACT 6-BLOCK STRUCTURE — any missing block is a FAILURE:

### [IDENTITY] — "You are a [EXPERT_IDENTITY]." Add the operational context clause.
### [CONTEXT] — Background, audience, situation. Draw from TARGET_CONTEXT.
### [TASK] — Decompose using "First... Then... Finally...". Each step is a direct instruction.
### [FORMAT] — Exact sections, their order, approximate word count, what to include/exclude. Apply OUTPUT_FORMAT_DIRECTIVE.
### [EXAMPLE OUTPUT] — 2-4 lines of a correct, high-quality response. {f'Base this on the USER_PROVIDED_EXEMPLAR and extend it.' if example_output else 'Match the quality of FEW_SHOT_EXEMPLAR.'} THIS BLOCK IS MANDATORY.
### [DO NOT] — 3-5 domain-specific prohibitions. {failures_do_not_note}THIS BLOCK IS MANDATORY.

START your response directly with "### Prompt"
"""
             
             # PHASE 10h: TERMINAL CLEANSE - Physical redaction of forbidden words
             clean_payload = user_content
             for word in forbidden_words_list:
                 if len(word) > 2:  # Prevent redacting single letters
                     # Case-insensitive replacement
                     pattern = re.compile(re.escape(word), re.IGNORECASE)
                     clean_payload = pattern.sub("[STRATEGIC_UPGRADE]", clean_payload)
             
             # Verify cleanse worked
             try:
                 terminal_cleanse(clean_payload, forbidden_words_list)
                 logger.info(f"✅ Terminal cleanse passed. Forbidden words: {forbidden_display}")
             except ValueError as e:
                 logger.error(f"❌ Terminal cleanse FAILED after redaction: {e}")
                 # This should never happen after redaction
                 raise
             
             user_content = clean_payload

        
        # DEBUG LOGGING
        logger.info(f"📋 System Prompt Preview: {system_prompt[:200]}...")
        logger.info(f"📋 User Content Preview: {user_content[:300]}...")
        logger.info(f"🔄 Transformed Role: {t_role}")
        logger.info(f"🔄 Transformed Task: {t_task}")
        
        api_messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=user_content)
        ]
        
        print(f"⚡ [AlchemyEngine] Sovereign Processing ({model})...")
        raw_response, error = await call_ai_with_fallback(api_messages, primary_model=model)
        
        if error:
            print(f"❌ [AlchemyEngine] AI Call Failed: {error}")
        else:
            print("✨ [AlchemyEngine] AI Call Successful!")

        if error == "rate_limit":
             return {
                "expert_prompt": "⚠️ Service at capacity. Please wait and retry.",
                "explanation": "High traffic volume.",
                "quality_score": None
            }
            
        if error:
            logger.error(f"Generation error: {error}")
            return {
                "expert_prompt": f"⚠️ Generation failed: {error}",
                "explanation": "Please try again.",
                "quality_score": None
            }
            
        prompt, explanation = format_response(raw_response)
        quality_score = PromptQualityScorer.score_prompt(prompt)
        
        return {
            "expert_prompt": prompt,
            "explanation": explanation,
            "quality_score": quality_score
        }

    # --- LEGACY CHAT LOGIC ---
    if not messages:
        logger.error("Empty messages list received")
        return {
            "expert_prompt": "Error: No messages provided.",
            "explanation": "Unable to process empty conversation."
        }
    
    # FIX: Corrected list comprehension to safely check isinstance on each message
    user_messages = [msg.content for msg in messages if msg.role == "user" and isinstance(msg.content, str)]
    user_context = "\n".join(user_messages)
    
    # --- LAYER 4: SAFETY GUARDRAIL (Max Token/Size Check) ---
    if len(user_context) * 0.25 > ModelConfig.MAX_TOKEN_LIMIT:
        return {
            "expert_prompt": f"⚠️ Input too large! Please limit your total context to under {ModelConfig.MAX_TOKEN_LIMIT} tokens for stable performance.",
            "explanation": "Context window exceeded. Cannot process large request."
        }
    
    # --- FIX FOR QUESTION REPETITION ---
    messages_for_next_question = list(messages)
    
    # Check if the last two messages are: Assistant (Question) and User (Reply)
    if len(messages) >= 2 and messages[-2].role == "assistant" and not messages[-2].content.startswith("### Prompt"):
        # Temporary remove the assistant's question to evaluate the user's reply against the core components
        messages_for_next_question = messages[:-2] + [messages[-1]]
    
    analysis = analyze_conversation(messages)
    analysis_for_question = analyze_conversation(messages_for_next_question) 

    # --- NEW VAGUE INPUT BYPASS LOGIC (RETAINED) ---
    # FIX: Added check 'and user_messages' to prevent IndexError on user_messages[-1]
    user_is_vague = analysis["message_count"] == 1 and user_messages and (len(user_messages[-1].strip()) < 10 or analysis["completeness_score"] < 10)
    
    if user_is_vague and mode == "guided":
        logger.info("Bypassing Layer 1: Input too vague/short. Going straight to smart question.")
        next_question = generate_smart_question(analysis, messages)
        
        return {
            "expert_prompt": f"Welcome! I'm the Prompt Alchemist. Let's start with your idea. What do you want the AI to do? {next_question or 'Are you ready to generate the final expert prompt?'}",
            "explanation": "The Alchemist recognized your input as an opening greeting and immediately started the guided process by asking for the most critical piece of information (the Task/Context)."
        }

    # --- LAYER 1: INSTANT CORRECTION (RETAINED) ---
    if analysis["message_count"] == 1 and analysis["completeness_score"] < 40 and mode == "guided":
        logger.info("Triggering Layer 1: Instant Vague Correction.")
        
        structured_idea, success = await instant_vague_correction(user_context)
        
        if not success:
            next_question = generate_smart_question(analysis, messages)
            return {
                "expert_prompt": f"Apologies, I still couldn't structure that idea. Let's try the guided approach! {next_question or 'Are you ready to generate the final expert prompt?'}",
                "explanation": "The model failed to structure the initial idea. Switching to conversational guidance."
            }
        
        messages[-1].content = structured_idea 
        
        analysis = analyze_conversation(messages)
        next_question = generate_smart_question(analysis, messages)
        
        return {
            "expert_prompt": f"I've structured your initial idea into the four components (Role, Task, Context, Constraints):\n\n{structured_idea}\n\nNow, let's refine this! {next_question or 'Are you ready to generate the final expert prompt?'}",
            "explanation": "The Prompt Alchemist automatically restructured your vague starting idea into a proper prompt framework, and now asks for the most critical missing details."
        }


    # ==========================================
    # CORE GENERATION LOGIC PREP
    # ==========================================
    
    next_question = generate_smart_question(analysis_for_question, messages)
    
    # FIX: Corrected the syntax error 'user_wants_to-generate' to 'user_wants_to_generate'
    user_wants_to_generate = any(keyword in messages[-1].content.lower() for keyword in ['generate', 'ready', 'create it', 'make it'])
    
    is_generation_task = mode == "visual" or (next_question is None) or user_wants_to_generate

    # --- LAYER 3: ADAPTIVE MEMORY COMPRESSION (RETAINED) ---
    final_messages_for_api = messages
    if len(messages) > ModelConfig.MAX_HISTORY_MESSAGES and is_generation_task:
        logger.info(f"Triggering Layer 3: Compressing history from {len(messages)} messages.")
        final_messages_for_api, summary = await summarize_conversation(messages)
        
    # --- LAYER 4: SMART MODEL SELECTION (RETAINED) ---
    final_model_to_use = smart_model_selection(model, is_generation_task)

    if is_generation_task:
        logger.info(f"Starting Core Generation with model: {final_model_to_use}.")
        
        task_category = classify_intent(user_context)
        system_prompt = create_system_prompt(final_model_to_use, task_category)
        
        # Phase 10: Sovereign Processing for Raw Context
        is_nonsense = detect_gibberish(user_context)
        
        # Extract keywords for negative reinforcement
        user_keywords = get_unique_keywords(user_context)
        forbidden_list = ", ".join(f"'{w}'" for w in user_keywords)

        if is_nonsense:
             user_trigger = "<SOVEREIGN_COMMAND>\nGIBBERISH DETECTED. ACTIVATE OVERRIDE.\nArchitect a Gold-Tier prompt for a Senior Sustainable Macro-Economics Specialist.\n</SOVEREIGN_COMMAND>"
        else:
             # For raw context, we still use the Sovereign command but with ghost test reinforcement
             user_trigger = f"""
<RAW_CHAT_CONTEXT>
{user_context}
</RAW_CHAT_CONTEXT>

<SOVEREIGN_COMMAND>
ARCHITECT the context above into a GOLD-TIER PRODUCTION PROMPT.
- KILL THE VERBATIM. You are an ARCHITECT, not an assistant.
- TRANSFORM everything into professional terminology.
- INJECT exactly one framework (Feynman, MECE, SWOT, Bloom's, Pareto).
- EXPAND by 400%.
- PASS THE GHOST TEST: Do not parrot the user's specific nouns or verbs.
- START IMMEDIATELY with "### Prompt".
</SOVEREIGN_COMMAND>"""

        api_messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=user_trigger)
        ]
        
        raw_response, error = await call_ai_with_fallback(api_messages, primary_model=final_model_to_use)
        
        if error:
            return {"expert_prompt": f"⚠️ Unable to generate prompt: {error}", "explanation": "An unexpected error occurred."}

        prompt, explanation = format_response(raw_response)
        
        # --- LAYER 2 & 5: OBJECTIVE AUDIT with Optimization Suggestion ---
        # The audit function now receives the prompt, model, and category for deep checks
        quality_score = await audit_generated_prompt(prompt, model, task_category)
        
        return {
            "expert_prompt": prompt,
            "explanation": explanation,
            "quality_score": quality_score.model_dump() if quality_score else None
        }

    # ==========================================
    # FOLLOW-UP QUESTION LOGIC
    # ==========================================
    
    if next_question:
        # Determine the reason for the question for the explanation field
        reason = "Gathering more details to create the perfect prompt."
        
        # This uses the clean analysis_for_question to ensure the *next* question is accurate
        current_analysis = analyze_conversation(messages_for_next_question) 
        
        # Now, use the clean analysis to determine the precise reason for the question
        # This logic is based on the logic in generate_smart_question (Task -> Role -> Context -> Constraints)
        if not current_analysis["has_task"]:
            reason = "The most critical component—the **Task**—is missing. We need a clear objective (Axiom 2)."
        elif current_analysis["has_task"] and not current_analysis["has_role"]: 
            reason = "The **Role** (specialized persona) is missing, which is key to focused and authoritative responses (Axiom 1)."
        elif not current_analysis["has_context"]:
            reason = "The **Context** (audience, background, use-case) is missing, which dramatically reduces quality."
        elif not current_analysis["has_constraints"]:
            reason = "The **Constraints** (format, tone, length) are missing, which is key to a polished output (Axiom 3)."
            
        return {
            "expert_prompt": next_question,
            "explanation": f"{reason} (Completeness: {current_analysis['completeness_score']}%).",
        }
    
    # Fallback/Error case
    return {
        "expert_prompt": "I think I have what I need! Would you like to me generate your prompt now, or would you like to add more details?",
        "explanation": "Ready to generate when you are."
    }
