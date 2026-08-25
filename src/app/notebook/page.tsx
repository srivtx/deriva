"use client"

import { useEffect, useMemo, useState } from "react"
import { TOPICS } from "@/data"
import { listTheoryNotes, saveTheoryNote } from "@/persistence/theory-notes"

function describe(id: string): { group: string; title: string } {
  const parts = id.split(":")
  if (parts[0] === "practice" && parts.length === 3) {
    const topic = TOPICS[parts[1]]
    const problem = topic?.problems.find(p => p.id === Number(parts[2]))
    return { group: topic?.name ?? parts[1], title: problem ? `P${problem.id} · ${problem.title}` : `Problem ${parts[2]}` }
  }
  if (parts[0] === "lld" || parts[0] === "design") {
    return { group: parts[0] === "lld" ? "Low-Level Design" : "System Design", title: parts.slice(1).join(" · ") || id }
  }
  return { group: "Elsewhere", title: id }
}

export default function NotebookPage() {
  const [notes, setNotes] = useState<{ id: string; note: string }[]>([])
  const [query, setQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setNotes(listTheoryNotes())
    setHydrated(true)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes.filter(entry => !q || entry.note.toLowerCase().includes(q) || describe(entry.id).title.toLowerCase().includes(q))
  }, [notes, query])

  const groups = useMemo(() => {
    const map = new Map<string, { id: string; note: string; title: string }[]>()
    for (const entry of filtered) {
      const { group, title } = describe(entry.id)
      const list = map.get(group) ?? []
      list.push({ ...entry, title })
      map.set(group, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  const startEdit = (id: string, note: string) => {
    setEditingId(id)
    setDraft(note)
  }

  const commit = () => {
    if (!editingId) return
    saveTheoryNote(editingId, draft)
    setNotes(listTheoryNotes())
    setEditingId(null)
  }

  const remove = (id: string) => {
    saveTheoryNote(id, "")
    setNotes(listTheoryNotes())
    if (editingId === id) setEditingId(null)
  }

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">NOTEBOOK / YOUR OWN WORDS</span>
          <h1>Everything you explained to yourself.</h1>
          <p>Every theory note you have ever written while solving — searchable, editable, all in one place. This is the book that beats any cheat sheet.</p>
        </div>
        <div className="contest-history-signal" aria-label="Note count">
          <span>NOTES</span>
          <strong>{hydrated ? notes.length : 0}</strong>
          <small>on this device</small>
        </div>
      </section>

      <input
        className="notebook-search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Search your notes…"
        aria-label="Search notes"
      />

      {hydrated && notes.length === 0 && (
        <section className="review-empty">
          <strong>No notes yet.</strong>
          <p>While solving any problem, write down the cue or invariant in the theory book. It lands here automatically.</p>
        </section>
      )}

      {groups.map(([group, entries]) => (
        <section key={group} className="notebook-group" aria-label={group}>
          <span className="notebook-group-label">{group} · {entries.length}</span>
          <div className="notebook-list">
            {entries.map(entry => (
              <article key={entry.id} className="notebook-item">
                {editingId === entry.id ? (
                  <div className="notebook-editor">
                    <textarea value={draft} onChange={event => setDraft(event.target.value)} aria-label="Edit note" />
                    <div className="notebook-actions">
                      <button type="button" className="super-primary" onClick={commit}>Save</button>
                      <button type="button" className="super-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="notebook-item-head">
                      <span className="notebook-item-title">{entry.title}</span>
                      <div className="notebook-actions">
                        <button type="button" className="super-ghost notebook-small-btn" onClick={() => startEdit(entry.id, entry.note)}>Edit</button>
                        <button type="button" className="super-ghost notebook-small-btn" onClick={() => remove(entry.id)}>Delete</button>
                      </div>
                    </div>
                    <p className="notebook-item-preview">{entry.note}</p>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      {hydrated && notes.length > 0 && filtered.length === 0 && (
        <p className="playground-elapsed">No notes match “{query}”.</p>
      )}
    </main>
  )
}
