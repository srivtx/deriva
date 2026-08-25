"use client"

// Ghost engine — drives the vendored wllama 2.4.0 core DIRECTLY on the page.
// No custom wrapper worker: wllama spawns its own internal sandboxed worker
// for WASM inference, so our old wrapper was a pure boot-failure liability.
// Library loads browser-natively from /ghost/vendor/wllama (same-origin,
// precached by the SW) — fully offline once installed.

export interface GhostModel {
  id: string
  label: string
  name: string
  url: string
  sizeMb: number
  blurb: string
}

export const GHOST_MODELS: GhostModel[] = [
  {
    id: "smollm2-135m",
    label: "NANO · 101 MB",
    name: "SmolLM2 135M",
    url: "https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf",
    sizeMb: 101,
    blurb: "default · fast on any phone",
  },
  {
    id: "smollm2-360m",
    label: "LITE · 258 MB",
    name: "SmolLM2 360M",
    url: "https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf",
    sizeMb: 258,
    blurb: "deeper reasoning · still quick",
  },
]

export const GHOST_LEGACY_URLS = [
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
]

export const DEFAULT_MODEL_ID = "smollm2-135m"

export function getSelectedModel(): GhostModel {
  try {
    const id = localStorage.getItem("deriva-ghost-model")
    return GHOST_MODELS.find(m => m.id === id) ?? GHOST_MODELS.find(m => m.id === DEFAULT_MODEL_ID)!
  } catch {
    return GHOST_MODELS.find(m => m.id === DEFAULT_MODEL_ID)!
  }
}

export function setSelectedModel(id: string) {
  try { localStorage.setItem("deriva-ghost-model", id) } catch {}
}

/* ---------- minimal typings over the vendored module ---------- */

interface WllamaInstance {
  loadModel(blobs: Blob[], config?: Record<string, unknown>): Promise<void>
  getEOS(): number
  lookupToken(piece: string): Promise<number>
  createCompletion(
    prompt: string,
    options: {
      nPredict?: number
      sampling?: { temp?: number; top_p?: number }
      stopTokens?: number[]
      abortSignal?: AbortSignal
      onNewToken?: (token: number, piece: Uint8Array, currentText: string) => void
    },
  ): Promise<string>
  exit(): Promise<void>
}

interface WllamaModule {
  Wllama: new (paths: Record<string, string>) => WllamaInstance
}

/* ---------- our own OPFS store (the vendored lib exports no usable one) --
   Layout under OPFS dir "cache":
     <basename>          model blob
     <basename>.meta.json { originalURL, originalSize, createdAt }        */

class GhostStore {
  private async dir(): Promise<FileSystemDirectoryHandle> {
    const root = await navigator.storage.getDirectory()
    return root.getDirectoryHandle("cache", { create: true })
  }
  async open(url: string): Promise<Blob | null> {
    try {
      const d = await this.dir()
      const f = await d.getFileHandle(baseName(url))
      const file = await f.getFile()
      return file.size > 0 ? file : null
    } catch { return null }
  }
  async write(url: string, blob: Blob): Promise<void> {
    const d = await this.dir()
    const fh = await d.getFileHandle(baseName(url), { create: true })
    const w = await fh.createWritable()
    await w.write(blob)
    await w.close()
    const meta = JSON.stringify({ originalURL: url, originalSize: blob.size, createdAt: Date.now() })
    const mh = await d.getFileHandle(`${baseName(url)}.meta.json`, { create: true })
    const mw = await mh.createWritable()
    await mw.write(meta)
    await mw.close()
  }
  async getOriginalSize(url: string): Promise<number> {
    try {
      const d = await this.dir()
      const f = await d.getFileHandle(`${baseName(url)}.meta.json`)
      const parsed = JSON.parse(await (await f.getFile()).text())
      return typeof parsed?.originalSize === "number" ? parsed.originalSize : 0
    } catch { return 0 }
  }
  async delete(url: string): Promise<void> {
    const d = await this.dir()
    for (const name of [baseName(url), `${baseName(url)}.meta.json`]) {
      try { await d.removeEntry(name) } catch {}
    }
  }
}

let storeSingleton: GhostStore | null = null
function store(): GhostStore {
  if (!storeSingleton) storeSingleton = new GhostStore()
  return storeSingleton
}

const WLLAMA_BASE = "/ghost/vendor/wllama"
const WLLAMA_PATHS = {
  "single-thread/wllama.wasm": `${WLLAMA_BASE}/single-thread/wllama.wasm`,
  "multi-thread/wllama.wasm": `${WLLAMA_BASE}/multi-thread/wllama.wasm`,
}
const CHATML_STOP = ["<|im_end|>", "<|im_start|>"]

