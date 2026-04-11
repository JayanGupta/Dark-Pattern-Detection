"""
Data Augmentation Pipeline.

Generates synthetic samples for underrepresented dark pattern categories
using template-based generation and synonym replacement.
"""

import csv
import os
import re
import json
import random
from collections import Counter

from data.label_mapping import NUM_LABELS, CATEGORIES, CATEGORY_TO_IDX

BASE_DIR = os.path.dirname(__file__)
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")

# ─── Synthetic Templates ──────────────────────────────────────────────
# Templates for categories that are underrepresented or missing from
# the Princeton dataset. Each template generates variations.

SYNTHETIC_TEMPLATES = {
    # ── Disguised Ads (index 6) ──
    "Disguised Ads": [
        "Sponsored: {product} - Shop Now",
        "Promoted: Discover {product} today",
        "Recommended for you: {product}",
        "Ad: Get {product} at the best price",
        "Paid Partnership: {brand} presents {product}",
        "Featured Partner: {brand}",
        "You might also like (sponsored): {product}",
        "From our partners: {product}",
        "Trending pick (ad): {product}",
        "Editor's choice (sponsored): {product}",
        "Popular choice: {product} — Buy now",
        "Suggested for you based on your browsing: {product}",
        "Top recommendation (paid): {product}",
        "Best value (promoted listing): {product}",
        "Shop {brand} — This post is sponsored",
        "Similar items you may like (advertisement)",
        "Customers love this (promoted)",
        "Try {product} — Sponsored content",
        "{brand} ad: Don't miss this deal",
        "This is a paid promotion for {brand}",
    ],

    # ── Hidden Costs (index 5) ──
    "Hidden Costs": [
        "Processing fee of $3.99 will be added at checkout",
        "Service charge: $2.50 (added at final step)",
        "Delivery surcharge may apply based on your location",
        "Convenience fee of $1.99 added to your order",
        "Handling fee: $4.95 (shown at checkout)",
        "Digital service tax of 5% applies",
        "Card processing fee will be calculated at checkout",
        "Restocking fee of 15% applies to returns",
        "An additional booking fee of $5.00 applies",
        "Platform fee included in final price",
        "Insurance fee of $2.99 automatically added",
        "Priority processing: $3.99 (pre-selected)",
        "Environmental levy of $1.50 per item",
        "Packaging fee: $2.00 added at checkout",
        "Membership processing fee applies",
        "Currency conversion fee of 2.5% may apply",
        "Taxes and fees calculated at checkout",
        "Expedited processing: $7.99 (pre-checked)",
        "Admin fee of $4.50 applies to all orders",
        "Gift wrapping: $3.99 (auto-selected)",
    ],

    # ── Forced Continuity (index 3) ──
    "Forced Continuity": [
        "Your free trial will automatically convert to a paid subscription at $9.99/month",
        "Cancel anytime. Terms and conditions apply. See fine print for details.",
        "Auto-renewal is enabled for your convenience",
        "Your subscription renews automatically on the billing date",
        "By proceeding, you agree to recurring monthly charges",
        "Free for 14 days, then $19.99/month (auto-billed)",
        "To cancel, call our support line during business hours only",
        "Cancellation must be submitted 30 days before renewal",
        "Your plan auto-renews. Manage in account settings (buried in menu).",
        "After the trial, your card will be charged automatically",
        "Opt out of renewal by navigating to Settings > Account > Subscription > Cancel",
        "Enjoy your trial! Billing starts automatically after day 7.",
        "Membership continues unless you cancel before the renewal date",
        "Pro plan activates after trial — card on file will be charged",
        "Please note: subscription auto-renews annually",
        "To downgrade, contact our billing department via email",
        "Your credit card will be charged $29.99 at the end of the trial period",
        "Recurring payment of $14.99/month will begin after your trial ends",
        "Annual subscription auto-renewed. See terms.",
        "Cancel within 24 hours of renewal to avoid charges",
    ],

    # ── Urgency / Scarcity (index 0) — additional variety ──
    "Urgency / Scarcity": [
        "Only {n} left in stock — order soon!",
        "Hurry! This deal expires in {time}",
        "Limited time offer: {discount}% off ends tonight!",
        "Almost gone! Only {n} remaining at this price",
        "Flash sale ends in {time} — don't miss out!",
        "Last chance! Sale ends at midnight",
        "SELLING FAST: {n} sold in the last hour",
        "Price goes up in {time}!",
        "⚡ Lightning deal: {discount}% off for the next {time}",
        "Offer expires soon — secure your order now",
    ],

    # ── Confirm-shaming (index 4) — additional variety ──
    "Confirm-shaming": [
        "No thanks, I hate saving money",
        "I don't want to improve my life",
        "No, I prefer to pay full price",
        "I'll pass on this amazing deal",
        "No thanks, I enjoy missing out",
        "I don't need any help, thanks",
        "No, I don't want better results",
        "I'd rather stay uninformed",
        "No thanks, discounts aren't for me",
        "I'll skip this once-in-a-lifetime offer",
    ],
}

