"""
HTML Text Extractor.

Extracts meaningful text segments from HTML that are likely candidates
for dark pattern analysis (buttons, popups, notifications, form labels, etc.).
"""

import re
from typing import List, Dict
from bs4 import BeautifulSoup, Comment


# HTML elements likely to contain dark pattern text
PRIORITY_ELEMENTS = {
    # Interactive elements
    "button", "a", "input", "select", "option",
    # Form elements
    "label", "legend", "fieldset",
    # Content containers
    "p", "span", "div", "li",
    # Headings
    "h1", "h2", "h3", "h4", "h5", "h6",
    # Specific elements
    "strong", "em", "b", "i", "small",
    "td", "th", "caption",
    "figcaption",
}

# Elements to skip entirely
SKIP_ELEMENTS = {
    "script", "style", "noscript", "iframe", "svg", "path",
    "meta", "link", "head", "title",
    "code", "pre",
}

# CSS class hints that suggest dark-pattern-related content
SUSPICIOUS_CLASSES = {
    "popup", "modal", "notification", "toast", "banner",
    "countdown", "timer", "urgency", "scarcity",
    "upsell", "cross-sell", "fomo", "social-proof",
    "overlay", "sticky", "alert", "warning",
    "subscribe", "newsletter", "opt-in",
    "checkout", "cart",
}

# Minimum text length to consider
MIN_TEXT_LENGTH = 5
# Maximum text length per segment
MAX_TEXT_LENGTH = 500


def extract_text_segments(html: str) -> List[Dict]:
    """
    Extract text segments from HTML for dark pattern analysis.
    
    Args:
        html: Raw HTML string.
        
    Returns:
        List of dicts: {text, element, context}
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove unwanted elements
    for element in soup.find_all(SKIP_ELEMENTS):
        element.decompose()

    # Remove HTML comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()

    segments = []
    seen_texts = set()

    # Extract text from priority elements first
    for tag in soup.find_all(PRIORITY_ELEMENTS):
        text = _clean_element_text(tag.get_text(separator=" ", strip=True))
        if not text or len(text) < MIN_TEXT_LENGTH:
            continue

        # Skip duplicate text
        text_lower = text.lower()
        if text_lower in seen_texts:
            continue
        seen_texts.add(text_lower)

        # Truncate very long text
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH] + "..."

        # Build context info
        context = _get_element_context(tag)

        segments.append({
            "text": text,
            "element": tag.name,
            "context": context,
        })

    # Also extract standalone text nodes from body
    body = soup.find("body") or soup
    for text_node in body.find_all(string=True):
        parent = text_node.parent
        if parent and parent.name in SKIP_ELEMENTS:
            continue

        text = _clean_element_text(str(text_node).strip())
        if not text or len(text) < MIN_TEXT_LENGTH:
            continue

        text_lower = text.lower()
        if text_lower in seen_texts:
            continue
        seen_texts.add(text_lower)

        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH] + "..."

        segments.append({
            "text": text,
            "element": parent.name if parent else "text",
            "context": _get_element_context(parent) if parent else "",
        })

    return segments


def _clean_element_text(text: str) -> str:
    """Clean extracted element text."""
    if not text:
        return ""
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Remove zero-width characters
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    return text


def _get_element_context(tag) -> str:
    """
    Extract context hints from an HTML element's attributes.
    Returns a string describing the element's role/position.
    """
    if not tag or not hasattr(tag, "attrs"):
        return ""

    context_parts = []

    # Check CSS classes for suspicious patterns
    classes = tag.get("class", [])
    if isinstance(classes, list):
        class_str = " ".join(classes).lower()
        for hint in SUSPICIOUS_CLASSES:
            if hint in class_str:
                context_parts.append(f"class:{hint}")

    # Check ID
    elem_id = tag.get("id", "").lower()
    for hint in SUSPICIOUS_CLASSES:
        if hint in elem_id:
            context_parts.append(f"id:{hint}")

    # Check element type specifics
    if tag.name == "button":
        context_parts.append("button")
    elif tag.name == "a":
        href = tag.get("href", "")
        if "unsubscribe" in href.lower() or "cancel" in href.lower():
            context_parts.append("cancel-link")

    # Check for data attributes
    for attr in tag.attrs:
        if attr.startswith("data-") and any(h in attr.lower() for h in ["timer", "countdown", "fomo"]):
            context_parts.append(f"data:{attr}")

    return ", ".join(context_parts)


def filter_relevant_segments(
    segments: List[Dict],
    max_segments: int = 500,
) -> List[Dict]:
    """
    Filter and prioritize segments that are most likely to contain dark patterns.
    
    Prioritizes segments from interactive elements and those with
    suspicious CSS class hints.
    """
    # Score each segment
    scored = []
    for seg in segments:
        score = 0
        # Boost interactive elements
        if seg["element"] in {"button", "a", "label", "input"}:
            score += 2
        # Boost segments with suspicious context
        if seg["context"]:
            score += 3
        # Boost shorter text (more likely to be UI text vs. content)
        if len(seg["text"]) < 100:
            score += 1
        scored.append((score, seg))

    # Sort by score (descending), then truncate
    scored.sort(key=lambda x: x[0], reverse=True)
    return [seg for _, seg in scored[:max_segments]]
