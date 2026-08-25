"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { APP_CATALOG, type AppMeta } from "@/data/apps"
import { loadInstalled, setInstalled } from "@/persistence/app-store"

type Tab = "all" | "installed" | "available" | "soon"

export default function StorePage() {
  const [installed, setInstalledState] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<Tab>("all")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setInstalledState(loadInstalled())
    setHydrated(true)
  }, [])

  const toggle = (app: AppMeta) => {
    if (app.status === "soon") return
    const next = setInstalled(app.id, !installed.has(app.id))
    setInstalledState(new Set(next))
  }

  const visible = APP_CATALOG.filter(app => {
    if (tab === "installed") return app.status !== "soon" && installed.has(app.id)
    if (tab === "available") return app.status !== "soon" && !installed.has(app.id)
    if (tab === "soon") return app.status === "soon"
    return true
  })

  const counts = {
    installed: APP_CATALOG.filter(a => a.status !== "soon" && installed.has(a.id)).length,
    available: APP_CATALOG.filter(a => a.status !== "soon" && !installed.has(a.id)).length,
    soon: APP_CATALOG.filter(a => a.status === "soon").length,
  }

  return (
    <main className="super-page store-page">
      <header className="app-hero">
        <span className="super-kicker">APP CENTER</span>
        <h1>Install what you need. Remove what you don&apos;t.</h1>
        <p>Every app runs locally in your browser — nothing is uploaded. Uninstalling just hides an app from your launcher; your data stays safe.</p>
      </header>

      <div className="store-tabs" role="group" aria-label="Filter apps">
        {(["all", "installed", "available", "soon"] as Tab[]).map(t => (
          <button key={t} type="button" className={`store-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t === "all" ? "All" : t === "installed" ? `Installed · ${counts.installed}` : t === "available" ? `Available · ${counts.available}` : `Coming soon · ${counts.soon}`}
          </button>
        ))}
      </div>

      <div className="store-grid stagger">
        {visible.map(app => {
          const isInstalled = app.status !== "soon" && installed.has(app.id)
          return (
            <article key={app.id} className={`store-card${app.status === "soon" ? " soon" : ""}`}>
              <div className="store-icon" style={{ background: app.gradient }} aria-hidden="true">{app.glyph}</div>
              <div className="store-card-body">
                <h2>{app.name}</h2>
                <p>{app.desc}</p>
                <span className="store-cat">{app.category}</span>
              </div>
              <div className="store-card-actions">
                {app.status === "soon" ? (
                  <button type="button" className="store-soon" disabled>Coming soon</button>
                ) : isInstalled ? (
                  <>
                    {app.href && <Link className="super-primary" href={app.href}>Open</Link>}
                    <button type="button" className="store-uninstall" onClick={() => toggle(app)}>Uninstall</button>
                  </>
                ) : (
                  <button type="button" className="super-primary" onClick={() => toggle(app)}>Install</button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <p className="store-foot">Uninstalled apps can be re-installed here anytime. Future releases will appear under “Coming soon”.</p>

      <style>{`
        .store-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
        .store-tab { min-height: 40px; padding: 0 16px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-raised); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; transition: border-color var(--dur-fast), color var(--dur-fast), background var(--dur-fast); }
        .store-tab.active { border-color: var(--accent); background: var(--accent); color: var(--paper-raised); }
        .store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .store-card { display: flex; gap: 14px; align-items: center; padding: 16px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); box-shadow: var(--shadow-raised); }
        .store-card.soon { opacity: 0.7; }
        .store-icon { width: 52px; height: 52px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 15px; color: #fff; font-size: 24px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); }
        .store-card-body { flex: 1; min-width: 0; }
        .store-card-body h2 { margin: 0 0 3px; font: 700 16px var(--font-ui); }
        .store-card-body p { margin: 0 0 4px; color: var(--ink-soft); font: 12px/1.45 var(--font-ui); }
        .store-cat { color: var(--ink-soft); font: 700 9px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; }
        .store-card-actions { display: flex; flex-direction: column; gap: 6px; flex: 0 0 auto; }
        .store-card-actions .super-primary, .store-uninstall, .store-soon { min-height: 38px; padding: 0 14px; border-radius: 10px; font: 600 13px var(--font-ui); text-decoration: none; display: inline-flex; align-items: center; }
        .store-uninstall { border: 1px solid var(--line); background: var(--paper); color: var(--viz-pruned); cursor: pointer; }
        .store-soon { border: 1px dashed var(--line); background: transparent; color: var(--ink-soft); cursor: not-allowed; }
        .store-foot { margin: 22px 0 0; color: var(--ink-soft); font: 12px/1.5 var(--font-ui); }
        @media (max-width: 480px) {
          .store-card { flex-direction: column; align-items: flex-start; }
          .store-card-actions { flex-direction: row; width: 100%; }
          .store-card-actions .super-primary, .store-uninstall, .store-soon { flex: 1; justify-content: center; }
        }
      `}</style>
    </main>
  )
}
