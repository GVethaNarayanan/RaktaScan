# RaktaScan Phase 2 Progress Report

**Omnikon National Hackathon 2026**  
**Problem Statement:** Omni_BioTech_2 — Non-Invasive Anemia Screening  
**Team:** Duo Tech (Vetha Narayanan G, Akshaya I)  
**Status:** Working Prototype Implemented  

---

## Executive Summary

Since Phase 1, Duo Tech has progressed **RaktaScan** from a conceptual proposal and architectural layout into a **working on-device prototype**. We implemented a modern React + TypeScript + Tailwind CSS mobile-first web frontend, an on-device computer vision pipeline using MediaPipe Face Landmarker for palpebral conjunctiva ROI localization, a multi-parameter Image Quality Gate (sharpness via Laplacian variance, exposure, contrast, resolution), a PyTorch to ONNX MobileNetV3 model export pipeline, and ONNX Runtime Web browser inference.

---

## Phase 1 → Phase 2 Implementation Progress

| Component / Feature | Phase 1 Status | Phase 2 Prototype Status | Implementation Details |
|---|---|---|---|
| **React + Vite Frontend** | 🔲 Planned | ✅ Implemented | Built responsive mobile-first UI with React 18, TypeScript, Tailwind CSS |
| **Real Camera Access** | 🔲 Planned | ✅ Implemented | HTML5 `navigator.mediaDevices.getUserMedia` with video preview & fallback |
| **Guided Capture Overlay** | 🔲 Planned | ✅ Implemented | Eye/conjunctiva positioning reticle with real-time visual feedback |
| **Image Quality Gate** | 🔲 Planned | ✅ Implemented | Variance of Laplacian blur detection, min/max brightness, contrast, size checks |
| **Conjunctiva ROI Localization**| 🔲 Planned | ✅ Implemented | MediaPipe Face Landmarker 468 3D facial mesh, lower eyelid crop |
| **Image Preprocessing** | 🔲 Planned | ✅ Implemented | 224x224 resize, ImageNet RGB normalization, Float32 CHW tensor conversion |
| **MobileNetV3 Model Export** | 🔲 Planned | ✅ Implemented | PyTorch export to ONNX format (`raktascan_mobilenetv3.onnx`, 0.30 MB) |
| **ONNX Runtime Web Inference**| 🔲 Planned | ✅ Implemented | Browser WASM execution provider running on-device inference |
| **Risk Level Output & Safety**| 🔲 Planned | ✅ Implemented | Low/Moderate/High classification with confirmatory test recommendations |
| **CHW Mode** | 🔲 Planned | ✅ Implemented | Session management, batch screening counters, anonymous participant IDs |
| **Local Screening History** | 🔲 Planned | ✅ Implemented | `localStorage` persistence, record view, single delete & clear all |
| **Multilingual UI (i18n)** | 🔲 Planned | ✅ Implemented | `i18next` integration with English and Hindi translations |
| **Clinical Model Fine-Tuning**| 🔲 Planned | 🔄 In Progress | Pipeline complete; training on clinical conjunctiva datasets ongoing |

---

## Key Technical Achievements

1. **On-Device Privacy & Processing**:
   - Zero image data transmitted to external servers during screening.
   - Quality checks, ROI cropping, and ONNX inference all run directly inside the browser using WebAssembly.

2. **Image Quality Gate**:
   - Computes grayscale variance of Laplacian for sharpness:
     $$\text{Var}(\Delta I) = \frac{1}{N}\sum (L(x,y) - \mu_L)^2$$
   - Enforces brightness thresholding ($40 \le B \le 220$) and standard deviation contrast check ($\sigma \ge 20$).
   - Immediately prompts user for recapture if quality is insufficient, preventing erroneous model outputs.

3. **Lightweight AI Inference**:
   - MobileNetV3-Small architecture optimized for edge execution ($1.52\text{M}$ parameters, $0.30\text{MB}$ ONNX file).
   - Fast browser execution time (~10–50 ms on standard mobile/desktop browsers).

---

## Captured Prototype Evidence

- **Home Screen**: [`docs/screenshots/01-home.png`](screenshots/01-home.png)
- **Guided Capture & Camera**: [`docs/screenshots/02-guided-capture.png`](screenshots/02-guided-capture.png)
- **CHW Mode Dashboard**: [`docs/screenshots/03-chw-dashboard.png`](screenshots/03-chw-dashboard.png)
- **Screening History**: [`docs/screenshots/04-history.png`](screenshots/04-history.png)
- **Settings & Disclaimers**: [`docs/screenshots/05-settings.png`](screenshots/05-settings.png)

---

## Responsible AI & Safety Disclaimers

- RaktaScan is explicitly positioned as a **screening and triage aid**, NOT a diagnostic medical device.
- All Moderate and High risk results feature prominent recommendations urging users to seek confirmatory hemoglobin blood testing at certified healthcare facilities.
- Prototype baseline status is clearly disclosed across UI screens.
