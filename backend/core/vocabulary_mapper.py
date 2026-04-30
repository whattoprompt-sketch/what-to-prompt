import zlib
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class VocabularyMapper:
    """
    Transforms novice inputs into professional credential blocks with cognitive frames.
    The cognitive frame is the operational context sentence that primes the LLM
    to adopt a specific high-stakes perspective — not just a title.
    """
    
    # Format: (Title, Experience, Niche, Cognitive Frame)
    AUTHORITY_BLOCKS = {
        "teacher": (
            "Senior Pedagogy Strategist", "15+ years", "Scaffolded Learning & Cognitive Science",
            "who designs curricula for elite universities where student outcomes are measured by real-world skill application, not exam scores"
        ),
        "student": (
            "Academic Research Practitioner", "Post-Graduate Level", "Critical Analysis & Advanced Methodology",
            "operating in a competitive research environment where every claim must survive peer review and every argument must be logically bulletproof"
        ),
        "developer": (
            "Principal Software Architect", "12+ years", "Distributed Systems & Clean Architecture",
            "who has shipped systems handling millions of concurrent users where a single architectural decision can cost six figures in infrastructure spend"
        ),
        "engineer": (
            "Principal Systems Engineer", "12+ years", "Technical Architecture & Systems Design",
            "who operates in safety-critical environments where every design choice is validated against failure mode analysis before it ships"
        ),
        "writer": (
            "Strategic Content Architect", "10+ years", "Narrative Design & Conversion Optimization",
            "who writes for direct-response campaigns where every paragraph is A/B tested against revenue metrics and weak copy is cut without sentiment"
        ),
        "marketer": (
            "Growth Engineering Lead", "8+ years", "Behavioral Economics & Performance Marketing",
            "who has scaled acquisition funnels from zero to eight figures using only data-validated creative decisions"
        ),
        "marketing": (
            "Senior Growth Marketing Strategist", "10+ years", "Brand Positioning & Demand Generation",
            "who has repositioned brands in saturated markets where the difference between first and second place is a single precise messaging insight"
        ),
        "consultant": (
            "Senior Management Consultant", "12+ years", "Strategic Advisory & Business Transformation",
            "who advises C-suite executives where every recommendation is benchmarked against a single metric: revenue impact per dollar of implementation cost"
        ),
        "salesman": (
            "Senior Luxury Brand Strategist", "12+ years", "High-Net-Worth Client Acquisition & AIDA Framework",
            "who sells to ultra-high-net-worth individuals where trust is built over years and a single wrong word ends the relationship permanently"
        ),
        "sales": (
            "Senior Revenue Growth Strategist", "10+ years", "Pipeline Optimization & Consultative Selling",
            "who has personally closed enterprise deals in competitive markets where the average sales cycle is 9 months and every touchpoint is deliberate"
        ),
        "manager": (
            "Strategic Operations Director", "20+ years", "Cross-Functional Leadership & Lean Six Sigma",
            "who leads teams across time zones in high-stakes environments where a missed deadline has direct contractual and financial consequences"
        ),
        "analyst": (
            "Principal Data & Strategy Analyst", "10+ years", "Quantitative Analysis & Business Intelligence",
            "who translates complex datasets into executive-level decisions where ambiguity in the analysis is simply not an option"
        ),
        "designer": (
            "Senior UX/Product Design Lead", "10+ years", "Human-Centered Design & Design Systems",
            "who designs for products with millions of daily active users where a single friction point generates thousands of support tickets per day"
        ),
        "scientist": (
            "Principal Research Scientist", "12+ years", "Applied Research & Experimental Methodology",
            "who works in peer-reviewed environments where every claim requires statistical validation and replicability is non-negotiable"
        ),
        "researcher": (
            "Senior Research Strategist", "10+ years", "Mixed-Methods Research & Insight Synthesis",
            "who synthesizes contradictory findings for decision-makers who need clear, actionable conclusions under time pressure"
        ),
        "coach": (
            "Executive Performance Coach", "10+ years", "Behavioral Change & High-Performance Systems",
            "who works with C-suite executives and elite athletes where the gap between potential and performance is always behavioral, never technical"
        ),
        "expert": (
            "Distinguished Industry Authority", "15+ years", "Principal Domain Expertise",
            "whose published work is cited by peers and whose recommendations have been adopted as industry standards"
        )
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
        
        # Context-aware elevation for low-skill roles paired with high-skill tasks
        if any(low_skill in raw_l for low_skill in ["student", "beginner", "amateur", "novice"]):
            if any(keyword in task_l for keyword in ["engineer", "structural", "audit", "skyscraper", "building", "construction"]):
                result = "Principal Structural Engineer & Forensic Architect with 20+ years in high-rise seismic safety and IBC compliance — who has testified as an expert witness in structural failure litigation"
                logger.info(f"[VocabMapper] Context elevation: '{raw_role}' -> engineer override")
                return result
            elif any(keyword in task_l for keyword in ["legal", "contract", "law", "attorney", "court"]):
                result = "Senior Real Estate Attorney & Property Law Strategist with 20+ years litigation experience — who has argued before appellate courts and written contracts that survived decade-long legal challenges"
                logger.info(f"[VocabMapper] Context elevation: '{raw_role}' -> legal override")
                return result
            elif any(keyword in task_l for keyword in ["medical", "surgery", "diagnosis", "patient"]):
                result = "Board-Certified Medical Specialist with 15+ years clinical experience — who practices in teaching hospitals where every diagnosis is documented as a peer-reviewed case study"
                logger.info(f"[VocabMapper] Context elevation: '{raw_role}' -> medical override")
                return result

        for key, data in cls.AUTHORITY_BLOCKS.items():
            if key in raw_l:
                title, exp, niche, frame = data
                result = f"{title} with {exp} in {niche} — {frame}"
                logger.info(f"[VocabMapper] Role match: '{raw_role}' -> key='{key}' -> '{result[:80]}...'")
                return result
        
        # Fallback — log what the raw input was so we can extend the mapping
        logger.warning(f"[VocabMapper] No match for role: '{raw_role}' (normalized: '{raw_l}'). Using generic fallback.")
        return "Distinguished Principal Strategy Lead and Subject Matter Authority — whose recommendations carry institutional weight and whose methodology has been adopted by industry peers"

    @classmethod
    def get_strategic_task(cls, raw_task: str) -> str:
        raw_l = raw_task.lower().strip()
        for key, options in cls.TASK_TRANSFORMATIONS.items():
            if key in raw_l:
                clean_context = raw_task.lower().replace(key, "").strip()
                idx = zlib.adler32(raw_task.encode()) % len(options)
                return f"{options[idx]} {clean_context}".strip()
        return "Synthesize and architect a production-grade framework for the target domain."

    @classmethod
    def get_methodology(cls, task: str) -> str:
        t = task.lower()
        if any(x in t for x in ["code", "build", "program"]): return "SOLID Principles & Big O Analysis"
        if any(x in t for x in ["explain", "teach", "learn"]): return "The Feynman Technique & Bloom's Taxonomy"
        if any(x in t for x in ["market", "sell", "ad", "copy"]): return "The AIDA Framework & Psychological Triggers"
        return "The MECE Framework (Mutually Exclusive, Collectively Exhaustive)"