let modPromise: Promise<WllamaModule> | null = null
function lib(): Promise<WllamaModule> {
  if (!modPromise) {
    // Browser-native ESM from our own origin. The specifier goes through a
    // runtime variable + ignore directives — bundlers (webpack AND
    // turbopack) otherwise rewrite the path and break the import.
    const specifier = `${WLLAMA_BASE}/index.js`
    modPromise = import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ specifier
    ) as Promise<WllamaModule>
  }
  return modPromise
}



function baseName(url: string): string {
  try { return new URL(url).pathname.split("/").pop() || url } catch { return url }
}

async function opfsSweep(fragment: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    for (const dirName of ["cache", "wllama", "ghost-models"]) {
      try {
        const dir = await root.getDirectoryHandle(dirName)
        for await (const name of dir.keys()) {
          if (name.includes(fragment)) {
            try { await dir.removeEntry(name) } catch {}
          }
        }
      } catch {}
    }
  } catch {}
}

class GhostEngine {
  private instance: WllamaInstance | null = null
  private loadedUrl: string | null = null
  private stopTokenIds: number[] | null = null
  private stopIdsUrl: string | null = null
  private activeAbort: AbortController | null = null

  /* ---------- runtime ---------- */

  private async ensureLoaded(url: string): Promise<void> {
    if (this.instance && this.loadedUrl === url) return
    const m = await lib()
    const c = store()
    let blob = await c.open(url)
    // Integrity gate: truncated/corrupt files load "fine" then produce
    // garbage tokens and memory crashes. Verify before trusting.
    if (blob && blob.size > 4) {
      const magic = await blob.slice(0, 4).text()
      const expected = await c.getOriginalSize(url).catch(() => 0)
      if (magic !== "GGUF" || (expected > 0 && Math.abs(blob.size - expected) > 1024)) {
        await this.releaseRuntime()
        await c.delete(url).catch(() => {})
        await opfsSweep(baseName(url))
        throw new Error("MODEL_CORRUPT · brain file damaged — refetching a clean copy")
      }
    }
    if (!blob || blob.size <= 0) {
      throw new Error("MODEL_NOT_CACHED · download the brain first")
    }
    this.instance = new m.Wllama(WLLAMA_PATHS)
    this.loadedUrl = url
    await this.instance.loadModel([blob], { n_ctx: 2048 })
  }

  private async releaseRuntime(): Promise<void> {
    if (!this.instance) return
    try { await this.instance.exit() } catch {}
    this.instance = null
    this.loadedUrl = null
  }

  /* ---------- storage queries ---------- */

  async probe(): Promise<{ webgpu: boolean; storageQuotaMb: number | null; cachedMb: number | null }> {
    let storageQuotaMb: number | null = null
    try {
      const estimate = await navigator.storage.estimate()
      if (typeof estimate.quota === "number") storageQuotaMb = Math.round(estimate.quota / (1024 * 1024))
    } catch {}
    let cachedMb: number | null = null
    const c = store()
    for (const model of GHOST_MODELS) {
      const blob = await c.open(model.url).catch(() => null)
      if (blob && blob.size > 0) { cachedMb = Math.round(blob.size / (1024 * 1024)); break }
    }
    return { webgpu: typeof navigator !== "undefined" && "gpu" in navigator, storageQuotaMb, cachedMb }
  }

  async cachedUrls(): Promise<string[]> {
    const out: string[] = []
    const c = store()
    for (const url of [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]) {
      const blob = await c.open(url).catch(() => null)
      if (blob && blob.size > 0) out.push(url)
    }
    return out
  }

  async scanStorage(): Promise<Array<{ url: string; sizeMb: number }>> {
    const out: Array<{ url: string; sizeMb: number }> = []
    const c = store()
    for (const url of [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]) {
      const blob = await c.open(url).catch(() => null)
      if (blob && blob.size > 0) out.push({ url, sizeMb: Math.round(blob.size / (1024 * 1024)) })
    }
    return out
  }

  async cachedBytesFor(url: string): Promise<number> {
    const blob = await store().open(url).catch(() => null)
    return blob?.size ?? 0
  }

  /* ---------- download ---------- */

