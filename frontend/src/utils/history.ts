// Expanded Patient History & CHW Record Management

export interface PatientRecord {
  id: string
  patientId: string
  patientName: string
  age?: number
  gender?: 'Male' | 'Female' | 'Other'
  timestamp: string
  riskLevel: 'low' | 'moderate' | 'high'
  confidence: number
  estimatedHb?: string
  modelVersion: string
  qualityMetrics: {
    sharpness: number
    brightness: number
    contrast: number
  }
  roiImage?: string
  notes?: string
  isPrototype: boolean
}

const STORAGE_KEY = 'raktascan-patient-records'
const SESSION_KEY = 'raktascan-chw-session'

function generatePatientId(): string {
  const randNum = Math.floor(1000 + Math.random() * 9000)
  return `PT-${randNum}`
}

function generateRecordId(): string {
  return `RS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

export function getPatientRecords(): PatientRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return getInitialDemoRecords()
    return JSON.parse(data)
  } catch {
    return getInitialDemoRecords()
  }
}

export function savePatientRecord(recordData: Partial<PatientRecord>): PatientRecord {
  const records = getPatientRecords()

  const newRecord: PatientRecord = {
    id: generateRecordId(),
    patientId: recordData.patientId || generatePatientId(),
    patientName: recordData.patientName || `Patient ${recordData.patientId || generatePatientId()}`,
    age: recordData.age || Math.floor(20 + Math.random() * 45),
    gender: recordData.gender || (Math.random() > 0.5 ? 'Female' : 'Male'),
    timestamp: new Date().toISOString(),
    riskLevel: recordData.riskLevel || 'low',
    confidence: recordData.confidence || 0.88,
    estimatedHb: recordData.estimatedHb || getEstimatedHb(recordData.riskLevel || 'low'),
    modelVersion: recordData.modelVersion || 'mobilenetv3-v0.1',
    qualityMetrics: recordData.qualityMetrics || { sharpness: 120, brightness: 110, contrast: 45 },
    roiImage: recordData.roiImage,
    notes: recordData.notes || 'Routine conjunctiva pallor screening',
    isPrototype: recordData.isPrototype ?? true,
  }

  records.unshift(newRecord)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  return newRecord
}

export function deletePatientRecord(id: string): void {
  const records = getPatientRecords().filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function clearAllPatientRecords(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function getEstimatedHb(riskLevel: 'low' | 'moderate' | 'high'): string {
  switch (riskLevel) {
    case 'low': return '> 12.5 g/dL (Normal Range)'
    case 'moderate': return '10.0 – 12.0 g/dL (Mild/Moderate)'
    case 'high': return '< 10.0 g/dL (Severe Risk)'
  }
}

// CHW Session Exports for backward & forward compatibility
export interface CHWSession {
  id: string
  startTime: string
  endTime?: string
  screenings: PatientRecord[]
}

export function getActiveSession(): CHWSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function startSession(): CHWSession {
  const session: CHWSession = {
    id: `chw-${Date.now().toString().slice(-6)}`,
    startTime: new Date().toISOString(),
    screenings: [],
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function addToSession(record: PatientRecord): void {
  const session = getActiveSession()
  if (session) {
    session.screenings.push(record)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function endSession(): CHWSession | null {
  const session = getActiveSession()
  if (session) {
    session.endTime = new Date().toISOString()
    localStorage.removeItem(SESSION_KEY)
  }
  return session
}

// Initial realistic demo records
function getInitialDemoRecords(): PatientRecord[] {
  return [
    {
      id: 'RS-8921-A1',
      patientId: 'PT-4821',
      patientName: 'Sunita Devi',
      age: 34,
      gender: 'Female',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      riskLevel: 'high',
      confidence: 0.91,
      estimatedHb: '< 10.0 g/dL (Severe Risk)',
      modelVersion: 'MobileNetV3-ONNX',
      qualityMetrics: { sharpness: 142.5, brightness: 118, contrast: 52.1 },
      notes: 'Palpebral conjunctiva showed significant pallor. Advised CBC blood test.',
      isPrototype: true,
    },
    {
      id: 'RS-7104-B2',
      patientId: 'PT-9102',
      patientName: 'Rajesh Kumar',
      age: 45,
      gender: 'Male',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      riskLevel: 'low',
      confidence: 0.94,
      estimatedHb: '> 12.5 g/dL (Normal Range)',
      modelVersion: 'MobileNetV3-ONNX',
      qualityMetrics: { sharpness: 185.0, brightness: 124, contrast: 61.3 },
      notes: 'Healthy vascularization observed.',
      isPrototype: true,
    },
    {
      id: 'RS-5093-C3',
      patientId: 'PT-3310',
      patientName: 'Priya Sharma',
      age: 28,
      gender: 'Female',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      riskLevel: 'moderate',
      confidence: 0.84,
      estimatedHb: '10.0 – 12.0 g/dL (Mild/Moderate)',
      modelVersion: 'MobileNetV3-ONNX',
      qualityMetrics: { sharpness: 110.2, brightness: 105, contrast: 41.8 },
      notes: 'Slight pallor detected. Confirmatory testing recommended.',
      isPrototype: true,
    }
  ]
}
