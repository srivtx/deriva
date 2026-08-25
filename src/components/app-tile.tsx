"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { AppTileDef } from "./app-tile-def"
import { navigateWithAppTransition, playIconPress } from "@/lib/app-transition"

export type { AppTileDef }

type AppTileProps = {
  app: AppTileDef
  badge?: number
  dot?: boolean
}

export default function AppTile({ app, badge, dot }: AppTileProps) {
  const router = useRouter()

  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    const icon = event.currentTarget.querySelector<HTMLSpanElement>(".app-tile-icon")
    navigateWithAppTransition(() => router.push(app.href), icon)
  }

  return (
    <Link
      href={app.href}
      className="app-tile"
      title={app.name}
      onClick={open}
      onPointerEnter={() => router.prefetch(app.href)}
      onTouchStart={event => {
        router.prefetch(app.href)
        playIconPress(event.currentTarget.querySelector(".app-tile-icon"))
      }}
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
