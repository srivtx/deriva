"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ghostEngine,
  ghostWasReady,
  GHOST_MODELS,
  getSelectedModel,
  setSelectedModel,
  type GhostCapabilities,
  type GhostModel,
} from "@/lib/ghost/engine"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const HINT_SYSTEM =
  "You are Ghost, a Socratic tutor inside the Deriva learning app. You help with data structures, algorithms and system design. NEVER give away the full solution or complete code. Instead: ask one guiding question, point at the invariant, or give a tiny nudge — then let the user derive it. Keep replies under 120 words. Be warm, sharp, and encouraging."
const DIRECT_SYSTEM =
  "You are Ghost, an offline assistant inside the Deriva learning app for data structures, algorithms and system design. Answer directly but concisely — under 150 words. Prefer concrete examples over abstract prose."

const SUGGESTIONS = [
  "Why does binary search need a sorted array?",
  "Give me a hint: detect a cycle in a linked list",
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

export default function GhostPage() {
  const [phase, setPhase] = useState<"probe" | "intro" | "downloading" | "loading" | "ready">("probe")
  const [caps, setCaps] = useState<GhostCapabilities | null>(null)
  const [cachedId, setCachedId] = useState<string | null>(null)
  const [model, setModel] = useState<GhostModel>(() => getSelectedModel())
  const [progress, setProgress] = useState({ fraction: 0, loaded: 0, total: 0 })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [hintMode, setHintMode] = useState(true)
  const [tps, setTps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const busyRef = useRef(false)

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
        const info = await ghostEngine.probe()
        const cached = await ghostEngine.cachedModelId()
        if (!alive) return
        setCaps(info)
        setCachedId(cached)
        setPhase(cached && ghostWasReady() ? "ready" : "intro")
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

  const chooseModel = useCallback((next: GhostModel) => {
    setModel(next)
    setSelectedModel(next.id)
    setError(null)
  }, [])

  const startDownload = useCallback(async () => {
    setError(null)
    setPhase("downloading")
    setProgress({ fraction: 0, loaded: 0, total: 0 })
    try {
      await ghostEngine.download(model, (fraction, loaded, total) =>
        setProgress({ fraction, loaded, total }),
      )
      setCachedId(model.id)
      setPhase("loading")
      await ghostEngine.load(model)
      setPhase("ready")
      setMessages(prev => {
        if (prev.length > 0) return prev
        return [{ role: "assistant", content: `I live here now — ${model.name} on your device, no cloud involved. Ask me anything about your algorithms; I nudge, you derive.` }]
      })
    } catch (err) {
      setError(String((err as Error)?.message || err))
      setPhase("intro")
    }
  }, [model])

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
      const systemPrompt = hintMode ? HINT_SYSTEM : DIRECT_SYSTEM
      const result = await ghostEngine.chat(
        model,
        [{ role: "system", content: systemPrompt }, ...history.slice(-10)],
        hintMode ? 300 : 380,
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
  }, [input, messages, hintMode, persist, model])

  const stop = useCallback(async () => {
    await ghostEngine.stop().catch(() => {})
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    try { localStorage.removeItem("deriva-ghost-chat") } catch {}
  }, [])

  const eject = useCallback(async () => {
    await ghostEngine.eject()
    setCachedId(null)
    setCaps(null)
    setTps(null)
    setPhase("intro")
  }, [])

  const mbTotal = progress.total > 0 ? Math.round(progress.total) : null

  return (
    <div className="ghost-app">
      {phase === "probe" && (
        <div className="ghost-center"><GhostFace size={72} /></div>
      )}

      {phase === "intro" && (
        <div className="ghost-intro">
          <GhostFace size={104} />
          <h1 className="ghost-wordmark">GHOST</h1>
          <p className="ghost-tagline">The tutor that lives in your phone.</p>

          <div className="ghost-picker">
            {GHOST_MODELS.map(m => (
              <button
                key={m.id}
                type="button"
                className={`ghost-model${model.id === m.id ? " active" : ""}`}
                onClick={() => chooseModel(m)}
              >
                <span className="ghost-model-name">{m.name}</span>
                <span className="ghost-model-meta">{m.label}</span>
                <span className="ghost-model-blurb">
                  {m.blurb}{cachedId === m.id ? " · CACHED ✓" : ""}
                </span>
              </button>
            ))}
          </div>

          <div className="ghost-spec">
            <div className="ghost-spec-row"><span>BRAIN</span><strong>{model.name} · {model.sizeMb} MB</strong></div>
            <div className="ghost-spec-row"><span>STATUS</span><strong>{cachedId === model.id ? "downloaded — no network needed" : "not downloaded yet"}</strong></div>
            <div className="ghost-spec-row"><span>NETWORK</span><strong>offline after setup</strong></div>
            <div className="ghost-spec-row"><span>PRIVACY</span><strong>nothing leaves this device</strong></div>
            <div className="ghost-spec-row"><span>ENGINE</span><strong>{caps?.webgpu ? "WASM · WebGPU ready" : "WASM"}</strong></div>
            {caps?.storageQuotaMb != null && (
              <div className="ghost-spec-row"><span>FREE SPACE</span><strong>{caps.storageQuotaMb} MB</strong></div>
            )}
          </div>
          <p className="ghost-note">
            {cachedId === model.id
              ? "Already materialised. Nothing will download."
              : "Nothing downloads until you say so. Eject anytime from the chat."}
          </p>
          <button type="button" className="ghost-summon" onClick={startDownload}>
            {cachedId === model.id ? "WAKE GHOST" : "SUMMON GHOST"}
          </button>
          {error && <p className="ghost-error">{error}</p>}
        </div>
      )}

      {phase === "downloading" && (
        <div className="ghost-intro">
          <GhostFace size={88} thinking />
          <h1 className="ghost-wordmark">MATERIALISING</h1>
          <p className="ghost-tagline mono">{model.name}</p>
          <div className="ghost-progress" role="progressbar" aria-valuenow={Math.round(progress.fraction * 100)}>
            <div className="ghost-progress-fill" style={{ width: `${Math.max(2, progress.fraction * 100)}%` }} />
          </div>
          <p className="ghost-tagline mono">
            {Math.round(progress.fraction * 100)}%{mbTotal != null ? ` · ${Math.round(progress.loaded)} / ${mbTotal} MB` : ""}
          </p>
          <p className="ghost-note">One-time download. After this, Ghost works in airplane mode.</p>
        </div>
      )}

      {phase === "loading" && (
        <div className="ghost-center"><GhostFace size={72} thinking /><p className="ghost-tagline">waking ghost…</p></div>
      )}

      {phase === "ready" && (
        <div className="ghost-chat">
          <header className="ghost-statusbar">
            <GhostFace size={30} thinking={busy} />
            <span className={`ghost-led${busy ? " on" : ""}`} />
            <span className="ghost-status-text">{busy ? "thinking" : "present"}</span>
            <span className="ghost-gauge">{tps != null ? `${tps.toFixed(1)} tok/s · ${model.name}` : `${model.name} · resident`}</span>
            <button type="button" className="ghost-minibtn" onClick={eject}>EJECT</button>
          </header>

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
                <span className="ghost-msg-tag">{m.role === "user" ? "YOU" : "GHOST"}</span>
                <p>{m.content}{busy && i === messages.length - 1 && m.role === "assistant" && <span className="ghost-cursor" />}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <footer className="ghost-composer">
            <div className="ghost-modes">
              <button type="button" className={`ghost-mode${hintMode ? " active" : ""}`} onClick={() => setHintMode(true)}>HINTS ONLY</button>
              <button type="button" className={`ghost-mode${!hintMode ? " active" : ""}`} onClick={() => setHintMode(false)}>DIRECT</button>
              <button type="button" className="ghost-minibtn" onClick={clearChat}>CLEAR</button>
            </div>
            {error && <p className="ghost-error">{error}</p>}
            <form
              onSubmit={event => { event.preventDefault(); void send() }}
              className="ghost-inputrow"
            >
              <input
                className="ghost-input"
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="ask ghost…"
                disabled={busy}
              />
              {busy ? (
                <button type="button" className="ghost-send stop" onClick={stop}>■</button>
              ) : (
                <button type="submit" className="ghost-send" disabled={!input.trim()}>PING</button>
              )}
            </form>
          </footer>
        </div>
      )}
    </div>
  )
}
