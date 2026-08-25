"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { CSSProperties, MouseEvent } from "react"

export type AppTileDef = {
  href: string
  name: string
  glyph: string
  gradient: string
}

type AppTileProps = {
  app: AppTileDef
  badge?: number
  dot?: boolean
}

export default function AppTile({ app, badge, dot }: AppTileProps) {
  const router = useRouter()

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => { skipTransition: () => void }
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    // Touch devices: skip the morph entirely — instant open feels faster and more native.
    if (window.matchMedia("(hover: none)").matches) return
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    event.preventDefault()
    const icon = event.currentTarget.querySelector<HTMLSpanElement>(".app-tile-icon")
    if (icon) (icon.style as CSSProperties & { viewTransitionName: string }).viewTransitionName = "app-tile"
    const targetUrl = new URL(app.href, window.location.origin)
    try {
      const transition = doc.startViewTransition(async () => {
        router.push(app.href)
        await new Promise<void>(resolve => {
          const started = Date.now()
          const check = () => {
            const arrived = window.location.pathname + window.location.search === targetUrl.pathname + targetUrl.search
          if (arrived || Date.now() - started > 2200) {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          } else {
              setTimeout(check, 60)
            }
          }
          check()
        })
      })
      setTimeout(() => { try { transition.skipTransition() } catch {} }, 4000)
    } catch {
      router.push(app.href)
    }
  }

  return (
    <Link
      href={app.href}
      className="app-tile"
      title={app.name}
      onClick={open}
      onPointerEnter={() => router.prefetch(app.href)}
      onTouchStart={() => router.prefetch(app.href)}
    >
      <span className="app-tile-icon" style={{ background: app.gradient }} aria-hidden="true">
        {app.glyph}
        {badge != null && badge > 0 && <i className="app-tile-badge">{badge > 9 ? "9+" : badge}</i>}
        {dot && <i className="app-tile-dot" />}
      </span>
      <span className="app-tile-name">{app.name}</span>
    </Link>
  )
}
