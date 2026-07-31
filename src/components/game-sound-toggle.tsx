"use client"

import { useEffect, useState } from "react"
import { isGameSoundEnabled, setGameSoundEnabled, triggerGameFeedback } from "@/games/feedback"

export default function GameSoundToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => setEnabled(isGameSoundEnabled()), [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    setGameSoundEnabled(next)
    if (next) triggerGameFeedback("move")
  }

  return <button className="game-sound-toggle" onClick={toggle} aria-pressed={enabled} aria-label={enabled ? "Mute game sound" : "Enable game sound"}>{enabled ? "◉ Sound" : "○ Sound"}</button>
}
