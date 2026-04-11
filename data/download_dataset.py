"""
Dataset Downloader.

Downloads the Princeton/Mathur dark patterns CSV and the Yamanalab ec-darkpattern TSV
into data/raw/ for subsequent preprocessing.
"""

import os
import sys
import urllib.request
import urllib.error

# ─── Configuration ────────────────────────────────────────────────────

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")

DATASETS = {
    "dark-patterns.csv": (
        "https://raw.githubusercontent.com/aruneshmathur/dark-patterns/"
        "master/data/final-dark-patterns/dark-patterns.csv"
    ),
    "dataset.tsv": (
        "https://raw.githubusercontent.com/yamanalab/ec-darkpattern/"
        "master/dataset/dataset.tsv"
    ),
}


# ─── Download Logic ───────────────────────────────────────────────────

def download_file(url: str, dest_path: str) -> bool:
    """Download a file from a URL to a local path."""
    if os.path.exists(dest_path):
        print(f"  [OK] Already exists: {os.path.basename(dest_path)}")
        return True

    print(f"  >> Downloading: {os.path.basename(dest_path)}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DarkPatternDetector/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
        with open(dest_path, "wb") as f:
            f.write(data)
        size_kb = len(data) / 1024
        print(f"  [OK] Downloaded: {os.path.basename(dest_path)} ({size_kb:.1f} KB)")
        return True
    except urllib.error.URLError as e:
        print(f"  [FAIL] Failed to download {os.path.basename(dest_path)}: {e}")
        return False
    except Exception as e:
        print(f"  [FAIL] Unexpected error downloading {os.path.basename(dest_path)}: {e}")
        return False


def download_all():
    """Download all required datasets."""
    os.makedirs(RAW_DIR, exist_ok=True)
    print("=" * 60)
    print("Dark Pattern Detection -- Dataset Downloader")
    print("=" * 60)

    success_count = 0
    for filename, url in DATASETS.items():
        dest_path = os.path.join(RAW_DIR, filename)
        if download_file(url, dest_path):
            success_count += 1

    print("-" * 60)
    print(f"Downloaded {success_count}/{len(DATASETS)} datasets to {RAW_DIR}")

    if success_count < len(DATASETS):
        print("[WARN] Some downloads failed. Check your internet connection and retry.")
        return False
    
    print("[OK] All datasets ready!")
    return True


if __name__ == "__main__":
    success = download_all()
    sys.exit(0 if success else 1)
