// Screening History — localStorage-based

export interface ScreeningRecord {
  id: string
  timestamp: string
  riskLevel: 'low' | 'moderate' | 'high'
  confidence: number
  modelVersion: string
  qualityPassed: boolean
  isPrototype: boolean
  participantId?: string // For CHW mode
  sessionId?: string     // For CHW mode
}

const STORAGE_KEY = 'raktascan-history'

function generateId(): string {
  return `rs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getHistory(): ScreeningRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveScreening(record: Omit<ScreeningRecord, 'id' | 'timestamp'>): ScreeningRecord {
  const entry: ScreeningRecord = {
    ...record,
    id: generateId(),
    timestamp: new Date().toISOString(),
  }

  const history = getHistory()
  history.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  return entry
}

export function deleteScreening(id: string): void {
  const history = getHistory().filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// CHW Session management
export interface CHWSession {
  id: string
  startTime: string
  endTime?: string
  screenings: ScreeningRecord[]
}

const SESSION_KEY = 'raktascan-chw-session'

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
    id: `chw-${Date.now()}`,
    startTime: new Date().toISOString(),
    screenings: [],
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function addToSession(record: ScreeningRecord): void {
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
    // Save all session screenings to history
    const history = getHistory()
    session.screenings.forEach(s => {
      if (!history.find(h => h.id === s.id)) {
        history.unshift(s)
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    localStorage.removeItem(SESSION_KEY)
  }
  return session
}
