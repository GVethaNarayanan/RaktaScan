# 🏗️ System Architecture

**RaktaScan — AI-Powered Non-Invasive Anemia Screening**

> **Status:** This document describes the **planned architecture**. Implementation is upcoming.

---

## Overview

RaktaScan is designed as a modular, mobile-first screening platform. The architecture prioritizes on-device processing for privacy, offline capability, and accessibility in resource-constrained environments.

---

## Core Screening Pipeline

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
        MobileNetV3
            ↓
    Risk Classification
            ↓
    Explainable Result
            ↓
Confirmatory Test Recommendation
```

---

## Component Details

### 1. Guided Capture
- Provides step-by-step visual instructions for imaging the inner eyelid (palpebral conjunctiva)
- Ensures consistent image framing and orientation
- **Status:** 🔲 Planned

### 2. Image Quality Gate
- Validates captured images for blur, exposure, and framing
- Rejects images that do not meet quality thresholds and prompts recapture
- Prevents unreliable predictions from poor-quality input
- **Status:** 🔲 Planned

### 3. Conjunctiva ROI Detection
- Uses MediaPipe Face Landmarker to locate facial landmarks
- Isolates the palpebral conjunctiva region from the captured image
- Crops and normalizes the region of interest for model input
- **Status:** 🔲 Planned

### 4. Image Preprocessing
- Standardizes image dimensions, color space, and normalization
- Applies necessary transformations for model compatibility
- **Status:** 🔲 Planned

### 5. MobileNetV3 Inference
- Lightweight classification model fine-tuned via transfer learning
- Runs on-device using ONNX Runtime Web
- Outputs risk-level classification (Low / Moderate / High)
- **Status:** 🔲 Planned

### 6. Risk Classification & Explainable Result
- Maps model output to a three-tier risk assessment
- Provides transparent reasoning for the screening result
- Moderate/High risk results recommend confirmatory hemoglobin testing
- **Status:** 🔲 Planned

---

## Supporting Systems

### Community Health Worker (CHW) Dashboard
- Simplified interface for batch screening workflows
- Summary views for screening sessions
- **Status:** 🔲 Planned

### Secure Screening History
- Local-first storage of past screening results
- No personal health data transmitted without explicit consent
- **Status:** 🔲 Planned

### Optional FastAPI Backend
- API layer for scenarios requiring server-side processing
- CHW batch screening coordination
- Screening history synchronization (when connectivity is available)
- **Status:** 🔲 Planned

---

## Implementation Status

| Component | Status |
|---|---|
| Guided Capture | 🔲 Planned |
| Image Quality Gate | 🔲 Planned |
| Conjunctiva ROI Detection | 🔲 Planned |
| Image Preprocessing | 🔲 Planned |
| MobileNetV3 Inference | 🔲 Planned |
| Risk Classification | 🔲 Planned |
| Explainable Result | 🔲 Planned |
| CHW Dashboard | 🔲 Planned |
| Screening History | 🔲 Planned |
| FastAPI Backend | 🔲 Planned |

> All components are in the planning stage. Implementation is upcoming.
