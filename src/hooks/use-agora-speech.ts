"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { updateAgoraAudioPrefs, type AgoraAudioPrefs } from "@/persistence/agora"

export interface UseAgoraSpeechOptions {
  initialPrefs?: AgoraAudioPrefs
  onSpeechEnd?: () => void
  onSentenceChange?: (index: number, text: string) => void
  onSpeechMatch?: (matchedOptionId: string) => void
}

// Built-in Web Audio tone synthesizer for human podcast / broadcast cues
class AudioChimeEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // Soft warm double-tone broadcast chime before oral defense begins
  playStartChime() {
    const ctx = this.getContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = "sine"
      osc1.frequency.setValueAtTime(523.25, now) // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.14) // E5

      osc2.type = "sine"
      osc2.frequency.setValueAtTime(659.25, now) // E5
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.14) // G5

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.36)
      osc2.stop(now + 0.36)
    } catch {
      // AudioContext may be restricted by browser autoplay policy
    }
  }

  // Pure harmonious chord when invariant is locked
  playInvariantChime() {
    const ctx = this.getContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const notes = [440, 554.37, 659.25] // A4, C#5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)

        gain.gain.setValueAtTime(0.001, now + idx * 0.05)
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.05 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.4)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.42)
      })
    } catch {}
  }

  // Low muted double-tap when trap is triggered
  playTrapTone() {
    const ctx = this.getContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(260, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.22)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.07, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.26)
    } catch {}
  }
}

const chimeEngine = new AudioChimeEngine()

