"use client"

import { useEffect } from "react"
import { applyPreferences, loadPreferences, type Preferences } from "@/persistence/preferences"
import { logoStyleDataUrl } from "@/data/logo-marks"

const MANIFEST_SELECTOR = "link[data-deriva-dynamic-manifest]"
let dynamicManifestUrl: string | null = null

type AndroidInstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferredInstall: AndroidInstallEvent | null = null

export function canPromptPwaInstall() {
  return deferredInstall !== null
}

export async function promptPwaInstall() {
  if (!deferredInstall) return false
  const event = deferredInstall
  await event.prompt()
  const choice = await event.userChoice
  deferredInstall = null
  return choice.outcome === "accepted"
}

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

// Chrome's installability check requires real PNG icons — SVG data URLs are
// rejected, which destabilizes installed WebAPKs. Rasterize any SVG mark once.
let rasterCache: { src: string; png: string } | null = null

function rasterizeToPng(src: string): Promise<string | null> {
  return new Promise(resolve => {
    if (!src.startsWith("data:image/svg+xml")) return resolve(src.startsWith("data:image/png") ? src : null)
    if (rasterCache?.src === src) return resolve(rasterCache.png)
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(null)
        ctx.drawImage(image, 0, 0, 512, 512)
        const png = canvas.toDataURL("image/png")
        rasterCache = { src, png }
        resolve(png)
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

async function applyPwaBranding(preferences: Preferences) {
  try {
  if (dynamicManifestUrl) URL.revokeObjectURL(dynamicManifestUrl)
  dynamicManifestUrl = null
  removeDynamicLinks()
  applyPreferences(preferences)
  document.title = `${preferences.brandName} — ${preferences.tagline}`
  const curatedIcon = preferences.logoDataUrl ?? (preferences.logoStyle === "nothing" || preferences.logoStyle === "opone" ? logoStyleDataUrl(preferences.logoStyle) : null)
  if (!curatedIcon) {
    restoreDefaultManifest()
    restoreDefaultIcons()
    return
  }
  document.head.querySelectorAll('link[rel="manifest"]').forEach(link => link.remove())
  document.head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => link.remove())

   const styles = getComputedStyle(document.documentElement)
   const color = styles.getPropertyValue("--paper").trim() || "#F2F4EC"
   const accent = styles.getPropertyValue("--accent").trim() || "#2F8F5B"
  const installable = await rasterizeToPng(curatedIcon)
  if (!installable) {
    restoreDefaultManifest()
    restoreDefaultIcons()
    return
  }
  const pngType = "image/png"
  const manifest = {
    name: `${preferences.brandName} — ${preferences.tagline}`,
    short_name: preferences.brandName,
    description: preferences.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: color,
     theme_color: accent,
    icons: [
      { src: installable, sizes: "512x512", type: pngType, purpose: "any" },
      { src: installable, sizes: "512x512", type: pngType, purpose: "maskable" },
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
  updateIconLink("icon", installable)
  updateIconLink("apple-touch-icon", installable)
  } catch (error) {
    console.warn("[deriva] branding application failed", error)
    restoreDefaultManifest()
    restoreDefaultIcons()
  }
}

export default function PwaBranding() {
  useEffect(() => {
    const next = loadPreferences()
    applyPwaBranding(next)
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let pendingPreferences: Preferences | null = null
    const onPreferencesChange = (event: Event) => {
      const detail = (event as CustomEvent<Preferences>).detail
      if (!detail) return
      pendingPreferences = detail
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        if (pendingPreferences) applyPwaBranding(pendingPreferences)
        pendingPreferences = null
      }, 300)
    }
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredInstall = event as AndroidInstallEvent
      window.dispatchEvent(new Event("deriva-pwa-install-available"))
    }
    const onAppInstalled = () => {
      deferredInstall = null
      window.dispatchEvent(new Event("deriva-pwa-install-complete"))
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    window.addEventListener("deriva-preferences-change", onPreferencesChange)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
      window.removeEventListener("deriva-preferences-change", onPreferencesChange)
      if (debounceTimer) clearTimeout(debounceTimer)
      document.head.querySelector(MANIFEST_SELECTOR)?.remove()
      if (dynamicManifestUrl) URL.revokeObjectURL(dynamicManifestUrl)
      dynamicManifestUrl = null
      document.head.querySelectorAll("link[data-deriva-dynamic-icon]").forEach(link => link.remove())
    }
  }, [])

  return null
}
