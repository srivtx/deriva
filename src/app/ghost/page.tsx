"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  ghostEngine,
  ghostWasReady,
  GHOST_MODELS,
  GHOST_LEGACY_URLS,
  GHOST_MAX_TOKENS,
  getSelectedModel,
  setSelectedModel,
  backendPref,
  setBackendPref,
  type GhostModel,
  type DownloadProgress,
  type ChatResult,
  type ChatOpts,
} from "@/lib/ghost/engine"
import { planHistory, estimateTokens } from "@/lib/ghost/text"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SYS_SOCRATIC = "You are Ghost, a DSA tutor. Reply with one short hint or question, under 50 words. Use plain text; code only in fenced blocks."
const SYS_ANSWER = "Answer the user directly in a few short sentences. Use plain text; code only in fenced blocks."
// Deterministic mode: the FIRST verb of the latest user message decides.
// Starts with answer/solve/compute/calculate/evaluate -> direct answer.
// Everything else -> Socratic hint. No mid-sentence keyword flakiness.
const ANSWER_COMMAND =
  /^\s*(?:please\s+|ghost[,:\s]+)?(?:now\s+)?(answer|solve|compute|calculate|evaluate)\b/i

function systemFor(history: { role: string; content: string }[]): string {
  const lastUser = [...history].reverse().find(m => m.role === "user")
  return lastUser && ANSWER_COMMAND.test(lastUser.content) ? SYS_ANSWER : SYS_SOCRATIC
}

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

function haptic(ms = 10) {
  try { navigator.vibrate?.(ms) } catch {}
}

const SUGGESTIONS = [
  "Why does binary search need a sorted array?",
  "Nudge me: detect a cycle in a linked list",
  "When is a hash map the wrong choice?",
]

/** history window budget in tokens — system + history + one reply (+ one
 *  continuation segment) must fit the 2048-token context with headroom */
const HISTORY_TOKEN_BUDGET = 1024
/** manual Continue clicks per answer — bounded so a looping model cannot
 *  trap the session in an endless reply */
const MAX_MANUAL_CONTINUES = 3

/* ── Markdown-lite renderer (no deps, no innerHTML) ─────────────────────
   Bold, italic, inline code, fenced code blocks, bullet / numbered lists,
   headings. Enough for a tutor's replies — everything else stays plain. */

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith("**")) nodes.push(<strong key={`${keyBase}-b${i}`}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith("`")) nodes.push(<code key={`${keyBase}-c${i}`} className="ghost-md-code">{tok.slice(1, -1)}</code>)
    else nodes.push(<em key={`${keyBase}-i${i}`}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/* Stream reveal (v16): while a reply streams, words are wrapped in spans
   keyed by char offset. Append-only streaming keeps offsets stable, so a
   revealed word never re-animates — only appended words materialize. */
function renderRevealWords(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\S+\s*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const tok = m[0]
    const word = tok.trimEnd()
    const trail = tok.slice(word.length)
    if (word) nodes.push(<span key={`${keyBase}w${m.index}`} className="ghost-w">{word}</span>)
    if (trail) nodes.push(trail)
  }
  return nodes
}

function renderInlineReveal(text: string, keyBase: string, caret: boolean): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(...renderRevealWords(text.slice(last, m.index), `${keyBase}o${last}-`))
    const tok = m[0]
    if (tok.startsWith("**")) nodes.push(<strong key={`${keyBase}-b${m.index}`} className="ghost-w">{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith("`")) nodes.push(<code key={`${keyBase}-c${m.index}`} className="ghost-md-code ghost-w">{tok.slice(1, -1)}</code>)
    else nodes.push(<em key={`${keyBase}-i${m.index}`} className="ghost-w">{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(...renderRevealWords(text.slice(last), `${keyBase}o${last}-`))
  if (caret) nodes.push(<span key={`${keyBase}-caret`} className="ghost-cursor" aria-hidden="true" />)
  return nodes
}

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      haptic(6)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }, [text])
  return (
    <button type="button" className={className ?? "ghost-copy"} onClick={copy} aria-label="Copy">
      {copied ? (
        <span className="ghost-copy-ok">
          <svg viewBox="0 0 20 20" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
          copied
        </span>
      ) : "copy"}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  const preRef = useRef<HTMLPreElement | null>(null)
  // v19: overflow affordance — a right-edge fade while the code scrolls,
  // lifted once the reader reaches the end. Static screenshots (and VLM
  // reviews) read overflowing code as "clipped"; the fade says "more
  // this way" without a scrollbar that mobile never renders.
  useEffect(() => {
    const pre = preRef.current
    if (!pre) return
    const sync = () => {
      const over = pre.scrollWidth - pre.clientWidth > 2
      const atEnd = pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 2
      pre.parentElement?.classList.toggle("scrolls-x", over && !atEnd)
    }
    sync()
    pre.addEventListener("scroll", sync, { passive: true })
    const ro = new ResizeObserver(sync)
    ro.observe(pre)
    return () => { pre.removeEventListener("scroll", sync); ro.disconnect() }
  }, [code])
  return (
    <div className="ghost-codeblock">
      <div className="ghost-codeblock-bar">
        <span>code</span>
        <CopyBtn text={code} className="ghost-code-copy" />
      </div>
      <pre ref={preRef}><code>{code}</code></pre>
    </div>
  )
}