export function useAgoraSpeech(options: UseAgoraSpeechOptions = {}) {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const [speechRate, setSpeechRate] = useState(options.initialPrefs?.speechRate ?? 0.94)
  const [commuteMode, setCommuteMode] = useState(options.initialPrefs?.autoAdvanceCommute ?? false)
  const [muted, setMuted] = useState(options.initialPrefs?.muted ?? false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  // Sentence tracking for conversational pacing
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(-1)
  const [totalSentences, setTotalSentences] = useState<number>(0)
  const [activePhrase, setActivePhrase] = useState<string>("")

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const sentenceQueueRef = useRef<string[]>([])
  const currentSentenceIdxRef = useRef<number>(-1)
  const isCancelledRef = useRef<boolean>(false)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const onEndCallbackRef = useRef<(() => void) | undefined>(undefined)

  // Rank and select the most natural neural English voice available
  const pickBestVoice = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!availableVoices || availableVoices.length === 0) return null

    const scored = availableVoices.map(v => {
      let score = 0
      const name = v.name.toLowerCase()
      const lang = v.lang.toLowerCase()

      // English priority
      if (lang.startsWith("en-us") || lang.startsWith("en-gb")) score += 40
      else if (lang.startsWith("en")) score += 20
      else return { voice: v, score: -100 }

      // Enhanced/Neural/Natural indicator in browser voice registry
      if (name.includes("natural")) score += 80
      if (name.includes("neural")) score += 80
      if (name.includes("enhanced")) score += 70
      if (name.includes("premium")) score += 60
      if (name.includes("google")) score += 40
      if (name.includes("samantha")) score += 30
      if (name.includes("daniel")) score += 30
      if (name.includes("karen")) score += 25
      if (name.includes("oliver")) score += 25
      if (name.includes("ava")) score += 25

      // Penalize robotic sounding names
      if (name.includes("espeak") || name.includes("croak") || name.includes("bad")) score -= 50

      return { voice: v, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.score > 0 ? scored[0].voice : availableVoices[0]
  }

  // Initialize SpeechSynthesis and SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return

    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis
      setSpeechSupported(true)

      const updateVoices = () => {
        if (!synthRef.current) return
        const available = synthRef.current.getVoices()
        setVoices(available)
        const best = pickBestVoice(available)
        if (best) setSelectedVoice(best)
      }

      updateVoices()
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    // SpeechRecognition for microphone input
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      setMicSupported(true)
      const rec = new SpeechRec()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = "en-US"

      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(" ")
        setTranscript(text)
      }

      rec.onend = () => {
        setListening(false)
      }

      rec.onerror = () => {
        setListening(false)
      }

      recognitionRef.current = rec
    }

    return () => {
      synthRef.current?.cancel()
      recognitionRef.current?.abort()
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    }
  }, [])

  // Natural clause/sentence splitter that preserves technical formulas
  const splitIntoConversationalSentences = (text: string): string[] => {
    const clean = text
      .replace(/[*#_`]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (!clean) return []

    // Split on punctuation followed by space or end of string
    const rawChunks = clean.split(/(?<=[.?!;])\s+(?=[A-Z0-9$§])/g)

    const finalSentences: string[] = []
    for (const chunk of rawChunks) {
      const trimmed = chunk.trim()
      if (trimmed.length > 0) {
        finalSentences.push(trimmed)
      }
    }

    return finalSentences.length > 0 ? finalSentences : [clean]
  }

  // Step through conversational sentences with deliberate natural inter-sentence pauses
  const speakNextSentence = useCallback(() => {
    if (!synthRef.current || isCancelledRef.current || muted) {
      setSpeaking(false)
      setPaused(false)
      setCurrentSentenceIndex(-1)
      setActivePhrase("")
      return
    }

    const nextIdx = currentSentenceIdxRef.current + 1
    if (nextIdx >= sentenceQueueRef.current.length) {
      // Completed all sentences in the queue
      setSpeaking(false)
      setPaused(false)
      setCurrentSentenceIndex(-1)
      setActivePhrase("")
      onEndCallbackRef.current?.()
      options.onSpeechEnd?.()
      return
    }

    currentSentenceIdxRef.current = nextIdx
    setCurrentSentenceIndex(nextIdx)
    const sentenceText = sentenceQueueRef.current[nextIdx]
    setActivePhrase(sentenceText)
    options.onSentenceChange?.(nextIdx, sentenceText)

    const utterance = new SpeechSynthesisUtterance(sentenceText)
    utterance.rate = speechRate
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onstart = () => {
      if (isCancelledRef.current) {
        synthRef.current?.cancel()
        return
      }
      setSpeaking(true)
      setPaused(false)
    }

    utterance.onend = () => {
      if (isCancelledRef.current) return
      // Human-like inter-sentence breath pause (120ms to 180ms depending on speech rate)
      const pauseDurationMs = Math.max(80, Math.round(140 / speechRate))
      timeoutIdRef.current = setTimeout(() => {
        speakNextSentence()
      }, pauseDurationMs)
    }

    utterance.onerror = (e) => {
      // Ignore interruption cancels
      if (e.error === "canceled" || e.error === "interrupted") return
      if (!isCancelledRef.current) {
        speakNextSentence()
      }
    }

    synthRef.current.speak(utterance)
  }, [muted, options, selectedVoice, speechRate])

  // Stop any ongoing speech and clear queues
  const stop = useCallback(() => {
    isCancelledRef.current = true
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    sentenceQueueRef.current = []
    currentSentenceIdxRef.current = -1
    setCurrentSentenceIndex(-1)
    setTotalSentences(0)
    setActivePhrase("")
    setSpeaking(false)
    setPaused(false)
  }, [])

  // Speak conversational text or segmented scripts
  const speak = useCallback(
    (text: string, onEndCallback?: () => void, soundCue?: "start" | "invariant" | "trap") => {
      stop()

      if (!synthRef.current || muted) return

      // Play soft Web Audio chime cue
      if (soundCue === "start") chimeEngine.playStartChime()
      else if (soundCue === "invariant") chimeEngine.playInvariantChime()
      else if (soundCue === "trap") chimeEngine.playTrapTone()

      isCancelledRef.current = false
      onEndCallbackRef.current = onEndCallback

      const sentences = splitIntoConversationalSentences(text)
      sentenceQueueRef.current = sentences
      setTotalSentences(sentences.length)
      currentSentenceIdxRef.current = -1

      // Small initial delay so chime doesn't clash with first spoken word
      const initialDelay = soundCue ? 260 : 20
      timeoutIdRef.current = setTimeout(() => {
        speakNextSentence()
      }, initialDelay)
    },
    [muted, speakNextSentence, stop],
  )

  const pause = useCallback(() => {
    if (synthRef.current && speaking) {
      synthRef.current.pause()
      setPaused(true)
    }
  }, [speaking])

  const resume = useCallback(() => {
    if (synthRef.current && paused) {
      synthRef.current.resume()
      setPaused(false)
    }
  }, [paused])

  const setRate = useCallback((rate: number) => {
    setSpeechRate(rate)
    updateAgoraAudioPrefs({ speechRate: rate })
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      if (next && synthRef.current) {
        synthRef.current.cancel()
        setSpeaking(false)
      }
      updateAgoraAudioPrefs({ muted: next })
      return next
    })
  }, [])

  const toggleCommute = useCallback(() => {
    setCommuteMode(prev => {
      const next = !prev
      updateAgoraAudioPrefs({ autoAdvanceCommute: next })
      return next
    })
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return
    setTranscript("")
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [listening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !listening) return
    try {
      recognitionRef.current.stop()
      setListening(false)
    } catch {
      setListening(false)
    }
  }, [listening])

  return {
    speaking,
    paused,
    listening,
    transcript,
    speechSupported,
    micSupported,
    speechRate,
    commuteMode,
    muted,
    voices,
    selectedVoice,
    setSelectedVoice,
    currentSentenceIndex,
    totalSentences,
    activePhrase,
    speak,
    stop,
    pause,
    resume,
    setRate,
    toggleMute,
    toggleCommute,
    startListening,
    stopListening,
    playCue: (cue: "start" | "invariant" | "trap") => {
      if (cue === "start") chimeEngine.playStartChime()
      else if (cue === "invariant") chimeEngine.playInvariantChime()
      else if (cue === "trap") chimeEngine.playTrapTone()
    },
  }
}
