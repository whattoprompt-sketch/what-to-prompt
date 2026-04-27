# Backend Documentation: The Alchemy Engine 🧪

The WhatToPrompt backend is a high-performance, asynchronous Python service built on FastAPI. It acts as the orchestration layer between the user interface and multiple Large Language Models (LLMs).

## 🚀 Core Architecture

The backend follows a modular design pattern:
- **`api/v1/`**: Contains the RESTful routes and endpoint definitions.
- **`core/`**: The heart of the system, containing the transformation logic (`alchemy_engine.py`), scoring logic (`prompt_quality_scorer.py`), and vocabulary mapping (`vocabulary_mapper.py`).
- **`services/`**: Abstraction layers for external APIs (e.g., OpenRouter).
- **`models/`**: Pydantic schemas for request/response validation.

---

## 🧠 The Alchemy Engine (`core/alchemy_engine.py`)

The Alchemy Engine is a stateful transformation pipeline that processes user ideas into structured prompts.

### 1. Intent Classification
The engine analyzes the user's input to categorize the task (e.g., `code`, `marketing`, `blog`). This classification determines:
- The specific **Sovereign System Prompt** applied.
- The **Optimization Framework** suggested (CoT, ToT, etc.).
- The **Domain-Specific Vocabulary** used for expansion.

### 2. The Transformation Delta
The engine implements "Sovereign Transformation" by:
1. **Context Isolation**: Forcing the AI to build a new prompt from scratch using professional analogs rather than rephrasing the user's draft.
2. **Credential Stacking**: Injecting senior-level personas (e.g., "Principal Structural Engineer") with specific seniority levels.
3. **Model Harmonization**: Adjusting the output structure based on research-backed "Axioms" for specific AI providers (e.g., using XML tags for Anthropic Claude).

### 3. Progressive Wizard Logic
The engine tracks conversation state to identify missing prompt components. It calculates a `completeness_score` and generates intelligent follow-up questions until the prompt reaches "Maturity."

---

## 📡 API Reference

### `POST /api/v1/chat`
The primary endpoint for intent extraction and prompt generation.

**Request Schema (`ChatRequest`):**
```json
{
  "messages": [{"role": "user", "content": "I need help with a blog post about perfumes"}],
  "target_model": "openai/gpt-4o",
  "mode": "wizard"
}
```

**Response Schema (`ChatResponse`):**
```json
{
  "expert_prompt": "### Prompt ...",
  "explanation": "✨ Refined with CoT...",
  "quality_score": { "overall_score": 95, "grade": "A+" }
}
```

### `POST /api/v1/refine`
Injects an advanced optimization framework (e.g., Chain-of-Thought) into an existing prompt.

---

## ⚙️ Configuration & Research Data

The system includes a `ModelConfig` class that stores research-backed metadata for various LLMs:
- **Structural Mandates**: (e.g., Triple hashes for OpenAI, XML for Anthropic).
- **Model Size Scaling**: Logic to warn users if a requested framework (like CoT) might be ineffective on small/free models (<100B params).
- **Cost Estimation**: Real-time simulated cost tracking based on OpenRouter pricing.

---

## 🧪 Testing & Validation

The backend includes several utility scripts for health checks and logic validation:
- `health_check_v3.py`: Verifies API connectivity and environment readiness.
- `test_wizard_flow.py`: Simulates a multi-turn conversation to test intent extraction.
- `test_new_models.py`: Validates model-specific formatting across different providers.
