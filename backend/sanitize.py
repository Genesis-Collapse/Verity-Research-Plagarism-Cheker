"""
sanitize.py — Text Sanitization Utility

Crushes adversarial homoglyph injections and invisible character tricks
by normalizing Unicode and stripping zero-width characters.
"""

import re
import unicodedata
from typing import NamedTuple


class SanitizationReport(NamedTuple):
    """Report of what the sanitizer did to the text."""
    cleaned_text: str
    unicode_normalized: bool
    zero_width_chars_removed: int
    whitespace_normalized: bool


# Zero-width and invisible Unicode characters to strip
_ZERO_WIDTH_PATTERN = re.compile(
    "["
    "\u200B"  # Zero Width Space
    "\u200C"  # Zero Width Non-Joiner
    "\u200D"  # Zero Width Joiner
    "\u200E"  # Left-to-Right Mark
    "\u200F"  # Right-to-Left Mark
    "\u2060"  # Word Joiner
    "\u2061"  # Function Application
    "\u2062"  # Invisible Times
    "\u2063"  # Invisible Separator
    "\u2064"  # Invisible Plus
    "\uFEFF"  # Zero Width No-Break Space (BOM)
    "]"
)


def sanitize(text: str) -> SanitizationReport:
    """
    Sanitize input text to neutralize adversarial manipulation.

    Steps:
        1. Unicode NFKC normalization — maps visually identical characters
           (e.g., fullwidth Latin) to their canonical form.
        2. Zero-width character stripping — removes invisible characters
           that can be inserted between letters to fool naive matchers.
        3. Whitespace normalization — collapses runs of whitespace to
           single spaces and strips leading/trailing whitespace.

    Args:
        text: Raw input text (potentially adversarial).

    Returns:
        SanitizationReport with cleaned text and metadata about what changed.
    """
    if not text:
        return SanitizationReport(
            cleaned_text="",
            unicode_normalized=False,
            zero_width_chars_removed=0,
            whitespace_normalized=False,
        )

    # Step 1: Unicode NFKC normalization
    normalized = unicodedata.normalize("NFKC", text)
    unicode_changed = normalized != text

    # Step 2: Strip zero-width characters
    zero_width_matches = _ZERO_WIDTH_PATTERN.findall(normalized)
    zero_width_count = len(zero_width_matches)
    stripped = _ZERO_WIDTH_PATTERN.sub("", normalized)

    # Step 3: Normalize whitespace
    whitespace_cleaned = re.sub(r"\s+", " ", stripped).strip()
    whitespace_changed = whitespace_cleaned != stripped

    return SanitizationReport(
        cleaned_text=whitespace_cleaned,
        unicode_normalized=unicode_changed,
        zero_width_chars_removed=zero_width_count,
        whitespace_normalized=whitespace_changed,
    )