function Markdown({ text, reveal = false, caret = false }: { text: string; reveal?: boolean; caret?: boolean }) {
  const blocks: ReactNode[] = []
  const parts = text.split(/```/)
  // the last prose part carries the stream reveal; the caret rides the last
  // paragraph, but only while the stream is NOT inside an open code fence
  const lastProsePart = parts.length - 1 - (parts.length % 2 === 0 ? 1 : 0)
  const caretHere = caret && parts.length % 2 === 1

  parts.forEach((part, pi) => {
    // odd indexes are fenced code
    if (pi % 2 === 1) {
      let code = part
      if (code.startsWith("\n")) code = code.slice(1)
      // strip a language hint line like `python\n` right after the fence
      const nl = code.indexOf("\n")
      const firstLine = nl >= 0 ? code.slice(0, nl).trim() : code.trim()
      if (firstLine && /^[a-z+#]{1,12}$/i.test(firstLine) && firstLine.length <= 10) {
        code = code.slice(nl + 1)
      }
      if (code.endsWith("\n")) code = code.slice(0, -1)
      blocks.push(<CodeBlock key={`cb${pi}`} code={code} />)
      return
    }
    // prose: paragraphs, lists, headings
    const lines = part.split("\n")
    let lastLineIdx = -1
    lines.forEach((l, li) => { if (l.trim()) lastLineIdx = li })
    let list: { ordered: boolean; items: string[] } | null = null
    const flushList = (key: string) => {
      if (!list) return
      const L = list
      blocks.push(
        L.ordered ? (
          <ol key={key} className="ghost-md-ol">{L.items.map((it, ii) => <li key={ii}>{renderInline(it, `${key}-${ii}`)}</li>)}</ol>
        ) : (
          <ul key={key} className="ghost-md-ul">{L.items.map((it, ii) => <li key={ii}>{renderInline(it, `${key}-${ii}`)}</li>)}</ul>
        ),
      )
      list = null
    }
    lines.forEach((raw, li) => {
      const line = raw.trimEnd()
      const key = `p${pi}-l${li}`
      const bullet = /^[-*•]\s+(.*)$/.exec(line)
      const numbered = /^(\d{1,3})[.)]\s+(.*)$/.exec(line)
      if (bullet) {
        if (!list || list.ordered) { flushList(`${key}-pre`); list = { ordered: false, items: [] } }
        list.items.push(bullet[1])
        return
      }
      if (numbered) {
        if (!list || !list.ordered) { flushList(`${key}-pre`); list = { ordered: true, items: [] } }
        list.items.push(numbered[2])
        return
      }
      flushList(`${key}-flush`)
      if (!line.trim()) return
      const heading = /^(#{1,4})\s+(.*)$/.exec(line)
      if (heading) {
        blocks.push(<p key={key} className="ghost-md-h">{renderInline(heading[2], key)}</p>)
        return
      }
      if (reveal && pi === lastProsePart) {
        blocks.push(<p key={key} className="ghost-md-p">{renderInlineReveal(line, key, caretHere && li === lastLineIdx)}</p>)
        return
      }
      blocks.push(<p key={key} className="ghost-md-p">{renderInline(line, key)}</p>)
    })
    flushList(`p${pi}-end`)
  })

  return <div className={reveal ? "ghost-md streaming" : "ghost-md"}>{blocks}</div>
}

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

/* ── Sheet (v16): spring entry, animated exit, drag-to-dismiss ──
   Exit mirrors entry (accelerated). The head area is the drag zone:
   pull down past 110 px or flick (>0.55 px/ms) to dismiss, else it
   springs back. Escape closes; focus returns to the invoker. */
function Sheet({
  title,
  closing,
  onClosed,
  onRequestClose,
  children,
}: {
  title: string
  closing: boolean
  onClosed: () => void
  onRequestClose: () => void
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const invokerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    invokerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => invokerRef.current?.focus?.()
  }, [])

  useEffect(() => {
    if (closing) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onRequestClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [closing, onRequestClose])

  const onHeadPointerDown = useCallback((e: React.PointerEvent) => {
    if (closing) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    const sheet = sheetRef.current
    if (!sheet) return
    const startY = e.clientY
    let y = startY
    let lastT = performance.now()
    let vy = 0
    let dy = 0
    try { sheet.setPointerCapture(e.pointerId) } catch {}
    sheet.classList.add("dragging")
    const move = (ev: PointerEvent) => {
      dy = Math.max(0, ev.clientY - startY)
      const now = performance.now()
      if (now > lastT) vy = (ev.clientY - y) / (now - lastT)
      y = ev.clientY
      lastT = now
      sheet.style.transform = `translateY(${dy}px)`
    }
    const finish = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", finish)
      window.removeEventListener("pointercancel", finish)
      sheet.classList.remove("dragging")
      if (dy > 110 || vy > 0.55) {
        sheet.style.transform = ""
        onRequestClose()
        return
      }
      sheet.classList.add("settle")
      sheet.style.transform = ""
      window.setTimeout(() => sheet.classList.remove("settle"), 360)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
  }, [closing, onRequestClose])

  return (
    <div className={`ghost-sheet-backdrop${closing ? " closing" : ""}`} onClick={() => !closing && onRequestClose()}>
      <div
        className={`ghost-sheet${closing ? " closing" : ""}`}
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
        onAnimationEnd={event => { if (closing && event.animationName === "ghost-sheet-out") onClosed() }}
      >
        <div className="ghost-sheet-head" onPointerDown={onHeadPointerDown}>
          <span className="ghost-sheet-handle" />
          <p className="ghost-sheet-title">{title}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

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
  const [sheetClosing, setSheetClosing] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyClosing, setHistoryClosing] = useState(false)
  const [action, setAction] = useState<string | null>(null)
  const [dl, setDl] = useState<DownloadProgress>({ phase: "connect", fraction: 0, loadedMb: 0, totalMb: 0, speedMbps: 0, etaSec: null })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<GhostSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [tps, setTps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingGet, setPendingGet] = useState<GhostModel | null>(null)
  const [caps, setCaps] = useState<{ webgpu: boolean; storageQuotaMb: number | null } | null>(null)
  const [diag, setDiag] = useState<{ backend: string; threads: number; flashAttn: boolean; kvQuant: boolean } | null>(null)
  const [pref, setPref] = useState<"cpu" | "gpu">("cpu")
  const [busyElapsed, setBusyElapsed] = useState(0)
  const [liveTps, setLiveTps] = useState<number | null>(null)
  const [gpuFetch, setGpuFetch] = useState(false)
  // v18 tutor-loop state
  /** index of the user message being edited (null = normal compose) */
  const [editing, setEditing] = useState<number | null>(null)
  /** consecutive regenerations of the current reply → temperature ladder */
  const [regenCount, setRegenCount] = useState(0)
  /** manual Continue clicks used for the current reply */
  const [contCount, setContCount] = useState(0)
  /** the last reply ended cap-dead even after auto-continue → offer Continue */
  const [capped, setCapped] = useState(false)
  /** share button morphed to a check (copied to clipboard) */
  const [sharedOk, setSharedOk] = useState(false)
  const busyRef = useRef(false)
  // active-session id mirror: persistence reads this so it never sees a
  // stale closure — the root cause of duplicated history rows (v16 fix)
  const activeIdRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const [follow, setFollow] = useState(true)
  const stick = useRef(true)          // source of truth, no re-render churn
  const suppressing = useRef(false)   // ignore scroll events we caused
  // Enter sends on pointer-fine (desktop); newline on touch keyboards
  const enterSends = useRef(true)

  const sizeOf = useCallback((url: string) => storage.find(s => s.url === url)?.sizeMb ?? 0, [storage])
  const isCached = useCallback((url: string) => storage.some(s => s.url === url), [storage])
  const totalMb = storage.reduce((sum, s) => sum + s.sizeMb, 0)

  useEffect(() => {
    const fine = typeof window !== "undefined" ? window.matchMedia?.("(pointer: fine)")?.matches : undefined
    enterSends.current = fine ?? true
  }, [])

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
    setPref(backendPref())
  }, [])

  // Field-debug handle (v18): the engine singleton + model picker on
  // window, so a field report can be triaged from the console —
  // __ghost.engine.diagnostics(), __ghost.getSelectedModel(), and the
  // countTokens probe used by the E2E suite.
  useEffect(() => {
    const w = window as unknown as { __ghost?: unknown }
    w.__ghost = { engine: ghostEngine, getSelectedModel }
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
        if (found) { setActiveId(found.id); activeIdRef.current = found.id; setMessages(found.messages) }
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

  // auto-grow composer
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 132)}px`
  }, [input])

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

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const persistSession = useCallback((next: ChatMessage[], firstUserText?: string) => {
    const currentId = activeIdRef.current
    if (currentId) {
      setSessions(prev => {
        const list = prev.map(s => s.id === currentId ? { ...s, messages: next.slice(-60), updatedAt: Date.now() } : s)
        saveSessions(list)
        return list
      })
      return
    }
    if (next.length === 0) return
    // id generated OUTSIDE the updater; insert is guarded, so double
    // invocation (StrictMode or the completion path) is idempotent
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const title = (firstUserText || next[0]?.content || "conversation").slice(0, 44)
    activeIdRef.current = id
    try { localStorage.setItem(ACTIVE_KEY, id) } catch {}
    setSessions(prev => {
      if (prev.some(s => s.id === id)) return prev
      const list = [{ id, title, updatedAt: Date.now(), messages: next.slice(-60) }, ...prev]
      saveSessions(list)
      return list
    })
    setActiveId(id)
  }, [])

  const refreshStorage = useCallback(async () => {
    setStorage(await ghostEngine.scanStorage().catch(() => []))
  }, [])

  // download-progress hook for LOAD-time turbo fetches: when the GPU
  // weights are not cached, building the pipeline downloads them, and
  // that must render (boot screen / in-chat strip) — never a silent stall.
  const loadDl = useCallback((p: DownloadProgress) => {
    setGpuFetch(p.phase !== "done")
    setDl(p)
  }, [])

  const chooseModel = useCallback((next: GhostModel) => {
    if (action) return
    haptic(4)
    setModel(next)
    setSelectedModel(next.id)
    setError(null)
  }, [action])

  const cancelDownload = useCallback(() => {
    haptic(10)
    ghostEngine.cancelDownload()
  }, [])

  const deleteByUrl = useCallback(async (url: string) => {
    if (action) return
    setAction(`del:${url}`)
    const result = await ghostEngine.delete(url)
    await refreshStorage()
    setAction(null)
    if (!result.verified) {
      setError("Could not fully free that brain's storage — tap DELETE again.")
      return
    }
    // Deleting the active brain ends the session — back to the intro screen.
    if (url === getSelectedModel().url && phase !== "intro") {
      setPhase("intro")
      setMessages([])
      persistSession([])
    }
  }, [action, refreshStorage, phase])

  const openSheet = useCallback(() => { haptic(6); setSheetClosing(false); setSheetOpen(true) }, [])
  const closeSheet = useCallback(() => { if (!action) setSheetClosing(true) }, [action])
  const openHistory = useCallback(() => { haptic(6); setHistoryClosing(false); setHistoryOpen(true) }, [])
  const closeHistory = useCallback(() => setHistoryClosing(true), [])

  const startGet = useCallback(async (m: GhostModel) => {
    if (action) return
    setPendingGet(m)
    setSheetOpen(false)
    setSheetClosing(false)
    setError(null)
    setDl({ phase: "connect", fraction: 0, loadedMb: 0, totalMb: 0, speedMbps: 0, etaSec: null })
    setPhase("downloading")
    try {
      await ghostEngine.download(m, setDl)
      await refreshStorage()
      setSelectedModel(m.id)
      setModel(m)
      markEverDownloaded(m.id)
      setPhase("loading")
      await ghostEngine.load(m, undefined, loadDl)
      setGpuFetch(false)
      setPhase("ready")
      void ghostEngine.diagnostics().then(d => { if (d) setDiag({ backend: d.backend, threads: d.threads, flashAttn: d.flashAttn, kvQuant: d.kvQuant }) }).catch(() => {})
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
      setGpuFetch(false)
      setDl({ phase: "connect", fraction: 0, loadedMb: 0, totalMb: 0, speedMbps: 0, etaSec: null })
    }
  }, [action, refreshStorage, loadDl])

  const startSummon = useCallback(async () => {
    if (isCached(model.url)) {
      setPhase("loading")
      try {
        await ghostEngine.load(model, undefined, loadDl)
        setGpuFetch(false)
        setPhase("ready")
        void ghostEngine.diagnostics().then(d => { if (d) setDiag({ backend: d.backend, threads: d.threads, flashAttn: d.flashAttn, kvQuant: d.kvQuant }) }).catch(() => {})
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
      } finally {
        setGpuFetch(false)
      }
      return
    }
    await startGet(model)
  }, [model, isCached, startGet, refreshStorage, loadDl])

  // live progress while the ghost thinks: elapsed seconds until the first
  // token lands, then a live tok/s readout (pieces ≈ tokens)
  const busyStartRef = useRef(0)
  const livePieceCount = useRef(0)
  const lastTpsEmit = useRef(0)
  useEffect(() => {
    if (!busy) return
    const id = setInterval(() => {
      if (busyStartRef.current) setBusyElapsed((performance.now() - busyStartRef.current) / 1000)
    }, 200)
    return () => clearInterval(id)
  }, [busy])

  /* ── v18 tutor loop: ONE streaming harness for every turn runner ────────
     send / regenerate / continueMore all stream into the LAST assistant
     message. makeStream() owns the 90ms flush cadence and the live tok/s
     chip; `base` seeds it with text that is already on screen (manual
     continuation) so new deltas append instead of restarting. */
  const makeStream = (base = "") => {
    let streamedText = base
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
    const push = (piece: string) => {
      streamedText += piece
      livePieceCount.current += 1
      const now = performance.now()
      if (now - lastTpsEmit.current > 250) {
        lastTpsEmit.current = now
        const secs = Math.max((now - busyStartRef.current) / 1000, 0.001)
        setLiveTps(livePieceCount.current / secs)
      }
      if (!flushTimer) flushTimer = setTimeout(flushNow, 90)
    }
    const reset = () => {
      streamedText = ""
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
      flushNow()
    }
    const settle = (finalText: string) => {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
      const content = finalText || streamedText || "(silence)"
      setMessages(prev => {
        const next = prev.slice()
        const last = next[next.length - 1]
        if (last?.role === "assistant") next[next.length - 1] = { role: "assistant", content }
        else next.push({ role: "assistant", content })
        persistSession(next)
        return next
      })
    }
    return { push, reset, settle, text: () => streamedText }
  }

  /* Token-aware context windowing (v18) replaces the blind slice(-8): the
     budget covers history only, the system prompt always rides along, and
     dropped turns are disclosed to the model so it knows context is missing.
     Exact counts when a tokenizer is loaded; ~3.6 chars/token otherwise. */
  const buildEngineMessages = async (history: ChatMessage[], extra?: string) => {
    const counts = await Promise.all(history.map(async m => {
      const n = await ghostEngine.countTokens(model, m.content)
      return n > 0 ? n : estimateTokens(m.content)
    }))
    const plan = planHistory(history, counts, HISTORY_TOKEN_BUDGET)
    return [
      { role: "system", content: systemFor(history) + (extra ? " " + extra : "") + plan.note },
      ...plan.keep,
    ]
  }

  const runTurn = useCallback(async (
    history: ChatMessage[],
    kind: "send" | "regen" | "continue",
    chatOpts?: ChatOpts,
  ) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    busyStartRef.current = performance.now()
    livePieceCount.current = 0
    lastTpsEmit.current = 0
    setBusyElapsed(0)
    setLiveTps(null)
    stick.current = true
    setFollow(true)
    setError(null)
    haptic(8)
    const lastMsg = messages[messages.length - 1]
    const stream = makeStream(kind === "continue" && lastMsg?.role === "assistant" ? lastMsg.content : "")

    try {
      await ghostEngine.load(model, undefined, loadDl)
      let result: ChatResult
      if (kind === "continue") {
        result = await ghostEngine.continueChat(model, stream.push)
      } else {
        result = await ghostEngine.chat(model, await buildEngineMessages(history), GHOST_MAX_TOKENS, stream.push, chatOpts)

        // Echo guard (fresh sends only): tiny models sometimes regurgitate
        // their previous reply verbatim. Detect substantial duplication and
        // retry once with a nudge.
        const words = (s: string) =>
          s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2)
        const prevAssistant = [...history].reverse().find(m => m.role === "assistant")
        if (prevAssistant && result.text.trim()) {
          const a = new Set(words(prevAssistant.content))
          const b = words(result.text)
          const overlap = b.length ? b.filter(w => a.has(w)).length / Math.max(b.length, 1) : 0
          if (overlap > 0.7 || result.text.trim() === prevAssistant.content.trim()) {
            stream.reset()
            const retry = await ghostEngine.chat(model, await buildEngineMessages(history, "Reply with new information the previous reply missed."), GHOST_MAX_TOKENS, stream.push, chatOpts)
            result = retry
          }
        }
      }

      // Cap-death: seamlessly continue once with the (warm) engine — the
      // user just sees the answer keep going. If the model STILL bursts,
      // surface an honest Continue affordance instead of looping forever.
      if (result.finishReason === "length" && result.text.trim() && kind !== "continue") {
        const cont = await ghostEngine.continueChat(model, stream.push)
        if (cont.text.trim()) result = cont
      }
      stream.settle(result.text)
      setTps(result.tps)
      setCapped(result.finishReason === "length")
    } catch (err) {
      const message = String((err as Error)?.message || err)
      const rawMsg = message.toLowerCase()
      if (message.includes("MODEL_CORRUPT")) {
        busyRef.current = false
        setBusy(false)
        setError(null)
        await refreshStorage()
        await startGet(model)
        return
      }
      if (/typed array|out of memory|invalid length/.test(rawMsg)) {
        // Memory pressure: the runtime died, the FILE is fine (it passed the
        // integrity gate). Recycle the runtime, reload from the cached blob
        // and retry the generation ONCE — no re-download.
        try {
          await ghostEngine.eject()
          await ghostEngine.load(model, undefined, loadDl)
          const retry = await ghostEngine.chat(model, await buildEngineMessages(history), GHOST_MAX_TOKENS, stream.push, chatOpts)
          stream.settle(retry.text)
          setTps(retry.tps)
          setCapped(retry.finishReason === "length")
          return
        } catch (retryErr) {
          setError("The brain ran out of memory — try a shorter question or the smaller brain.")
          console.warn("[ghost] OOM retry failed:", retryErr)
        }
      } else if (/kv_cache|context/.test(rawMsg)) {
        setError("Ghost's memory filled — start a new chat to reset it.")
      } else if (rawMsg.includes("abort") || rawMsg.includes("timed out")) {
        setError(message)
      } else {
        setError(message)
      }
      if (!stream.text()) {
        setMessages(prev => {
          const next = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant"))
          persistSession(next)
          return next
        })
      }
    } finally {
      busyRef.current = false
      setBusy(false)
      busyStartRef.current = 0
      setLiveTps(null)
      setGpuFetch(false)
    }
  }, [messages, model, persistSession, refreshStorage, startGet, loadDl])

  const send = useCallback(async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || busyRef.current) return
    haptic(8)
    setInput("")
    setRegenCount(0)
    setContCount(0)
    setCapped(false)
    if (editing != null) {
      // editing an earlier question: truncate from that message and re-run
      // the turn from the corrected text — no wasted answers, no dead turns
      const idx = Math.max(0, Math.min(editing, messages.length - 1))
      const history = [...messages.slice(0, idx), { role: "user" as const, content: text }]
      setEditing(null)
      setMessages(history)
      persistSession(history)
      await runTurn(history, "send")
      return
    }
    const history = [...messages, { role: "user" as const, content: text }]
    setMessages(history)
    persistSession(history, text)
    await runTurn(history, "send")
  }, [input, messages, editing, persistSession, runTurn])

  /** Re-roll the last reply. The sampler varies on two levers — temperature
   *  climbs +0.2 per attempt and repetition-penalty tightens — because
   *  wllama re-seeds its sampler chain from the fixed context seed on every
   *  call: same prompt + same sampling can replay the identical reply
   *  verbatim (confirmed by probe). The ladder makes that vanishingly
   *  unlikely while keeping the early re-rolls close to the model's
   *  intended profile. */
  const regenerate = useCallback(async () => {
    if (busyRef.current || messages.length === 0) return
    if (messages[messages.length - 1]?.role !== "assistant") return
    const hist = messages.slice(0, -1)
    const attempt = regenCount + 1
    setRegenCount(c => c + 1)
    setContCount(0)
    setCapped(false)
    setMessages(hist)
    persistSession(hist)
    await runTurn(hist, "regen", {
      temperature: model.temp + Math.min(0.2 * attempt, 0.45),
      penaltyRepeat: 1.15 + Math.min(0.08 * attempt, 0.3),
      useCache: false,
    })
  }, [messages, regenCount, model, persistSession, runTurn])

  /** Manual Continue: one more segment onto the capped reply. */
  const continueMore = useCallback(async () => {
    if (busyRef.current || contCount >= MAX_MANUAL_CONTINUES) return
    if (messages[messages.length - 1]?.role !== "assistant") return
    setContCount(c => c + 1)
    setCapped(false)
    await runTurn(messages, "continue")
  }, [contCount, messages, runTurn])

  /** Load the LAST user question into the composer for editing. */
  const editLast = useCallback(() => {
    if (busyRef.current) return
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        setEditing(i)
        setInput(messages[i].content)
        haptic(6)
        taRef.current?.focus()
        return
      }
    }
  }, [messages])

  const cancelEdit = useCallback(() => {
    setEditing(null)
    setInput("")
    taRef.current?.focus()
  }, [])

  /** Share the chat as markdown: Web Share API when present, clipboard +
   *  honest feedback otherwise. A dismissed share sheet is not an error. */
  const shareChat = useCallback(async () => {
    if (messages.length === 0) return
    haptic(6)
    const title = sessions.find(s => s.id === activeIdRef.current)?.title ?? "Ghost chat"
    const md = [`# Ghost · ${title}`, ""]
      .concat(messages.map(m => `${m.role === "user" ? "**You:**" : "**Ghost:**"} ${m.content}`))
      .join("\n\n")
    if (navigator.share) {
      try {
        await navigator.share({ title, text: md })
        return
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return // user dismissed
      }
    }
    try {
      await navigator.clipboard.writeText(md)
      setSharedOk(true)
      setTimeout(() => setSharedOk(false), 1600)
    } catch {
      setError("Sharing unavailable — the clipboard was refused.")
    }
  }, [messages, sessions])

  const stop = useCallback(() => {
    haptic(12)
    ghostEngine.stop()
  }, [])

  const clearChat = useCallback(() => {
    setSessions(prev => {
      const list = prev.filter(s => s.id !== activeIdRef.current)
      saveSessions(list)
      return list
    })
    setMessages([])
    setActiveId(null)
    activeIdRef.current = null
    setEditing(null)
    setRegenCount(0)
    setContCount(0)
    setCapped(false)
    setSheetOpen(false)
    setSheetClosing(false)
    try { localStorage.removeItem(ACTIVE_KEY) } catch {}
    try { localStorage.removeItem("deriva-ghost-chat") } catch {}
  }, [])

  const upsertCurrentBeforeSwitch = useCallback((list: GhostSession[]): GhostSession[] => {
    const id = activeIdRef.current
    if (!id || messages.length === 0) return list
    return list.map(s => s.id === id ? { ...s, messages: messages.slice(-60), updatedAt: Date.now() } : s)
  }, [messages])

  const newChat = useCallback(() => {
    if (busyRef.current) return
    setSessions(prev => { const l = upsertCurrentBeforeSwitch(prev); saveSessions(l); return l })
    setMessages([])
    setActiveId(null)
    activeIdRef.current = null
    setEditing(null)
    setRegenCount(0)
    setContCount(0)
    setCapped(false)
    stick.current = true
    setFollow(true)
    setHistoryOpen(false)
    setHistoryClosing(false)
    try { localStorage.removeItem(ACTIVE_KEY) } catch {}
  }, [upsertCurrentBeforeSwitch])

  const openSession = useCallback((id: string) => {
    if (busyRef.current) return
    const found = sessions.find(s => s.id === id)
    if (!found) return
    setSessions(prev => { const l = upsertCurrentBeforeSwitch(prev); saveSessions(l); return l })
    setMessages(found.messages)
    setActiveId(id)
    activeIdRef.current = id
    setEditing(null)
    setRegenCount(0)
    setContCount(0)
    setCapped(false)
    try { localStorage.setItem(ACTIVE_KEY, id) } catch {}
    stick.current = true
    setFollow(true)
    setHistoryOpen(false)
    setHistoryClosing(false)
  }, [upsertCurrentBeforeSwitch, sessions])

  const deleteSession = useCallback((id: string) => {
    if (busyRef.current) return
    setSessions(prev => {
      const l = prev.filter(s => s.id !== id); saveSessions(l)
      return l
    })
    if (id === activeIdRef.current) {
      setMessages([])
      setActiveId(null)
      activeIdRef.current = null
      try { localStorage.removeItem(ACTIVE_KEY) } catch {}
      try { localStorage.removeItem("deriva-ghost-chat") } catch {}
    }
  }, [])

  const useModel = useCallback(async (m: GhostModel) => {
    if (action || m.id === model.id) return
    setAction(`use:${m.id}`)
    setError(null)
    try {
      await ghostEngine.swapModel(m)
      await ghostEngine.load(m, undefined, loadDl)
      setModel(m)
    } catch (err) {
      setError(String((err as Error)?.message || err))
    } finally {
      setAction(null)
      setGpuFetch(false)
    }
  }, [action, model.id, loadDl])

  const clearEverything = useCallback(async () => {
    if (action) return
    setAction("clear")
    await ghostEngine.clearAll()
    await refreshStorage()
    setTps(null)
    setSheetOpen(false)
    setSheetClosing(false)
    setPhase("intro")
    setAction(null)
  }, [action, refreshStorage])

  const chooseBackend = useCallback((p: "cpu" | "gpu") => {
    setBackendPref(p)
    setPref(p)
    setSheetOpen(false)
    setSheetClosing(false)
    // backend swaps need a clean runtime — reload is the honest reset
    window.location.reload()
  }, [])

  const legacyLeftovers = storage.filter(s => GHOST_LEGACY_URLS.includes(s.url))
  const backendLabel = diag
    ? diag.backend === "webgpu" ? "TURBO · GPU" : `CPU · ${diag.threads}t`
    : pref === "gpu" ? "TURBO · GPU" : "CPU"

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
            <button type="button" className="ghost-storage-link" onClick={openSheet}>
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
          <p className="ghost-tagline mono">
            {dl.phase === "fetch" && dl.totalMb > 0 ? Math.round(dl.totalMb) : (pendingGet ?? model).sizeMb} MB · one-time
            {dl.cancellable === false ? " · GPU weights" : ""}
          </p>
          <div
            className={`ghost-progress${dl.phase === "connect" || dl.phase === "verify" || dl.phase === "store" ? " indet" : ""}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(dl.fraction * 100)}
            aria-valuetext={`${Math.round(dl.loadedMb)} of ${Math.round(dl.totalMb)} MB`}
          >
            <div className="ghost-progress-fill" style={{ width: `${dl.fraction * 100}%` }} />
          </div>
          <p className="ghost-dl-meta mono">
            {dl.phase === "connect" ? (dl.loadedMb > 0.05 ? `fetching engine parts · ${Math.round(dl.loadedMb)} MB` : "finding a clean copy…")
              : dl.phase === "verify" ? "verifying…"
              : dl.phase === "store" ? "filing into storage…"
              : dl.phase === "done" ? "done"
              : `${Math.round(dl.fraction * 100)}% · ${Math.round(dl.loadedMb)} / ${dl.totalMb > 0 ? Math.round(dl.totalMb) : "?"} MB`}
          </p>
          <p className="ghost-dl-sub mono">
            {dl.resumedMb ? `resumed from ${Math.round(dl.resumedMb)} MB · ` : ""}
            {dl.speedMbps > 0.05 ? `${dl.speedMbps.toFixed(1)} MB/s` : ""}
            {dl.etaSec != null && dl.etaSec > 0 ? ` · ~${dl.etaSec}s left` : ""}
            {dl.files ? ` · ${dl.files} files` : ""}
          </p>
          {(dl.phase === "connect" || dl.phase === "fetch") && dl.cancellable !== false && (
            <button type="button" className="ghost-cancel" onClick={cancelDownload}>
              <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
              CANCEL
            </button>
          )}
          {(dl.phase === "connect" || dl.phase === "fetch") && dl.cancellable === false && (
            <p className="ghost-note">GPU copy streams through the engine — keep this tab open.</p>
          )}
          <p className="ghost-note">One-time download. After this, Ghost works in airplane mode.</p>
        </div>
      )}

      {phase === "loading" && (
        <div className="ghost-center">
          <GhostFace size={72} thinking />
          <p className="ghost-tagline">{gpuFetch ? "fetching the GPU copy…" : "waking ghost…"}</p>
          {gpuFetch && (
            <>
              <div
                className={`ghost-progress${dl.phase === "connect" ? " indet" : ""}`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(dl.fraction * 100)}
                aria-valuetext={`${Math.round(dl.loadedMb)} of ${Math.round(dl.totalMb)} MB`}
              >
                <div className="ghost-progress-fill" style={{ width: `${dl.fraction * 100}%` }} />
              </div>
              <p className="ghost-dl-meta mono">
                {dl.phase === "connect"
                  ? dl.loadedMb > 0.05 ? `engine parts · ${Math.round(dl.loadedMb)} MB` : "connecting…"
                  : dl.phase === "verify" ? "compiling GPU engine…"
                  : `${Math.round(dl.fraction * 100)}% · ${Math.round(dl.loadedMb)} / ${dl.totalMb > 0 ? Math.round(dl.totalMb) : "?"} MB`}
              </p>
              <p className="ghost-dl-sub mono">
                {dl.speedMbps > 0.05 ? `${dl.speedMbps.toFixed(1)} MB/s` : ""}
                {dl.etaSec != null && dl.etaSec > 0 ? ` · ~${dl.etaSec}s left` : ""}
                {dl.files ? ` · ${dl.files} files` : ""}
              </p>
            </>
          )}
        </div>
      )}

      {phase === "ready" && (
        <>
          <div className="ghost-chatbar">
            <div className="ghost-chatbar-id">
              <GhostFace size={26} />
              <div className="ghost-chatbar-titles">
                <span className="ghost-chatbar-title">Ghost</span>
                <span className="ghost-chatbar-sub">
                  {model.name}{diag ? ` · ${backendLabel}${diag.backend === "cpu" && diag.kvQuant ? " · kv q8" : ""}` : ""}{!busy && tps != null && tps > 0 ? ` · ${tps.toFixed(0)} t/s` : ""}
                </span>
              </div>
            </div>
            <span className="ghost-chatbar-actions">
              <button type="button" className="ghost-iconbtn" aria-label="Share chat" title="Share" disabled={messages.length === 0} onClick={shareChat}>
                {sharedOk ? (
                  <svg className="ghost-pop" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4.5 4.5L16 6" /></svg>
                ) : (
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="15.5" cy="4.5" r="2.2" /><circle cx="4.5" cy="10" r="2.2" /><circle cx="15.5" cy="15.5" r="2.2" /><path d="M6.5 9l7-3.7M6.5 11l7 3.7" /></svg>
                )}
              </button>
              <button type="button" className="ghost-iconbtn" aria-label="History" disabled={busy} onClick={openHistory}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 4a6 6 0 1 0 6 6H10V4z"/><path d="M10 4a6 6 0 0 1 6 6"/><path d="M10 10l4-4"/></svg>
              </button>
              <button type="button" className="ghost-iconbtn" aria-label="New chat" disabled={busy} onClick={newChat}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>
              </button>
              <button type="button" className="ghost-iconbtn" aria-label="Ghost settings" title="Settings" onClick={openSheet}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="10" cy="10" r="5.2" />
                  <circle cx="10" cy="10" r="1.8" />
                  <path d="M10 1.4v3.4M10 15.2v3.4M1.4 10h3.4M15.2 10h3.4M3.95 3.95l2.4 2.4M13.65 13.65l2.4 2.4M16.05 3.95l-2.4 2.4M6.35 13.65l-2.4 2.4" />
                </svg>
              </button>
            </span>
          </div>
          <div className="ghost-messages" ref={scrollRef} onScroll={onMessagesScroll}>
            {messages.length === 0 && !busy && (
              <div className="ghost-empty">
                <GhostFace size={54} />
                <p className="ghost-empty-hi">Ask ghost anything.</p>
                <p className="ghost-empty-sub">Hints and nudges first — real answers on demand. Runs offline.</p>
                {SUGGESTIONS.map(s => (
                  <button key={s} type="button" className="ghost-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            {(() => {
              let lastUserIdx = -1
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === "user") { lastUserIdx = i; break }
              }
              return messages.map((m, i) => {
              const streaming = busy && i === messages.length - 1 && m.role === "assistant"
              const isLastUser = m.role === "user" && i === lastUserIdx
              const isLastReply = m.role === "assistant" && i === messages.length - 1
              return m.role === "user" ? (
                <div key={i} className="ghost-msg from-user">
                  <div className="ghost-msg-body"><p>{m.content}</p></div>
                  {!busy && isLastUser && (
                    <button type="button" className="ghost-msg-edit" aria-label="Edit question" title="Edit question" onClick={editLast}>
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 3.5l3 3L7 16l-4 1 1-4z" /><path d="M12 5l3 3" /></svg>
                    </button>
                  )}
                </div>
              ) : (
                <div key={i} className="ghost-msg from-ghost">
                  <div className="ghost-msg-body">
                    <Markdown text={m.content} reveal={streaming} caret={streaming} />
                    {streaming && liveTps != null && liveTps > 0 && (
                      <span className="ghost-stream-tps">{liveTps.toFixed(1)} tok/s</span>
                    )}
                  </div>
                  <span className="ghost-msg-actions">
                    {!busy && m.content.length > 24 && (
                      <CopyBtn text={m.content} />
                    )}
                    {!busy && isLastReply && (
                      <button type="button" className="ghost-msg-edit" aria-label="Regenerate reply" title="Try again — a different take" onClick={regenerate}>
                        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 10a6 6 0 1 1-1.76-4.24" /><path d="M16 2.6v3.4h-3.4" /></svg>
                      </button>
                    )}
                  </span>
                  {capped && !busy && isLastReply && contCount < MAX_MANUAL_CONTINUES && (
                    <button type="button" className="ghost-continue-chip" onClick={continueMore}>
                      <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4v11M5 10l5 5 5-5" /></svg>
                      continue
                    </button>
                  )}
                </div>
              )
              })
            })()}
            {busy && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="ghost-thinking-chip" aria-live="polite">
                <span className="ghost-dots"><i /><i /><i /></span>
                thinking
                {busyElapsed >= 0.4 ? (
                  <span className="ghost-tps">{busyElapsed.toFixed(1)}s · first reply warms the engine</span>
                ) : null}
              </div>
            )}
            {!follow && (
              <div className="ghost-jump-wrap">
                <button type="button" className="ghost-jump" onClick={jumpToLatest}>
                  <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4v11M5 10l5 5 5-5"/></svg> latest
                </button>
              </div>
            )}
          </div>
          {gpuFetch && (
            <div className="ghost-gpu-fetch" role="status" aria-label="Fetching GPU model copy">
              <div className="ghost-gpu-fetch-bar">
                <span className={dl.phase === "connect" ? "indet" : ""} style={{ width: `${Math.max(dl.phase === "fetch" ? 2 : 0, dl.fraction * 100)}%` }} />
              </div>
              <span className="mono">
                {dl.phase === "connect"
                  ? `GPU copy · ${Math.round(dl.loadedMb)} MB${dl.files ? ` · ${dl.files} files` : ""}`
                  : dl.phase === "verify"
                    ? "compiling GPU engine…"
                    : `GPU copy · ${Math.round(dl.fraction * 100)}%${dl.etaSec != null && dl.etaSec > 0 ? ` · ~${dl.etaSec}s` : ""}`}
              </span>
            </div>
          )}

          <footer className="ghost-composer">
            {error && <p className="ghost-error">{error}</p>}
            {editing != null && (
              <div className="ghost-editing" role="status">
                <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13.5 3.5l3 3L7 16l-4 1 1-4z" /><path d="M12 5l3 3" /></svg>
                <span>editing your question — send re-runs from there</span>
                <button type="button" aria-label="Cancel edit" onClick={cancelEdit}>
                  <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
                </button>
              </div>
            )}
            <form onSubmit={event => { event.preventDefault(); void send() }} className="ghost-inputrow">
              <textarea
                ref={taRef}
                className="ghost-input"
                rows={1}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Escape" && editing != null) {
                    event.preventDefault()
                    cancelEdit()
                  }
                  if (event.key === "Enter" && !event.shiftKey && enterSends.current) {
                    event.preventDefault()
                    void send()
                  }
                }}
                placeholder={editing != null ? "edit your question…" : "ask ghost…"}
                disabled={busy}
              />
              <button
                type="submit"
                className={`ghost-send${busy ? " stop" : ""}`}
                data-mode={busy ? "stop" : "send"}
                disabled={!busy && !input.trim()}
                aria-label={busy ? "Stop" : "Send"}
                onClick={event => { if (busy) { event.preventDefault(); stop() } }}
              >
                <span className="ghost-send-ico ico-send" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M10 16V4M5 9l5-5 5 5"/></svg>
                </span>
                <span className="ghost-send-ico ico-stop" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor"><rect x="4" y="4" width="12" height="12" rx="2.5"/></svg>
                </span>
              </button>
            </form>
          </footer>
        </>
      )}

      {sheetOpen && (
        <Sheet
          title="GHOST SETTINGS"
          closing={sheetClosing}
          onRequestClose={closeSheet}
          onClosed={() => { setSheetOpen(false); setSheetClosing(false) }}
        >
            <div className="ghost-backend-row">
              <div className="ghost-brain-info">
                <span className="ghost-brain-name">Engine</span>
                <span className="ghost-brain-meta">
                  {caps?.webgpu
                    ? pref === "gpu" ? "turbo · downloads its own GPU copy · experimental" : "cpu · default · fastest everywhere"
                    : "cpu · this device has no WebGPU"}
                </span>
              </div>
              <div className="ghost-backend-choices" role="radiogroup" aria-label="Backend">
                {(["cpu", "gpu"] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={pref === p}
                    className={`ghost-backend-btn${pref === p ? " active" : ""}`}
                    disabled={p === "gpu" && !caps?.webgpu}
                    onClick={() => chooseBackend(p)}
                  >
                    {p === "cpu" ? "CPU" : "TURBO"}
                  </button>
                ))}
              </div>
            </div>

            {GHOST_MODELS.map(m => {
              const cached = isCached(m.url)
              const resident = phase === "ready" && m.id === model.id
              const working = action?.endsWith(`:${m.id}`)
              return (
                <div key={m.id} className={`ghost-brain-row${resident ? " active" : ""}`}>
                  <div className="ghost-brain-info">
                    <span className="ghost-brain-name">{m.name}{resident ? " · RESIDENT" : ""}</span>
                    <span className="ghost-brain-meta">{cached ? `${sizeOf(m.url)} MB on device` : `${m.sizeMb} MB · not downloaded`}</span>
                    {working && action === `get:${m.id}` && phase === "downloading" && (
                      <span className="ghost-brain-bar"><span style={{ width: `${Math.max(3, dl.fraction * 100)}%` }} /></span>
                    )}
                  </div>
                  <div className="ghost-brain-actions">
                    {resident ? (
                      <span className="ghost-brain-state">in use</span>
                    ) : working ? (
                      <span className="ghost-brain-state">{action?.startsWith("get") ? `${Math.round(dl.fraction * 100)}%` : "…"}</span>
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
              const name = l.url.includes("qwen2.5")
                ? "Qwen 2.5 0.5B (leftover)"
                : l.url.includes("SmolLM2")
                  ? "SmolLM 2 (leftover)"
                  : "old model"
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
        </Sheet>
      )}

      {historyOpen && (
        <Sheet
          title="CONVERSATIONS"
          closing={historyClosing}
          onRequestClose={closeHistory}
          onClosed={() => { setHistoryOpen(false); setHistoryClosing(false) }}
        >
            {sessions.length === 0 && <p className="ghost-note">No past conversations yet.</p>}
            {sessions.map(s => (
              <div key={s.id} className={`ghost-brain-row${s.id === activeId ? " active" : ""}`}>
                <button type="button" className="ghost-hist-open" disabled={busy} onClick={() => { if (!busy) openSession(s.id) }}>
                  <span className="ghost-brain-name">{s.title}</span>
                  <span className="ghost-brain-meta">{relTime(s.updatedAt)} · {s.messages.length} messages</span>
                </button>
                <button type="button" className="ghost-minibtn danger" disabled={busy} aria-label="Delete conversation" onClick={() => { if (!busy) deleteSession(s.id) }}>✕</button>
              </div>
            ))}
            <div className="ghost-brains-foot">
              <span>{sessions.length} saved</span>
              <button type="button" className="ghost-minibtn accent" disabled={!!action || busy} onClick={newChat}>＋ START NEW</button>
            </div>
        </Sheet>
      )}
    </div>
  )
}
