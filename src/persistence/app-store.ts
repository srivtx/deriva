import { APP_CATALOG, type AppMeta } from "@/data/apps"

const KEY = "deriva-uninstalled-apps"

function loadUninstalled(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {}
  return new Set()
}

export function saveUninstalled(ids: Set<string>): void {
  try { localStorage.setItem(KEY, JSON.stringify([...ids])) } catch {}
}

// A built app is installed unless the user explicitly uninstalled it.
// Tracking uninstalls (not installs) means newly added apps appear automatically.
export function loadInstalled(): Set<string> {
  const uninstalled = loadUninstalled()
  return new Set(APP_CATALOG.filter(a => a.status !== "soon" && !uninstalled.has(a.id)).map(a => a.id))
}

export function isInstalled(id: string): boolean {
  return loadInstalled().has(id)
}

export function setInstalled(id: string, installed: boolean): Set<string> {
  const meta = APP_CATALOG.find(a => a.id === id)
  if (!meta || meta.status === "soon") return loadInstalled()
  const next = loadUninstalled()
  if (installed) next.delete(id); else next.add(id)
  saveUninstalled(next)
  return loadInstalled()
}

export function installedApps(): AppMeta[] {
  const set = loadInstalled()
  return APP_CATALOG.filter(a => a.status !== "soon" && set.has(a.id))
}
