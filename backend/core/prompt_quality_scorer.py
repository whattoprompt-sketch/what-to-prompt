import re
from models.chat_models import AuditResult, AuditDimension

class PromptQualityScorer:
    """
    Evaluates the quality of a generated prompt objectively using heuristics.
    """
    
    @staticmethod
    def score_prompt(prompt: str) -> AuditResult:
        """
        Scores the prompt based on structure, depth, and instructional signals.
        """
        if not prompt:
            return AuditResult(
                overall_score=0,
                grade="F",
                estimated_success_rate="0%",
                dimensions={},
                strengths=[],
                suggestions=["Prompt is empty."],
                token_count=0,
                estimated_cost="$0.00",
                model_check_warning=None
            )

        # 1. Structural Analysis (Section Headers)
        sections = {
            "Role": r"(?i)(role|persona|act as|you are a)",
            "Task": r"(?i)(task|goal|objective|instruction|your job is)",
            "Context": r"(?i)(context|background|situation|setting)",
            "Constraints": r"(?i)(constraints|limitations|rules|requirements|do not|avoid)"
        }
        
        found_sections = []
        section_score = 0
        for name, pattern in sections.items():
            if re.search(pattern, prompt):
                found_sections.append(name)
                section_score += 25
        
        # 2. Depth Analysis (Length/Complexity)
        word_count = len(prompt.split())
        token_count = int(word_count * 1.3)
        
        depth_score = 0
        if word_count > 300:
            depth_score = 100
        elif word_count > 150:
            depth_score = 80
        elif word_count > 50:
            depth_score = 50
        else:
            depth_score = 20

        # 3. Instruction Signals (Expert Vocabulary)
        signals = [
            r"(?i)step-by-step",
            r"(?i)output format",
            r"(?i)chain of thought",
            r"(?i)delimiters",
            r"(?i)example",
            r"(?i)few-shot",
            r"(?i)optimize",
            r"(?i)comprehensive"
        ]
        
        signal_count = sum(1 for s in signals if re.search(s, prompt))
        signal_score = min(100, signal_count * 20)

        # 4. Calculate Final Metrics
        overall_score = int((section_score * 0.5) + (depth_score * 0.3) + (signal_score * 0.2))
        
        # Determine Grade
        if overall_score >= 90:
            grade = "A+"
            success = "Extremely High (95%+)"
        elif overall_score >= 80:
            grade = "A"
            success = "High (85%+)"
        elif overall_score >= 70:
            grade = "B"
            success = "Moderate (70%+)"
        else:
            grade = "C"
            success = "Low (50% or less)"

        # Generate Strengths and Suggestions
        strengths = []
        if section_score >= 75: strengths.append("Excellent multi-part structure")
        if depth_score >= 80: strengths.append("Strong descriptive depth")
        if signal_score >= 60: strengths.append("Advanced instructional signals")
        
        suggestions = []
        missing = set(sections.keys()) - set(found_sections)
        if missing:
            suggestions.append(f"Consider explicitly adding: {', '.join(missing)}")
        if word_count < 100:
            suggestions.append("Increase specificity by providing more context")
        if signal_count < 2:
            suggestions.append("Use formatting instructions (e.g. 'Output as JSON')")

        return AuditResult(
            overall_score=overall_score,
            grade=grade,
            estimated_success_rate=success,
            dimensions={
                "Structure": AuditDimension(score=section_score, feedback=f"Found {len(found_sections)}/4 essential sections."),
                "Depth": AuditDimension(score=depth_score, feedback=f"Prompt is {word_count} words long."),
                "Clarity": AuditDimension(score=signal_score, feedback=f"Detected {signal_count} expert signals.")
            },
            strengths=strengths,
            suggestions=suggestions,
            token_count=token_count,
            estimated_cost=f"${(token_count/1000 * 0.015):.4f}",
            model_check_warning=None
        )