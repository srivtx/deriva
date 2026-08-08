// Short, user-authored explanations that turn solved work into a personal
// theory book. Notes are local-first and keyed by learning surface + item.

const KEY = "deriva-theory-notes-v1"

function readNotes(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, unknown>
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => typeof value === "string")) as Record<string, string>
  } catch {
    return {}
  }
}

export function loadTheoryNote(noteId: string): string {
  return readNotes()[noteId] || ""
}

export function saveTheoryNote(noteId: string, note: string) {
  const notes = readNotes()
  if (note.trim()) notes[noteId] = note
  else delete notes[noteId]
  try { localStorage.setItem(KEY, JSON.stringify(notes)) } catch {}
}
