import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  startSession,
  endSession,
  getActiveSession,
  addToSession,
  CHWSession,
  ScreeningRecord,
  saveScreening,
} from '../utils/history'

export default function CHWMode() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [session, setSession] = useState<CHWSession | null>(null)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const active = getActiveSession()
    if (active) {
      setSession(active)
      setParticipantCount(active.screenings.length)
    }
  }, [])

  const handleStartSession = () => {
    const newSession = startSession()
    setSession(newSession)
    setParticipantCount(0)
  }

  const handleEndSession = () => {
    const completed = endSession()
    setSession(null)
    setParticipantCount(0)
  }

  const handleNextParticipant = () => {
    navigate('/screening')
  }

  // Summary stats
  const lowCount = session?.screenings.filter(s => s.riskLevel === 'low').length || 0
  const modCount = session?.screenings.filter(s => s.riskLevel === 'moderate').length || 0
  const highCount = session?.screenings.filter(s => s.riskLevel === 'high').length || 0

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{t('chw.title')}</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-4">
        {!session ? (
          <>
            {/* Start Session */}
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-medical-600/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-medical-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Community Health Worker Mode</h2>
              <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">
                Screen multiple participants in a session. Each screening uses an anonymous participant ID.
              </p>
              <button
                id="btn-start-session"
                onClick={handleStartSession}
                className="btn-success py-3 px-8 text-lg"
              >
                {t('chw.startSession')}
              </button>
            </div>

            <div className="rounded-xl bg-medical-500/5 border border-medical-500/20 p-4">
              <p className="text-xs text-medical-300/70 leading-relaxed">
                No personal identifying information is collected. Each participant receives an anonymous screening ID.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Active Session */}
            <div className="card border-medical-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Active Session</p>
                  <p className="text-sm font-mono text-gray-400">{session.id}</p>
                </div>
                <div className="quality-badge bg-medical-500/20 text-medical-300 border border-medical-500/30">
                  Active
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Started: {new Date(session.startTime).toLocaleString()}
              </p>
            </div>

            {/* Dashboard */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card text-center py-4">
                <p className="text-3xl font-bold text-white">{session.screenings.length}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('chw.totalScreened')}</p>
              </div>
              <div className="card text-center py-4">
                <p className="text-3xl font-bold text-red-400">{modCount + highCount}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('chw.followUp')}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center py-3 border-emerald-500/20">
                <p className="text-2xl font-bold text-emerald-400">{lowCount}</p>
                <p className="text-xs text-gray-500">{t('chw.lowRisk')}</p>
              </div>
              <div className="card text-center py-3 border-amber-500/20">
                <p className="text-2xl font-bold text-amber-400">{modCount}</p>
                <p className="text-xs text-gray-500">{t('chw.moderateRisk')}</p>
              </div>
              <div className="card text-center py-3 border-red-500/20">
                <p className="text-2xl font-bold text-red-400">{highCount}</p>
                <p className="text-xs text-gray-500">{t('chw.highRisk')}</p>
              </div>
            </div>

            {/* Screening list */}
            {session.screenings.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Screenings</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {session.screenings.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 w-6">#{i + 1}</span>
                      <span className={`quality-badge border text-xs ${
                        s.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        s.riskLevel === 'moderate' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {s.riskLevel}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {(s.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 mt-4">
              <button
                id="btn-next-participant"
                onClick={handleNextParticipant}
                className="w-full btn-success py-4 text-lg"
              >
                {t('chw.nextParticipant')}
              </button>
              <button
                id="btn-end-session"
                onClick={handleEndSession}
                className="w-full btn-secondary py-3 text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                {t('chw.endSession')}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
