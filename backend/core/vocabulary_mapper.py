import zlib
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class VocabularyMapper:
    """
    Transforms novice inputs into professional credential blocks and methodologies.
    This creates the 'Creative Gap' that forces the AI to innovate.
    """
    
    # Credentials: Role -> (Professional Title, Experience, Niche)
    AUTHORITY_BLOCKS = {
        "teacher": ("Senior Pedagogy Strategist", "15+ years", "Scaffolded Learning & Cognitive Science"),
        "student": ("Academic Research Practitioner", "Post-Graduate Level", "Critical Analysis & Advanced Methodology"),
        "developer": ("Principal Software Architect", "12+ years", "Distributed Systems & Clean Architecture"),
        "engineer": ("Principal Systems Engineer", "12+ years", "Technical Architecture & Systems Design"),
        "writer": ("Strategic Content Architect", "10+ years", "Narrative Design & Conversion Optimization"),
        "marketer": ("Growth Engineering Lead", "8+ years", "Behavioral Economics & Performance Marketing"),
        "marketing": ("Senior Growth Marketing Strategist", "10+ years", "Brand Positioning & Demand Generation"),
        "consultant": ("Senior Management Consultant", "12+ years", "Strategic Advisory & Business Transformation"),
        "salesman": ("Senior Luxury Brand Strategist", "12+ years", "High-Net-Worth Client Acquisition & AIDA Framework"),
        "sales": ("Senior Revenue Growth Strategist", "10+ years", "Pipeline Optimization & Consultative Selling"),
        "manager": ("Strategic Operations Director", "20+ years", "Cross-Functional Leadership & Lean Six Sigma"),
        "analyst": ("Principal Data & Strategy Analyst", "10+ years", "Quantitative Analysis & Business Intelligence"),
        "designer": ("Senior UX/Product Design Lead", "10+ years", "Human-Centered Design & Design Systems"),
        "scientist": ("Principal Research Scientist", "12+ years", "Applied Research & Experimental Methodology"),
        "researcher": ("Senior Research Strategist", "10+ years", "Mixed-Methods Research & Insight Synthesis"),
        "coach": ("Executive Performance Coach", "10+ years", "Behavioral Change & High-Performance Systems"),
        "expert": ("Distinguished Industry Authority", "15+ years", "Principal Domain Expertise")
    }

    TASK_TRANSFORMATIONS = {
        "write": ["architect a comprehensive", "engineer a production-grade", "synthesize a strategic"],
        "explain": ["elucidate complex principles via", "translate technical concepts using", "demystify"],
        "build": ["construct a scalable", "engineer a robust", "implement an enterprise-grade"],
        "teach": ["facilitate knowledge transfer via", "design cognitive scaffolding for"],
        "sell": ["architect an acquisition strategy for", "engineer a conversion framework for", "design a strategic engagement plan for"]
    }

    @classmethod
    def get_credential_block(cls, raw_role: str, task_context: str = "") -> str:
        raw_l = raw_role.lower().strip()
        task_l = task_context.lower()
        
        # Context-aware role elevation for low-skill roles with high-skill tasks
        if any(low_skill in raw_l for low_skill in ["student", "beginner", "amateur", "novice"]):
            # Check if task requires high-skill expertise
            if any(keyword in task_l for keyword in ["engineer", "structural", "audit", "skyscraper", "building", "construction"]):
                return "Principal Structural Engineer & Forensic Architect with 20+ years experience in high-rise seismic safety and IBC compliance."
            elif any(keyword in task_l for keyword in ["legal", "contract", "law", "attorney", "court"]):
                return "Senior Real Estate Attorney & Property Law Strategist with 20+ years litigation experience."
            elif any(keyword in task_l for keyword in ["medical", "surgery", "diagnosis", "patient"]):
                return "Board-Certified Medical Specialist with 15+ years clinical experience."
        
        for key, data in cls.AUTHORITY_BLOCKS.items():
            if key in raw_l:
                title, exp, niche = data
                result = f"{title} with {exp} experience in {niche}."
                logger.info(f"[VocabMapper] Role match: '{raw_role}' -> key='{key}' -> '{result}'")
                return result
        
        # FALLBACK: No key matched — log what the raw input was so we can add it
        logger.warning(f"[VocabMapper] No match for role: '{raw_role}' (normalized: '{raw_l}'). Using generic fallback.")
        return "Distinguished Principal Strategy Lead and Subject Matter Authority."

    @classmethod
    def get_strategic_task(cls, raw_task: str) -> str:
        raw_l = raw_task.lower().strip()
        for key, options in cls.TASK_TRANSFORMATIONS.items():
            if key in raw_l:
                # Remove the novice word even in the strategic task string
                clean_context = raw_task.lower().replace(key, "").strip()
                # Deterministic selection based on input string
                idx = zlib.adler32(raw_task.encode()) % len(options)
                return f"{options[idx]} {clean_context}".strip()
        # FALLBACK: Use generic strategic language
        return "Synthesize and architect a production-grade framework for the target domain."

    @classmethod
    def get_methodology(cls, task: str) -> str:
        t = task.lower()
        if any(x in t for x in ["code", "build", "program"]): return "SOLID Principles & Big O Analysis"
        if any(x in t for x in ["explain", "teach", "learn"]): return "The Feynman Technique & Bloom’s Taxonomy"
        if any(x in t for x in ["market", "sell", "ad", "copy"]): return "The AIDA Framework & Psychological Triggers"
        return "The MECE Framework (Mutually Exclusive, Collectively Exhaustive)"
