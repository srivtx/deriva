// Whole-workspace backup — export/import every local Deriva key as one JSON file.

const KEY_PREFIX = "deriva-"
const EXPORT_VERSION = 1

export type WorkspaceBackup = {
  deriva: "backup"
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

export function exportWorkspace(): WorkspaceBackup {
  const data: Record<string, unknown> = {}
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(KEY_PREFIX)) continue
      const raw = localStorage.getItem(key)
      if (raw == null) continue
      try { data[key] = JSON.parse(raw) } catch { data[key] = raw }
    }
  }
  return { deriva: "backup", version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data }
}

export function downloadWorkspace() {
  const backup = exportWorkspace()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `deriva-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function importWorkspace(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read that file."))
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<WorkspaceBackup>
        if (parsed?.deriva !== "backup" || typeof parsed.data !== "object" || parsed.data === null) {
          throw new Error("That file is not a Deriva backup.")
        }
        let restored = 0
        for (const [key, value] of Object.entries(parsed.data)) {
          if (!key.startsWith(KEY_PREFIX)) continue
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
          restored++
        }
        resolve(restored)
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Import failed."))
      }
    }
    reader.readAsText(file)
  })
}

export function eraseWorkspace() {
  if (typeof window === "undefined") return
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(KEY_PREFIX)) keys.push(key)
  }
  keys.forEach(key => localStorage.removeItem(key))
}
