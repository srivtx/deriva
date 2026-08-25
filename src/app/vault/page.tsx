"use client"

import { useEffect, useRef, useState } from "react"
import { createVault, deleteVault, hasVault, newEntryId, saveVault, unlockVault, type VaultData, type VaultEntry } from "@/persistence/vault"
import { generatePassword } from "@/lib/crypto"

type Phase = "loading" | "unlock" | "create" | "open"

export default function VaultPage() {
  const [phase, setPhase] = useState<Phase>("loading")
  const [password, setPassword] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [error, setError] = useState("")
  const [data, setData] = useState<VaultData>({ entries: [] })
  const [pw, setPw] = useState("")
  const [editing, setEditing] = useState<VaultEntry | null>(null)
  const [reveal, setReveal] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState("")
  const pwdRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPhase(hasVault() ? "unlock" : "create")
  }, [])

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 1600) }

  const submitUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const d = await unlockVault(password)
      setData(d); setPw(password); setPhase("open")
    } catch {
      setError("Wrong master password. Try again.")
    }
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) { setError("Use at least 6 characters."); return }
    if (password !== confirmPw) { setError("Passwords don't match."); return }
    await createVault(password, [])
    setPw(password); setData({ entries: [] }); setPhase("open")
  }

  const persist = async (next: VaultData) => {
    setData(next)
    await saveVault(pw, next)
  }

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const next: VaultData = { entries: data.entries.filter(x => x.id !== editing.id).concat({ ...editing, updatedAt: Date.now() }) }
    await persist(next)
    setEditing(null)
    flash("Saved")
  }

  const removeEntry = async (id: string) => {
    await persist({ entries: data.entries.filter(x => x.id !== id) })
    flash("Deleted")
  }

  const newEntry = () => setEditing({ id: newEntryId(), title: "", username: "", password: "", url: "", note: "", updatedAt: Date.now() })

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); flash(`${label} copied`) } catch { flash("Copy failed") }
  }

  const wipe = () => {
    if (confirm("Delete the entire vault and all entries? This cannot be undone.")) {
      deleteVault(); setPassword(""); setPw(""); setPhase("create")
    }
  }

  if (phase === "loading") return <div className="page-loading">Loading vault…</div>

  if (phase === "unlock" || phase === "create") {
    const creating = phase === "create"
    return (
      <main className="super-page vault-page">
        <header className="app-hero">
          <span className="super-kicker">PASSWORD VAULT</span>
          <h1>{creating ? "Create your vault" : "Unlock your vault"}</h1>
          <p>{creating ? "Pick a master password. It never leaves this device — we can't recover it if you forget." : "Encrypted locally with AES-GCM. Your secrets stay on your device."}</p>
        </header>
        <form className="vault-form" onSubmit={creating ? submitCreate : submitUnlock}>
          <label className="super-field"><span>Master password</span>
            <input ref={pwdRef} type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
          {creating && <label className="super-field"><span>Confirm password</span>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" /></label>}
          {error && <p className="vault-error">{error}</p>}
          <button type="submit" className="super-primary">{creating ? "Create vault" : "Unlock"}</button>
        </form>
        <p className="vault-note">Secured with PBKDF2 (200k iterations) + AES-256-GCM in your browser.</p>
      </main>
    )
  }

  return (
    <main className="super-page vault-page">
      <div className="vault-head">
        <header className="app-hero" style={{ flex: "1 1 320px", marginBottom: 0 }}>
          <span className="super-kicker">PASSWORD VAULT</span>
          <h1>Your secrets</h1>
        </header>
        <div className="vault-head-actions">
          <button type="button" className="super-ghost" onClick={wipe}>Delete vault</button>
          <button type="button" className="super-ghost" onClick={() => { setPw(""); setPassword(""); setPhase(hasVault() ? "unlock" : "create") }}>Lock</button>
          <button type="button" className="super-primary" onClick={newEntry}>+ Add</button>
        </div>
      </div>

      {toast && <div className="vault-toast" role="status">{toast}</div>}

      {editing && (
        <form className="vault-entry-form" onSubmit={saveEntry}>
          <span className="super-kicker">ENTRY</span>
          <label className="super-field"><span>Title</span><input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="GitHub" autoFocus /></label>
          <label className="super-field"><span>Username / email</span><input value={editing.username} onChange={e => setEditing({ ...editing, username: e.target.value })} placeholder="you@email.com" /></label>
          <label className="super-field"><span>Password</span>
            <div className="vault-pw-row">
              <input type={reveal[editing.id] ? "text" : "password"} value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} placeholder="••••••••" />
              <button type="button" className="vault-mini" onClick={() => setEditing({ ...editing, password: generatePassword(16) })}>Generate</button>
              <button type="button" className="vault-mini" onClick={() => setReveal(r => ({ ...r, [editing.id]: !r[editing.id] }))}>{reveal[editing.id] ? "Hide" : "Show"}</button>
            </div>
          </label>
          <label className="super-field"><span>Website</span><input value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} placeholder="https://" /></label>
          <label className="super-field"><span>Note</span><textarea value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} rows={3} /></label>
          <div className="vault-entry-actions">
            <button type="button" className="super-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="super-primary">Save entry</button>
          </div>
        </form>
      )}

      {!editing && data.entries.length === 0 && <p className="vault-empty">No entries yet. Tap “+ Add” to store your first secret.</p>}

      {!editing && data.entries.length > 0 && (
        <ul className="vault-list">
          {data.entries.map(entry => (
            <li key={entry.id} className="vault-item">
              <div className="vault-item-main">
                <strong>{entry.title || "Untitled"}</strong>
                {entry.username && <span>{entry.username}</span>}
                <code>{reveal[entry.id] ? entry.password : "•".repeat(Math.max(6, entry.password.length))}</code>
              </div>
              <div className="vault-item-actions">
                <button type="button" className="vault-mini" onClick={() => copy(entry.password, "Password")}>Copy</button>
                <button type="button" className="vault-mini" onClick={() => setReveal(r => ({ ...r, [entry.id]: !r[entry.id] }))}>{reveal[entry.id] ? "Hide" : "Show"}</button>
                <button type="button" className="vault-mini" onClick={() => setEditing(entry)}>Edit</button>
                <button type="button" className="vault-mini danger" onClick={() => removeEntry(entry.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .vault-form { display: grid; gap: 14px; max-width: 420px; }
        .vault-error { color: var(--viz-pruned); font: 600 13px var(--font-ui); margin: 0; }
        .vault-note { margin-top: 14px; color: var(--ink-soft); font: 12px/1.5 var(--font-ui); }
        .vault-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .vault-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .vault-toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); background: var(--ink); color: var(--paper-raised); padding: 10px 16px; border-radius: 999px; font: 600 13px var(--font-ui); z-index: 60; box-shadow: var(--shadow-raised); }
        .vault-entry-form { display: grid; gap: 12px; max-width: 520px; padding: 18px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); margin-bottom: 16px; }
        .vault-pw-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .vault-pw-row input { flex: 1 1 160px; }
        .vault-pw-row input { flex: 1; }
        .vault-mini { min-height: 34px; padding: 0 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--paper); color: var(--ink-soft); font: 600 12px var(--font-ui); cursor: pointer; }
        .vault-mini.danger { color: var(--viz-pruned); }
        .vault-entry-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .vault-empty { color: var(--ink-soft); font: 14px var(--font-ui); }
        .vault-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .vault-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 4px); background: var(--paper-raised); }
        .vault-item-main { display: grid; gap: 2px; min-width: 0; }
        .vault-item-main strong { font: 700 15px var(--font-ui); }
        .vault-item-main span { color: var(--ink-soft); font: 12px var(--font-ui); }
        .vault-item-main code { font: 13px var(--font-mono); color: var(--accent); }
        .vault-item-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 480px) { .vault-item { flex-direction: column; align-items: stretch; } .vault-item-actions { justify-content: flex-start; } }
      `}</style>
    </main>
  )
}
