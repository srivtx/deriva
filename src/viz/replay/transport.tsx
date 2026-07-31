"use client"

// Transport — one shared time-control under every visualization (09 §6):
// play / step / step-back / scrub. Keyboard: space play-pause, ←/→ step.

import { useEffect } from "react"

interface TransportProps {
  cursor: number
  total: number
  playing: boolean
  onPlay: () => void
  onPause: () => void
  onStep: (delta: number) => void
  onScrub: (cursor: number) => void
}

export function Transport({ cursor, total, playing, onPlay, onPause, onStep, onScrub }: TransportProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "TEXTAREA" || tag === "INPUT") return
      if (e.key === " ") { e.preventDefault(); playing ? onPause() : onPlay() }
      if (e.key === "ArrowRight") { e.preventDefault(); onStep(1) }
      if (e.key === "ArrowLeft") { e.preventDefault(); onStep(-1) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [playing, onPlay, onPause, onStep])

  return (
    <div className="transport">
      <button className="transport-btn" onClick={() => onStep(-1)} disabled={cursor <= 0} aria-label="Step back">←</button>
      <button
        className="transport-btn transport-play"
        onClick={playing ? onPause : onPlay}
        disabled={cursor >= total && !playing}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <button className="transport-btn" onClick={() => onStep(1)} disabled={cursor >= total} aria-label="Step forward">→</button>
      <input
        className="transport-scrub"
        type="range"
        min={0}
        max={total}
        value={cursor}
        onChange={(e) => onScrub(Number(e.target.value))}
        aria-label="Scrub through the trace"
      />
      <span className="transport-count">{cursor}/{total}</span>
    </div>
  )
}
