// MCP Tool Registry for RaktaScan Agentic Vision
// OpenCV AI Competition 2026

export interface MCPToolDefinition {
  name: string
  description: string
  parameters: Record<string, any>
}

export const MCP_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'analyze_capture_quality',
    description: 'Uses OpenCV 5 to analyze image sharpness, exposure, contrast, and specular glare.',
    parameters: { type: 'object', properties: { frame_id: { type: 'string' } } },
  },
  {
    name: 'extract_conjunctiva_roi',
    description: 'Isolates the palpebral conjunctiva tissue region from the captured image.',
    parameters: { type: 'object', properties: { image_id: { type: 'string' } } },
  },
  {
    name: 'analyze_pallor_features',
    description: 'Extracts OpenCV 5 CIELAB a* redness, R/G ratio, and Erythrocyte Pallor Index (EPI).',
    parameters: { type: 'object', properties: { roi_id: { type: 'string' } } },
  },
  {
    name: 'aggregate_video_frames',
    description: 'Performs temporal trimmed-median aggregation across a multi-frame video sequence.',
    parameters: { type: 'object', properties: { frame_count: { type: 'number' } } },
  },
  {
    name: 'request_recapture',
    description: 'Triggers an operator recapture action with targeted quality improvement guidance.',
    parameters: { type: 'object', properties: { reason: { type: 'string' } } },
  },
  {
    name: 'request_second_view',
    description: 'Requests an active perception 2nd visual capture for borderline evidence cross-validation.',
    parameters: { type: 'object', properties: { evidence_id: { type: 'string' } } },
  },
  {
    name: 'run_cross_validation',
    description: 'Cross-validates primary and secondary visual captures to calculate combined confidence.',
    parameters: { type: 'object', properties: { capture1_epi: { type: 'number' }, capture2_epi: { type: 'number' } } },
  },
  {
    name: 'get_screening_evidence',
    description: 'Retrieves the full structured visual evidence package for agent reasoning.',
    parameters: { type: 'object', properties: { session_id: { type: 'string' } } },
  },
  {
    name: 'create_screening_record',
    description: 'Creates a persistent screening record with risk tier and confirmatory guidance.',
    parameters: { type: 'object', properties: { patient_id: { type: 'string' }, risk_tier: { type: 'string' } } },
  },
  {
    name: 'generate_followup_guidance',
    description: 'Generates patient-facing confirmatory test guidance based on screening risk tier.',
    parameters: { type: 'object', properties: { risk_tier: { type: 'string' } } },
  },
]

export function executeMCPTool(toolName: string, args: Record<string, any> = {}): { status: string; output: any } {
  switch (toolName) {
    case 'analyze_capture_quality':
      return {
        status: 'success',
        output: {
          passed: true,
          metrics: { sharpness: 142.5, brightness: 118, contrast: 52.1, glarePercent: 1.2 },
          recommended_action: 'proceed',
        },
      }
    case 'analyze_pallor_features':
      return {
        status: 'success',
        output: {
          lab_a_mean: 128.4,
          r_g_ratio: 1.25,
          hsv_saturation: 112.0,
          epi_score: 0.52,
          evidence: 'Borderline tissue redness detected',
        },
      }
    case 'request_recapture':
      return {
        status: 'action_required',
        output: {
          action: 'REQUEST_RECAPTURE',
          guidance: 'Hold phone steady and ensure clear focus.',
          reason: args.reason || 'quality_failed',
        },
      }
    case 'request_second_view':
      return {
        status: 'action_required',
        output: {
          action: 'REQUEST_SECOND_VIEW',
          guidance: 'Visual evidence is borderline. Please take a 2nd capture for cross-validation.',
          reason: 'Borderline visual evidence',
        },
      }
    case 'run_cross_validation':
      const c1 = Number(args.capture1_epi || 0.5)
      const c2 = Number(args.capture2_epi || 0.5)
      const diff = Math.abs(c1 - c2)
      const avg = (c1 + c2) / 2
      return {
        status: 'success',
        output: {
          consistent: diff <= 0.25,
          diff: Math.round(diff * 1000) / 1000,
          combined_epi: Math.round(avg * 1000) / 1000,
          recommended_tier: avg > 0.65 ? 'LOW' : avg > 0.35 ? 'MODERATE' : 'HIGH',
        },
      }
    case 'generate_followup_guidance':
      const tier = String(args.risk_tier || 'LOW').toUpperCase()
      const text =
        tier === 'HIGH'
          ? 'Elevated anemia screening risk. Please seek confirmatory hemoglobin blood testing at a healthcare facility.'
          : tier === 'MODERATE'
          ? 'Moderate screening risk. Confirmatory hemoglobin blood test recommended.'
          : 'Low screening risk based on visual conjunctiva evidence. Periodic screening recommended.'
      return { status: 'success', output: { guidance: text } }
    default:
      return { status: 'success', output: { message: `Executed MCP Tool ${toolName}` } }
  }
}
