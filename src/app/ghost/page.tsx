"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ghostEngine,
  ghostWasReady,
  GHOST_MODELS,
  GHOST_LEGACY_URLS,
  getSelectedModel,
  setSelectedModel,
  type GhostModel,
} from "@/lib/ghost/engine"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT =
  "You are Ghost, a Socratic tutor inside the Deriva learning app for data structures, algorithms and system design. Never hand over the full solution or complete code. Respond with one guiding question, the invariant to notice, or a small nudge — then let the user derive the rest. Under 120 words. Warm, sharp, encouraging."

const SUGGESTIONS = [
  "Why does binary search need a sorted array?",
  "Nudge me: detect a cycle in a linked list",
  "When is a hash map the wrong choice?",
]

function GhostFace({ size = 96, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <span className={`ghost-face${thinking ? " ghost-thinking" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          className="ghost-body"
          d="M24 6c8.8 0 15 6.3 15 15v19l-5.2-4-4.9 4-4.9-4-4.9 4-4.9-4L9 40V21c0-8.7 6.2-15 15-15z"
        />
        <circle className="ghost-eye" cx="18.4" cy="22" r="2.5" />
        <circle className="ghost-eye" cx="29.6" cy="22" r="2.5" />
      </svg>
      {thinking && <span className="ghost-ring" />}
      {thinking && <span className="ghost-ring ghost-ring-2" />}
    </span>
  )
}

type StorageEntry = { url: string; sizeMb: number }

export default function GhostPage() {
  const [phase, setPhase] = useState<"probe" | "intro" | "downloading" | "loading" | "ready">("probe")
  const [model, setModel] = useState<GhostModel>(() => getSelectedModel())
  const [storage, setStorage] = useState<StorageEntry[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [action, setAction] = useState<string | null>(null)
  const [getProgress, setGetProgress] = useState<{ url: string; fraction: number; loadedMb: number; totalMb: number }>({ url: "", fraction: 0, loadedMb: 0, totalMb: 0 })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [tps, setTps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const busyRef = useRef(false)

  const sizeOf = useCallback((url: string) => storage.find(s => s.url === url)?.sizeMb ?? 0, [storage])
  const isCached = useCallback((url: string) => storage.some(s => s.url === url), [storage])
  const totalMb = storage.reduce((sum, s) => sum + s.sizeMb, 0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deriva-ghost-chat")
      if (raw) setMessages(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const found = await ghostEngine.scanStorage()
        if (!alive) return
        setStorage(found)
        const activeCached = found.some(s => s.url === getSelectedModel().url)
        setPhase(activeCached && ghostWasReady() ? "ready" : "intro")
      } catch {
        if (alive) setPhase("intro")
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  const persist = useCallback((next: ChatMessage[]) => {
    try { localStorage.setItem("deriva-ghost-chat", JSON.stringify(next.slice(-40))) } catch {}
  }, [])

  const refreshStorage = useCallback(async () => {
    setStorage(await ghostEngine.scanStorage().catch(() => []))
  }, [])

  const chooseModel = useCallback((next: GhostModel) => {
    if (action) return
    setModel(next)
    setSelectedModel(next.id)
    setError(null)
  }, [action])

  const downloadModel = useCallback(async (m: GhostModel, after: () => void) => {
    if (action) return
    setAction(`get:${m.id}`)
    setError(null)
    try {
      await ghostEngine.download(m, (_f, loaded, total) =>
        setGetProgress({ url: m.url, fraction: total > 0 ? loaded / total : 0, loadedMb: Math.round(loaded / 1048576), totalMb: Math.round(total / 1048576) }),
      )
      await refreshStorage()
      setSelectedModel(m.id)
      setModel(m)
      after()
    } catch (err) {
      setError(String((err as Error)?.message || err))
    } finally {
      setAction(null)
      setGetProgress({ url: "", fraction: 0, loadedMb: 0, totalMb: 0 })
    }
  }, [action, refreshStorage])

  const startSummon = useCallback(async () => {
    if (isCached(model.url)) {
      setPhase("loading")
      try {
        await ghostEngine.load(model)
        setPhase("ready")
      } catch (err) {
        const msg = String((err as Error)?.message || "")
        setError(msg.includes("MODEL_NOT_CACHED") ? "Brain not on device yet — download it first." : msg)
        setPhase("intro")
      }
      return
    }
    await downloadModel(model, async () => {
      setPhase("loading")
      try {
        await ghostEngine.load(model)
        setPhase("ready")
        setMessages(prev => {
          if (prev.length > 0) return prev
          return [{ role: "assistant", content: `I live here now — ${model.name}, on your device, no cloud involved. Ask anything; I nudge, you derive.` }]
        })
      } catch (err) {
        setError(String((err as Error)?.message || err))
        setPhase("intro")
      }
    })
  }, [model, isCached, downloadModel])

  const send = useCallback(async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setInput("")
    setError(null)

    const history = [...messages, { role: "user" as const, content: text }]
    setMessages(history)
    persist(history)

    let streamedText = ""
    try {
      await ghostEngine.load(model)
      const result = await ghostEngine.chat(
        model,
        [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-10)],
        300,
        piece => {
          streamedText += piece
          setMessages(prev => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === "assistant") last.content = streamedText
            else next.push({ role: "assistant", content: streamedText })
            return next
          })
        },
      )
      setTps(result.tps)
      setMessages(prev => {
        const next = prev.slice()
        const last = next[next.length - 1]
        if (last?.role === "assistant") {
          next[next.length - 1] = { role: "assistant", content: result.text || streamedText || "(silence)" }
        } else {
          next.push({ role: "assistant", content: result.text || streamedText || "(silence)" })
        }
        persist(next)
        return next
      })
    } catch (err) {
      const message = String((err as Error)?.message || err)
      setError(message.toLowerCase().includes("abort") ? null : message)
      if (!streamedText) {
        setMessages(prev => {
          const next = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant"))
          persist(next)
          return next
        })
      }
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [input, messages, persist, model])

  const stop = useCallback(async () => {
    await ghostEngine.stop().catch(() => {})
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    try { localStorage.removeItem("deriva-ghost-chat") } catch {}
  }, [])

  const deleteByUrl = useCallback(async (url: string) => {
    if (action) return
    setAction(`del:${url}`)
    const freed = sizeOf(url)
    await ghostEngine.delete(url)
    await refreshStorage()
    setAction(null)
    if (freed > 0) setError(null)
  }, [action, sizeOf, refreshStorage])

  const useModel = useCallback(async (m: GhostModel) => {
    if (action || m.id === model.id) return
    setAction(`use:${m.id}`)
    setError(null)
    try {
      await ghostEngine.swapModel(m)
      await ghostEngine.load(m)
      setModel(m)
    } catch (err) {
      setError(String((err as Error)?.message || err))
    } finally {
      setAction(null)
    }
  }, [action, model.id])

  const clearEverything = useCallback(async () => {
    if (action) return
    setAction("clear")
    await ghostEngine.clearAll()
    await refreshStorage()
    setTps(null)
    setSheetOpen(false)
    setPhase("intro")
    setAction(null)
  }, [action, refreshStorage])

  const legacyLeftovers = storage.filter(s => GHOST_LEGACY_URLS.includes(s.url))

  return (
    <div className="ghost-app">
      {phase === "probe" && <div className="ghost-center"><GhostFace size={72} /></div>}

      {phase === "intro" && (
        <div className="ghost-intro">
          <span className="ghost-kicker">GHOST · OFFLINE AI</span>
          <h1 className="ghost-hero-title">A tutor that lives in your phone.</h1>
          <p className="ghost-hero-sub">
            A real language model running inside this app — no cloud, no account, no network after setup.
            It answers with questions and nudges; the derivation stays yours.
          </p>
          <GhostFace size={84} />

          <p className="ghost-section-label">CHOOSE ITS BRAIN</p>
          <div className="ghost-picker">
            {GHOST_MODELS.map(m => {
              const cached = isCached(m.url)
              const selected = model.id === m.id
              return (
                <button key={m.id} type="button" className={`ghost-model${selected ? " active" : ""}`} onClick={() => chooseModel(m)}>
                  <span className="ghost-model-top">
                    <span className="ghost-model-name">{m.name}</span>
                    {cached && <span className="ghost-model-badge">ON DEVICE</span>}
                  </span>
                  <span className="ghost-model-meta">{m.sizeMb} MB · {cached ? `${sizeOf(m.url)} MB stored` : "one-time download"}</span>
                  <span className="ghost-model-blurb">{m.blurb}</span>
                </button>
              )
            })}
          </div>

          <button type="button" className="ghost-summon" onClick={startSummon} disabled={!!action}>
            {isCached(model.url) ? "WAKE GHOST" : `SUMMON · ${model.sizeMb} MB`}
          </button>

          {totalMb > 0 && (
            <button type="button" className="ghost-storage-link" onClick={() => setSheetOpen(true)}>
              {totalMb} MB stored on this device{legacyLeftovers.length > 0 ? ` · ${legacyLeftovers.reduce((s, l) => s + l.sizeMb, 0)} MB leftover` : ""} → manage
            </button>
          )}
          {error && <p className="ghost-error">{error}</p>}
        </div>
      )}

      {phase === "downloading" && (
        <div className="ghost-intro">
          <GhostFace size={88} thinking />
          <span className="ghost-kicker">MATERIALISING</span>
          <p className="ghost-hero-title">{model.name}</p>
          <div className="ghost-progress" role="progressbar" aria-valuenow={Math.round(getProgress.fraction * 100)}>
            <div className="ghost-progress-fill" style={{ width: `${Math.max(2, getProgress.fraction * 100)}%` }} />
          </div>
          <p className="ghost-tagline mono">
            {Math.round(getProgress.fraction * 100)}%{getProgress.totalMb > 0 ? ` · ${getProgress.loadedMb} / ${getProgress.totalMb} MB` : ""}
          </p>
          <p className="ghost-note">One-time download. After this, Ghost works in airplane mode.</p>
        </div>
      )}

      {phase === "loading" && (
        <div className="ghost-center"><GhostFace size={72} thinking /><p className="ghost-tagline">waking ghost…</p></div>
      )}

      {phase === "ready" && (
        <>
          {busy && (
            <div className="ghost-thinking-chip"><GhostFace size={18} thinking /> thinking…{tps != null && tps > 0 ? ` ${tps.toFixed(1)} tok/s` : ""}</div>
          )}
          <div className="ghost-messages">
            {messages.length === 0 && (
              <div className="ghost-empty">
                <p>Ping the void.</p>
                {SUGGESTIONS.map(s => (
                  <button key={s} type="button" className="ghost-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`ghost-msg ${m.role === "user" ? "from-user" : "from-ghost"}`}>
                {m.role === "assistant" && <GhostFace size={22} thinking={busy && i === messages.length - 1} />}
                <div className="ghost-msg-body">
                  <p>{m.content}{busy && i === messages.length - 1 && m.role === "assistant" && <span className="ghost-cursor" />}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <footer className="ghost-composer">
            {error && <p className="ghost-error">{error}</p>}
            <div className="ghost-microrow">
              <span className="ghost-micro-brain">{model.name}{isCached(model.url) ? "" : " · not downloaded"}</span>
              <button type="button" className="ghost-storage-link" onClick={() => setSheetOpen(true)}>
                {totalMb > 0 ? `${totalMb} MB stored` : "storage"} →
              </button>
            </div>
            <form onSubmit={event => { event.preventDefault(); void send() }} className="ghost-inputrow">
              <input
                className="ghost-input"
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="ask ghost…"
                disabled={busy}
              />
              {busy ? (
                <button type="button" className="ghost-send stop" onClick={stop} aria-label="Stop">■</button>
              ) : (
                <button type="submit" className="ghost-send" disabled={!input.trim()} aria-label="Send">↑</button>
              )}
            </form>
          </footer>
        </>
      )}

      {sheetOpen && (
        <div className="ghost-sheet-backdrop" onClick={() => !action && setSheetOpen(false)}>
          <div className="ghost-sheet" onClick={event => event.stopPropagation()}>
            <span className="ghost-sheet-handle" />
            <p className="ghost-sheet-title">BRAIN STORAGE</p>

            {GHOST_MODELS.map(m => {
              const cached = isCached(m.url)
              const resident = phase === "ready" && m.id === model.id
              const working = action?.endsWith(`:${m.id}`) || (action === `get:${m.id}` && getProgress.url === m.url)
              return (
                <div key={m.id} className={`ghost-brain-row${resident ? " active" : ""}`}>
                  <div className="ghost-brain-info">
                    <span className="ghost-brain-name">{m.name}{resident ? " · RESIDENT" : ""}</span>
                    <span className="ghost-brain-meta">{cached ? `${sizeOf(m.url)} MB on device` : `${m.sizeMb} MB · not downloaded`}</span>
                    {working && action === `get:${m.id}` && (
                      <span className="ghost-brain-bar"><span style={{ width: `${Math.max(3, getProgress.fraction * 100)}%` }} /></span>
                    )}
                  </div>
                  <div className="ghost-brain-actions">
                    {resident ? (
                      <span className="ghost-brain-state">in use</span>
                    ) : working ? (
                      <span className="ghost-brain-state">{action?.startsWith("get") ? `${Math.round(getProgress.fraction * 100)}%` : "…"}</span>
                    ) : cached ? (
                      <>
                        <button type="button" className="ghost-minibtn" disabled={!!action} onClick={() => useModel(m)}>USE</button>
                        <button type="button" className="ghost-minibtn danger" disabled={!!action} onClick={() => deleteByUrl(m.url)}>DELETE</button>
                      </>
                    ) : (
                      <button type="button" className="ghost-minibtn" disabled={!!action} onClick={() => downloadModel(m, () => {})}>GET</button>
                    )}
                  </div>
                </div>
              )
            })}

            {legacyLeftovers.map(l => {
              const name = l.url.includes("qwen") ? "Qwen 2.5 0.5B (leftover)" : "old model"
              return (
                <div key={l.url} className="ghost-brain-row legacy">
                  <div className="ghost-brain-info">
                    <span className="ghost-brain-name">{name}</span>
                    <span className="ghost-brain-meta">{l.sizeMb} MB on device · unused</span>
                  </div>
                  <div className="ghost-brain-actions">
                    <button type="button" className="ghost-minibtn danger" disabled={!!action} onClick={() => deleteByUrl(l.url)}>DELETE</button>
                  </div>
                </div>
              )
            })}

            <div className="ghost-brains-foot">
              <span>{totalMb > 0 ? `${totalMb} MB total` : "nothing stored"}</span>
              <button type="button" className="ghost-minibtn danger" disabled={!!action || totalMb === 0} onClick={clearEverything}>CLEAR EVERYTHING</button>
            </div>
            {error && <p className="ghost-error">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
