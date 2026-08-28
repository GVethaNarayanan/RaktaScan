"""
RaktaScan Agentic Vision Decision Engine
OpenCV AI Competition 2026

Evaluates OpenCV 5 visual evidence and MobileNetV3 scores against configurable
medical policy thresholds to decide the system's next active perception step.
"""

from typing import Dict, Any, List
import time


class AgenticVisionEngine:
    """Decision Policy Engine for RaktaScan Active Perception Loop."""

    def __init__(self):
        # Configurable evidence thresholds
        self.epi_low_risk_min = 0.65
        self.epi_high_risk_max = 0.35
        self.model_high_risk_min = 0.70
        self.model_low_risk_max = 0.30
        self.uncertainty_borderline_max = 0.30

    def evaluate_perception_step(
        self,
        quality_metrics: Dict[str, Any],
        pallor_features: Dict[str, Any],
        model_score: float,
        capture_count: int = 1,
        previous_evidence: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates perception evidence and returns an Agentic Action + Trace log.
        Possible Actions:
          - REQUEST_RECAPTURE
          - REQUEST_SECOND_VIEW
          - ACCEPT_LOW_RISK
          - ACCEPT_MODERATE_RISK
          - ACCEPT_HIGH_RISK
          - REQUEST_HUMAN_REVIEW
        """
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        previous_evidence = previous_evidence or []

        # Extract metrics
        passed_quality = quality_metrics.get("passed", True)
        reasons = quality_metrics.get("reasons", [])
        sharpness = quality_metrics.get("metrics", {}).get("sharpness", 100.0)
        glare_percent = quality_metrics.get("metrics", {}).get("glare_percent", 0.0)

        epi_score = pallor_features.get("epi_score", 0.50)
        lab_a = pallor_features.get("lab_a_mean", 125.0)

        # 1. QUALITY REJECTION GATE
        if not passed_quality:
            guidance = self._get_quality_guidance(reasons)
            trace = [
                f"[{timestamp}] PERCEPT: Frame quality failed ({', '.join(reasons)}).",
                f"[{timestamp}] DECISION: Action -> REQUEST_RECAPTURE",
                f"[{timestamp}] ACTION: Prompt operator: '{guidance}'"
            ]
            return {
                "action": "REQUEST_RECAPTURE",
                "recommended_guidance": guidance,
                "reason": f"Quality gate failed: {', '.join(reasons)}",
                "risk_tier": "UNKNOWN",
                "confidence": 0.0,
                "agent_trace": trace,
                "requires_action": True,
            }

        # 2. BORDERLINE / UNCERTAINTY ACTIVE PERCEPTION GATE
        is_borderline_epi = (self.epi_high_risk_max <= epi_score <= self.epi_low_risk_min)
        is_borderline_model = (self.model_low_risk_max <= model_score <= self.model_high_risk_min)

        if capture_count == 1 and (is_borderline_epi or is_borderline_model):
            trace = [
                f"[{timestamp}] PERCEPT 1: Valid OpenCV 5 frame (EPI={epi_score:.2f}, LAB a*={lab_a:.1f}).",
                f"[{timestamp}] UNDERSTAND: Visual evidence is borderline (Uncertainty threshold reached).",
                f"[{timestamp}] DECISION: Action -> REQUEST_SECOND_VIEW",
                f"[{timestamp}] ACTION: Request 2nd visual capture to perform cross-validation."
            ]
            return {
                "action": "REQUEST_SECOND_VIEW",
                "recommended_guidance": "Visual evidence is borderline. Please take a 2nd capture for cross-validation.",
                "reason": "Borderline visual pallor score requires secondary confirmation.",
                "risk_tier": "BORDERLINE",
                "confidence": 0.65,
                "agent_trace": trace,
                "requires_action": True,
            }

        # 3. MULTI-CAPTURE CROSS-VALIDATION GATE
        if capture_count >= 2 and previous_evidence:
            prev_epi = previous_evidence[0].get("epi_score", epi_score)
            epi_diff = abs(epi_score - prev_epi)

            if epi_diff > 0.40:
                trace = [
                    f"[{timestamp}] PERCEPT 2: 2nd capture collected (EPI 1={prev_epi:.2f}, EPI 2={epi_score:.2f}).",
                    f"[{timestamp}] UNDERSTAND: High discrepancy detected between captures (|ΔEPI|={epi_diff:.2f}).",
                    f"[{timestamp}] DECISION: Action -> REQUEST_HUMAN_REVIEW",
                    f"[{timestamp}] ACTION: Recommend clinical consultation."
                ]
                return {
                    "action": "REQUEST_HUMAN_REVIEW",
                    "recommended_guidance": "Conflicting visual captures detected. Clinical consultation recommended.",
                    "reason": "High variance between visual evidence captures.",
                    "risk_tier": "UNRESOLVED",
                    "confidence": 0.50,
                    "agent_trace": trace,
                    "requires_action": True,
                }

        # 4. FINAL SCREENING RESULT RISK MAPPING
        combined_score = 0.60 * (1.0 - epi_score) + 0.40 * model_score

        if combined_score < 0.35:
            action = "ACCEPT_LOW_RISK"
            risk_tier = "LOW"
            guidance = "Low screening risk based on vascular redness. Periodic check recommended."
        elif combined_score < 0.65:
            action = "ACCEPT_MODERATE_RISK"
            risk_tier = "MODERATE"
            guidance = "Moderate screening risk. Confirmatory hemoglobin blood test recommended."
        else:
            action = "ACCEPT_HIGH_RISK"
            risk_tier = "HIGH"
            guidance = "Elevated anemia screening risk. Please seek confirmatory hemoglobin blood testing."

        confidence = round(float(0.85 + 0.12 * abs(combined_score - 0.50)), 2)

        trace = [
            f"[{timestamp}] PERCEPT: OpenCV 5 + MobileNetV3 visual evidence aggregated (EPI={epi_score:.2f}, Combined={combined_score:.2f}).",
            f"[{timestamp}] DECISION: Action -> {action}",
            f"[{timestamp}] ACTION: Final screening risk set to {risk_tier} (Confidence={confidence*100:.0f}%).",
            f"[{timestamp}] GUIDANCE: {guidance}"
        ]

        return {
            "action": action,
            "recommended_guidance": guidance,
            "reason": f"Visual features indicate {risk_tier} anemia screening risk.",
            "risk_tier": risk_tier,
            "confidence": confidence,
            "agent_trace": trace,
            "requires_action": False,
        }

    def _get_quality_guidance(self, reasons: List[str]) -> str:
        if "too_blurry" in reasons:
            return "Hold the phone steady and ensure clear focus."
        if "too_dark" in reasons:
            return "Move to a brighter area or increase room lighting."
        if "too_bright" in reasons:
            return "Avoid direct glaring light sources."
        if "specular_glare" in reasons:
            return "Tilt phone slightly to reduce direct specular reflections."
        if "low_contrast" in reasons:
            return "Ensure lower eyelid is pulled down properly to expose conjunctiva."
        return "Position lower eyelid clearly inside the guide reticle."
