"use client"

import { useEffect, useRef, useState } from "react"

const LANGS: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
  nl: "Dutch", ru: "Russian", ja: "Japanese", zh: "Chinese", ko: "Korean", ar: "Arabic",
  hi: "Hindi", tr: "Turkish", pl: "Polish", vi: "Vietnamese", th: "Thai", id: "Indonesian",
}

interface HistoryItem { id: string; from: string; to: string; src: string; dst: string }

export default function TranslatePage() {
  const [src, setSrc] = useState("")
  const [dst, setDst] = useState("")
  const [from, setFrom] = useState("en")
  const [to, setTo] = useState("es")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const cache = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("deriva-translate-v1") || "[]")) } catch {}
  }, [])

  const translate = async () => {
    setError("")
    const text = src.trim()
    if (!text) return
    const key = `${from}|${to}|${text}`
    if (cache.current.has(key)) { setDst(cache.current.get(key)!); return }
    setBusy(true)
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`)
      const j = await r.json()
      const out = j?.responseData?.translatedText as string | undefined
      if (!out) { setError("Translation failed. Try again."); return }
      setDst(out)
      cache.current.set(key, out)
      const next: HistoryItem[] = [{ id: `${Date.now()}`, from, to, src: text, dst: out }, ...history].slice(0, 12)
      setHistory(next)
      try { localStorage.setItem("deriva-translate-v1", JSON.stringify(next)) } catch {}
    } catch { setError("Couldn't reach the translation service.") } finally { setBusy(false) }
  }

  const swap = () => { setFrom(to); setTo(from); setSrc(dst); setDst(src) }

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setError("Copied") } catch {} }

  return (
    <main className="super-page translate-page">
      <span className="super-kicker">TRANSLATOR</span>
      <h1 className="translate-title">Translate anything</h1>

      <div className="translate-langs">
        <select value={from} onChange={e => setFrom(e.target.value)} aria-label="From language">
          {Object.entries(LANGS).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
        <button type="button" className="translate-swap" onClick={swap} aria-label="Swap languages">⇄</button>
        <select value={to} onChange={e => setTo(e.target.value)} aria-label="To language">
          {Object.entries(LANGS).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </div>

      <label className="super-field"><span>Source</span>
        <textarea value={src} onChange={e => setSrc(e.target.value)} rows={4} placeholder="Type or paste text…" />
      </label>
      <button type="button" className="super-primary translate-go" onClick={translate} disabled={busy}>{busy ? "Translating…" : "Translate"}</button>
      {error && <p className="translate-error">{error}</p>}

      {dst && (
        <div className="translate-out">
          <div className="translate-out-head">
            <span className="super-kicker">TRANSLATION</span>
            <button type="button" className="translate-copy" onClick={() => copy(dst)}>Copy</button>
          </div>
          <p>{dst}</p>
        </div>
      )}

      {history.length > 0 && (
        <section className="translate-history">
          <span className="super-kicker">RECENT</span>
          <ul>
            {history.map(h => (
              <li key={h.id} onClick={() => { setFrom(h.from); setTo(h.to); setSrc(h.src); setDst(h.dst) }}>
                <span className="translate-hist-langs">{LANGS[h.from]} → {LANGS[h.to]}</span>
                <span className="translate-hist-src">{h.src}</span>
                <span className="translate-hist-dst">{h.dst}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <style>{`
        .translate-title { margin: 6px 0 14px; font: 700 clamp(24px, 5vw, 36px)/1.02 var(--font-narrative); letter-spacing: -.03em; }
        .translate-langs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; margin-bottom: 14px; }
        .translate-langs select { min-height: 46px; padding: 0 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: 14px var(--font-ui); }
        .translate-swap { width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--accent); font-size: 18px; cursor: pointer; }
        .translate-go { margin-top: 12px; }
        .translate-error { color: var(--viz-pruned); font: 600 13px var(--font-ui); }
        .translate-out { margin-top: 16px; padding: 16px; border: 1px solid var(--accent); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); }
        .translate-out-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .translate-copy { min-height: 34px; padding: 0 14px; border: 1px solid var(--line); border-radius: 9px; background: var(--paper); color: var(--ink-soft); font: 600 12px var(--font-ui); cursor: pointer; }
        .translate-out p { margin: 0; font: 16px/1.6 var(--font-ui); }
        .translate-history { margin-top: 18px; }
        .translate-history ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
        .translate-history li { display: grid; gap: 2px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--paper-raised); cursor: pointer; }
        .translate-hist-langs { color: var(--accent); font: 700 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; }
        .translate-hist-src { color: var(--ink-soft); font: 13px var(--font-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .translate-hist-dst { font: 14px var(--font-ui); }
      `}</style>
    </main>
  )
}
