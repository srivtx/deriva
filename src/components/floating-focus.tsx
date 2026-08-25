"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { focusRemainingMs, loadFocusState } from "@/persistence/focus"

export default function FloatingFocus() {
  const pathname = usePathname()
  const router = useRouter()
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => {
      const state = loadFocusState()
      if (!state.running) {
        setRemaining(null)
        return
      }
      const left = focusRemainingMs(state)
      if (left <= 0) {
        setRemaining(null)
        return
      }
      setRemaining(left)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [pathname])

  if (remaining == null || remaining <= 0 || pathname === "/toolkit") return null

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <Link
      href="/toolkit?tool=focus"
      className="floating-focus"
      aria-label={`Focus timer running, ${minutes} minutes ${seconds} seconds remaining. Open timer`}
      onClick={() => { if ("vibrate" in navigator) navigator.vibrate(8); router.prefetch("/toolkit?tool=focus") }}
    >
      <i aria-hidden="true" />
      <strong>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong>
      <span>focus</span>
    </Link>
  )
}
