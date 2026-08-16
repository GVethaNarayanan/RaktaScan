<p align="center">
  <h1 align="center">🩸 RaktaScan</h1>
  <h3 align="center">AI-Powered Non-Invasive Anemia Screening</h3>
  <p align="center">
    <strong>Team Duo Tech</strong> · Omni_BioTech_2
    <br />
    <em>A screening/triage aid — not a diagnostic device</em>
  </p>
</p>

---

## 🩸 Problem Statement

**Omni_BioTech_2 — Non-Invasive Anemia Screening**

Anemia is a widespread health condition affecting millions globally. Conventional screening relies on blood-based testing methods such as Complete Blood Count (CBC) analysis, which require:

- Specialized laboratory equipment
- Trained medical personnel
- Consumables (needles, reagents, collection tubes)
- Reliable healthcare facility access

These requirements make mass screening difficult in **rural and resource-constrained environments**, where anemia prevalence is often highest and healthcare infrastructure is limited. There is a clear need for accessible, non-invasive screening approaches that can function as a first-line triage tool in such settings.

---

## 💡 Proposed Solution

**RaktaScan** is a camera-based, AI-assisted screening platform that uses guided smartphone imaging of the **inner eyelid (palpebral conjunctiva)** to assess anemia risk.

### Planned Pipeline

```
Smartphone Camera
        ↓
Guided Capture
        ↓
Image Quality Gate
        ↓
Conjunctiva ROI Detection
        ↓
Preprocessing
        ↓
MobileNetV3
        ↓
Risk Assessment
        ↓
Explainable Result
        ↓
Confirmatory Test Recommendation
```

> **Important:**
> RaktaScan is a **screening/triage aid**, NOT a diagnostic device.
> Moderate/High-risk screening results will recommend **confirmatory hemoglobin testing**.

---

## ✨ Key Features

All features listed below are **planned / in development** for future phases:

| Feature | Description | Status |
|---|---|---|
| AI-Guided Camera Capture | Step-by-step instructions for conjunctiva imaging | 🔲 Planned |
| Image Quality Gate | Automatic validation of captured image quality | 🔲 Planned |
| Automatic Conjunctiva ROI Detection | Isolation of the relevant conjunctiva region | 🔲 Planned |
| Lightweight On-Device AI | MobileNetV3-based inference in the browser | 🔲 Planned |
| Explainable Risk Assessment | Transparent reasoning behind screening results | 🔲 Planned |
| Low / Moderate / High Risk Output | Three-tier risk classification | 🔲 Planned |
| Community Health Worker Mode | Batch screening and simplified workflow for CHWs | 🔲 Planned |
| Screening History | Secure, local tracking of past screenings | 🔲 Planned |
| Multilingual Interface | Support for multiple languages | 🔲 Planned |
| Offline-First Capability | Full functionality without internet connectivity | 🔲 Planned |
| Privacy-Preserving Image Handling | On-device processing, no image upload by default | 🔲 Planned |

---

## 🏗️ System Architecture

### Core Screening Pipeline

```
Smartphone Camera
        ↓
Guided Capture
        ↓
Image Quality Gate
        ↓
Conjunctiva ROI Detection
        ↓
Preprocessing
        ↓
MobileNetV3
        ↓
Risk Assessment
        ↓
Explainable Result
        ↓
Confirmatory Test Recommendation
```

### Supporting Components

- **Community Health Worker Dashboard** — Batch screening management and simplified workflows
- **Secure Screening History** — Local-first screening record storage
- **Optional FastAPI Backend** — For heavier processing, CHW coordination, and data sync

> See [`docs/architecture.md`](docs/architecture.md) for detailed component descriptions.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, Tailwind CSS, PWA |
| **Computer Vision** | MediaPipe Face Landmarker |
| **Primary AI Model** | MobileNetV3 (Transfer Learning) |
| **Alternative Model** | EfficientNet-B3 |
| **On-Device Inference** | ONNX Runtime Web |
| **Backend** | FastAPI (Python) |
| **Database** | Supabase / PostgreSQL |
| **Deployment** | Vercel (frontend), Render / Hugging Face Spaces (backend) |
| **Version Control** | GitHub |

