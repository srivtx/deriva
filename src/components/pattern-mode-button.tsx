"use client"

import Link from "next/link"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin(useGSAP)

export default function PatternModeButton() {
  const button = useRef<HTMLAnchorElement>(null)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(button.current, { backgroundPosition: "200% 50%", duration: 4.8, repeat: -1, ease: "none" })
    })
    return () => media.revert()
  }, { scope: button })

  return (
    <Link ref={button} href="/patterns" className="home-pattern-button">
      <span className="pattern-mode-copy"><span>Pattern Mode</span><span aria-hidden="true">→</span></span>
    </Link>
  )
}
