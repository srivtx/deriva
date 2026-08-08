"use client"

import Link from "next/link"

export default function GameModeButton() {
  return (
    <Link href="/games" className="home-game-button">
      <span className="game-mode-glyph" aria-hidden="true">✦</span>
      <span>Game Mode</span>
      <span aria-hidden="true">→</span>
    </Link>
  )
}