  async download(
    model: GhostModel,
    onProgress: (fraction: number, mbLoaded: number, mbTotal: number) => void,
  ): Promise<void> {
    const res = await fetch(model.url)
    if (!res.ok || !res.body) throw new Error(`Download failed (HTTP ${res.status})`)
    const total = Number(res.headers.get("content-length")) || model.sizeMb * 1048576
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.byteLength
      onProgress(total > 0 ? Math.min(1, received / total) : 0, received / 1048576, total / 1048576)
    }
    const blob = new Blob(chunks as BlobPart[])
    if (blob.size !== received) throw new Error("Download verification failed — retry")
    await store().write(model.url, blob)
    setSelectedModel(model.id)
    try { localStorage.setItem("deriva-ghost-ready", "1") } catch {}
  }

  /* ---------- lifecycle ---------- */

  async load(model: GhostModel, onProgress?: (label: string) => void): Promise<void> {
    onProgress?.(`waking ${model.name}`)
    await this.ensureLoaded(model.url)
  }

  async chat(
    model: GhostModel,
    messages: { role: string; content: string }[],
    maxTokens: number,
    onToken?: (piece: string) => void,
  ): Promise<{ text: string; tps: number }> {
    await this.ensureLoaded(model.url)
    const wllama = this.instance!
    const clean = (s: unknown) => String(s ?? "").replace(/<\|[a-z_]+\|>/g, "")

    // stopTokens are TOKEN IDs in v2 — resolve once per loaded model.
    if (!this.stopTokenIds || this.stopIdsUrl !== model.url) {
      const ids = new Set<number>()
      const eos = wllama.getEOS()
      if (eos >= 0) ids.add(eos)
      try {
        const imStart = await wllama.lookupToken("<|im_start|>")
        if (imStart >= 0) ids.add(imStart)
      } catch {}
      this.stopTokenIds = [...ids]
      this.stopIdsUrl = model.url
    }

    const abort = new AbortController()
    this.activeAbort = abort
    const started = performance.now()

    const run = (async () => {
      const msgs = messages ?? []
      const promptStr =
        msgs.map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`).join("\n") +
        "\n<|im_start|>assistant\n"
      let tokens = 0
      let currentText = ""
      const decoder = new TextDecoder("utf-8")
      try {
        const text = await wllama.createCompletion(promptStr, {
          nPredict: Math.min(maxTokens || 280, 280),
          sampling: { temp: 0.35, top_p: 0.9 },
          stopTokens: this.stopTokenIds!,
          abortSignal: abort.signal,
          onNewToken: (_token, piece) => {
            tokens += 1
            currentText += decoder.decode(piece, { stream: true })
            const pieceStr = clean(decoder.decode(piece, { stream: false }))
            if (pieceStr) onToken?.(pieceStr)
          },
        })
        const finalText = clean(typeof text === "string" && text ? text : currentText)
        const seconds = (performance.now() - started) / 1000
        return { text: finalText, tokens: Math.max(tokens, 1), tps: seconds > 0 ? Math.max(tokens, 1) / seconds : 0 }
      } catch (err) {
        const name = (err as Error)?.name || ""
        const msg = String((err as Error)?.message || err)
        if (abort.signal.aborted || /abort/i.test(name) || /abort/i.test(msg)) {
          // User pressed stop — hand back whatever was generated so far.
          const seconds = (performance.now() - started) / 1000
          return { text: clean(currentText), tokens: Math.max(tokens, 1), tps: seconds > 0 ? Math.max(tokens, 1) / seconds : 0 }
        }
        throw err
      } finally {
        if (this.activeAbort === abort) this.activeAbort = null
      }
    })()

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Ghost timed out — the phone reclaimed the brain. Try again.")),
        120000,
      )
    })
    try {
      return await Promise.race([run, timeout])
    } catch (err) {
      // Real failures leave suspect state — recycle before the next ping.
      await this.releaseRuntime()
      throw err
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  // Stop: aborts generation via signal — v2 unwinds cleanly and rolls back
  // the KV cache, so the runtime stays warm for the next question.
  stop(): void {
    const abort = this.activeAbort
    if (!abort) return
    try { abort.abort() } catch {}
  }

  async eject(): Promise<void> {
    await this.releaseRuntime()
    try { localStorage.removeItem("deriva-ghost-ready") } catch {}
  }

  async swapModel(next: GhostModel): Promise<void> {
    await this.releaseRuntime()
    setSelectedModel(next.id)
  }

  // Cold delete: release every OPFS handle first, then remove + verify.
  async delete(url: string): Promise<{ verified: boolean }> {
    await this.releaseRuntime()
    try {
      const c = store()
      await c.delete(url).catch(() => {})
      let blob = await c.open(url).catch(() => null)
      if (blob && blob.size > 0) {
        await opfsSweep(baseName(url))
        blob = await c.open(url).catch(() => null)
      }
      return { verified: !blob || blob.size === 0 }
    } catch {
      return { verified: false }
    }
  }

  async clearAll(): Promise<void> {
    await this.releaseRuntime()
    for (const url of [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]) {
      await this.delete(url).catch(() => {})
    }
    try { localStorage.removeItem("deriva-ghost-ready") } catch {}
  }
}

export const ghostEngine = new GhostEngine()

export function ghostWasReady(): boolean {
  try { return localStorage.getItem("deriva-ghost-ready") === "1" } catch { return false }
}
