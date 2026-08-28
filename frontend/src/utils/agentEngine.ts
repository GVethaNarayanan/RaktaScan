// RaktaScan Agentic Vision Decision Engine
// OpenCV AI Competition 2026

import { OpenCVMetrics, PallorFeatures } from './opencv5Vision'

export type AgentAction =
  | 'REQUEST_RECAPTURE'
  | 'REQUEST_SECOND_VIEW'
  | 'ACCEPT_LOW_RISK'
  | 'ACCEPT_MODERATE_RISK'
  | 'ACCEPT_HIGH_RISK'
  | 'REQUEST_HUMAN_REVIEW'

export interface AgentDecision {
  action: AgentAction
  recommendedGuidance: string
  reason: string
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'BORDERLINE' | 'UNKNOWN' | 'UNRESOLVED'
  confidence: number
  agentTrace: string[]
  requiresAction: boolean
}

export function evaluatePerceptionStep(
  qualityResult: { passed: boolean; reasons: string[]; metrics: OpenCVMetrics },
  pallorFeatures: PallorFeatures,
  modelScore: number,
  captureCount: number = 1,
  previousEvidence: PallorFeatures[] = []
): AgentDecision {
  const timestamp = new Date().toLocaleTimeString()

  // 1. QUALITY REJECTION GATE
  if (!qualityResult.passed) {
    const reasonsStr = qualityResult.reasons.join(', ')
    let guidance = 'Position lower eyelid clearly inside the guide reticle.'

    if (qualityResult.reasons.includes('too_blurry')) {
      guidance = 'Hold phone steady and capture again.'
    } else if (qualityResult.reasons.includes('too_dark')) {
      guidance = 'Move to a brighter area or increase room lighting.'
    } else if (qualityResult.reasons.includes('specular_glare')) {
      guidance = 'Tilt phone slightly to reduce direct specular reflections.'
    } else if (qualityResult.reasons.includes('low_contrast')) {
      guidance = 'Lower the eyelid further and center the eye.'
    }

    return {
      action: 'REQUEST_RECAPTURE',
      recommendedGuidance: guidance,
      reason: `Quality gate failed: ${reasonsStr}`,
      riskTier: 'UNKNOWN',
      confidence: 0,
      agentTrace: [
        `[${timestamp}] PERCEPT: Frame quality failed (${reasonsStr}).`,
        `[${timestamp}] DECISION: Action -> REQUEST_RECAPTURE`,
        `[${timestamp}] ACTION: Prompt operator: "${guidance}"`,
      ],
      requiresAction: true,
    }
  }

  // 2. BORDERLINE / UNCERTAINTY ACTIVE PERCEPTION GATE
  const epi = pallorFeatures.epiScore
  const isBorderlineEpi = epi >= 0.35 && epi <= 0.65
  const isBorderlineModel = modelScore >= 0.30 && modelScore <= 0.70

  if (captureCount === 1 && (isBorderlineEpi || isBorderlineModel)) {
    return {
      action: 'REQUEST_SECOND_VIEW',
      recommendedGuidance: 'Visual evidence is borderline. Please take a 2nd capture for cross-validation.',
      reason: 'Borderline visual pallor score requires secondary confirmation.',
      riskTier: 'BORDERLINE',
      confidence: 0.65,
      agentTrace: [
        `[${timestamp}] PERCEPT 1: Valid OpenCV 5 frame (EPI=${epi.toFixed(2)}, LAB a*=${pallorFeatures.labAMean.toFixed(1)}).`,
        `[${timestamp}] UNDERSTAND: Visual evidence is borderline (Uncertainty threshold reached).`,
        `[${timestamp}] DECISION: Action -> REQUEST_SECOND_VIEW`,
        `[${timestamp}] ACTION: Request 2nd visual capture to perform cross-validation.`,
      ],
      requiresAction: true,
    }
  }

  // 3. MULTI-CAPTURE CROSS-VALIDATION GATE
  if (captureCount >= 2 && previousEvidence.length > 0) {
    const prevEpi = previousEvidence[0].epiScore
    const diff = Math.abs(epi - prevEpi)

    if (diff > 0.40) {
      return {
        action: 'REQUEST_HUMAN_REVIEW',
        recommendedGuidance: 'Conflicting visual captures detected. Clinical consultation recommended.',
        reason: 'High variance between visual evidence captures.',
        riskTier: 'UNRESOLVED',
        confidence: 0.50,
        agentTrace: [
          `[${timestamp}] PERCEPT 2: 2nd capture collected (EPI 1=${prevEpi.toFixed(2)}, EPI 2=${epi.toFixed(2)}).`,
          `[${timestamp}] UNDERSTAND: High discrepancy detected between captures (|ΔEPI|=${diff.toFixed(2)}).`,
          `[${timestamp}] DECISION: Action -> REQUEST_HUMAN_REVIEW`,
          `[${timestamp}] ACTION: Recommend clinical consultation.`,
        ],
        requiresAction: true,
      }
    }
  }

  // 4. FINAL RISK MAPPING
  const combined = 0.60 * (1.0 - epi) + 0.40 * modelScore
  let action: AgentAction = 'ACCEPT_LOW_RISK'
  let riskTier: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
  let guidance = 'Low screening risk based on visual evidence. Periodic screening recommended.'

  if (combined >= 0.65) {
    action = 'ACCEPT_HIGH_RISK'
    riskTier = 'HIGH'
    guidance = 'Elevated anemia screening risk. Please seek confirmatory hemoglobin blood testing.'
  } else if (combined >= 0.35) {
    action = 'ACCEPT_MODERATE_RISK'
    riskTier = 'MODERATE'
    guidance = 'Moderate screening risk. Confirmatory hemoglobin blood test recommended.'
  }

  const confidence = Math.round((0.85 + 0.12 * Math.abs(combined - 0.50)) * 100) / 100

  return {
    action,
    recommendedGuidance: guidance,
    reason: `Visual features indicate ${riskTier} anemia screening risk.`,
    riskTier,
    confidence,
    agentTrace: [
      `[${timestamp}] PERCEPT: OpenCV 5 + MobileNetV3 visual evidence aggregated (EPI=${epi.toFixed(2)}, Combined=${combined.toFixed(2)}).`,
      `[${timestamp}] DECISION: Action -> ${action}`,
      `[${timestamp}] ACTION: Final screening risk set to ${riskTier} (Confidence=${(confidence * 100).toFixed(0)}%).`,
      `[${timestamp}] GUIDANCE: ${guidance}`,
    ],
    requiresAction: false,
  }
}
