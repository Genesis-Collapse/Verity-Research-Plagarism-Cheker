"""
ai_engine.py — Hybrid AI Text Detection Engine

Three-component blended scoring:
  1. Burstiness (20% weight) — Sentence-length variance via nltk
  2. Perplexity (20% weight) — Cross-entropy loss via distilgpt2
  3. Modern Classifier (60% weight) — Direct probability from
     Hello-SimpleAI/chatgpt-detector-roberta

Returns a single blended probability and label.
"""

import logging
import re
import math
import statistics

import torch
import nltk

logger = logging.getLogger(__name__)


# ─── Component 1: Burstiness (20%) ─────────────────────────────────────────

def _compute_burstiness(text: str) -> float:
    """
    Compute a burstiness score from sentence-length variance.

    Human writing tends to have high variance (short + long sentences).
    AI writing tends to be more uniform → low std dev → high AI score.

    Returns a value in [0, 1] where 1 = very likely AI.
    """
    try:
        sentences = nltk.sent_tokenize(text)
        if len(sentences) < 3:
            return 0.5  # Not enough data → neutral

        lengths = [len(s.split()) for s in sentences]
        std_dev = statistics.stdev(lengths)
        mean_len = statistics.mean(lengths)

        if mean_len == 0:
            return 0.5

        # Coefficient of variation: lower = more uniform = more AI-like
        cv = std_dev / mean_len

        # Map CV to AI probability:
        # CV < 0.2 → very uniform → AI score ~0.9
        # CV > 0.6 → very varied → AI score ~0.1
        if cv <= 0.2:
            return 0.9
        elif cv >= 0.6:
            return 0.1
        else:
            # Linear interpolation between 0.2 and 0.6
            return 0.9 - (cv - 0.2) * (0.8 / 0.4)

    except Exception as e:
        logger.warning(f"Burstiness calculation failed: {e}")
        return 0.5


# ─── Component 2: Perplexity (20%) ─────────────────────────────────────────

def _compute_perplexity(text: str, tokenizer, model) -> float:
    """
    Calculate cross-entropy loss using distilgpt2.

    Low perplexity (easy to predict) → more likely AI-generated.
    High perplexity (surprising text) → more likely human.

    Returns a value in [0, 1] where 1 = very likely AI.
    """
    try:
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        )

        with torch.no_grad():
            outputs = model(**inputs, labels=inputs["input_ids"])
            loss = outputs.loss.item()

        # Convert loss to perplexity
        perplexity = math.exp(min(loss, 20))  # Cap to prevent overflow

        # Map perplexity to AI probability:
        # perplexity < 30 → very predictable → AI score ~0.9
        # perplexity > 200 → very surprising → AI score ~0.1
        if perplexity <= 30:
            return 0.9
        elif perplexity >= 200:
            return 0.1
        else:
            # Log-scale interpolation
            log_ppl = math.log(perplexity)
            log_low = math.log(30)
            log_high = math.log(200)
            return 0.9 - (log_ppl - log_low) / (log_high - log_low) * 0.8

    except Exception as e:
        logger.warning(f"Perplexity calculation failed: {e}")
        return 0.5


# ─── Component 3: Modern Classifier (60%) ──────────────────────────────────

def _classify_modern(text: str, tokenizer, model) -> float:
    """
    Direct classification using Hello-SimpleAI/chatgpt-detector-roberta.

    Returns the probability that the text is AI-generated [0, 1].
    """
    try:
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)

        # This model: index 0 = "Human", index 1 = "ChatGPT"
        ai_prob = probabilities[0][1].item()
        return ai_prob

    except Exception as e:
        logger.warning(f"Modern classifier failed: {e}")
        return 0.5


# ─── Hybrid Blender ────────────────────────────────────────────────────────

def detect_ai_hybrid(
    text: str,
    classifier_tokenizer,
    classifier_model,
    perplexity_tokenizer,
    perplexity_model,
) -> tuple[float, str]:
    """
    Run the full 3-component hybrid AI detection pipeline.

    Weights:
      - Burstiness:        20%
      - Perplexity:        20%
      - Modern Classifier: 60%

    Returns:
        (blended_probability, label)
        where label is "AI-Generated" or "Human-Written"
    """
    # Component 1: Burstiness (no model needed — uses nltk)
    burstiness_score = _compute_burstiness(text)

    # Component 2: Perplexity (uses distilgpt2)
    perplexity_score = _compute_perplexity(text, perplexity_tokenizer, perplexity_model)

    # Component 3: Modern Classifier (uses chatgpt-detector-roberta)
    classifier_score = _classify_modern(text, classifier_tokenizer, classifier_model)

    # Weighted blend
    blended = (
        0.20 * burstiness_score +
        0.20 * perplexity_score +
        0.60 * classifier_score
    )

    # Citation dampening — reduce false positives on academic text
    citation_pattern = r'(\[[\d,\s]+\]|\([A-Za-z\s]+,\s\d{4}\)|et al\.)'
    if re.search(citation_pattern, text):
        blended = max(0.0, blended - 0.15)

    # Clamp to [0, 1]
    blended = max(0.0, min(1.0, blended))

    # Threshold
    label = "AI-Generated" if blended > 0.65 else "Human-Written"

    logger.debug(
        f"AI Detection — Burstiness: {burstiness_score:.3f}, "
        f"Perplexity: {perplexity_score:.3f}, "
        f"Classifier: {classifier_score:.3f}, "
        f"Blended: {blended:.3f} → {label}"
    )

    return blended, label
