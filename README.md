<p align="center">
  <h1 align="center">🩸 RaktaScan</h1>
  <h3 align="center">AI-Powered Non-Invasive Anemia Screening</h3>
  <p align="center">
    <strong>Team Duo Tech</strong> · Omni_BioTech_2
    <br />
    <em>A camera-based screening/triage aid — not a diagnostic device</em>
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

### Pipeline

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
> Moderate/High-risk screening results recommend **confirmatory hemoglobin testing**.

---

## ✨ Features & Phase 2 Implementation Status

| Feature | Description | Status |
|---|---|---|
| **React + Vite Frontend** | Responsive mobile-first healthcare UI | ✅ Implemented |
| **AI-Guided Camera Capture** | Live camera view with eye positioning reticle | ✅ Implemented |
| **Image Quality Gate** | Sharpness (Laplacian variance), exposure, contrast & size checks | ✅ Implemented |
| **Automatic Conjunctiva ROI** | MediaPipe Face Landmarker lower-eyelid localization | ✅ Implemented |
| **Image Preprocessing** | 224x224 RGB normalization & CHW Float32 tensor conversion | ✅ Implemented |
| **Lightweight On-Device AI** | MobileNetV3 model in ONNX format (0.30 MB) | ✅ Implemented |
| **On-Device Inference** | ONNX Runtime Web execution provider in browser | ✅ Implemented |
| **Risk Assessment Output** | Low / Moderate / High Risk classification & recommendations | ✅ Implemented |
| **Community Health Worker Mode** | Batch screening session manager & summary dashboard | ✅ Implemented |
| **Screening History** | Local-first storage, record view & deletion | ✅ Implemented |
| **Multilingual Interface** | English and Hindi translations (`i18next`) | ✅ Implemented |
| **Privacy-Preserving Architecture** | On-device processing, no image uploads by default | ✅ Implemented |
| **Clinical Dataset Fine-Tuning** | Model training & evaluation on clinical dataset | 🔄 In Progress |

---

## 🏗️ System Architecture

```
User / Community Health Worker
            ↓
    Smartphone Camera
            ↓
      Guided Capture
            ↓
    Image Quality Gate
            ↓
  Conjunctiva ROI Detection
            ↓
    Image Preprocessing
            ↓
   MobileNetV3 (ONNX Web)
            ↓
    Risk Classification
            ↓
    Explainable Result
            ↓
Confirmatory Test Recommendation
```

### Supporting Components

- **Community Health Worker Dashboard** — Batch screening management and session metrics.
- **Secure Screening History** — Local-first screening record storage using `localStorage`.
- **Optional FastAPI Backend** — Backend API layer located in `backend/`.

> See [`docs/architecture.md`](docs/architecture.md) and [`docs/phase2-progress.md`](docs/phase2-progress.md) for detailed technical documentation.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS |
| **Computer Vision** | MediaPipe Face Landmarker (468 3D Mesh) |
| **Primary AI Model** | MobileNetV3-Small (PyTorch → ONNX) |
| **On-Device Inference** | ONNX Runtime Web (WASM execution provider) |
| **Internationalization** | i18next (English & Hindi) |
| **Backend (Optional)** | FastAPI (Python) |
| **Version Control** | Git & GitHub |

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Python (v3.10+)

### Quick Start

1. **Install Frontend Dependencies & Run Dev Server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

2. **Generate / Re-export MobileNetV3 ONNX Model (Optional)**:
   ```bash
   pip install torch torchvision onnx
   python model/scripts/export_onnx.py
   ```

3. **Run Quality Gate Test**:
   ```bash
   npx tsx tests/qualityGate.test.ts
   ```

---

## 🛡️ Responsible AI

- **RaktaScan is NOT a diagnostic device** — it is a screening/triage aid.
- Screening results **should not replace** clinical hemoglobin testing.
- Moderate/High risk results **must recommend** confirmatory testing at certified healthcare facilities.
- **No unsupported medical claims** are made by this project.
- Image quality failures **trigger recapture** rather than unreliable predictions.
- **Privacy-preserving processing** is prioritized (100% on-device browser execution).

---

## 📁 Project Structure

```
RaktaScan/
│
├── README.md                  ← Project documentation & Phase 2 status
├── LICENSE                    ← MIT License
├── .gitignore
│
├── docs/
│   ├── README.md              ← Documentation index
│   ├── phase1-proposal.pdf    ← Phase 1 proposal document
│   ├── phase2-progress.md    ← Phase 2 progress report
│   ├── architecture.md        ← Technical architecture details
│   └── screenshots/           ← Prototype screenshots
│
├── frontend/                  ← React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/        ← UI modules & guides
│   │   ├── pages/             ← Home, Screening, Result, History, CHW, Settings
│   │   ├── utils/             ← Quality Gate, ROI Detection, Preprocessing, Inference
│   │   └── i18n.ts            ← Multilingual config
│   ├── public/models/         ← MobileNetV3 ONNX model
│   └── vite.config.ts
│
├── backend/                   ← FastAPI backend API
├── model/                     ← PyTorch training & ONNX export scripts
├── data/                      ← Dataset specifications & splits
└── tests/                     ← Unit & quality gate tests
```

---

## 👥 Team

**Duo Tech**

| Name | Role |
|---|---|
| **Vetha Narayanan G** | Team Member |
| **Akshaya I** | Team Member |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
