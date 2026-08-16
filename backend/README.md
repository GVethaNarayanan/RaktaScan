# ⚙️ Backend

**RaktaScan — Backend API**

> **Status:** Planning stage. Implementation is upcoming.

---

## Planned Technology Stack

| Technology | Purpose |
|---|---|
| FastAPI | API framework |
| Python | Backend language |
| Supabase / PostgreSQL | Database |
| Render / Hugging Face Spaces | Deployment |

---

## Planned Responsibilities

- **API Layer** — RESTful endpoints for frontend-backend communication
- **CHW Batch Screening Support** — Manage and coordinate batch screening sessions for Community Health Workers
- **Heavier Processing** — Server-side inference or processing for devices that cannot run on-device models
- **Screening History Integration** — Synchronize screening records when connectivity is available
- **Secure Communication** — Encrypted data transmission, authentication, and authorization

---

## Planned Structure

```
backend/
├── app/
│   ├── main.py               ← FastAPI application entry point
│   ├── routers/               ← API route handlers
│   ├── models/                ← Data models / schemas
│   ├── services/              ← Business logic
│   ├── utils/                 ← Utility functions
│   └── config.py              ← Configuration management
├── requirements.txt
└── Dockerfile
```

---

## Notes

- The backend is **optional** for the core screening flow — on-device inference is the primary approach
- The backend serves as a supporting layer for CHW coordination, data sync, and fallback processing
- **No endpoints or APIs have been implemented yet**
- Implementation will follow the architecture defined in [`docs/architecture.md`](../docs/architecture.md)

> For the full project overview, see the [root README](../README.md).
