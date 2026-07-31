"use client"

import Link from "next/link"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin(useGSAP)

export default function GameModeButton() {
  const button = useRef<HTMLAnchorElement>(null)
  const glyph = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(button.current, {
        backgroundPosition: "200% 50%",
        duration: 4,
        repeat: -1,
        ease: "none",
      })
      gsap.to(glyph.current, {
        rotation: 360,
        duration: 7,
        repeat: -1,
        ease: "none",
      })
    })
    return () => media.revert()
  }, { scope: button })

  return (
    <Link ref={button} href="/games" className="home-game-button">
      <span ref={glyph} className="game-mode-glyph" aria-hidden="true">✦</span>
      <span>Game Mode</span>
      <span aria-hidden="true">→</span>
    </Link>
  )
}
