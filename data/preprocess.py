"""
Data Preprocessing Pipeline.

Parses the Princeton dark-patterns CSV and Yamanalab ec-darkpattern TSV,
maps them to our 7-label schema, creates multi-hot label vectors,
and outputs cleaned train/test splits.
"""

import csv
import os
import re
import json
import random
from collections import Counter

from data.label_mapping import (
    NUM_LABELS,
    CATEGORIES,
    PRINCETON_CATEGORY_MAP,
    PRINCETON_CATEGORY_FALLBACK,
)

# ─── Paths ────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(__file__)
RAW_DIR = os.path.join(BASE_DIR, "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")


# ─── Text Cleaning ───────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Normalize and clean a text segment."""
    if not text:
        return ""
    # Remove HTML entities
    text = re.sub(r"&[a-zA-Z]+;", " ", text)
    text = re.sub(r"&#\d+;", " ", text)
    # Remove URLs
    text = re.sub(r"https?://\S+", "", text)
    # Normalize unicode
    text = text.encode("ascii", "ignore").decode("ascii")
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ─── Princeton CSV Parser ────────────────────────────────────────────

def parse_princeton_csv(filepath: str) -> list:
    """
    Parse the Princeton dark-patterns.csv.
    Returns list of dicts: {text, labels (multi-hot), source}
    """
    records = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = clean_text(row.get("Pattern String", ""))
            if not text or len(text) < 5:
                continue

            category = row.get("Pattern Category", "").strip()
            pattern_type = row.get("Pattern Type", "").strip()

            # Map to our label indices
            key = (category, pattern_type)
            if key in PRINCETON_CATEGORY_MAP:
                label_indices = PRINCETON_CATEGORY_MAP[key]
            elif category in PRINCETON_CATEGORY_FALLBACK:
                label_indices = PRINCETON_CATEGORY_FALLBACK[category]
            else:
                # Unknown category — skip
                continue

            # Create multi-hot vector
            labels = [0] * NUM_LABELS
            for idx in label_indices:
                labels[idx] = 1

            records.append({
                "text": text,
                "labels": labels,
                "source": "princeton",
            })

    return records


# ─── Yamanalab TSV Parser ─────────────────────────────────────────────

def parse_yamanalab_tsv(filepath: str) -> list:
    """
    Parse the Yamanalab ec-darkpattern dataset.tsv.
    Columns: page_id, text, label, Pattern Category
    We only use the NEGATIVE samples (non-dark-pattern texts).
    Returns list of dicts: {text, labels (all zeros), source}
    """
    records = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader, None)

        for row in reader:
            if len(row) < 3:
                continue

            text = clean_text(row[1])       # text column (index 1)
            label_val = row[2].strip()      # label column (index 2)

            # Only keep negative samples (label = 0)
            if label_val == "0":
                if text and len(text) >= 5:
                    records.append({
                        "text": text,
                        "labels": [0] * NUM_LABELS,
                        "source": "yamanalab_negative",
                    })

    return records


# ─── Deduplication ────────────────────────────────────────────────────

def deduplicate(records: list) -> list:
    """Remove duplicate texts, keeping the first occurrence."""
    seen = set()
    unique = []
    for rec in records:
        text_lower = rec["text"].lower()
        if text_lower not in seen:
            seen.add(text_lower)
            unique.append(rec)
    return unique


# ─── Train/Test Split ─────────────────────────────────────────────────

def stratified_split(records: list, test_ratio: float = 0.2, seed: int = 42) -> tuple:
    """
    Split records into train and test sets.
    Uses a simple random split (true stratification on multi-label is complex).
    """
    random.seed(seed)
    shuffled = records.copy()
    random.shuffle(shuffled)
    split_idx = int(len(shuffled) * (1 - test_ratio))
    return shuffled[:split_idx], shuffled[split_idx:]


# ─── Save to CSV ─────────────────────────────────────────────────────

def save_processed(records: list, filepath: str):
    """Save processed records to a CSV file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "labels", "source"])
        for rec in records:
            writer.writerow([
                rec["text"],
                json.dumps(rec["labels"]),
                rec["source"],
            ])
    print(f"  ✓ Saved {len(records)} records → {filepath}")


# ─── Statistics ───────────────────────────────────────────────────────

def print_stats(records: list, name: str = "Dataset"):
    """Print label distribution statistics."""
    print(f"\n{'─' * 50}")
    print(f"  {name}: {len(records)} total records")
    print(f"{'─' * 50}")

    label_counts = Counter()
    positive_count = 0
    for rec in records:
        has_positive = False
        for i, v in enumerate(rec["labels"]):
            if v == 1:
                label_counts[CATEGORIES[i]] += 1
                has_positive = True
        if has_positive:
            positive_count += 1

    negative_count = len(records) - positive_count
    print(f"  Positive samples: {positive_count}")
    print(f"  Negative samples: {negative_count}")
    print(f"  Label distribution:")
    for cat in CATEGORIES:
        count = label_counts.get(cat, 0)
        bar = "█" * (count // 20) if count > 0 else "░"
        print(f"    {cat:25s} → {count:5d}  {bar}")


# ─── Main Pipeline ────────────────────────────────────────────────────

def preprocess():
    """Run the full preprocessing pipeline."""
    print("=" * 60)
    print("Dark Pattern Detection — Data Preprocessing")
    print("=" * 60)

    # Parse Princeton CSV
    princeton_path = os.path.join(RAW_DIR, "dark-patterns.csv")
    if not os.path.exists(princeton_path):
        print(f"  ✗ Princeton CSV not found at {princeton_path}")
        print("  → Run download_dataset.py first!")
        return False

    print("\n→ Parsing Princeton dark-patterns.csv...")
    princeton_records = parse_princeton_csv(princeton_path)
    print(f"  ✓ Parsed {len(princeton_records)} dark pattern records")

    # Parse Yamanalab TSV
    yamanalab_path = os.path.join(RAW_DIR, "dataset.tsv")
    yamanalab_records = []
    if os.path.exists(yamanalab_path):
        print("\n→ Parsing Yamanalab dataset.tsv (negative samples)...")
        yamanalab_records = parse_yamanalab_tsv(yamanalab_path)
        print(f"  ✓ Parsed {len(yamanalab_records)} negative samples")
    else:
        print(f"  ⚠ Yamanalab TSV not found at {yamanalab_path}, skipping negatives")

    # Merge and deduplicate
    print("\n→ Merging and deduplicating...")
    all_records = princeton_records + yamanalab_records
    all_records = deduplicate(all_records)
    print(f"  ✓ {len(all_records)} unique records after deduplication")

    # Print stats
    print_stats(all_records, "Full Dataset")

    # Split train/test
    print("\n→ Splitting into train/test (80/20)...")
    train_records, test_records = stratified_split(all_records)

    # Save
    print("\n→ Saving processed data...")
    save_processed(train_records, os.path.join(PROCESSED_DIR, "train.csv"))
    save_processed(test_records, os.path.join(PROCESSED_DIR, "test.csv"))

    # Print split stats
    print_stats(train_records, "Train Set")
    print_stats(test_records, "Test Set")

    print("\n" + "=" * 60)
    print("✓ Preprocessing complete!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    import sys
    # Add project root to path
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    success = preprocess()
    sys.exit(0 if success else 1)
