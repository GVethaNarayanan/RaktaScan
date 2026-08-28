# RaktaScan — Agentic Vision Architecture

**OpenCV AI Competition 2026, powered by AWS**  
**Category:** Agentic Vision / Healthcare Triage  

---

## 1. Active Perception Paradigm

Traditional medical computer vision systems follow a static feedforward paradigm:
$$\text{CAMERA} \longrightarrow \text{CLASSIFIER} \longrightarrow \text{STATIC RESULT}$$

**RaktaScan** replaces this with an **Active Perception Loop**:
$$\text{PERCEIVE (OpenCV 5)} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{DECIDE} \longrightarrow \text{ACT} \longrightarrow \text{RE-PERCEIVE} \longrightarrow \text{VERIFY}$$

```
                           ┌───────────────────────────────┐
                           │      SMARTPHONE CAMERA        │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │     OPEN CV 5 PERCEPTION      │
                           │  - Laplacian Sharpness        │
                           │  - Specular Glare Mask        │
                           │  - CIELAB a* Redness Index    │
                           │  - Multi-Frame Aggregation    │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │    AGENTIC DECISION ENGINE    │
                           └───────────────┬───────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│  POOR QUALITY   │               │   BORDERLINE    │               │  VALID EVIDENCE │
│ Quality Failed  │               │   EPI / MODEL   │               │ Clear Redness   │
└────────┬────────┘               └────────┬────────┘               └────────┬────────┘
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│ ACTION:         │               │ ACTION:         │               │ ACTION:         │
│ REQUEST         │               │ REQUEST         │               │ FINAL RISK      │
│ RECAPTURE       │               │ SECOND VIEW     │               │ CLASSIFICATION  │
└────────┬────────┘               └────────┬────────┘               └────────┬────────┘
         │                                 │                                 │
         └─────────────────────────────────┴─────────────────────────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │   CONFIRMATORY TEST GUIDANCE   │
                           └───────────────────────────────┘
```

---

## 2. Decision Engine Policy Rules

| Trigger Condition | OpenCV 5 / Model Metric | Agent Action | Guidance / Action Output |
|---|---|---|---|
| **Blur / Focus Failure** | $\text{Var}(\Delta I) < 45$ | `REQUEST_RECAPTURE` | *"Hold phone steady and capture again."* |
| **Specular Reflection** | Glare $\% > 8.0\%$ | `REQUEST_RECAPTURE` | *"Tilt phone slightly to reduce direct specular reflections."* |
| **Low Illumination** | Brightness $< 40$ | `REQUEST_RECAPTURE` | *"Move to a brighter area or increase room lighting."* |
| **Borderline Pallor** | $0.35 \le \text{EPI} \le 0.65$ | `REQUEST_SECOND_VIEW` | *"Visual evidence is borderline. Please take 2nd capture for cross-validation."* |
| **High Discrepancy** | $|\Delta\text{EPI}| > 0.40$ | `REQUEST_HUMAN_REVIEW` | *"Conflicting visual captures detected. Clinical consultation recommended."* |
| **Clear Healthy Redness** | $\text{EPI} \ge 0.65$ | `ACCEPT_LOW_RISK` | *"Low screening risk based on visual evidence."* |
| **Clear Severe Pallor** | $\text{EPI} < 0.35$ | `ACCEPT_HIGH_RISK` | *"Elevated anemia screening risk. Seek confirmatory blood test."* |

---

## 3. Model Context Protocol (MCP) Tools

RaktaScan registers 10 MCP-compatible tools:

1. `analyze_capture_quality()` — Runs OpenCV 5 Laplacian sharpness & glare analysis.
2. `extract_conjunctiva_roi()` — Isolates lower eyelid mucosa.
3. `analyze_pallor_features()` — Extracts CIELAB $a^*$, $R/(R+G)$, and EPI.
4. `aggregate_video_frames()` — Computes trimmed-median multi-frame aggregation.
5. `request_recapture()` — Issues operator quality correction instructions.
6. `request_second_view()` — Triggers active perception 2nd view request.
7. `run_cross_validation()` — Cross-validates primary & secondary captures.
8. `get_screening_evidence()` — Packages structured visual evidence.
9. `create_screening_record()` — Persists patient record to database.
10. `generate_followup_guidance()` — Generates confirmatory testing recommendations.
