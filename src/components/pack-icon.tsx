"use client"

import { currentIconPack, NOTHING_DOTS, TEENAGE_PATHS, type IconPackId } from "@/data/icon-packs"

export default function PackIcon({
  id, fallback, pack, className,
}: {
  id: string
  fallback: string
  pack?: IconPackId
  className?: string
}) {
  const active = pack ?? currentIconPack()

  if (active === "nothing") {
    const map = NOTHING_DOTS[id]
    if (map) {
      return (
        <i className={`doticon${className ? ` ${className}` : ""}`} aria-hidden="true">
          {map.flatMap((row, y) =>
            row.split("").map((cell, x) => <b key={`${y}-${x}`} className={cell === "#" ? "on" : ""} />),
          )}
        </i>
      )
    }
  }

  if (active === "teenage") {
    const path = TEENAGE_PATHS[id]
    if (path) {
      return (
        <svg className={`teicon${className ? ` ${className}` : ""}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={path} />
        </svg>
      )
    }
  }

  return <span aria-hidden="true">{fallback}</span>
}
