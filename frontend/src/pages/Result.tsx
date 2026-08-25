import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InferenceResult } from '../utils/inference'
import { savePatientRecord } from '../utils/history'
import { useState } from 'react'

interface ResultState {
  inferenceResult: InferenceResult
  capturedImage?: string
  roiImage?: string
  overlayImage?: string
  qualityMetrics?: { sharpness: number; brightness: number; contrast: number }
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

  const { inferenceResult, roiImage, overlayImage, qualityMetrics } = state
  const { riskLevel, confidence, inferenceTime, modelVersion, isPrototype } = inferenceResult
  const colors = riskColors[riskLevel]

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
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-white">Screening Result Report</h1>
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
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('result.riskLevel')}</p>
          <h2 className={`text-3xl font-extrabold ${colors.text}`}>
            {t(`result.${riskLevel}`)}
          </h2>
        </div>

        {/* Confidence & Estimated Hb */}
        <div className="glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Model Confidence</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{(confidence * 100).toFixed(1)}%</span>
          </div>

          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                riskLevel === 'low' ? 'bg-emerald-400' :
                riskLevel === 'moderate' ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${(confidence * 100).toFixed(0)}%` }}
            />
          </div>

          {inferenceTime > 0 && (
            <p className="text-[11px] text-gray-500">Inference Latency: {inferenceTime.toFixed(0)}ms · {modelVersion}</p>
          )}
        </div>

        {/* What This Means & Next Steps */}
        <div className="glass-card">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Clinical Interpretation</h3>
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            {t(`result.${riskLevel}Desc`)}
          </p>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-semibold text-white mb-1">Recommended Action:</p>
            <p className="text-xs text-gray-300">{t(`result.${riskLevel}Rec`)}</p>
          </div>
        </div>

        {/* ROI Overlay Visualization */}
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
            {t('result.disclaimer')}
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
