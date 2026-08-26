"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { oscEngine } from "@/lib/osc/engine"

/** Floating pill shown while OSC-1 keeps playing after you leave /osc. */
export default function FloatingOsc() {
  const pathname = usePathname()
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setPlaying(oscEngine.playing), 350)
    return () => clearInterval(id)
  }, [])

  if (!playing || pathname === "/osc") return null

  return (
    <div className="floating-osc">
      <Link href="/osc" className="floating-osc-link" aria-label="OSC-1 is playing — open">
        <i />
        <strong>OSC&#8209;1</strong>
        <span>playing</span>
      </Link>
      <button
        type="button"
        aria-label="Stop playback"
        className="floating-osc-stop"
        onClick={() => { oscEngine.stop(); setPlaying(false) }}
      >
        ■
      </button>
    </div>
  )
}
