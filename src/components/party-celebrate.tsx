"use client"

import { useEffect, useRef } from "react"

const COLORS = ["#2F8F5B", "#1E6B45", "#2E5AAC", "#7655B8", "#B55335", "#B07C24", "#DB2777", "#0891B2", "#FFD166"]

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; rot: number; vrot: number; color: string; shape: number
}

export default function PartyCelebrate({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (trigger === 0) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const count = 150
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0
      particles.push({
        x: fromLeft ? -20 : W + 20,
        y: H * 0.25 + Math.random() * H * 0.4,
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 6),
        vy: -(6 + Math.random() * 9),
        size: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.floor(Math.random() * 2),
      })
    }

    const start = performance.now()
    const duration = 2600

    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, W, H)
      const gravity = 0.22
      for (const p of particles) {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vrot
        const alpha = Math.max(0, 1 - elapsed / duration)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, W, H)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [trigger])

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 500 }} />
}
