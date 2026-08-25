import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InferenceResult } from '../utils/inference'
import { saveScreening } from '../utils/history'
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
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
    icon: '✓',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
  },
  moderate: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    icon: '⚠',
    gradient: 'from-amber-500/20 to-amber-600/5',
  },
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300',
    icon: '⚠',
    gradient: 'from-red-500/20 to-red-600/5',
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
        <div className="text-center">
          <p className="text-gray-400 mb-4">No screening result available.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const { inferenceResult, roiImage, overlayImage, modelError } = state
  const { riskLevel, confidence, inferenceTime, modelVersion, isPrototype } = inferenceResult
  const colors = riskColors[riskLevel]

  const handleSave = () => {
    saveScreening({
      riskLevel,
      confidence,
      modelVersion,
      qualityPassed: true,
      isPrototype,
    })
    setSaved(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{t('result.title')}</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-4 animate-fade-in">
        {/* Prototype Banner */}
        {isPrototype && (
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-xs text-blue-300">{t('result.prototype')}</p>
            </div>
          </div>
        )}

        {modelError && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-300">{modelError}</p>
          </div>
        )}

        {/* Risk Level Card */}
        <div className={`card ${colors.border} bg-gradient-to-br ${colors.gradient} text-center py-8`}>
          <div className="text-5xl mb-4">{colors.icon === '✓' ? '✅' : riskLevel === 'high' ? '🔴' : '🟡'}</div>
          <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider">{t('result.riskLevel')}</p>
          <h2 className={`text-3xl font-bold ${colors.text}`}>
            {t(`result.${riskLevel}`)}
          </h2>
        </div>

        {/* What This Means */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
            {t('result.whatThisMeans')}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {t(`result.${riskLevel}Desc`)}
          </p>
        </div>

        {/* Recommendation */}
        <div className={`card ${colors.border} ${colors.bg}`}>
          <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
            {t('result.recommendation')}
          </h3>
          <p className={`text-sm ${colors.text} leading-relaxed font-medium`}>
            {t(`result.${riskLevel}Rec`)}
          </p>
        </div>

        {/* Model Confidence */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            {t('result.confidence')}
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  riskLevel === 'low' ? 'bg-emerald-500' :
                  riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${(confidence * 100).toFixed(0)}%` }}
              />
            </div>
            <span className="text-sm font-mono text-gray-400">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          {inferenceTime > 0 && (
            <p className="text-xs text-gray-600 mt-2">Inference: {inferenceTime.toFixed(0)}ms · {modelVersion}</p>
          )}
        </div>

        {/* Detected ROI */}
        {overlayImage && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Detected Region
            </h3>
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <img src={overlayImage} alt="ROI overlay" className="w-full" style={{ transform: 'scaleX(-1)' }} />
            </div>
          </div>
        )}

        {roiImage && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Conjunctiva ROI
            </h3>
            <div className="rounded-lg overflow-hidden border border-gray-700 bg-black">
              <img src={roiImage} alt="Conjunctiva ROI" className="w-full max-h-24 object-contain" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              The screening estimate is based on visual features extracted from the detected conjunctiva region.
            </p>
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              {t('result.disclaimer')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-8">
          <button
            id="btn-save-result"
            onClick={handleSave}
            disabled={saved}
            className="w-full btn-secondary py-3"
          >
            {saved ? '✓ Saved to History' : t('result.saveResult')}
          </button>

          <button
            id="btn-new-screening"
            onClick={() => navigate('/screening')}
            className="w-full btn-primary py-3"
          >
            {t('result.newScreening')}
          </button>
        </div>
      </main>
    </div>
  )
}
