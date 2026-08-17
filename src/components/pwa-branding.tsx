"use client"

import { useEffect } from "react"
import { applyPreferences, loadPreferences, type Preferences } from "@/persistence/preferences"

const MANIFEST_SELECTOR = "link[data-deriva-dynamic-manifest]"
let dynamicManifestUrl: string | null = null

function updateIconLink(rel: "icon" | "apple-touch-icon", href: string) {
  const selector = `link[rel="${rel}"][data-deriva-dynamic-icon]`
  let link = document.head.querySelector<HTMLLinkElement>(selector)
  if (!link) {
    link = document.createElement("link")
    link.rel = rel
    link.dataset.derivaDynamicIcon = "true"
    document.head.appendChild(link)
  }
  link.href = href
}

function removeDynamicLinks() {
  document.head.querySelector(MANIFEST_SELECTOR)?.remove()
  document.head.querySelectorAll("link[data-deriva-dynamic-icon]").forEach(link => link.remove())
}

function restoreDefaultManifest() {
  if (document.head.querySelector('link[rel="manifest"]')) return
  const link = document.createElement("link")
  link.rel = "manifest"
  link.href = "/manifest.webmanifest"
  document.head.appendChild(link)
}

function restoreDefaultIcons() {
  if (!document.head.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement("link")
    favicon.rel = "icon"
    favicon.href = "/favicon.svg"
    favicon.type = "image/svg+xml"
    document.head.appendChild(favicon)
  }
  if (!document.head.querySelector('link[rel="apple-touch-icon"]')) {
    const apple = document.createElement("link")
    apple.rel = "apple-touch-icon"
    apple.href = "/icons/icon-180.png"
    document.head.appendChild(apple)
  }
}

function applyPwaBranding(preferences: Preferences) {
  if (dynamicManifestUrl) URL.revokeObjectURL(dynamicManifestUrl)
  dynamicManifestUrl = null
  removeDynamicLinks()
  applyPreferences(preferences)
  document.title = `${preferences.brandName} — ${preferences.tagline}`
  if (!preferences.logoDataUrl) {
    restoreDefaultManifest()
    restoreDefaultIcons()
    return
  }
  document.head.querySelectorAll('link[rel="manifest"]').forEach(link => link.remove())
  document.head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => link.remove())

  const color = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#FAF9F6"
  const iconType = /^data:(image\/[^;]+)/.exec(preferences.logoDataUrl)?.[1] || "image/png"
  const manifest = {
    name: `${preferences.brandName} — ${preferences.tagline}`,
    short_name: preferences.brandName,
    description: preferences.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: color,
    theme_color: color,
    icons: [
      { src: preferences.logoDataUrl, sizes: "192x192", type: iconType, purpose: "any" },
      { src: preferences.logoDataUrl, sizes: "512x512", type: iconType, purpose: "any maskable" },
    ],
  }
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" })
  const manifestUrl = URL.createObjectURL(blob)
  dynamicManifestUrl = manifestUrl
  const manifestLink = document.createElement("link")
  manifestLink.rel = "manifest"
  manifestLink.href = manifestUrl
  manifestLink.dataset.derivaDynamicManifest = "true"
  document.head.appendChild(manifestLink)
  updateIconLink("icon", preferences.logoDataUrl)
  updateIconLink("apple-touch-icon", preferences.logoDataUrl)
}

export default function PwaBranding() {
  useEffect(() => {
    const next = loadPreferences()
    applyPwaBranding(next)
    const onPreferencesChange = (event: Event) => {
      const detail = (event as CustomEvent<Preferences>).detail
      if (detail) applyPwaBranding(detail)
    }
    window.addEventListener("deriva-preferences-change", onPreferencesChange)
    return () => {
      window.removeEventListener("deriva-preferences-change", onPreferencesChange)
      document.head.querySelector(MANIFEST_SELECTOR)?.remove()
      if (dynamicManifestUrl) URL.revokeObjectURL(dynamicManifestUrl)
      dynamicManifestUrl = null
      document.head.querySelectorAll("link[data-deriva-dynamic-icon]").forEach(link => link.remove())
    }
  }, [])

  return null
}
