"""
Model Training Configuration.

Central configuration for hyperparameters, paths, and model settings.
"""

import os

# ─── Model ────────────────────────────────────────────────────────────
MODEL_NAME = "distilbert-base-uncased"
NUM_LABELS = 7
PROBLEM_TYPE = "multi_label_classification"

# ─── Tokenization ────────────────────────────────────────────────────
MAX_SEQ_LENGTH = 128

# ─── Training ─────────────────────────────────────────────────────────
BATCH_SIZE = 32
LEARNING_RATE = 2e-5
NUM_EPOCHS = 5
WARMUP_RATIO = 0.1
WEIGHT_DECAY = 0.01
GRADIENT_ACCUMULATION_STEPS = 2
SEED = 42

# ─── Inference ────────────────────────────────────────────────────────
DEFAULT_THRESHOLD = 0.5       # Classification threshold during training eval
INFERENCE_THRESHOLD = 0.7     # Default threshold for API/UI
INFERENCE_BATCH_SIZE = 64     # Batch size for inference

# ─── Paths ────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")
BEST_MODEL_DIR = os.path.join(CHECKPOINT_DIR, "best_model")

TRAIN_DATA_PATH = os.path.join(PROCESSED_DIR, "train_augmented.csv")
TRAIN_DATA_FALLBACK = os.path.join(PROCESSED_DIR, "train.csv")
TEST_DATA_PATH = os.path.join(PROCESSED_DIR, "test.csv")
EVAL_RESULTS_PATH = os.path.join(os.path.dirname(__file__), "evaluation_results.json")

# ─── Device ───────────────────────────────────────────────────────────
import torch
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
FP16 = torch.cuda.is_available()  # Use mixed precision on GPU

# ─── Logging ──────────────────────────────────────────────────────────
LOGGING_STEPS = 50
SAVE_STEPS = 200
EVAL_STEPS = 200
SAVE_TOTAL_LIMIT = 3
LOAD_BEST_MODEL_AT_END = True
METRIC_FOR_BEST_MODEL = "f1_macro"
