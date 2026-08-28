# RaktaScan — System Evaluation & Performance Benchmarks

**OpenCV AI Competition 2026, powered by AWS**  

---

## 1. Computer Vision Subsystem Evaluation

| OpenCV 5 Metric / Module | Target Threshold | Measured Performance | Verification Status |
|---|---|---|---|
| **Laplacian Sharpness** | $\text{Var}(\Delta I) \ge 45.0$ | Accurately identifies blurry vs sharp frames ($100\%$ synthetic test pass) | ✅ Verified (`tests/opencv_vision.test.ts`) |
| **Specular Glare Detection** | Glare $\% \le 8.0\%$ | Detects bright specular highlight clusters ($L > 230$) | ✅ Verified |
| **CIELAB a* Redness** | Range $120.0 - 160.0$ | Correlates tissue redness vs pallor | ✅ Verified |
| **Erythrocyte Pallor Index** | Range $0.00 - 1.00$ | Normalized index ($0.50 a^* + 0.35 R/(R+G) + 0.15 S$) | ✅ Verified |
| **Temporal Aggregation** | 5–15 frame sequence | Trimmed median rejects outliers & movement spikes | ✅ Verified |

---

## 2. Active Perception Agentic Evaluation

| Test Scenario | Input Condition | Expected Agent Action | Measured Output | Status |
|---|---|---|---|---|
| **Scenario 1: Motion Blur** | Sharpness $= 10.0$ | `REQUEST_RECAPTURE` | Action: `REQUEST_RECAPTURE` (`"Hold phone steady"`) | ✅ PASSED |
| **Scenario 2: Specular Glare** | Glare $= 9.4\%$ | `REQUEST_RECAPTURE` | Action: `REQUEST_RECAPTURE` (`"Tilt phone slightly"`) | ✅ PASSED |
| **Scenario 3: Borderline Pallor** | $\text{EPI} = 0.52$ | `REQUEST_SECOND_VIEW` | Action: `REQUEST_SECOND_VIEW` (`"Take 2nd capture"`) | ✅ PASSED |
| **Scenario 4: High Discrepancy** | $|\Delta\text{EPI}| = 0.45$ | `REQUEST_HUMAN_REVIEW` | Action: `REQUEST_HUMAN_REVIEW` (`"Clinical consultation"`) | ✅ PASSED |
| **Scenario 5: Healthy Tissue** | $\text{EPI} = 0.85$ | `ACCEPT_LOW_RISK` | Action: `ACCEPT_LOW_RISK` | ✅ PASSED |

---

## 3. Latency & Latency Measurements

| Processing Step | Execution Context | Measured Latency |
|---|---|---|
| **OpenCV 5 Quality Analysis** | Browser WASM / Client Canvas | $8.2 \text{ ms}$ |
| **MediaPipe Face Mesh ROI** | WebGL GPU Delegate | $14.5 \text{ ms}$ |
| **OpenCV 5 Pallor Extraction** | Client Canvas / OpenCV Engine | $6.1 \text{ ms}$ |
| **MobileNetV3 ONNX Inference** | ONNX Runtime Web (WASM) | $18.4 \text{ ms}$ |
| **Agent Decision Policy** | Local Decision Engine | $1.2 \text{ ms}$ |
| **Amazon Bedrock Explanation** | AWS Cloud (US-East-1) | $320 \text{ ms}$ |
| **Total Screening Latency** | End-to-End Pipeline | **$\sim 48.4 \text{ ms}$ (Local)** / **$\sim 368 \text{ ms}$ (AWS Hybrid)** |

---

## 4. Failure Case Resilience Matrix

| Failure Mode | Detection Method | System Mitigation |
|---|---|---|
| **Dark Lighting** | Brightness $< 40.0$ | Prompts operator: *"Move to a brighter area"* |
| **Excessive Glare** | Glare $\% > 8.0\%$ | Prompts operator: *"Tilt phone slightly to reduce glare"* |
| **Closed Eye** | Feature Density Shift | Prompts operator: *"⚠️ EYE CLOSED — Open eye wide"* |
| **Borderline Case** | $0.35 \le \text{EPI} \le 0.65$ | Triggers Active Perception 2nd view cross-validation |
| **Conflicting Captures**| $|\Delta\text{EPI}| > 0.40$ | Escalates to human clinical review referral |
