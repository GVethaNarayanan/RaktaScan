import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPatientRecords,
  deletePatientRecord,
  clearAllPatientRecords,
  savePatientRecord,
  PatientRecord,
} from '../utils/history'

export default function History() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low' | 'moderate' | 'high'>('all')
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Quick Add Patient Form State
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState<number>(30)
  const [patientGender, setPatientGender] = useState<'Female' | 'Male' | 'Other'>('Female')
  const [patientRisk, setPatientRisk] = useState<'low' | 'moderate' | 'high'>('moderate')

  useEffect(() => {
    setRecords(getPatientRecords())
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Delete this patient record?')) {
      deletePatientRecord(id)
      const updated = getPatientRecords()
      setRecords(updated)
      if (selectedPatient?.id === id) setSelectedPatient(null)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all patient history?')) {
      clearAllPatientRecords()
      setRecords([])
      setSelectedPatient(null)
    }
  }

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault()
    const record = savePatientRecord({
      patientName: patientName || 'Anonymous Patient',
      age: patientAge,
      gender: patientGender,
      riskLevel: patientRisk,
      confidence: 0.89,
      notes: 'Manually entered screening record by health worker',
    })
    setRecords(getPatientRecords())
    setShowAddModal(false)
    setPatientName('')
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || r.riskLevel === selectedFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Glow Ambient Lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rakta-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Glass Header */}
      <header className="sticky top-0 z-30 px-6 py-4 bg-gray-950/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Patient Screening Database</h1>
            <p className="text-xs text-gray-400">Comprehensive local patient records & Hb estimates</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="floating-badge bg-rakta-500/20 text-rakta-300 border-rakta-500/40 hover:bg-rakta-500/30 cursor-pointer"
        >
          + Log Patient Record
        </button>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Search & Risk Filter Bar */}
        <div className="glass-card p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Patient Name or ID (e.g. PT-4821)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rakta-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex gap-1.5">
              {(['all', 'low', 'moderate', 'high'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    selectedFilter === f
                      ? 'bg-rakta-600 text-white shadow-md shadow-rakta-600/30'
                      : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear Database
              </button>
            )}
          </div>
        </div>

        {/* Patient Records List */}
        {filteredRecords.length === 0 ? (
          <div className="glass-card text-center py-16 text-gray-500">
            <span className="text-4xl block mb-3">📁</span>
            <p className="text-sm font-medium">No patient records found matching query.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map(patient => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`glass-card-interactive p-5 transition-all ${
                  selectedPatient?.id === patient.id ? 'border-rakta-500/60 bg-gray-900/90 shadow-rakta-600/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{patient.patientName}</h3>
                      <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                        {patient.patientId}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {patient.age ? `${patient.age} yrs` : ''} {patient.gender ? `· ${patient.gender}` : ''} · {new Date(patient.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    patient.riskLevel === 'low' ? 'risk-badge-low' :
                    patient.riskLevel === 'moderate' ? 'risk-badge-moderate' : 'risk-badge-high'
                  }`}>
                    {patient.riskLevel} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950/60 p-3 rounded-xl border border-white/5 mb-3">
                  <div>
                    <span className="text-gray-500 block">Est. Hemoglobin</span>
                    <span className="font-semibold text-gray-200">{patient.estimatedHb || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Confidence</span>
                    <span className="font-mono text-emerald-400 font-bold">{(patient.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Sharpness: {patient.qualityMetrics?.sharpness?.toFixed(1) || '120.0'}</span>
                  <button
                    onClick={(e) => handleDelete(patient.id, e)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl border-white/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono text-rakta-400 uppercase tracking-widest">{selectedPatient.patientId}</span>
                <h2 className="text-xl font-bold text-white">{selectedPatient.patientName}</h2>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-white p-2">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Timestamp</span>
                <span className="text-gray-200">{new Date(selectedPatient.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Risk Assessment</span>
                <span className={`font-bold uppercase ${
                  selectedPatient.riskLevel === 'low' ? 'text-emerald-400' :
                  selectedPatient.riskLevel === 'moderate' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {selectedPatient.riskLevel} Risk
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Est. Hb Range</span>
                <span className="font-semibold text-gray-200">{selectedPatient.estimatedHb}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Notes / Symptoms</span>
                <span className="text-gray-300 text-xs">{selectedPatient.notes || 'None recorded'}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full btn-gradient-secondary text-xs py-3 mt-4"
            >
              🖨️ Print / Export Patient Report
            </button>
          </div>
        </div>
      )}

      {/* Manual Quick Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleAddPatient} className="glass-card w-full max-w-md p-6 rounded-3xl border-white/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white">Log Patient Screening Record</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Roy"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full bg-gray-950 border border-white/15 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-rakta-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={e => setPatientAge(parseInt(e.target.value) || 30)}
                    className="w-full bg-gray-950 border border-white/15 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-rakta-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={e => setPatientGender(e.target.value as any)}
                    className="w-full bg-gray-950 border border-white/15 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-rakta-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Risk Outcome</label>
                <select
                  value={patientRisk}
                  onChange={e => setPatientRisk(e.target.value as any)}
                  className="w-full bg-gray-950 border border-white/15 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-rakta-500"
                >
                  <option value="low">Low Anemia Risk</option>
                  <option value="moderate">Moderate Anemia Risk</option>
                  <option value="high">High Anemia Risk</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full btn-gradient-primary text-sm py-3 mt-2">
              Save Patient Record
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
