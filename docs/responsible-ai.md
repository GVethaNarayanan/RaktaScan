# RaktaScan — Responsible AI & Safety Framework

**OpenCV AI Competition 2026, powered by AWS**  

---

## 1. Primary Safety Principles

1. **Screening / Triage Aid Only**:
   - RaktaScan is explicitly positioned as an **accessible pre-screening and triage tool**.
   - It is **NOT** a diagnostic medical device and does not replace blood laboratory testing.

2. **Mandatory Confirmatory Recommendations**:
   - All Moderate and High risk screening outputs prominently direct users and health workers to seek **confirmatory hemoglobin blood testing (CBC)** at certified healthcare facilities.

3. **No Unsubstantiated Clinical Claims**:
   - RaktaScan outputs **Low, Moderate, or High Screening Risk**.
   - It never claims to "diagnose anemia" or calculate absolute clinical blood counts without confirmatory blood draws.

---

## 2. Privacy-First Architecture

- **On-Device By Default**: Raw smartphone camera video frames, facial landmarks, and cropped conjunctiva images are processed 100% inside local device browser memory.
- **Explicit Cloud Consent**: Data transmission to AWS (DynamoDB / CloudWatch) is restricted to anonymized metrics ($\text{EPI}$, $\text{Sharpness}$, Agent Traces) and requires explicit user consent.
- **Anonymous Identifiers**: Patient records use generated anonymous IDs (`PT-4821`).

---

## 3. Transparency & Honest System Status

- **Configurable Runtime Mode**: Displays current execution context (`LOCAL` vs `AWS`).
- **Controlled Demo Transparency**: Demo scenarios are labeled `CONTROLLED DEMONSTRATION DATA`.
- **OpenCV 5 Feature Visibility**: Exposes measured visual metrics (CIELAB $a^*$, $R/(R+G)$, Glare $\%$) so clinicians and judges can inspect the visual evidence behind every decision.
