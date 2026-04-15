"""
HTML Text Extractor

Takes raw HTML and pulls out the text segments that might contain
dark patterns. Focuses on buttons, links, popups, notifications,
and other interactive elements where dark patterns typically hide.
"""

import re
from bs4 import BeautifulSoup, Comment


# --- CONFIGURATION ---

# HTML tags that are most likely to contain dark pattern text
PRIORITY_ELEMENTS = {
    # Buttons and links
    "button", "a", "input", "select", "option",
    # Form stuff
    "label", "legend", "fieldset",
    # Text containers
    "p", "span", "div", "li",
    # Headings
    "h1", "h2", "h3", "h4", "h5", "h6",
    # Emphasis elements
    "strong", "em", "b", "i", "small",
    # Table cells
    "td", "th", "caption",
    "figcaption",
}

# HTML tags to completely ignore (no useful text here)
SKIP_ELEMENTS = {
    "script", "style", "noscript", "iframe", "svg", "path",
    "meta", "link", "head", "title",
    "code", "pre",
}

# CSS class names that hint at dark pattern content
SUSPICIOUS_CLASSES = {
    "popup", "modal", "notification", "toast", "banner",
    "countdown", "timer", "urgency", "scarcity",
    "upsell", "cross-sell", "fomo", "social-proof",
    "overlay", "sticky", "alert", "warning",
    "subscribe", "newsletter", "opt-in",
    "checkout", "cart",
}

# Text shorter than this is probably not meaningful
MIN_TEXT_LENGTH = 5
# Truncate extremely long text segments
MAX_TEXT_LENGTH = 500


def extract_text_segments(html):
    """
    Pull out text segments from HTML for dark pattern analysis.

    Args:
        html: Raw HTML string from a web page

    Returns:
        A list of dicts like:
        [
            {"text": "Only 2 left!", "element": "span", "context": "class:urgency"},
            {"text": "Add to cart", "element": "button", "context": "button"},
        ]
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove script/style/etc tags — we don't need those
    for element in soup.find_all(SKIP_ELEMENTS):
        element.decompose()

    # Remove HTML comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()

    segments = []
    seen_texts = set()  # Track duplicates

    # First pass: get text from important elements (buttons, links, etc.)
    for tag in soup.find_all(PRIORITY_ELEMENTS):
        text = _clean_text(tag.get_text(separator=" ", strip=True))

        # Skip empty or very short text
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

        # Build context info (which HTML element, suspicious classes, etc.)
        context = _get_context(tag)

        segments.append({
            "text": text,
            "element": tag.name,
            "context": context,
        })

    # Second pass: get standalone text nodes that weren't in priority elements
    body = soup.find("body") or soup
    for text_node in body.find_all(string=True):
        parent = text_node.parent
        if parent and parent.name in SKIP_ELEMENTS:
            continue

        text = _clean_text(str(text_node).strip())
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
            "context": _get_context(parent) if parent else "",
        })

    return segments


def _clean_text(text):
    """Clean up extracted text: collapse whitespace, remove invisible characters."""
    if not text:
        return ""
    # Replace multiple spaces/newlines with a single space
    text = re.sub(r"\s+", " ", text).strip()
    # Remove zero-width invisible characters
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    return text


def _get_context(tag):
    """
    Look at an HTML element's attributes to find suspicious hints.

    For example, if a <div> has class="countdown-timer", this returns
    "class:countdown, class:timer" — telling us this might be an urgency pattern.
    """
    if not tag or not hasattr(tag, "attrs"):
        return ""

    hints = []

    # Check CSS classes for suspicious keywords
    classes = tag.get("class", [])
    if isinstance(classes, list):
        class_str = " ".join(classes).lower()
        for keyword in SUSPICIOUS_CLASSES:
            if keyword in class_str:
                hints.append(f"class:{keyword}")

    # Check element ID for suspicious keywords
    elem_id = tag.get("id", "").lower()
    for keyword in SUSPICIOUS_CLASSES:
        if keyword in elem_id:
            hints.append(f"id:{keyword}")

    # Note what type of element this is
    if tag.name == "button":
        hints.append("button")
    elif tag.name == "a":
        href = tag.get("href", "")
        if "unsubscribe" in href.lower() or "cancel" in href.lower():
            hints.append("cancel-link")

    # Check data attributes for timer/countdown hints
    for attr in tag.attrs:
        if attr.startswith("data-") and any(h in attr.lower() for h in ["timer", "countdown", "fomo"]):
            hints.append(f"data:{attr}")

    return ", ".join(hints)


def filter_relevant_segments(segments, max_segments=500):
    """
    Prioritize segments most likely to contain dark patterns.

    Gives higher priority to:
    - Interactive elements (buttons, links) — +2 points
    - Elements with suspicious CSS classes — +3 points
    - Short text (UI text vs. article content) — +1 point

    Then keeps only the top `max_segments` results.
    """
    scored = []
    for seg in segments:
        score = 0

        # Buttons and links are common dark pattern locations
        if seg["element"] in {"button", "a", "label", "input"}:
            score += 2

        # Elements with suspicious CSS classes are very likely candidates
        if seg["context"]:
            score += 3

        # Short text is more likely to be a UI element than article content
        if len(seg["text"]) < 100:
            score += 1

        scored.append((score, seg))

    # Sort by score (highest first) and keep top results
    scored.sort(key=lambda x: x[0], reverse=True)
    return [seg for _, seg in scored[:max_segments]]
