# 🛡️ Dark Pattern Detector

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![HuggingFace](https://img.shields.io/badge/🤗_Transformers-DistilBERT-FFD21E?style=flat)](https://huggingface.co/transformers)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

> **Fine-tuned DistilBERT multi-label classifier wrapped in a FastAPI inference pipeline, detecting seven dark pattern taxonomies from live DOM-scraped text with sub-2s latency.

---

## 🎯 What Are Dark Patterns?

Dark patterns are deceptive UI/UX designs that trick users into unintended actions. This tool detects **7 categories**:

| Category | Example | Severity |
|----------|---------|----------|
| 🔴 **Urgency / Scarcity** | "Only 2 left in stock!" | High |
| 🟡 **Misdirection** | Pre-checked upsell boxes | High |
| 🟣 **Social Proof** | "50 people viewing this right now" | Medium |
| 🩷 **Forced Continuity** | Auto-renewing subscriptions | Critical |
| 🟠 **Confirm-shaming** | "No thanks, I hate saving money" | Medium |
| 🩵 **Hidden Costs** | Fees revealed only at checkout | Critical |
| 🔵 **Disguised Ads** | Sponsored content styled as organic | High |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Dashboard                       │
│              (Vite + TailwindCSS v4)                     │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │
│  │ URL Input│  │ Slider   │  │ Annotated Results    │   │
│  └────┬─────┘  └──────────┘  └─────────────────────┘   │
└───────┼─────────────────────────────────────────────────┘
        │ POST /analyze
┌───────▼─────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────┐   │
│  │ Scraper  │→ │ Extractor  │→ │ DistilBERT Model  │   │
│  │ (httpx)  │  │ (BS4)      │  │ (Multi-label CLF) │   │
│  └──────────┘  └────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone & Install

```bash
git clone <repo-url>
cd "Dark Pattern Detection"

# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Prepare Data & Train Model

```bash
# Step 1: Download datasets
python -m data.download_dataset

# Step 2: Preprocess data
python -m data.preprocess

# Step 3: Augment training data
python -m data.augment

# Step 4: Train the model (~10–60 min depending on hardware)
python -m model.train

# Step 5: Evaluate
python -m model.evaluate
```

### 3. Run the Application

```bash
# Terminal 1: Start API server
uvicorn api.main:app --reload --port 8000

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🐳 Docker Deployment

```bash
# Build and run both services
docker-compose up --build

# Access:
# - Frontend: http://localhost:3000
# - API Docs: http://localhost:8000/docs
```

---

## 📡 API Reference

### `POST /analyze`

Analyze a web page for dark patterns.

**Request:**
```json
{
  "url": "https://example.com/product-page",
  "threshold": 0.7
}
```

Or with raw HTML:
```json
{
  "html": "<html><body><p>Only 2 left!</p></body></html>",
  "threshold": 0.5
}
```

**Response:**
```json
{
  "url": "https://example.com/product-page",
  "total_segments": 142,
  "flagged_segments": 5,
  "patterns": [
    {
      "text": "Only 2 left in stock — order soon!",
      "categories": [
        {"name": "Urgency / Scarcity", "confidence": 0.94}
      ],
      "severity": "high",
      "severity_score": 0.87,
      "location": "class:product-detail"
    }
  ],
  "summary": {
    "Urgency / Scarcity": 2,
    "Social Proof": 1,
    "Confirm-shaming": 1,
    "Hidden Costs": 1,
    ...
  },
  "analysis_time_ms": 1250.5
}
```

### `GET /health`

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_info": {
    "model_name": "DistilBERT (fine-tuned)",
    "num_categories": 7,
    "device": "cpu"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "threshold": 0.7}'
```

---

## 🧪 Testing

```bash
# Run all tests
pytest api/tests/ -v

# Run specific test file
pytest api/tests/test_analyze.py -v
pytest api/tests/test_inference.py -v
```

---

## 📁 Project Structure

```
Dark Pattern Detection/
├── data/                     # Data pipeline
│   ├── download_dataset.py   # Fetch datasets
│   ├── preprocess.py         # Clean & encode
│   ├── augment.py            # Synthetic augmentation
│   ├── dataset_loader.py     # PyTorch DataLoader
│   └── label_mapping.py      # Category definitions
├── model/                    # ML model
│   ├── config.py             # Hyperparameters
│   ├── train.py              # Fine-tuning script
│   ├── evaluate.py           # Evaluation metrics
│   ├── inference.py          # Prediction engine
│   └── model_card.md         # Model documentation
├── api/                      # FastAPI backend
│   ├── main.py               # App entry point
│   ├── schemas.py            # Pydantic models
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   └── tests/                # Unit tests
├── frontend/                 # React dashboard
│   └── src/
│       ├── App.jsx           # Main component
│       └── components/       # UI components
├── docker-compose.yml        # Docker orchestration
├── Dockerfile.api            # API container
├── Dockerfile.frontend       # Frontend container
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

---

## 📊 Model Card

- **Base Model:** `distilbert-base-uncased` (66M params)
- **Task:** Multi-label sequence classification (7 categories)
- **Training Data:** Princeton Dark Patterns dataset + Yamanalab negatives + synthetic augmentation
- **Loss:** BCEWithLogitsLoss (per-label binary cross-entropy)
- **Optimizer:** AdamW with linear warmup
- **Inference:** < 2 seconds for ~100 text segments

See [model/model_card.md](model/model_card.md) for full details.

---

## ⚠️ Limitations

- **English only** — trained on English e-commerce text
- **Text only** — does not analyze visual layout, colors, or positioning
- **E-commerce focus** — may underperform on social media or news sites
- **False positives** — legitimate urgency messages may be flagged
- **Assistive tool** — should not be used as sole arbiter; human review recommended

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Mathur et al. (2019)](https://webtransparency.cs.princeton.edu/dark-patterns/) — Princeton Dark Patterns at Scale dataset
- [Yada et al. (2022)](https://github.com/yamanalab/ec-darkpattern) — Yamanalab ec-darkpattern dataset
- [HuggingFace Transformers](https://huggingface.co/transformers) — DistilBERT model
