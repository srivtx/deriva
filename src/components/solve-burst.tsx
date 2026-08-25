"use client"

import { useEffect, useState, type CSSProperties } from "react"

const COLORS = ["var(--viz-settled)", "var(--accent)", "var(--viz-cached)", "var(--viz-pointer)"]

export default function SolveBurst({ trigger }: { trigger: number }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!trigger) return
    setActive(true)
    const timer = setTimeout(() => setActive(false), 1100)
    return () => clearTimeout(timer)
  }, [trigger])

  if (!active) return null

  const parts = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.35
    const distance = 90 + Math.random() * 120
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: COLORS[i % COLORS.length],
      delay: (Math.random() * 0.08).toFixed(2),
      size: 6 + Math.random() * 8,
    }
  })

  return (
    <div className="solve-burst" aria-hidden="true">
      {parts.map((part, index) => (
        <i
          key={index}
          style={{
            "--bx": `${part.x}px`,
            "--by": `${part.y}px`,
            background: part.color,
            animationDelay: `${part.delay}s`,
            width: part.size,
            height: part.size,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