---

## 🔬 AI/ML Development Plan

Model development will commence after Phase 1 approval. The planned workflow is:

1. **Dataset Sourcing / Curation** — Identify and prepare appropriate conjunctiva image datasets
2. **Data Preprocessing** — Standardize image dimensions, color spaces, and formats
3. **Conjunctiva ROI Preparation** — Extract and validate regions of interest
4. **Image Quality Validation** — Filter out unusable or ambiguous images
5. **Data Augmentation** — Apply appropriate augmentation strategies
6. **MobileNetV3 Transfer Learning** — Fine-tune on conjunctiva image data
7. **Model Evaluation** — Assess screening performance
8. **ONNX Conversion** — Export trained model to ONNX format
9. **On-Device Inference Integration** — Deploy via ONNX Runtime Web

### Planned Evaluation Metrics

- Precision
- Recall
- F1-Score
- ROC-AUC
- Confusion Matrix

> **Note:** No accuracy or performance numbers are presented at this stage because the model has **not yet been trained or evaluated**.

---

## 📊 Current Status

### `PHASE 1 — IDEA SUBMISSION`

**Completed:**
- ✅ Problem definition
- ✅ Solution design
- ✅ System architecture
- ✅ Feature planning
- ✅ Technology selection
- ✅ Implementation roadmap
- ✅ GitHub project initialization

**Not yet completed:**
- ⬜ Dataset preparation
- ⬜ Model training
- ⬜ Model evaluation
- ⬜ Camera capture implementation
- ⬜ ROI detection implementation
- ⬜ Image Quality Gate implementation
- ⬜ Backend implementation
- ⬜ Community Health Worker mode
- ⬜ Deployment

---

## 🚀 Roadmap

### Phase 1 — Idea Submission *(current)*
- ✅ Architecture design
- ✅ Solution design
- ✅ Technology planning
- ✅ Repository initialization

### Phase 2 — Progress Evaluation
- ⬜ Guided camera capture
- ⬜ Image Quality Gate
- ⬜ Conjunctiva ROI detection
- ⬜ MobileNetV3 baseline training
- ⬜ Initial model evaluation
- ⬜ Prediction flow
- ⬜ Initial UI

### Final Submission
- ⬜ Model refinement
- ⬜ Community Health Worker mode
- ⬜ Screening history
- ⬜ Multilingual UI
- ⬜ Offline inference
- ⬜ Privacy improvements
- ⬜ Deployment
- ⬜ GitHub documentation
- ⬜ Working prototype

---

## 🛡️ Responsible AI

- **RaktaScan is NOT a diagnostic device** — it is a screening/triage aid
- Screening results **should not replace** clinical hemoglobin testing
- Moderate/High risk results **must recommend** confirmatory testing
- **No unsupported medical claims** are made by this project
- Image quality failures **trigger recapture** rather than unreliable predictions
- **Privacy-preserving processing** is prioritized (on-device inference, no default image upload)
- **No fabricated model performance** metrics are presented at any stage

---

## 📁 Project Structure

```
RaktaScan/
│
├── README.md                  ← You are here
├── LICENSE
├── .gitignore
│
├── docs/
│   ├── README.md              ← Documentation index
│   ├── phase1-proposal.pdf    ← Phase 1 proposal (to be placed manually)
│   └── architecture.md        ← System architecture details
│
├── frontend/
│   └── README.md              ← Frontend planning documentation
│
├── backend/
│   └── README.md              ← Backend planning documentation
│
├── model/
│   └── README.md              ← ML pipeline documentation
│
├── data/
│   └── README.md              ← Dataset planning documentation
│
└── tests/
    └── README.md              ← Testing plan documentation
```

---

## 👥 Team

**Duo Tech**

| Name | Role |
|---|---|
| **Vetha Narayanan G** | Team Member |
| **Akshaya I** | Team Member |

---

<p align="center">
  <em>Built for Omni_BioTech_2 — Non-Invasive Anemia Screening</em>
</p>
