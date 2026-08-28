import { useState } from 'react'

interface CarePlanModalProps {
  isOpen: boolean
  onClose: () => void
  patientName?: string
  riskTier: 'LOW' | 'MODERATE' | 'HIGH'
  estimatedHb?: string
}

export default function CarePlanModal({ isOpen, onClose, patientName = 'Patient', riskTier, estimatedHb }: CarePlanModalProps) {
  if (!isOpen) return null

  const isHigh = riskTier === 'HIGH'
  const isModerate = riskTier === 'MODERATE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in text-white">
      <div className="relative w-full max-w-2xl glass-card border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rakta-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="border-b border-white/10 pb-4">
          <span className="floating-badge text-rakta-300 bg-rakta-500/15 border-rakta-500/30 mb-2">
            📋 Personalized Clinical Care Plan & Action Sheet
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Anemia Management Plan</h2>
          <p className="text-xs text-gray-400">
            Prepared for: <span className="text-white font-semibold">{patientName}</span> · Risk Outcome:{' '}
            <span className={`font-bold ${isHigh ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
              {riskTier} RISK
            </span>
          </p>
        </div>

        {/* Immediate Medical Action Protocols */}
        <div className="glass-card bg-gray-950/80 p-5 rounded-2xl border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🚨</span> Step 1: Mandatory Clinical Confirmation
          </h3>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200 leading-relaxed">
            {isHigh ? (
              <p className="text-rose-300 font-medium">
                • <strong>Immediate Action Required</strong>: Schedule a <strong>Complete Blood Count (CBC)</strong> and <strong>Serum Ferritin Test</strong> at a certified diagnostic laboratory within 48 hours to confirm hemoglobin levels.
              </p>
            ) : isModerate ? (
              <p className="text-amber-300 font-medium">
                • <strong>Recommended Action</strong>: Schedule a routine <strong>CBC blood test</strong> within 1-2 weeks to measure exact hemoglobin and red blood cell indices.
              </p>
            ) : (
              <p className="text-emerald-300 font-medium">
                • <strong>Preventive Care</strong>: Hemoglobin screening appears normal. Schedule annual routine health checkups.
              </p>
            )}
          </div>
        </div>

        {/* Dietary Iron & Absorption Guidelines (Real Nutritional Measures) */}
        <div className="glass-card bg-gray-950/80 p-5 rounded-2xl border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🥗</span> Step 2: Evidence-Based Dietary Iron Plan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Iron Rich Foods */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <h4 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                <span>🥬</span> High-Iron Foods (Heme & Non-Heme)
              </h4>
              <ul className="space-y-1 text-gray-300 text-[11px] list-disc list-inside">
                <li>Dark Green Leafy Vegetables (Spinach, Moringa/Drumstick leaves, Fenugreek)</li>
                <li>Legumes & Beans (Lentils, Chickpeas, Rajma, Soybeans)</li>
                <li>Jaggery (Gud) & Sesame Seeds (Til)</li>
                <li>Beetroot, Pomegranate & Dates (Khajoor)</li>
                <li>Poultry, Liver & Red Meat (Heme iron - high bio-availability)</li>
              </ul>
            </div>

            {/* Absorption Enhancers vs Blockers */}
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-2">
              <h4 className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                <span>⚡</span> Iron Absorption Synergy Rules
              </h4>
              <ul className="space-y-1 text-gray-300 text-[11px] list-disc list-inside">
                <li><strong className="text-emerald-300">DO:</strong> Pair iron foods with Vitamin C (Lemon juice, Amla, Guava, Oranges) to triple absorption.</li>
                <li><strong className="text-rose-300">DON'T:</strong> Drink Tea or Coffee within 1 hour of meals (Tannins inhibit iron absorption by up to 60%).</li>
                <li><strong className="text-amber-300">NOTE:</strong> Take Calcium supplements at a different time from Iron supplements.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Supplementation & Medical Management */}
        {(isHigh || isModerate) && (
          <div className="glass-card bg-gray-950/80 p-5 rounded-2xl border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>💊</span> Step 3: Clinical Supplementation Guidelines
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Consult a physician for prescription oral iron supplements (e.g. Ferrous Ascorbate / Ferrous Fumarate + Folic Acid). Take iron supplements on an empty stomach with water or citrus juice for maximum efficacy.
            </p>
          </div>
        )}

        {/* Follow-up Timeline */}
        <div className="glass-card bg-gray-950/80 p-5 rounded-2xl border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📅</span> Step 4: Re-Screening Timeline
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-300 bg-white/5 p-3 rounded-xl">
            <span>Next Recommended Non-Invasive Screening:</span>
            <span className="font-bold text-rakta-300">
              {isHigh ? 'In 3-4 Weeks (Post Treatment)' : isModerate ? 'In 6 Weeks' : 'In 6 Months'}
            </span>
          </div>
        </div>

        {/* Print / Action CTA */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 btn-gradient-emerald text-xs py-3.5"
          >
            🖨️ Print / Save PDF Care Plan
          </button>

          <button
            onClick={onClose}
            className="btn-gradient-secondary text-xs py-3.5 px-6"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
