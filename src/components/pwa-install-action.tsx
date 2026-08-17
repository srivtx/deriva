"use client"

import { useEffect, useState } from "react"
import { canPromptPwaInstall, promptPwaInstall } from "@/components/pwa-branding"
import { loadPreferences } from "@/persistence/preferences"

export default function PwaInstallAction() {
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
    <section className="android-pwa-option" aria-labelledby="android-pwa-heading">
      <div>
        <span className="android-pwa-option-kicker">BROWSER PWA</span>
        <h2 id="android-pwa-heading">Prefer the installable web app?</h2>
        <p>This option stays in Chrome and can use {customLogo ? "your saved logo" : "the current icon"} from Settings. It is separate from the signed APK.</p>
      </div>
      <button type="button" className="android-pwa-option-button" onClick={install}>Install browser PWA <span aria-hidden="true">-&gt;</span></button>
    </section>
  )
}
