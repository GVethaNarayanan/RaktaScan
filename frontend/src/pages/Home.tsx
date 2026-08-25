import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DemoModal from '../components/DemoModal'

export default function Home() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isDemoOpen, setIsDemoOpen] = useState(false)

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en'
    i18n.changeLanguage(nextLang)
    localStorage.setItem('raktascan-lang', nextLang)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-950">
      {/* Ambient Floating Glow Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rakta-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyber-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Top Glass Navbar */}
      <header className="sticky top-0 z-30 px-6 py-4 bg-gray-950/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rakta-600 to-rose-700 flex items-center justify-center shadow-lg shadow-rakta-600/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              RaktaScan
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-rakta-500/20 text-rakta-300 border border-rakta-500/30">
                AI Detection
              </span>
            </h1>
          </div>
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="floating-badge hover:border-white/30 text-xs font-bold text-gray-300 cursor-pointer transition-all active:scale-95"
        >
          🌐 {i18n.language === 'en' ? 'English' : 'हिंदी'}
        </button>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 px-6 pt-6 pb-12 max-w-xl mx-auto w-full space-y-6">
        {/* Hero Card */}
        <div className="relative glass-card border-white/15 p-8 text-center overflow-hidden perspective-1000">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rakta-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Floating 3D Glowing Blood/Health Icon */}
          <div className="relative mx-auto mb-6 w-24 h-24 rounded-3xl bg-gradient-to-br from-rakta-500 via-rose-600 to-rakta-800 p-0.5 shadow-2xl shadow-rakta-600/40 animate-float-slow">
            <div className="w-full h-full bg-gray-950 rounded-[22px] flex items-center justify-center">
              <svg className="w-12 h-12 text-rakta-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>

          <span className="floating-badge text-rakta-300 bg-rakta-500/15 border-rakta-500/30 mb-3">
            🩸 Non-Invasive Anemia Screening
          </span>

          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            AI Anemia Screening
          </h2>

          <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto mb-6">
            Instant camera-based screening of the inner lower eyelid for early non-invasive anemia risk detection.
          </p>

          {/* Start Screening Primary CTA */}
          <button
            id="btn-start-screening"
            onClick={() => navigate('/screening')}
            className="w-full btn-gradient-primary text-lg py-4 shadow-2xl shadow-rakta-600/50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            START ANEMIA SCREENING
          </button>
        </div>

        {/* Demo Mode & CHW Mode Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsDemoOpen(true)}
            className="btn-gradient-emerald py-3.5 text-sm rounded-2xl shadow-lg shadow-teal-500/20"
          >
            💡 Try Demo Walkthrough
          </button>

          <button
            id="btn-chw-mode"
            onClick={() => navigate('/chw')}
            className="btn-gradient-secondary py-3.5 text-sm rounded-2xl"
          >
            👥 CHW Health Worker Mode
          </button>
        </div>

        {/* Patient Database Shortcut */}
        <button
          id="btn-history"
          onClick={() => navigate('/history')}
          className="w-full glass-card-interactive p-4 flex items-center justify-between border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              📁
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-sm">Patient Screening Database</h3>
              <p className="text-xs text-gray-400">View saved patient records & hemoglobin estimates</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg">→</span>
        </button>

        {/* Safety Disclaimer */}
        <div className="glass-card bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              RaktaScan is an anemia screening and triage aid, NOT a medical diagnostic device. Moderate or High risk screening results recommend confirmatory hemoglobin blood testing at certified healthcare facilities.
            </p>
          </div>
        </div>
      </main>

      {/* Interactive Demo Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onStartRealScreening={() => navigate('/screening')}
      />
    </div>
  )
}
