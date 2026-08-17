"use client"

import { useEffect, useState } from "react"
import { canPromptPwaInstall, promptPwaInstall } from "@/components/pwa-branding"
import { loadPreferences } from "@/persistence/preferences"

export default function AndroidInstallActions() {
  const [android, setAndroid] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [customLogo, setCustomLogo] = useState(false)

  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent))
    setStandalone(window.matchMedia("(display-mode: standalone)").matches)
    setCanInstall(canPromptPwaInstall())
    setCustomLogo(Boolean(loadPreferences().logoDataUrl))
    const refresh = () => {
      setCanInstall(canPromptPwaInstall())
      setCustomLogo(Boolean(loadPreferences().logoDataUrl))
    }
    window.addEventListener("deriva-pwa-install-available", refresh)
    window.addEventListener("deriva-preferences-change", refresh)
    return () => {
      window.removeEventListener("deriva-pwa-install-available", refresh)
      window.removeEventListener("deriva-preferences-change", refresh)
    }
  }, [])

  if (!android || standalone || !canInstall) return null

  const install = async () => {
    await promptPwaInstall()
    setCanInstall(canPromptPwaInstall())
  }

  return (
    <section className="android-icon-choice" aria-labelledby="android-icon-choice-heading">
      <div>
        <span className="android-icon-choice-kicker">PERSONAL ICON</span>
        <h2 id="android-icon-choice-heading">Install with {customLogo ? "your saved logo" : "the current icon"}.</h2>
        <p>This browser-installed Android app can use the icon from Settings. It is separate from the signed APK download above.</p>
      </div>
      <button type="button" className="android-icon-choice-button" onClick={install}>Install custom app <span aria-hidden="true">-&gt;</span></button>
    </section>
  )
}
