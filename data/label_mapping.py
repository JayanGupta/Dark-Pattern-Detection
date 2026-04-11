"""
Dark Pattern Category Definitions and Label Mapping.

Maps the 7 target dark pattern categories to integer indices for multi-label classification.
Also provides mappings from Princeton/Mathur dataset categories to our unified schema.
"""

# ─── Target Categories ────────────────────────────────────────────────
CATEGORIES = [
    "Urgency / Scarcity",
    "Misdirection",
    "Social Proof",
    "Forced Continuity",
    "Confirm-shaming",
    "Hidden Costs",
    "Disguised Ads",
]

NUM_LABELS = len(CATEGORIES)

# Index ↔ Category mappings
CATEGORY_TO_IDX = {cat: idx for idx, cat in enumerate(CATEGORIES)}
IDX_TO_CATEGORY = {idx: cat for idx, cat in enumerate(CATEGORIES)}

# ─── Princeton Dataset Mapping ────────────────────────────────────────
# Maps (Pattern Category, Pattern Type) from the Princeton/Mathur CSV
# to our 7-label schema. A single source record may map to multiple labels.

PRINCETON_CATEGORY_MAP = {
    # Urgency / Scarcity (index 0)
    ("Urgency", "Countdown Timer"): [0],
    ("Urgency", "Limited-time Message"): [0],
    ("Scarcity", "Low-stock Message"): [0],
    ("Scarcity", "High-demand Message"): [0],

    # Social Proof (index 2)
    ("Social Proof", "Activity Notification"): [2],
    ("Social Proof", "Testimonial of Uncertain Origin"): [2],

    # Confirm-shaming (index 4) — subset of Misdirection in Princeton data
    ("Misdirection", "Confirmshaming"): [4],

    # Misdirection (index 1) — other Misdirection subtypes
    ("Misdirection", "Visual Interference"): [1],
    ("Misdirection", "Trick Questions"): [1],
    ("Misdirection", "Pressured Selling"): [1],

    # Hidden Costs (index 5)
    ("Sneaking", "Hidden Costs"): [5],
    ("Sneaking", "Hidden Subscription"): [5, 3],  # Also Forced Continuity
    ("Sneaking", "Sneak into Basket"): [5],

    # Forced Continuity (index 3)
    ("Obstruction", "Hard to Cancel"): [3],
    ("Forced Action", "Forced Enrollment"): [3],
}

# Fallback: if (category, type) pair not found, map by category alone
PRINCETON_CATEGORY_FALLBACK = {
    "Urgency": [0],
    "Scarcity": [0],
    "Social Proof": [2],
    "Misdirection": [1],
    "Sneaking": [5],
    "Obstruction": [3],
    "Forced Action": [3],
}

# ─── Severity Weights ────────────────────────────────────────────────
# Used to compute an aggregate severity score from multi-label predictions.
# Higher weight = more manipulative/harmful pattern.
SEVERITY_WEIGHTS = {
    "Urgency / Scarcity": 0.6,
    "Misdirection": 0.7,
    "Social Proof": 0.5,
    "Forced Continuity": 0.9,
    "Confirm-shaming": 0.6,
    "Hidden Costs": 0.95,
    "Disguised Ads": 0.8,
}


def get_severity_level(score: float) -> str:
    """Convert a numeric severity score to a human-readable level."""
    if score >= 0.8:
        return "critical"
    elif score >= 0.6:
        return "high"
    elif score >= 0.4:
        return "medium"
    else:
        return "low"


def labels_to_categories(label_vector: list) -> list:
    """Convert a multi-hot label vector to a list of category names."""
    return [CATEGORIES[i] for i, v in enumerate(label_vector) if v == 1]


def categories_to_labels(category_names: list) -> list:
    """Convert a list of category names to a multi-hot label vector."""
    vector = [0] * NUM_LABELS
    for name in category_names:
        if name in CATEGORY_TO_IDX:
            vector[CATEGORY_TO_IDX[name]] = 1
    return vector