# Fill-in values for templates
PRODUCTS = [
    "Premium Wireless Headphones", "Organic Skin Care Kit", "Smart Fitness Watch",
    "Professional Camera Lens", "Luxury Bath Set", "Portable Bluetooth Speaker",
    "Memory Foam Pillow", "Stainless Steel Water Bottle", "LED Desk Lamp",
    "Yoga Mat Pro", "Essential Oil Diffuser", "Travel Backpack",
]

BRANDS = [
    "TechPro", "NatureCare", "FitLife", "EliteGear", "GlowUp",
    "SoundWave", "PureComfort", "EcoLiving", "SmartHome", "AuraWell",
]

TIMES = ["2 hours", "30 minutes", "3 hours", "45 minutes", "1 hour", "15 minutes"]
DISCOUNTS = ["20", "30", "50", "40", "60", "75", "25"]
NUMBERS = ["2", "3", "5", "7", "1", "4", "8", "10"]


# ─── Synonym Replacement ─────────────────────────────────────────────

SYNONYM_MAP = {
    "buy": ["purchase", "get", "grab", "order", "snag"],
    "hurry": ["rush", "act fast", "be quick", "don't wait", "move fast"],
    "limited": ["exclusive", "rare", "scarce", "restricted", "finite"],
    "free": ["complimentary", "no-cost", "gratis", "zero-cost", "on the house"],
    "deal": ["offer", "bargain", "discount", "promo", "special"],
    "save": ["get off", "reduce", "cut", "slash", "discount"],
    "only": ["just", "merely", "barely", "simply", "a mere"],
    "now": ["today", "immediately", "right away", "this instant", "ASAP"],
    "people": ["customers", "buyers", "shoppers", "visitors", "users"],
    "looking": ["viewing", "checking out", "browsing", "watching", "eyeing"],
    "bought": ["purchased", "ordered", "grabbed", "snagged", "picked up"],
    "popular": ["trending", "hot", "best-selling", "top-rated", "in-demand"],
}


def synonym_replace(text: str, n_replacements: int = 1) -> str:
    """Replace up to n words with their synonyms."""
    words = text.split()
    replaced = 0
    result = []
    for word in words:
        lower = word.lower().strip(".,!?:;")
        if lower in SYNONYM_MAP and replaced < n_replacements and random.random() > 0.5:
            synonym = random.choice(SYNONYM_MAP[lower])
            # Preserve original casing
            if word[0].isupper():
                synonym = synonym.capitalize()
            result.append(synonym)
            replaced += 1
        else:
            result.append(word)
    return " ".join(result)


# ─── Template Filling ─────────────────────────────────────────────────

def fill_template(template: str) -> str:
    """Fill a template with random values."""
    text = template
    text = text.replace("{product}", random.choice(PRODUCTS))
    text = text.replace("{brand}", random.choice(BRANDS))
    text = text.replace("{time}", random.choice(TIMES))
    text = text.replace("{discount}", random.choice(DISCOUNTS))
    text = text.replace("{n}", random.choice(NUMBERS))
    return text


