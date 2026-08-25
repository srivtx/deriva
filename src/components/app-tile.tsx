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
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    event.preventDefault()
    const icon = event.currentTarget.querySelector<HTMLSpanElement>(".app-tile-icon")
    if (icon) (icon.style as CSSProperties & { viewTransitionName: string }).viewTransitionName = "app-tile"
    doc.startViewTransition(async () => {
      router.push(app.href)
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
  }

  return (
    <Link href={app.href} className="app-tile" title={app.name} onClick={open}>
      <span className="app-tile-icon" style={{ background: app.gradient }} aria-hidden="true">
        {app.glyph}
        {badge != null && badge > 0 && <i className="app-tile-badge">{badge > 9 ? "9+" : badge}</i>}
        {dot && <i className="app-tile-dot" />}
      </span>
      <span className="app-tile-name">{app.name}</span>
    </Link>
  )
}
