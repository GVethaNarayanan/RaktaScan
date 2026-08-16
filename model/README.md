# 🧠 Model

**RaktaScan — ML Pipeline**

> **Status:** Planning phase. Model development will begin in Phase 2.

---

## Planned Models

### Primary: MobileNetV3 + Transfer Learning
- Lightweight architecture suitable for on-device inference
- Pre-trained on ImageNet, fine-tuned on conjunctiva image data
- Exported to ONNX format for browser-based inference via ONNX Runtime Web

### Alternative: EfficientNet-B3
- Higher-capacity architecture for comparison and potential server-side inference
- Will be evaluated alongside MobileNetV3 during Phase 2

---

## Planned ML Workflow

```
Dataset Sourcing / Curation
            ↓
    Data Preprocessing
            ↓
  Conjunctiva ROI Preparation
            ↓
   Image Quality Validation
            ↓
      Data Augmentation
            ↓
  MobileNetV3 Transfer Learning
            ↓
      Model Evaluation
            ↓
      ONNX Conversion
            ↓
  Browser Inference Integration
```

---

## Planned Evaluation Metrics

| Metric | Purpose |
|---|---|
| Precision | Proportion of positive predictions that are correct |
| Recall | Proportion of actual positives correctly identified |
| F1-Score | Harmonic mean of precision and recall |
| ROC-AUC | Model's ability to distinguish between risk levels |
| Confusion Matrix | Detailed breakdown of classification outcomes |

---

## Planned Structure

```
model/
├── notebooks/                 ← Training and evaluation notebooks
├── scripts/                   ← Training, evaluation, and export scripts
├── configs/                   ← Model and training configurations
├── exports/                   ← ONNX model exports (gitignored)
└── results/                   ← Evaluation results and reports
```

---

## Important Notes

- **No model has been trained yet**
- **No model weights exist in this repository**
- **No accuracy or performance metrics are available at this stage**
- Model development, training, and evaluation will commence in Phase 2
- All evaluation results will be documented transparently when available

> For the full project overview, see the [root README](../README.md).
