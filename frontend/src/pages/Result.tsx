import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InferenceResult } from '../utils/inference'
import { savePatientRecord } from '../utils/history'
import { OpenCVMetrics, PallorFeatures } from '../utils/opencv5Vision'
import { AgentDecision } from '../utils/agentEngine'
import { useState } from 'react'

interface ResultState {
  inferenceResult: InferenceResult
  capturedImage?: string
  roiImage?: string
  overlayImage?: string
  qualityMetrics?: OpenCVMetrics
  pallorFeatures?: PallorFeatures
  agentDecision?: AgentDecision
  modelError?: string
}

const riskColors = {
  low: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    badge: 'risk-badge-low',
    icon: '✅',
  },
  moderate: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badge: 'risk-badge-moderate',
    icon: '🟡',
  },
  high: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badge: 'risk-badge-high',
    icon: '🔴',
  },
}

export default function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)

  const state = location.state as ResultState | null

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card text-center p-8 max-w-sm">
          <p className="text-gray-400 mb-4">No screening result available.</p>
          <button onClick={() => navigate('/')} className="btn-gradient-primary w-full text-sm">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const { inferenceResult, roiImage, overlayImage, qualityMetrics, pallorFeatures, agentDecision } = state
  const { riskLevel, confidence, inferenceTime, modelVersion, isPrototype } = inferenceResult
  const colors = riskColors[riskLevel] || riskColors.moderate

  const handleSave = () => {
    savePatientRecord({
      riskLevel,
      confidence,
      modelVersion,
      qualityMetrics: qualityMetrics || { sharpness: 120, brightness: 110, contrast: 45 },
      roiImage,
      isPrototype,
    })
    setSaved(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Screening Result & Agent Trace</h1>
          <p className="text-xs text-gray-400">OpenCV 5 & Agentic Vision Pre-Screening</p>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-4 animate-fade-in">
        {/* Prototype Banner */}
        {isPrototype && (
          <div className="glass-card bg-blue-500/10 border-blue-500/30 p-3.5 flex items-center gap-3">
            <span className="text-xl">ℹ️</span>
            <p className="text-xs text-blue-200">{t('result.prototype')}</p>
          </div>
        )}

        {/* Main Risk Output Card */}
        <div className={`glass-card ${colors.border} ${colors.bg} text-center py-8 relative overflow-hidden`}>
          <div className="text-5xl mb-3">{colors.icon}</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">SCREENING RISK TIER</p>
          <h2 className={`text-3xl font-extrabold ${colors.text}`}>
            {riskLevel.toUpperCase()} SCREENING RISK
          </h2>
          <span className="inline-block mt-3 px-4 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/15">
            Screening Only — Not A Diagnosis
          </span>
        </div>

        {/* OpenCV 5 Visual Features Explainability */}
        {pallorFeatures && (
          <div className="glass-card space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">OpenCV 5 Visual Features</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                <p className="font-mono font-bold text-emerald-400">{pallorFeatures.labAMean.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">CIELAB a* Redness</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                <p className="font-mono font-bold text-emerald-400">{pallorFeatures.rgRatio.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">R/G Ratio</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-800/50 border border-white/5">
                <p className="font-mono font-bold text-emerald-400">{pallorFeatures.epiScore.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">Pallor Index (EPI)</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
              🔬 {pallorFeatures.evidence}
            </p>
          </div>
        )}

        {/* Agent Trace */}
        {agentDecision && agentDecision.agentTrace && (
          <div className="glass-card space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agent Decision Trace</h3>
            <div className="bg-black/80 rounded-xl p-3 font-mono text-[11px] text-emerald-400 space-y-1.5 border border-white/10 max-h-44 overflow-y-auto">
              {agentDecision.agentTrace.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Interpretation & Next Steps */}
        <div className="glass-card space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirmatory Test Guidance</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            {agentDecision?.recommendedGuidance || t(`result.${riskLevel}Rec`)}
          </p>
        </div>

        {/* Isolated ROI */}
        {overlayImage && (
          <div className="glass-card">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Isolated Conjunctiva ROI</h3>
            <div className="rounded-xl overflow-hidden border border-white/15">
              <img src={overlayImage} alt="ROI Overlay" className="w-full" style={{ transform: 'scaleX(-1)' }} />
            </div>
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="glass-card bg-amber-500/5 border-amber-500/20 p-4">
          <p className="text-xs text-amber-200/80 leading-relaxed">
            RaktaScan is an anemia screening and triage aid, NOT a medical diagnostic device. Screening results should not replace clinical hemoglobin testing.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2 pb-8">
          <button
            id="btn-save-result"
            onClick={handleSave}
            disabled={saved}
            className="w-full btn-gradient-emerald text-sm py-3.5"
          >
            {saved ? '✓ Saved to Patient History Database' : '💾 Save to Patient History'}
          </button>

          <button
            id="btn-new-screening"
            onClick={() => navigate('/screening')}
            className="w-full btn-gradient-primary text-sm py-3.5"
          >
            📸 Start New Screening
          </button>
        </div>
      </main>
    </div>
  )
}
