// Lightweight offline game feedback. Audio is synthesized locally so the PWA
// does not need sound assets or a network connection.

export type GameFeedbackKind = "move" | "correct" | "wrong" | "complete"

const SOUND_KEY = "deriva-game-sound-v1"
let audioContext: AudioContext | null = null

export function isGameSoundEnabled() {
  if (typeof window === "undefined") return true
  return localStorage.getItem(SOUND_KEY) !== "off"
}

export function setGameSoundEnabled(enabled: boolean) {
  try { localStorage.setItem(SOUND_KEY, enabled ? "on" : "off") } catch {}
}

function getAudioContext() {
  if (typeof window === "undefined") return null
  const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return null
  audioContext ||= new Context()
  return audioContext
}

export function triggerGameFeedback(kind: GameFeedbackKind) {
  if (!isGameSoundEnabled()) return
  const context = getAudioContext()
  if (context?.state === "suspended") void context.resume()

  if (context) {
    const notes: Record<GameFeedbackKind, { frequency: number; duration: number; type: OscillatorType }> = {
      move: { frequency: 330, duration: .08, type: "triangle" },
      correct: { frequency: 560, duration: .16, type: "sine" },
      wrong: { frequency: 150, duration: .18, type: "sawtooth" },
      complete: { frequency: 740, duration: .28, type: "sine" },
    }
    const note = notes[kind]
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = note.type
    oscillator.frequency.value = note.frequency
    gain.gain.setValueAtTime(.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(kind === "wrong" ? .035 : .06, context.currentTime + .012)
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + note.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + note.duration + .02)
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const pattern: Record<GameFeedbackKind, number | number[]> = {
      move: 8,
      correct: [12, 24, 18],
      wrong: [28, 20, 28],
      complete: [18, 35, 24, 35, 42],
    }
    navigator.vibrate(pattern[kind])
  }
}