# ─── Augmentation Pipeline ────────────────────────────────────────────

def generate_synthetic_samples(target_per_category: int = 200, seed: int = 42) -> list:
    """Generate synthetic labeled samples from templates."""
    random.seed(seed)
    records = []

    for category, templates in SYNTHETIC_TEMPLATES.items():
        idx = CATEGORY_TO_IDX[category]
        count = 0

        while count < target_per_category:
            template = random.choice(templates)
            text = fill_template(template)

            # Also apply synonym replacement for variety
            if random.random() > 0.5:
                text = synonym_replace(text, n_replacements=2)

            labels = [0] * NUM_LABELS
            labels[idx] = 1

            records.append({
                "text": text,
                "labels": labels,
                "source": "synthetic",
            })
            count += 1

    return records


def augment_existing(records: list, augment_factor: int = 2, seed: int = 42) -> list:
    """
    Augment existing records using synonym replacement.
    Returns the original records plus augmented copies.
    """
    random.seed(seed)
    augmented = []

    for rec in records:
        # Only augment positive samples
        if sum(rec["labels"]) > 0:
            for _ in range(augment_factor):
                new_text = synonym_replace(rec["text"], n_replacements=2)
                if new_text != rec["text"]:  # Only keep if changed
                    augmented.append({
                        "text": new_text,
                        "labels": rec["labels"].copy(),
                        "source": "augmented",
                    })

    return augmented


# ─── Main ─────────────────────────────────────────────────────────────

def augment():
    """Run the full augmentation pipeline."""
    print("=" * 60)
    print("Dark Pattern Detection — Data Augmentation")
    print("=" * 60)

    train_path = os.path.join(PROCESSED_DIR, "train.csv")
    if not os.path.exists(train_path):
        print(f"  ✗ Train CSV not found at {train_path}")
        print("  → Run preprocess.py first!")
        return False

    # Load existing training data
    print("\n→ Loading existing training data...")
    existing_records = []
    with open(train_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_records.append({
                "text": row["text"],
                "labels": json.loads(row["labels"]),
                "source": row["source"],
            })
    print(f"  ✓ Loaded {len(existing_records)} existing records")

    # Count per-category distribution
    cat_counts = Counter()
    for rec in existing_records:
        for i, v in enumerate(rec["labels"]):
            if v == 1:
                cat_counts[CATEGORIES[i]] += 1

    print("\n  Current label distribution:")
    for cat in CATEGORIES:
        print(f"    {cat:25s} → {cat_counts.get(cat, 0):5d}")

    # Generate synthetic samples
    print("\n→ Generating synthetic samples...")
    synthetic = generate_synthetic_samples(target_per_category=200)
    print(f"  ✓ Generated {len(synthetic)} synthetic samples")

    # Augment underrepresented existing samples
    print("\n→ Augmenting existing samples via synonym replacement...")
    augmented = augment_existing(existing_records, augment_factor=1)
    print(f"  ✓ Generated {len(augmented)} augmented samples")

    # Merge all
    all_records = existing_records + synthetic + augmented

    # Deduplicate
    seen = set()
    unique = []
    for rec in all_records:
        key = rec["text"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(rec)

    print(f"\n  Total after merge + dedup: {len(unique)} records")

    # Save augmented training data
    augmented_path = os.path.join(PROCESSED_DIR, "train_augmented.csv")
    with open(augmented_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "labels", "source"])
        for rec in unique:
            writer.writerow([rec["text"], json.dumps(rec["labels"]), rec["source"]])
    print(f"  ✓ Saved augmented data → {augmented_path}")

    # Print final stats
    final_counts = Counter()
    for rec in unique:
        for i, v in enumerate(rec["labels"]):
            if v == 1:
                final_counts[CATEGORIES[i]] += 1

    print("\n  Final label distribution:")
    for cat in CATEGORIES:
        print(f"    {cat:25s} → {final_counts.get(cat, 0):5d}")

    print("\n" + "=" * 60)
    print("✓ Augmentation complete!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    success = augment()
    sys.exit(0 if success else 1)
