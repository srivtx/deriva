"use client"

import Link from "next/link"

export default function PatternModeButton() {
  return (
    <Link href="/patterns" className="home-pattern-button">
      <span className="pattern-mode-copy"><span>Pattern Mode</span><span aria-hidden="true">→</span></span>
    </Link>
  )
}
