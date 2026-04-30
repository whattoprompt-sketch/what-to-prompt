# backend/models/chat_models.py

from pydantic import BaseModel, Field
from typing import List, Literal, Union, Dict, Any, Optional 

# Pydantic models define the structure of your data.

class AuditDimension(BaseModel):
    """Schema for individual audit criteria."""
    score: int = Field(..., ge=0, le=100)
    feedback: str

class WhatIfVariation(BaseModel):
    """Schema for 'What if' iteration suggestions."""
    label: str  # e.g., "What if we added an exemplar?"
    why: str    # e.g., "Anchors ambiguities and matches your specific style."
    action: str # The internal command to apply it

class AuditResult(BaseModel):
    """Detailed structure for the objective quality audit. ADDED fields for iteration loop."""
    overall_score: int = Field(..., ge=0, le=100)
    grade: str
    estimated_success_rate: str
    dimensions: Dict[str, AuditDimension]
    strengths: List[str]
    suggestions: List[str]
    
    # --- LAYER 5: ITERATION LOOP ---
    what_if_variations: List[WhatIfVariation] = Field(default_factory=list)
    # --------------------------------
    
    # --- NEW FIELDS FOR ADVANCED AUDIT (From Gemini/Perplexity Reports) ---
    token_count: Optional[int] = Field(None, description="Total tokens used by the final generated prompt.")
    estimated_cost: Optional[str] = Field(None, description="Estimated API cost for the generation step.")
    model_check_warning: Optional[str] = Field(None, description="Warning if model size is too small for the suggested framework (e.g., CoT) or if structured output truncation is likely.")
    # ----------------------------------------------------------------------

class ChatMessage(BaseModel):
    """
    Represents a single message in the conversation.
    """
    role: Literal["user", "assistant", "system"]
    content: Union[str, Dict, Any] 

class ChatRequest(BaseModel):
    """
    Represents the request body that the frontend will send to our chat endpoint.
    """
    messages: List[Dict[str, str]]
    target_model: str
    mode: str = "visual"

    # Optional fields for explicit wizard input (New Frontend)
    role: Optional[str] = None
    task: Optional[str] = None
    context: Optional[str] = None
    constraints: Optional[str] = None
    tone: Optional[str] = None
    output_format: Optional[str] = None
    failed_attempts: Optional[str] = None
    example_output: Optional[str] = None
    reader_usage_context: Optional[str] = None

class ChatResponse(BaseModel):
    """
    Represents the structured response body returned by the API.
    quality_score now explicitly uses the detailed AuditResult schema.
    """
    expert_prompt: str
    explanation: str = ""
    quality_score: Optional[AuditResult] = None # Updated to use AuditResult

class RefineRequest(BaseModel):
    """
    Request body for the refine endpoint.
    Sent when user clicks the 'Refine' button after receiving a generated prompt.
    """
    original_prompt: str = Field(..., description="The prompt to be refined")
    framework_suggestion: str = Field(..., description="The optimization framework to inject (CoT, ToT, etc.)")
    target_model: str = Field(..., description="The AI model to use for refinement")
    task_category: str = Field(default="general", description="Category of the task (blog, code, etc.)")