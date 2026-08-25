import { useState } from 'react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
  onStartRealScreening: () => void
}

export default function DemoModal({ isOpen, onClose, onStartRealScreening }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [demoState, setDemoState] = useState<'sample' | 'analyzing' | 'complete'>('sample')

  if (!isOpen) return null

  const steps = [
    {
      title: '1. Position Eyelid',
      desc: 'Position the inner lower eyelid (palpebral conjunctiva) inside the camera reticle.',
      icon: '📷',
    },
    {
      title: '2. Auto Quality Check',
      desc: 'RaktaScan automatically checks sharpness, brightness, and contrast before processing.',
      icon: '🛡️',
    },
    {
      title: '3. AI ROI Extraction',
      desc: 'MediaPipe Face Mesh isolates the exact conjunctiva region for localized feature analysis.',
      icon: '👁️',
    },
    {
      title: '4. On-Device Risk Report',
      desc: 'MobileNetV3 generates an instant Low, Moderate, or High risk assessment locally.',
      icon: '📊',
    },
  ]

  const runDemoAnalysis = () => {
    setDemoState('analyzing')
    setTimeout(() => {
      setDemoState('complete')
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl glass-card border border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rakta-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="floating-badge text-rakta-400 bg-rakta-500/10 border-rakta-500/20 mb-2">
            ✨ Interactive Feature Walkthrough
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">How RaktaScan Works</h2>
          <p className="text-sm text-gray-400">Experience the AI screening pipeline in 30 seconds</p>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {steps.map((s, idx) => (
            <button
              key={s.title}
              onClick={() => setCurrentStep(idx + 1)}
              className={`p-2 rounded-xl text-center transition-all ${
                currentStep === idx + 1
                  ? 'bg-gradient-to-r from-rakta-600 to-rose-600 text-white font-bold shadow-lg shadow-rakta-600/30 scale-105'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <div className="text-sm">{s.icon}</div>
              <div className="text-[10px] font-semibold tracking-wider uppercase mt-1">Step {idx + 1}</div>
            </button>
          ))}
        </div>

        {/* Step Content Preview */}
        <div className="glass-card bg-gray-950/80 border-white/10 p-5 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{steps[currentStep - 1].icon}</span>
            <div>
              <h3 className="font-bold text-white text-base">{steps[currentStep - 1].title}</h3>
              <p className="text-xs text-gray-400">{steps[currentStep - 1].desc}</p>
            </div>
          </div>

          {/* Interactive Visual Simulation per step */}
          {currentStep === 1 && (
            <div className="relative h-44 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-rakta-500/5 animate-pulse-glow" />
              {/* Simulated Camera reticle */}
              <div className="w-36 h-20 rounded-full border-2 border-dashed border-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse">
                <span className="text-xs font-semibold text-emerald-300">Lower Eyelid Zone</span>
              </div>
              <p className="text-xs text-emerald-400 mt-3 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                ✨ Perfect Framing Prompt Detected
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-3 gap-2 py-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-lg font-bold text-emerald-400">142.5</p>
                <p className="text-[10px] text-gray-400">Sharpness (Pass)</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-lg font-bold text-emerald-400">118</p>
                <p className="text-[10px] text-gray-400">Exposure (Optimal)</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-lg font-bold text-emerald-400">54.2</p>
                <p className="text-[10px] text-gray-400">Contrast (Good)</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="relative h-44 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <div className="inline-block p-2 rounded-lg bg-emerald-500/20 border border-emerald-400 text-xs font-mono text-emerald-300 mb-2">
                  MediaPipe 468 Mesh Landmark #154 / #380
                </div>
                <p className="text-xs text-gray-400">Isolating Palpebral Conjunctiva ROI Candidate...</p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              {demoState === 'sample' && (
                <button
                  onClick={runDemoAnalysis}
                  className="w-full btn-gradient-emerald text-sm py-3"
                >
                  ⚡ Run Simulated MobileNetV3 Test
                </button>
              )}

              {demoState === 'analyzing' && (
                <div className="text-center py-4">
                  <div className="inline-block w-8 h-8 border-3 border-rakta-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs text-gray-400">Processing ONNX Tensor in WASM...</p>
                </div>
              )}

              {demoState === 'complete' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/40 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Demo Risk Output</span>
                      <h4 className="text-lg font-bold text-emerald-300">Low Anemia Risk</h4>
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-400">92.4%</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2">Conjunctiva pallor patterns indicate normal vascular range.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3">
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="btn-gradient-secondary text-xs py-3 px-5 ml-auto"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={() => {
                onClose()
                onStartRealScreening()
              }}
              className="w-full btn-gradient-primary text-sm py-3.5"
            >
              📸 Start Real Screening Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
