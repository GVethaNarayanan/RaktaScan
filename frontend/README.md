# 🖥️ Frontend

**RaktaScan — Frontend Application**

> **Status:** Planning phase. Implementation will begin in Phase 2.

---

## Planned Technology Stack

| Technology | Purpose |
|---|---|
| React.js | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| PWA | Offline-first capability |
| ONNX Runtime Web | On-device model inference |
| MediaPipe Face Landmarker | Conjunctiva ROI detection |

---

## Planned Module Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── camera/           ← Camera capture interface
│   │   ├── guided-capture/   ← Step-by-step capture instructions
│   │   ├── quality-gate/     ← Image quality feedback UI
│   │   ├── result/           ← Screening result display
│   │   ├── dashboard/        ← CHW dashboard views
│   │   ├── history/          ← Screening history interface
│   │   └── common/           ← Shared/reusable components
│   ├── hooks/                ← Custom React hooks
│   ├── utils/                ← Utility functions
│   ├── i18n/                 ← Multilingual support
│   ├── services/             ← API and inference services
│   └── assets/               ← Static assets
├── public/
│   └── models/               ← ONNX model files (at runtime)
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Planned Features

- **Camera Capture** — Smartphone camera access with guided framing
- **Guided Capture UI** — Visual instructions for imaging the palpebral conjunctiva
- **Image Quality Feedback** — Real-time feedback on capture quality (blur, exposure, framing)
- **Screening Result UI** — Clear display of Low / Moderate / High risk assessment
- **CHW Dashboard** — Batch screening management for Community Health Workers
- **Screening History** — Local-first record of past screenings
- **Multilingual Interface** — Support for multiple languages

---

## Setup Instructions

*Setup instructions will be provided once the frontend is initialized in Phase 2.*

> For the full project overview, see the [root README](../README.md).
