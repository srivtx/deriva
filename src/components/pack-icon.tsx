"use client"

import { currentIconPack, getPersonalDots, NOTHING_DOTS, TEENAGE_PATHS, CLASSIC_PATHS, type IconPackId } from "@/data/icon-packs"

export default function PackIcon({
  id, fallback, pack, className,
}: {
  id: string
  fallback: string
  pack?: IconPackId
  className?: string
}) {
  const active = pack ?? currentIconPack()

  if (active === "personal" || active === "nothing") {
    const map = active === "personal" ? getPersonalDots(id) ?? NOTHING_DOTS[id] : NOTHING_DOTS[id]
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
        <svg className={`teicon${className ? ` ${className}` : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={path} />
        </svg>
      )
    }
  }

  const classicPath = CLASSIC_PATHS[id]
  if (active === "classic" && classicPath) {
    return (
      <svg className={`teicon${className ? ` ${className}` : ""}`} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
        <path d={classicPath} />
      </svg>
    )
  }

  return <span aria-hidden="true">{fallback}</span>
}
