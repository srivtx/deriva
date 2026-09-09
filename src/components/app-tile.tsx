"use client"

import { memo } from "react"
import Link from "next/link"
import type { AppTileDef } from "./app-tile-def"
import PackIcon from "./pack-icon"
import { playIconPress } from "@/lib/app-transition"

export type { AppTileDef }

type AppTileProps = {
  app: AppTileDef & { id?: string }
  badge?: number
  dot?: boolean
}

function AppTile({ app, badge, dot }: AppTileProps) {
  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      playIconPress(event.currentTarget.querySelector(".app-tile-icon"))
    }
    window.open(app.href, "_blank", "noopener")
  }

  return (
    <Link
      href={app.href}
      className="app-tile"
      title={app.name}
      target="_blank"
      rel="noreferrer noopener"
      onClick={open}
      onTouchStart={event => {
        playIconPress(event.currentTarget.querySelector(".app-tile-icon"))
      }}
    >
      <span className="app-tile-icon" style={{ background: app.gradient }} aria-hidden="true">
        {app.id ? <PackIcon id={app.id} fallback={app.glyph} /> : app.glyph}
        {badge != null && badge > 0 && <i className="app-tile-badge">{badge > 9 ? "9+" : badge}</i>}
        {dot && <i className="app-tile-dot" />}
      </span>
      <span className="app-tile-name">{app.name}</span>
    </Link>
  )
}

export default memo(AppTile)
