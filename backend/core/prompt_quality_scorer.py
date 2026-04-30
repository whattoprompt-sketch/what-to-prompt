import re
from models.chat_models import AuditResult, AuditDimension

class PromptQualityScorer:
    """
    Evaluates the quality of a generated prompt objectively using heuristics.
    """
    
    @staticmethod
    def score_prompt(prompt: str) -> AuditResult:
        """
        Scores the prompt based on 5 real signals:
        1. Block Presence (6 blocks)
        2. Constraint Measurability (numbers/specifics)
        3. Role Specificity (precision vs generic)
        4. Task Decomposition (multi-step)
        5. Format Definition (explicitness)
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

        # 1. BLOCK PRESENCE (6 Blocks)
        required_blocks = [
            "### [IDENTITY]", "### [CONTEXT]", "### [TASK]", 
            "### [OUTPUT STRUCTURE]", "### [EXEMPLAR]", "### [CONSTRAINT]"
        ]
        found_blocks = [b for b in required_blocks if b in prompt]
        block_score = int((len(found_blocks) / 6) * 100)
        
        # 2. CONSTRAINT MEASURABILITY (Numbers/Specifics)
        # Look for numbers or units in the constraint block
        constraint_match = re.search(r"### \[CONSTRAINT\](.*?)(###|$)", prompt, re.S)
        constraint_text = constraint_match.group(1) if constraint_match else ""
        has_numbers = bool(re.search(r"\d+|words?|bullets?|paragraphs?|sections?", constraint_text, re.I))
        constraint_score = 100 if has_numbers and len(constraint_text) > 20 else (50 if len(constraint_text) > 0 else 0)

        # 3. ROLE SPECIFICITY (Precision vs Generic)
        identity_match = re.search(r"### \[IDENTITY\](.*?)(###|$)", prompt, re.S)
        identity_text = identity_match.group(1) if identity_match else ""
        # Check if identity is deep (> 20 words or has expertise markers)
        is_precise = len(identity_text.split()) > 15 or bool(re.search(r"expert|senior|specialist|master|certified|years of experience", identity_text, re.I))
        role_score = 100 if is_precise else 40

        # 4. TASK DECOMPOSITION (Multi-step)
        task_match = re.search(r"### \[TASK\](.*?)(###|$)", prompt, re.S)
        task_text = task_match.group(1) if task_match else ""
        has_steps = bool(re.search(r"Step 1|Step 2|First,|Then,|Finally,", task_text, re.I))
        task_score = 100 if has_steps else 50

        # 5. FORMAT DEFINITION (Explicitness)
        format_match = re.search(r"### \[OUTPUT STRUCTURE\](.*?)(###|$)", prompt, re.S)
        format_text = format_match.group(1) if format_match else ""
        is_explicit = bool(re.search(r"\[.*?\]|max|exactly|as follows", format_text, re.I))
        format_score = 100 if is_explicit else 30

        # Calculate Final Metrics (Equal Weighting for these 5 core signals)
        overall_score = int((block_score + constraint_score + role_score + task_score + format_score) / 5)
        
        # Determine Grade
        if overall_score >= 95: grade = "A+"; success = "Extremely High (98%+)"
        elif overall_score >= 88: grade = "A"; success = "High (90%+)"
        elif overall_score >= 75: grade = "B"; success = "Moderate (75%+)"
        elif overall_score >= 60: grade = "C"; success = "Average (60%+)"
        else: grade = "D"; success = "Low (below 50%)"

        # Generate Strengths and Suggestions
        strengths = []
        if block_score == 100: strengths.append("Complete 6-block architecture")
        if constraint_score == 100: strengths.append("Measurable success constraints")
        if role_score == 100: strengths.append("Precise expert role calibration")
        if task_score == 100: strengths.append("Decomposed multi-step logic")
        if format_score == 100: strengths.append("Explicit format definition")
        
        suggestions = []
        missing = set(required_blocks) - set(found_blocks)
        if missing: suggestions.append(f"Missing blocks: {', '.join(missing)}")
        if not has_numbers: suggestions.append("Add numbers to constraints (e.g. 'max 200 words')")
        if not is_precise: suggestions.append("Deepen the role with specific expertise markers")
        if not has_steps: suggestions.append("Break the task into Step 1, Step 2 logic")
        if not is_explicit: suggestions.append("Define the output format more explicitly using headers")

        # Basic counters
        word_count = len(prompt.split())
        token_count = int(word_count * 1.3)

        return AuditResult(
            overall_score=overall_score,
            grade=grade,
            estimated_success_rate=success,
            dimensions={
                "Architecture": AuditDimension(score=block_score, feedback=f"Found {len(found_blocks)}/6 blocks."),
                "Precision": AuditDimension(score=role_score, feedback="Expert role specificity analysis."),
                "Logic": AuditDimension(score=task_score, feedback="Task decomposition check."),
                "Measurability": AuditDimension(score=constraint_score, feedback="Numeric constraint detection."),
                "Formatting": AuditDimension(score=format_score, feedback="Output structure explicitness.")
            },
            strengths=strengths,
            suggestions=suggestions,
            token_count=token_count,
            estimated_cost=f"${(token_count/1000 * 0.015):.4f}",
            model_check_warning=None
        )