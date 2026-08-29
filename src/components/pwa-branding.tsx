"use client"

import { useEffect } from "react"
import { applyPreferences, loadPreferences, type Preferences } from "@/persistence/preferences"
import { logoStyleDataUrl } from "@/data/logo-marks"
import { readErrorLog } from "@/lib/diagnostics"

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

// React 19 owns server-rendered <head> nodes — NEVER remove them (that causes
// hydration/render fights and breaks the whole app). Mutate hrefs in place.

const STATIC_MANIFEST_HREF = "/manifest.webmanifest"

function setManifestHref(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) {
    link = document.createElement("link")
    link.rel = "manifest"
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

function setIconHref(rel: "icon" | "apple-touch-icon", href: string, type?: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement("link")
    link.rel = rel
    if (type) link.type = type
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

function restoreDefaultBranding() {
  setManifestHref(STATIC_MANIFEST_HREF)
  setIconHref("icon", "/favicon.svg", "image/svg+xml")
  setIconHref("apple-touch-icon", "/icons/icon-180.png")
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
    applyPreferences(preferences)
    document.title = `${preferences.brandName} — ${preferences.tagline}`
    const curatedIcon = preferences.logoDataUrl ?? (preferences.logoStyle === "nothing" || preferences.logoStyle === "opone" ? logoStyleDataUrl(preferences.logoStyle) : null)
    if (!curatedIcon) {
      restoreDefaultBranding()
      return
    }
    const installable = await rasterizeToPng(curatedIcon)
    if (!installable) {
      restoreDefaultBranding()
      return
    }
    // Keep the served manifest: blob-URL manifests have no valid base URL, so
    // start_url/scope become invalid (console warnings, broken installability).
    // Custom branding still reaches the browser through the icon hrefs below.
    setManifestHref(STATIC_MANIFEST_HREF)
    setIconHref("icon", installable, "image/png")
    setIconHref("apple-touch-icon", installable, "image/png")
  } catch (error) {
    console.warn("[deriva] branding application failed", error)
    try { sessionStorage.setItem("deriva-error-log", JSON.stringify([{ at: Date.now(), message: String(error).slice(0, 200), source: "branding" }, ...readErrorLog()].slice(0, 6))) } catch {}
    restoreDefaultBranding()
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

    }
  }, [])

  return null
}
