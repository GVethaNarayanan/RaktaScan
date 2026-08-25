import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getHistory, deleteScreening, clearHistory, ScreeningRecord } from '../utils/history'

const riskBadge = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function History() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [records, setRecords] = useState<ScreeningRecord[]>([])

  useEffect(() => {
    setRecords(getHistory())
  }, [])

  const handleDelete = (id: string) => {
    deleteScreening(id)
    setRecords(getHistory())
  }

  const handleClear = () => {
    if (window.confirm('Clear all screening history?')) {
      clearHistory()
      setRecords([])
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{t('history.title')}</h1>
        {records.length > 0 && (
          <button onClick={handleClear} className="ml-auto text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
            {t('history.clearAll')}
          </button>
        )}
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-12 h-12 mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm">{t('history.noHistory')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="card flex items-center gap-4 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`quality-badge border ${riskBadge[record.riskLevel]} text-xs`}>
                      {record.riskLevel.charAt(0).toUpperCase() + record.riskLevel.slice(1)} Risk
                    </span>
                    {record.isPrototype && (
                      <span className="quality-badge bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                        Prototype
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(record.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Confidence: {(record.confidence * 100).toFixed(1)}% · {record.modelVersion}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
