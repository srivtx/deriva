"use client"

import AppIcon, { type AppIconName } from "./app-icon"
import { resolveNavVariant } from "@/data/nav-icons"
import type { IconPackId } from "@/data/icon-packs"

export default function NavSlotIcon({
  itemId,
  variantId,
  autoPack,
  size = 22,
}: {
  itemId: string
  variantId?: string
  autoPack: IconPackId
  size?: number
}) {
  const variant = resolveNavVariant(itemId, variantId, autoPack)

  if (variant.lang === "classic" && variant.classicIcon) {
    return <AppIcon name={variant.classicIcon as AppIconName} size={size} />
  }

  if (variant.lang === "nothing" && variant.dots) {
    return (
      <i className="doticon navslot-icon" style={{ width: size }} aria-hidden="true">
        {variant.dots.flatMap((row, y) =>
          row.split("").map((cell, x) => <b key={`${y}-${x}`} className={cell === "#" ? "on" : ""} />),
        )}
      </i>
    )
  }

  if (variant.lang === "teenage" && variant.path) {
    return (
      <svg
        className="teicon navslot-icon"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={variant.path} />
      </svg>
    )
  }

  return (
    <span className="glyphicon navslot-icon" style={{ fontSize: Math.round(size * 0.82), lineHeight: 1 }} aria-hidden="true">
      {variant.glyph ?? "◆"}
    </span>
  )
}
