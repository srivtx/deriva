// Local-first persistence for Agora (docs/08 local-first).
// Tracks oral defense attempts, instinct scores, audio settings, and streaks.

export interface AgoraAttempt {
  challengeId: string
  answeredAt: number
  correct: boolean
  selectedOptionId: string
  spoken: boolean
}

export interface AgoraAudioPrefs {
  speechRate: number // 0.8 to 1.3
  voiceName?: string
  autoAdvanceCommute: boolean
  muted: boolean
}

export interface AgoraProgress {
  attempts: Record<string, AgoraAttempt>
  completedIds: string[]
  streakDays: number
  lastActiveDate: string
  audioPrefs: AgoraAudioPrefs
}

const AGORA_STORAGE_KEY = "deriva-agora-progress-v1"

const DEFAULT_AUDIO_PREFS: AgoraAudioPrefs = {
  speechRate: 1.0,
  autoAdvanceCommute: false,
  muted: false,
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function loadAgoraProgress(): AgoraProgress {
  if (typeof window === "undefined") {
    return {
      attempts: {},
      completedIds: [],
      streakDays: 0,
      lastActiveDate: "",
      audioPrefs: DEFAULT_AUDIO_PREFS,
    }
  }

  try {
    const raw = localStorage.getItem(AGORA_STORAGE_KEY)
    if (!raw) {
      return {
        attempts: {},
        completedIds: [],
        streakDays: 0,
        lastActiveDate: "",
        audioPrefs: DEFAULT_AUDIO_PREFS,
      }
    }
    const parsed = JSON.parse(raw) as AgoraProgress
    return {
      attempts: parsed.attempts || {},
      completedIds: parsed.completedIds || [],
      streakDays: parsed.streakDays || 0,
      lastActiveDate: parsed.lastActiveDate || "",
      audioPrefs: { ...DEFAULT_AUDIO_PREFS, ...(parsed.audioPrefs || {}) },
    }
  } catch {
    return {
      attempts: {},
      completedIds: [],
      streakDays: 0,
      lastActiveDate: "",
      audioPrefs: DEFAULT_AUDIO_PREFS,
    }
  }
}

export function saveAgoraProgress(progress: AgoraProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(AGORA_STORAGE_KEY, JSON.stringify(progress))
  } catch {}
}

export function recordAgoraAttempt(
  challengeId: string,
  selectedOptionId: string,
  correct: boolean,
  spoken = false,
): AgoraProgress {
  const current = loadAgoraProgress()
  const today = getTodayString()

  let streak = current.streakDays
  if (current.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`
    if (current.lastActiveDate === yesterdayStr) {
      streak += 1
    } else {
      streak = 1
    }
  }

  const completed = new Set(current.completedIds)
  if (correct) {
    completed.add(challengeId)
  }

  const updated: AgoraProgress = {
    ...current,
    attempts: {
      ...current.attempts,
      [challengeId]: {
        challengeId,
        answeredAt: Date.now(),
        correct,
        selectedOptionId,
        spoken,
      },
    },
    completedIds: [...completed],
    streakDays: streak,
    lastActiveDate: today,
  }

  saveAgoraProgress(updated)
  return updated
}

export function updateAgoraAudioPrefs(patch: Partial<AgoraAudioPrefs>): AgoraAudioPrefs {
  const current = loadAgoraProgress()
  const nextPrefs: AgoraAudioPrefs = {
    ...current.audioPrefs,
    ...patch,
  }
  saveAgoraProgress({
    ...current,
    audioPrefs: nextPrefs,
  })
  return nextPrefs
}
