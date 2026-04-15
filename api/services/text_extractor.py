import re
from bs4 import BeautifulSoup, Comment

PRIORITY_ELEMENTS = {
    "button", "a", "input", "select", "option",
    "label", "legend", "fieldset",
    "p", "span", "div", "li",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "em", "b", "i", "small",
    "td", "th", "caption", "figcaption",
}

SKIP_ELEMENTS = {
    "script", "style", "noscript", "iframe", "svg", "path",
    "meta", "link", "head", "title",
    "code", "pre",
}

SUSPICIOUS_CLASSES = {
    "popup", "modal", "notification", "toast", "banner",
    "countdown", "timer", "urgency", "scarcity",
    "upsell", "cross-sell", "fomo", "social-proof",
    "overlay", "sticky", "alert", "warning",
    "subscribe", "newsletter", "opt-in",
    "checkout", "cart",
}

MIN_TEXT_LENGTH = 5
MAX_TEXT_LENGTH = 500

def extract_text_segments(html):
    soup = BeautifulSoup(html, "html.parser")

    for element in soup.find_all(SKIP_ELEMENTS):
        element.decompose()

    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()

    segments = []
    seen_texts = set()

    for tag in soup.find_all(PRIORITY_ELEMENTS):
        text = _clean_text(tag.get_text(separator=" ", strip=True))

        if not text or len(text) < MIN_TEXT_LENGTH:
            continue

        text_lower = text.lower()
        if text_lower in seen_texts:
            continue
        seen_texts.add(text_lower)

        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH] + "..."

        context = _get_context(tag)

        segments.append({
            "text": text,
            "element": tag.name,
            "context": context,
        })

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
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    return text

def _get_context(tag):
    if not tag or not hasattr(tag, "attrs"):
        return ""

    hints = []
    classes = tag.get("class", [])
    if isinstance(classes, list):
        class_str = " ".join(classes).lower()
        for keyword in SUSPICIOUS_CLASSES:
            if keyword in class_str:
                hints.append(f"class:{keyword}")

    elem_id = tag.get("id", "").lower()
    for keyword in SUSPICIOUS_CLASSES:
        if keyword in elem_id:
            hints.append(f"id:{keyword}")

    if tag.name == "button":
        hints.append("button")
    elif tag.name == "a":
        href = tag.get("href", "")
        if "unsubscribe" in href.lower() or "cancel" in href.lower():
            hints.append("cancel-link")

    for attr in tag.attrs:
        if attr.startswith("data-") and any(h in attr.lower() for h in ["timer", "countdown", "fomo"]):
            hints.append(f"data:{attr}")

    return ", ".join(hints)

def filter_relevant_segments(segments, max_segments=500):
    scored = []
    for seg in segments:
        score = 0
        if seg["element"] in {"button", "a", "label", "input"}:
            score += 2
        if seg["context"]:
            score += 3
        if len(seg["text"]) < 100:
            score += 1
        scored.append((score, seg))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [seg for _, seg in scored[:max_segments]]
