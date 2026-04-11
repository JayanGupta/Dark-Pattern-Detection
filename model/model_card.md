# Dark Pattern Detector — Model Card

## Model Description
- **Architecture:** DistilBERT (distilbert-base-uncased), fine-tuned for multi-label sequence classification
- **Task:** Detecting dark patterns in web page text segments
- **Framework:** HuggingFace Transformers + PyTorch
- **Parameters:** ~66M
- **Input:** Text segments (up to 128 tokens)
- **Output:** Multi-label predictions across 7 dark pattern categories with confidence scores

## Intended Use
This model is designed to analyze text extracted from web pages and identify manipulative UI/UX patterns ("dark patterns") that may deceive users. It is intended for:
- Browser extensions that alert users to manipulative content
- Regulatory compliance tools
- Research on deceptive design practices
- Website auditing and accessibility reviews

## Categories Detected

| Category | Description | Example |
|----------|-------------|---------|
| Urgency / Scarcity | Creates false sense of limited availability | "Only 2 left in stock!" |
| Misdirection | Tricks users into unintended actions | Pre-checked upsell options |
| Social Proof | Fabricates or inflates social validation | "50 people viewing this right now" |
| Forced Continuity | Makes cancellation deliberately difficult | Auto-renewing subscriptions |
| Confirm-shaming | Guilts users for declining offers | "No thanks, I hate saving money" |
| Hidden Costs | Conceals fees until late in checkout | "Processing fee added at checkout" |
| Disguised Ads | Hides advertising as organic content | "Recommended for you (sponsored)" |

## Training Data
- **Princeton/Mathur Dataset:** 1,818 labeled dark pattern texts from 11K shopping sites
- **Yamanalab ec-darkpattern Dataset:** ~1,178 negative samples (non-dark-pattern text)
- **Synthetic Augmentation:** Template-based generation for underrepresented categories
- **Total Training Samples:** ~3,500+ after augmentation

## Evaluation Metrics
Evaluated on a held-out 20% test split. Metrics computed at threshold = 0.5.

*Note: Actual metrics will be populated after training by running `evaluate.py`.*

## Limitations
- **Domain Specificity:** Trained primarily on e-commerce shopping site text. May underperform on other domains (social media, news sites, etc.)
- **Language:** English only
- **Context:** The model analyzes text segments in isolation. It does not consider visual layout, color, or positioning, which are important aspects of dark patterns.
- **False Positives:** Legitimate urgency messages (real low stock) may be flagged as dark patterns
- **Coverage:** The "Disguised Ads" category relies heavily on synthetic data and may have lower real-world accuracy

## Ethical Considerations
- This model should be used as an assistive tool, not as a definitive arbiter of dark patterns
- Dark pattern classification can be subjective; legitimate marketing may share language patterns with manipulative content
- The model should not be used to penalize or sanction websites without human review
- False negatives are possible — the absence of detected patterns does not guarantee a website is ethical
