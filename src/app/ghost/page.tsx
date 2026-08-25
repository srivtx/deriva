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
  "You are Ghost, a tutor for data structures and algorithms. Reply with at most ONE short guiding question or ONE small hint — under 60 words, plain words only. Never give full solutions or code. If you are not sure about something, say you are not sure. Stay on the topic the user mentioned."

function everDownloaded(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem("deriva-ghost-ever") || "[]")) } catch { return new Set() }
}
function markEverDownloaded(id: string) {
  try {
    const set = everDownloaded()
    set.add(id)
    localStorage.setItem("deriva-ghost-ever", JSON.stringify([...set]))
  } catch {}
}

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
interface GhostSession { id: string; title: string; updatedAt: number; messages: ChatMessage[] }

const CHATS_KEY = "deriva-ghost-chats"
const ACTIVE_KEY = "deriva-ghost-active"

function loadSessions(): GhostSession[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]")
    return Array.isArray(raw) ? raw.slice(0, 20) : []
  } catch { return [] }
}
function saveSessions(list: GhostSession[]) {
  try { localStorage.setItem(CHATS_KEY, JSON.stringify(list.slice(0, 20))) } catch {}
}
function relTime(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

export default function GhostPage() {
  const [phase, setPhase] = useState<"probe" | "intro" | "downloading" | "loading" | "ready">("probe")
  const [model, setModel] = useState<GhostModel>(() => getSelectedModel())
  const [storage, setStorage] = useState<StorageEntry[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [action, setAction] = useState<string | null>(null)
  const [getProgress, setGetProgress] = useState<{ url: string; fraction: number; loadedMb: number; totalMb: number }>({ url: "", fraction: 0, loadedMb: 0, totalMb: 0 })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<GhostSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [tps, setTps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingGet, setPendingGet] = useState<GhostModel | null>(null)
  const [caps, setCaps] = useState<{ webgpu: boolean; storageQuotaMb: number | null } | null>(null)
  const busyRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [follow, setFollow] = useState(true)
  const stick = useRef(true)          // source of truth, no re-render churn
  const suppressing = useRef(false)   // ignore scroll events we caused

  const sizeOf = useCallback((url: string) => storage.find(s => s.url === url)?.sizeMb ?? 0, [storage])
  const isCached = useCallback((url: string) => storage.some(s => s.url === url), [storage])
  const totalMb = storage.reduce((sum, s) => sum + s.sizeMb, 0)

  useEffect(() => () => { if (busyRef.current) void ghostEngine.stop() }, [])

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden" && busyRef.current) void ghostEngine.stop() }
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [])

  useEffect(() => {
    const prev = document.title
    document.title = "Ghost · Deriva"
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    try {
      let list = loadSessions()
      // One-time migration from the pre-sessions storage shape.
      if (!localStorage.getItem("deriva-ghost-migrated-v2")) {
        const legacyRaw = localStorage.getItem("deriva-ghost-chat")
        if (legacyRaw) {
          const msgs = JSON.parse(legacyRaw)
          if (Array.isArray(msgs) && msgs.length > 0 && !list.some(s => s.title === (msgs[0]?.content || "").slice(0, 44))) {
            list = [{ id: `${Date.now()}`, title: (msgs[0]?.content || "conversation").slice(0, 44), updatedAt: Date.now(), messages: msgs.slice(-60) }, ...list]
            saveSessions(list)
          }
        }
        localStorage.setItem("deriva-ghost-migrated-v2", "1")
        localStorage.removeItem("deriva-ghost-chat")
      }
      setSessions(list)
      const active = localStorage.getItem(ACTIVE_KEY)
      if (active) {
        const found = list.find(s => s.id === active)
        if (found) { setActiveId(found.id); setMessages(found.messages) }
        else { localStorage.removeItem(ACTIVE_KEY) }
      }
    } catch {}
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [found, info] = await Promise.all([
          ghostEngine.scanStorage(),
          ghostEngine.probe().catch(() => null),
        ])
        if (!alive) return
        if (info) setCaps({ webgpu: info.webgpu, storageQuotaMb: info.storageQuotaMb })
        setStorage(found)
        const activeCached = found.some(s => s.url === getSelectedModel().url)
        setPhase(activeCached && ghostWasReady() ? "ready" : "intro")
      } catch {
        if (alive) setPhase("intro")
      }
    })()
    return () => { alive = false }
  }, [])

  // Pin instantly whenever content grows and we're stuck to bottom.
  // Instant (no smooth): animated chases cancel out under token streams.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stick.current) return
    suppressing.current = true
    el.scrollTop = el.scrollHeight
    requestAnimationFrame(() => { suppressing.current = false })
  }, [messages])

  const onMessagesScroll = useCallback(() => {
    if (suppressing.current) return
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    stick.current = atBottom
    setFollow(prev => prev !== atBottom ? atBottom : prev)
  }, [])

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    stick.current = true
    suppressing.current = true
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    requestAnimationFrame(() => { suppressing.current = false })
    setFollow(true)
  }, [])

  const persistSession = useCallback((next: ChatMessage[], firstUserText?: string) => {
    setSessions(prev => {
      let list = [...prev]
      if (activeId) {
        list = list.map(s => s.id === activeId ? { ...s, messages: next.slice(-60), updatedAt: Date.now() } : s)
      } else if (next.length > 0) {
        const id = `${Date.now()}`
        const title = (firstUserText || next[0]?.content || "conversation").slice(0, 44)
        list = [{ id, title, updatedAt: Date.now(), messages: next.slice(-60) }, ...list]
        setActiveId(id)
        try { localStorage.setItem(ACTIVE_KEY, id) } catch {}
      }
      saveSessions(list)
      return list
    })
  }, [activeId])

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
      markEverDownloaded(m.id)
      after()
    } catch (err) {
      setError(String((err as Error)?.message || err))
    } finally {
      setAction(null)
      setGetProgress({ url: "", fraction: 0, loadedMb: 0, totalMb: 0 })
    }
  }, [action, refreshStorage])

  const deleteByUrl = useCallback(async (url: string) => {
    if (action) return
    setAction(`del:${url}`)
    const result = await ghostEngine.delete(url)
    await refreshStorage()
    setAction(null)
    if (!result.verified) setError("Could not fully free that brain's storage — tap DELETE again.")
  }, [action, refreshStorage])

  const startGet = useCallback(async (m: GhostModel) => {
    if (action) return
    setPendingGet(m)
    setSheetOpen(false)
    setError(null)
    setPhase("downloading")
    try {
      await ghostEngine.download(m, (_f, loaded, total) =>
        setGetProgress({ url: m.url, fraction: total > 0 ? loaded / total : 0, loadedMb: Math.round(loaded / 1048576), totalMb: Math.round(total / 1048576) }),
      )
      await refreshStorage()
      setSelectedModel(m.id)
      setModel(m)
      markEverDownloaded(m.id)
      setPhase("loading")
      await ghostEngine.load(m)
      setPhase("ready")
      setMessages(prev => {
        if (prev.length > 0) return prev
        return [{ role: "assistant", content: `I live here now — ${m.name}, on your device, no cloud involved. Ask anything; I nudge, you derive.` }]
      })
    } catch (err) {
      setError(String((err as Error)?.message || err))
      setPhase("intro")
    } finally {
      setAction(null)
      setPendingGet(null)
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
        if (msg.includes("MODEL_CORRUPT")) {
          setError(null)
          await refreshStorage()
          await startGet(model)
          return
        }
        setError(msg.includes("MODEL_NOT_CACHED") ? "Brain not on device yet — download it first." : msg)
        setPhase("intro")
      }
      return
    }
    await startGet(model)
  }, [model, isCached, startGet, refreshStorage])

  const send = useCallback(async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    stick.current = true
    setFollow(true)
    setInput("")
    setError(null)

    const history = [...messages, { role: "user" as const, content: text }]
    setMessages(history)
    persistSession(history, text)

    let streamedText = ""
    let flushTimer: ReturnType<typeof setTimeout> | null = null
    const flushNow = () => {
      flushTimer = null
      setMessages(prev => {
        if (!streamedText) return prev
        const next = prev.slice()
        const last = next[next.length - 1]
        if (last?.role === "assistant") next[next.length - 1] = { role: "assistant", content: streamedText }
        else next.push({ role: "assistant", content: streamedText })
        return next
      })
    }
    try {
      await ghostEngine.load(model)
      const result = await ghostEngine.chat(
        model,
        [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-8)],
        220,
        piece => {
          streamedText += piece
          if (!flushTimer) flushTimer = setTimeout(flushNow, 90)
        },
      )
      if (flushTimer) { clearTimeout(flushTimer); flushNow() }
      setTps(result.tps)
      setMessages(prev => {
        const next = prev.slice()
        const last = next[next.length - 1]
        if (last?.role === "assistant") {
          next[next.length - 1] = { role: "assistant", content: result.text || streamedText || "(silence)" }
        } else {
          next.push({ role: "assistant", content: result.text || streamedText || "(silence)" })
        }
        persistSession(next)
        return next
      })
    } catch (err) {
      const message = String((err as Error)?.message || err)
      const raw = message.toLowerCase()
      if (message.includes("MODEL_CORRUPT") || /typed array|out of memory|invalid length/.test(raw)) {
        busyRef.current = false
        setBusy(false)
        setError(null)
        await deleteByUrl(model.url).catch(() => {})
        await refreshStorage()
        await startGet(model)
        return
      }
      if (/kv_cache|context/.test(raw)) setError("Ghost's memory filled — start a new chat to reset it.")
      else if (raw.includes("abort") || raw.includes("timed out")) setError(message)
      else setError(message)
      if (!streamedText) {
        setMessages(prev => {
          const next = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant"))
          persistSession(next)
          return next
        })
      }
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [input, messages, persistSession, model, deleteByUrl, startGet])

  const stop = useCallback(() => {
    ghostEngine.stop()
  }, [])

  const clearChat = useCallback(() => {
    setSessions(prev => {
      const list = prev.filter(s => s.id !== activeId)
      saveSessions(list)
      return list
    })
    setMessages([])
    setActiveId(null)
    setSheetOpen(false)
    try { localStorage.removeItem(ACTIVE_KEY) } catch {}
    try { localStorage.removeItem("deriva-ghost-chat") } catch {}
  }, [activeId])

  const upsertCurrentBeforeSwitch = useCallback((list: GhostSession[]): GhostSession[] => {
    if (!activeId || messages.length === 0) return list
    return list.map(s => s.id === activeId ? { ...s, messages: messages.slice(-60), updatedAt: Date.now() } : s)
  }, [activeId, messages])

  const newChat = useCallback(() => {
    if (busyRef.current) return
    setSessions(prev => { const l = upsertCurrentBeforeSwitch(prev); saveSessions(l); return l })
    setMessages([])
    setActiveId(null)
    stick.current = true
    setFollow(true)
    setHistoryOpen(false)
    try { localStorage.removeItem(ACTIVE_KEY) } catch {}
  }, [upsertCurrentBeforeSwitch])

  const openSession = useCallback((id: string) => {
    if (busyRef.current) return
    setSessions(prev => {
      const l = upsertCurrentBeforeSwitch(prev); saveSessions(l)
      const found = l.find(s => s.id === id)
      if (found) { setMessages(found.messages); setActiveId(found.id); try { localStorage.setItem(ACTIVE_KEY, id) } catch {} }
      stick.current = true
      setFollow(true)
      setHistoryOpen(false)
      return l
    })
  }, [upsertCurrentBeforeSwitch])

  const deleteSession = useCallback((id: string) => {
    if (busyRef.current) return
    setSessions(prev => {
      const l = prev.filter(s => s.id !== id); saveSessions(l)
      if (id === activeId) {
        setMessages([]); setActiveId(null)
        try { localStorage.removeItem(ACTIVE_KEY) } catch {}
        try { localStorage.removeItem("deriva-ghost-chat") } catch {}
      }
      return l
    })
  }, [activeId])

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
          <GhostFace size={88} />
          <span className="ghost-kicker">GHOST · OFFLINE AI</span>
          <h1 className="ghost-hero-title">A tutor that lives in your phone.</h1>
          <p className="ghost-hero-sub">
            A real language model running inside this app — no cloud, no account,
            no network after setup. It answers with questions and nudges; the derivation stays yours.
          </p>

          <p className="ghost-section-label">CHOOSE ITS BRAIN</p>
          <div className="ghost-picker" role="radiogroup" aria-label="Model">
            {GHOST_MODELS.map(m => {
              const cached = isCached(m.url)
              const selected = model.id === m.id
              return (
                <div
                  key={m.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  className={`ghost-model${selected ? " active" : ""}`}
                  onClick={() => chooseModel(m)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseModel(m) }
                  }}
                >
                  {cached && (
                    <button
                      type="button"
                      className="ghost-card-del"
                      title={`Delete ${m.name} cache`}
                      disabled={!!action}
                      onClick={event => { event.stopPropagation(); deleteByUrl(m.url) }}
                    >
                      ✕
                    </button>
                  )}
                  <span className="ghost-model-name">{m.name}</span>
                  <span className="ghost-model-meta">{m.sizeMb} MB · one-time download{cached ? ` · on device (${sizeOf(m.url)} MB)` : ""}</span>
                  <span className="ghost-model-blurb">{m.blurb}</span>
                </div>
              )
            })}
          </div>

          {caps?.storageQuotaMb != null && (
            <p className="ghost-spec-mini">{caps.webgpu ? "WASM · WebGPU ready" : "WASM engine"} · {caps.storageQuotaMb} MB free{totalMb > 0 ? ` · ${totalMb} MB in use` : ""}</p>
          )}

          <button type="button" className="ghost-summon" onClick={startSummon} disabled={!!action}>
            {isCached(model.url) ? `WAKE GHOST` : `SUMMON · ${model.sizeMb} MB`}
          </button>

          {totalMb > 0 && (
            <button type="button" className="ghost-storage-link" onClick={() => setSheetOpen(true)}>
              MANAGE STORED BRAINS ({totalMb} MB) →
            </button>
          )}
          {error && <p className="ghost-error">{error}</p>}
        </div>
      )}

      {phase === "downloading" && (
        <div className="ghost-intro">
          <GhostFace size={88} thinking />
          <span className="ghost-kicker">MATERIALISING</span>
          <p className="ghost-hero-title">{(pendingGet ?? model).name}</p>
          <p className="ghost-tagline mono">{(pendingGet ?? model).sizeMb} MB · one-time</p>
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
          <div className="ghost-chatbar">
              <span className="ghost-chatbar-title">{sessions.find(s => s.id === activeId)?.title ?? "new conversation"}</span>
              <span className="ghost-chatbar-actions">
                <button type="button" className="ghost-minibtn" disabled={busy} onClick={() => setHistoryOpen(true)}>HISTORY</button>
                <button type="button" className="ghost-minibtn accent" disabled={busy} onClick={newChat}>＋ NEW</button>
                <button type="button" className="ghost-gear-inline" aria-label="Ghost settings" onClick={() => setSheetOpen(true)}>⚙</button>
              </span>
            </div>
          <div className="ghost-messages" ref={scrollRef} onScroll={onMessagesScroll}>
            {busy && (
              <div className="ghost-thinking-chip"><GhostFace size={18} thinking /> thinking…{tps != null && tps > 0 ? ` ${tps.toFixed(1)} tok/s` : ""}</div>
            )}
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
                {m.role === "assistant" && <GhostFace size={22} />}
                <div className="ghost-msg-body">
                  <p>{m.content}{busy && i === messages.length - 1 && m.role === "assistant" && <span className="ghost-cursor" />}</p>
                </div>
              </div>
            ))}
          </div>

          {!follow && (
            <button type="button" className="ghost-jump" onClick={jumpToLatest}>↓ latest</button>
          )}
          <footer className="ghost-composer">
            {error && <p className="ghost-error">{error}</p>}
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
            <p className="ghost-sheet-title">GHOST SETTINGS</p>

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
                      <button type="button" className="ghost-minibtn" disabled={!!action} onClick={() => startGet(m)}>{everDownloaded().has(m.id) ? "RESTORE" : "GET"}</button>
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
              <span className="ghost-sheet-foot-actions">
                <button type="button" className="ghost-minibtn" disabled={!!action || busy || messages.length === 0} onClick={clearChat}>CLEAR CHAT</button>
                <button type="button" className="ghost-minibtn danger" disabled={!!action || totalMb === 0} onClick={clearEverything}>CLEAR EVERYTHING</button>
              </span>
            </div>
            {error && <p className="ghost-error">{error}</p>}
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="ghost-sheet-backdrop" onClick={() => setHistoryOpen(false)}>
          <div className="ghost-sheet" onClick={event => event.stopPropagation()}>
            <span className="ghost-sheet-handle" />
            <p className="ghost-sheet-title">CONVERSATIONS</p>
            {sessions.length === 0 && <p className="ghost-note">No past conversations yet.</p>}
            {sessions.map(s => (
              <div key={s.id} className={`ghost-brain-row${s.id === activeId ? " active" : ""}`}>
                <button type="button" className="ghost-hist-open" disabled={busy} onClick={() => { if (!busy) openSession(s.id) }}>
                  <span className="ghost-brain-name">{s.title}</span>
                  <span className="ghost-brain-meta">{relTime(s.updatedAt)} · {s.messages.length} messages</span>
                </button>
                <button type="button" className="ghost-minibtn danger" disabled={busy} onClick={() => { if (!busy) deleteSession(s.id) }}>✕</button>
              </div>
            ))}
            <div className="ghost-brains-foot">
              <span>{sessions.length} saved</span>
              <button type="button" className="ghost-minibtn accent" disabled={!!action || busy} onClick={newChat}>＋ START NEW</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
