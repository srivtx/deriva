"use client"

// Ghost engine — drives the vendored wllama 2.4.0 core DIRECTLY on the page.
// No custom wrapper worker: wllama spawns its own internal sandboxed worker
// for WASM inference, so our old wrapper was a pure boot-failure liability.
// Library loads browser-natively from /ghost/vendor/wllama (same-origin,
// precached by the SW) — fully offline once installed.
//
// ── ghost/faster-smarter v15 — the correctness pass ──────────────────
// Field reports from v14 (preview-site): "download is glitchy", "the
// settings icon looks like a light/dark toggle", "0.6 qwen is very slow
// on M2 and phones". Root causes found and fixed here:
// · QWEN3 THINK BUG (the big one): v14 shipped assistantSuffix "\n\n",
//   which neither opens nor closes Qwen3's think block — the model entered
//   thinking mode on EVERY reply, burning up to nPredict hidden reasoning
//   tokens (3x latency, replies dying mid-think at the cap, raw reasoning
//   leaking into the stream). The official non-thinking recipe — verified
//   byte-for-byte against Qwen/Qwen3-0.6B's chat_template — appends an
//   EMPTY think block: "<think>\n\n</think>\n\n" (see text.ts).
// · STREAM CLEANING: cleaning now runs over the full text so far (wllama
//   hands us currentText), so think blocks spanning many tokens are hidden
//   while they stream, special tokens never flash, and split multibyte
//   characters are held back instead of rendering as   glyphs.
// · BACKEND POLICY: auto-WebGPU was a mistake — measured parity
//   (transformers.js ~62-66 tok/s vs wllama ~60 on the same desktop) plus
//   a second multi-file weight download (the glitchy progress) plus
//   ORT/WebGPU variability on phones. CPU wllama is now THE default on
//   every device (single-file download, resumable, cancellable, OPFS);
//   WebGPU survives as an explicit TURBO toggle in settings.
// · DOWNLOAD: streams straight to OPFS (no 378MB in-memory Blob), resumes
//   from partial files via HTTP Range, is cancellable, and reports honest
//   monotonic progress (throttled ~3/s) with speed + ETA. The turbo path
//   aggregates transformers.js per-file events via its progress_total.

import { buildPrompt, cleanFinal, visibleDelta, QWEN3_NO_THINK_SUFFIX } from "./text"

export interface GhostModel {
  id: string
  label: string
  name: string
  url: string
  sizeMb: number
  blurb: string
  /** prompt family — decides template suffix + stop tokens */
  family: "lfm2" | "qwen3"
  /** sampling profile */
  temp: number
  topP: number
  minP: number
  /** appended after `<|im_start|>assistant\n` — Qwen3 non-thinking contract */
  assistantSuffix?: string
  /** ONNX repo for the WebGPU path */
  gpuRepo?: string
}

export const GHOST_MODELS: GhostModel[] = [
  {
    id: "lfm2.5-350m",
    label: "NANO · 219 MB",
    name: "LFM 2.5 350M",
    url: "https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF/resolve/main/LFM2.5-350M-Q4_K_M.gguf",
    sizeMb: 219,
    blurb: "default · fastest brain per byte — happy on any phone",
    family: "lfm2",
    temp: 0.45,
    topP: 0.9,
    minP: 0.05,
    gpuRepo: "onnx-community/LFM2.5-350M-ONNX",
  },
  {
    id: "qwen3-0.6b",
    label: "LITE · 378 MB",
    name: "Qwen 3 0.6B",
    url: "https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf",
    sizeMb: 378,
    blurb: "deeper reasoning · best on desktop, patient on phone",
    family: "qwen3",
    temp: 0.7,
    topP: 0.8,
    minP: 0.05,
    // Qwen3's official non-thinking recipe (verified against the model's
    // chat_template): an EMPTY think block after the assistant header.
    // v14 shipped "\n\n" — the block was never closed, so the model thought
    // silently on every reply: 3x latency, cap-death mid-reasoning.
    assistantSuffix: QWEN3_NO_THINK_SUFFIX,
    gpuRepo: "onnx-community/Qwen3-0.6B-ONNX",
  },
]

export const GHOST_LEGACY_URLS = [
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
  "https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf",
  "https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf",
]

export const DEFAULT_MODEL_ID = "lfm2.5-350m"

/** max tokens per reply — 288 keeps the tutor terse but lets answers breathe */
export const GHOST_MAX_TOKENS = 288

/** honest progress events for model downloads */
export interface DownloadProgress {
  /** connect → fetch → verify → store → done (turbo: fetch → done) */
  phase: "connect" | "fetch" | "verify" | "store" | "done"
  /** 0..1, monotonic */
  fraction: number
  loadedMb: number
  totalMb: number
  /** smoothed MB/s (0 until measurable) */
  speedMbps: number
  /** seconds remaining, null when unknown */
  etaSec: number | null
  /** set once when a resume actually continued a partial download */
  resumedMb?: number
  /** turbo only: number of files in flight */
  files?: number
}

export function getSelectedModel(): GhostModel {
  try {
    const id = localStorage.getItem("deriva-ghost-model")
    const found = GHOST_MODELS.find(m => m.id === id)
    if (found) return found
    // migrate: a stored SmolLM2/Qwen2.5 id no longer exists → default
    if (id && !found) localStorage.setItem("deriva-ghost-model", DEFAULT_MODEL_ID)
    return GHOST_MODELS.find(m => m.id === DEFAULT_MODEL_ID)!
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
  getNumThreads(): number
  createCompletion(
    prompt: string,
    options: {
      nPredict?: number
      useCache?: boolean
      sampling?: {
        temp?: number
        top_p?: number
        top_k?: number
        min_p?: number
        penalty_repeat?: number
        penalty_last_n?: number
      }
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
     <basename>          model blob (only present once verified complete)
     <basename>.meta.json { originalURL, originalSize, createdAt }
     <basename>.part     in-flight download (resumable)
   A model is trusted ONLY when the final name exists with a GGUF magic
   header and a matching meta size — a killed download leaves just the
   .part, never a half-valid "cached" model. */

type PartHandle = FileSystemFileHandle & { move?: (name: string) => Promise<void> }

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
    await this.writeMeta(url, blob.size)
  }
  async writeMeta(url: string, size: number): Promise<void> {
    const d = await this.dir()
    const meta = JSON.stringify({ originalURL: url, originalSize: size, createdAt: Date.now() })
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
    for (const name of [baseName(url), `${baseName(url)}.meta.json`, `${baseName(url)}.part`]) {
      try { await d.removeEntry(name) } catch {}
    }
  }
  /** open (creating if needed) the .part file handle for a resumable download */
  async partHandle(url: string): Promise<PartHandle> {
    const d = await this.dir()
    return (await d.getFileHandle(`${baseName(url)}.part`, { create: true })) as PartHandle
  }
  /** committed rename: .part → final name; falls back to a copy when the
   *  File System Access move() is unavailable (Safari/Firefox). */
  async commitPart(url: string): Promise<void> {
    const d = await this.dir()
    const part = await this.partHandle(url)
    const file = await part.getFile()
    if (typeof part.move === "function") {
      try {
        await part.move(baseName(url))
        return
      } catch { /* fall through to copy */ }
    }
    const blob = await file.slice(0, file.size).arrayBuffer().then(b => new Blob([b]))
    const fh = await d.getFileHandle(baseName(url), { create: true })
    const w = await fh.createWritable()
    await w.write(blob)
    await w.close()
    try { await d.removeEntry(`${baseName(url)}.part`) } catch {}
  }
  async removePart(url: string): Promise<void> {
    try {
      const d = await this.dir()
      await d.removeEntry(`${baseName(url)}.part`)
    } catch {}
  }
}

let storeSingleton: GhostStore | null = null
function store(): GhostStore {
  if (!storeSingleton) storeSingleton = new GhostStore()
  return storeSingleton
}

/* ---------- WebGPU backend (Transformers.js v4 + ONNX Runtime WebGPU) ---- */

const GPU_MODEL_REPOS: Record<string, string> = Object.fromEntries(
  GHOST_MODELS.filter(m => m.gpuRepo).map(m => [m.id, m.gpuRepo!]),
)

interface TfLike {
  env: { backends: { onnx: { wasm: { wasmPaths: string } } }; allowLocalModels: boolean }
  pipeline(task: string, repo: string, opts?: Record<string, unknown>): Promise<unknown>
  TextStreamer: new (tok: unknown, cfg: Record<string, unknown>) => unknown
}

let tfPromise: Promise<TfLike> | null = null
function tf(): Promise<TfLike> {
  if (!tfPromise) {
    tfPromise = import("@huggingface/transformers").then((T: unknown) => {
      const mod = T as TfLike
      mod.env.backends.onnx.wasm.wasmPaths = "/ghost/vendor/onnx/"
      mod.env.allowLocalModels = false
      return mod
    })
  }
  return tfPromise
}

const gpuBytesCache = new Map<string, number>()
async function gpuMark(modelId: string, bytes: number): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle("ghost-gpu", { create: true })
    const fh = await dir.getFileHandle(`${modelId}.json`, { create: true })
    const w = await fh.createWritable()
    await w.write(JSON.stringify({ bytes, createdAt: Date.now() }))
    await w.close()
  } catch {}
}
async function gpuUnmark(modelId: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle("ghost-gpu")
    await dir.removeEntry(`${modelId}.json`)
  } catch {}
}
async function gpuBytes(modelId: string): Promise<number> {
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle("ghost-gpu")
    const f = await (await dir.getFileHandle(`${modelId}.json`)).getFile()
    return JSON.parse(await f.text())?.bytes ?? 0
  } catch { return 0 }
}

/* ---------- backend selection ───────────────────────────────────────────
   "deriva-ghost-backend": "cpu" (default) | "gpu" (turbo).

   v14 shipped auto-WebGPU. Field result: the transformers.js path downloads
   a SECOND set of weights (multi-file, jumpy progress) and measured a wash
   against multithreaded wllama on desktops (~60 tok/s both) while being
   fragile on phones. New policy: CPU wllama is the default everywhere —
   one file, resumable, cancellable, offline. WebGPU stays as an explicit
   TURBO opt-in for users who want to experiment. Legacy values:
   "auto" (v14) → cpu; the ancient "deriva-ghost-gpu"="1" opt-in → gpu. */

type BackendPref = "gpu" | "cpu"
const BACKEND_KEY = "deriva-ghost-backend"

export function backendPref(): BackendPref {
  try {
    const v = localStorage.getItem(BACKEND_KEY)
    if (v === "gpu" || v === "cpu") return v
    if (v === "auto") localStorage.removeItem(BACKEND_KEY) // v14 leftover
    if (localStorage.getItem("deriva-ghost-gpu") === "1") return "gpu"
  } catch {}
  return "cpu"
}
export function setBackendPref(p: BackendPref) {
  try {
    localStorage.setItem(BACKEND_KEY, p)
  } catch {}
}

let gpuProbe: Promise<boolean> | null = null
function gpuAvailable(): Promise<boolean> {
  if (!gpuProbe) {
    gpuProbe = (async () => {
      try {
        if (!("gpu" in navigator)) return false
        const adapter = await (navigator as Navigator & { gpu: { requestAdapter(): Promise<unknown> } }).gpu.requestAdapter()
        return !!adapter
      } catch { return false }
    })()
  }
  return gpuProbe
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

async function wipeDir(dirName: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    const dir = await root.getDirectoryHandle(dirName)
    for await (const name of dir.keys()) {
      try { await dir.removeEntry(name, { recursive: true }) } catch { try { await dir.removeEntry(name) } catch {} }
    }
  } catch {}
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

/** thread pinning: decode is memory-bandwidth bound — 2–6 workers is the
 *  sweet spot on both big.LITTLE phones (8 logical cores) and desktops. */
function pickThreads(): number {
  const hc = navigator.hardwareConcurrency || 4
  return Math.min(Math.max(hc, 2), 6)
}

class GhostEngine {
  private instance: WllamaInstance | null = null
  private loadedUrl: string | null = null
  private pipes = new Map<string, unknown>()
  private stopDetached = false
  private gpuBytesSeen = false
  private stopTokenIds: number[] | null = null
  private stopIdsUrl: string | null = null
  private activeAbort: AbortController | null = null
  private downloadAbort: AbortController | null = null
  private gpuFailed = false
  /** diagnostics for the gauge */
  lastThreads = 0
  lastFlashAttn = false
  lastKvQuant = false

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
    // Fallback ladder: flash-attn + q8_0 KV cache first (halves KV memory
    // bandwidth), plain config if the wasm build refuses it. Silent — the
    // user never sees a config error, only the speed.
    // n_batch 256: chat prompts are short (useCache keeps them incremental),
    // so a small ubatch halves the compute buffer with zero prefill cost.
    const nThreads = pickThreads()
    const attempts: Array<Record<string, unknown>> = [
      { n_ctx: 2048, n_batch: 256, n_threads: nThreads, flash_attn: true, cache_type_k: "q8_0", cache_type_v: "q8_0" },
      { n_ctx: 2048, n_batch: 256, n_threads: nThreads },
    ]
    let lastErr: unknown = null
    for (const opts of attempts) {
      try {
        const inst = new m.Wllama(WLLAMA_PATHS)
        await inst.loadModel([blob], opts)
        this.instance = inst
        this.loadedUrl = url
        this.lastFlashAttn = !!opts.flash_attn
        this.lastKvQuant = opts.cache_type_k === "q8_0"
        try { this.lastThreads = inst.getNumThreads() } catch { this.lastThreads = 0 }
        return
      } catch (err) {
        lastErr = err
        try { await this.releaseRuntime() } catch {}
      }
    }
    throw lastErr ?? new Error("MODEL_NOT_CACHED · download the brain first")
  }

  private async releaseRuntime(): Promise<void> {
    if (!this.instance) return
    try { await this.instance.exit() } catch {}
    this.instance = null
    this.loadedUrl = null
  }

  private async ensurePipeline(
    modelId: string,
    onProgress?: (p: DownloadProgress) => void,
  ): Promise<unknown> {
    if (this.pipes.has(modelId)) return this.pipes.get(modelId)
    const repo = GPU_MODEL_REPOS[modelId]
    if (!repo) throw new Error("MODEL_NOT_CACHED · download the brain first")
    const T = await tf()
    // transformers.js emits `progress_total` — an AGGREGATE event summed
    // across every file in the repo. v14 listened to per-file `progress`
    // events, so the bar reset to 0% with each new file: "glitchy".
    let seenTotal = 0
    const progress_callback = (info: { status?: string; progress?: number; loaded?: number; total?: number; files?: Record<string, unknown> }) => {
      if (info?.status === "progress_total" && onProgress) {
        const loaded = Number(info.loaded ?? 0)
        const total = Number(info.total ?? 0)
        if (total > seenTotal && total < 16 * 1024 * 1024 * 1024) seenTotal = total
        onProgress({
          phase: "fetch",
          fraction: total > 0 ? Math.min(1, loaded / total) : 0,
          loadedMb: loaded / 1048576,
          totalMb: total / 1048576,
          speedMbps: 0,
          etaSec: null,
          files: Object.keys(info.files ?? {}).length,
        })
      }
    }
    // dtype ladder: q4f16 is the fast path on capable GPUs; q4 (fp32
    // activations) is the compatibility rung when fp16 is refused.
    let pipe: unknown
    let lastErr: unknown = null
    for (const dtype of ["q4f16", "q4"]) {
      try {
        pipe = await T.pipeline("text-generation", repo, {
          device: "webgpu",
          dtype,
          progress_callback,
        } as Record<string, unknown>)
        break
      } catch (err) {
        lastErr = err
      }
    }
    if (!pipe) throw lastErr ?? new Error("WebGPU pipeline failed to build")
    this.pipes.set(modelId, pipe)
    if (!gpuBytesCache.has(modelId)) {
      gpuBytesCache.set(modelId, seenTotal)
      void gpuMark(modelId, seenTotal)
    }
    return pipe
  }

  /** turbo only: the explicit "gpu" backend pref. CPU is the default —
   *  see the backend-selection notes above. */
  private async useGpu(): Promise<boolean> {
    if (this.gpuFailed) return false
    if (backendPref() !== "gpu") return false
    return await gpuAvailable()
  }

  async backend(): Promise<"webgpu" | "cpu"> {
    return (await this.useGpu()) ? "webgpu" : "cpu"
  }

  /* ---------- storage queries ---------- */

  async diagnostics(): Promise<{
    isolated: boolean
    threads: number
    resident: boolean
    backend: "webgpu" | "cpu"
    flashAttn: boolean
    kvQuant: boolean
  }> {
    const isolated = typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : false
    const backend = (await this.useGpu()) ? "webgpu" as const : "cpu" as const
    if (this.instance && this.lastThreads > 0) {
      return { isolated, threads: this.lastThreads, resident: true, backend, flashAttn: this.lastFlashAttn, kvQuant: this.lastKvQuant }
    }
    const expected = pickThreads()
    return { isolated, threads: Math.max(expected, 1), resident: false, backend, flashAttn: false, kvQuant: false }
  }

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

  private async gpuCachedBytes(modelId: string): Promise<number> {
    if (!(await this.useGpu())) return 0
    if (!gpuBytesCache.has(modelId)) {
      gpuBytesCache.set(modelId, await gpuBytes(modelId))
    }
    return gpuBytesCache.get(modelId) ?? 0
  }

  async cachedUrls(): Promise<string[]> {
    const out: string[] = []
    const c = store()
    for (const url of [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]) {
      const blob = await c.open(url).catch(() => null)
      if (blob && blob.size > 0) { out.push(url); continue }
      const model = GHOST_MODELS.find(m => m.url === url)
      if (model && (await this.gpuCachedBytes(model.id)) > 0) out.push(url)
    }
    return out
  }

  async scanStorage(): Promise<Array<{ url: string; sizeMb: number }>> {
    const out: Array<{ url: string; sizeMb: number }> = []
    const c = store()
    for (const url of [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]) {
      const blob = await c.open(url).catch(() => null)
      if (blob && blob.size > 0) { out.push({ url, sizeMb: Math.round(blob.size / (1024 * 1024)) }); continue }
      const model = GHOST_MODELS.find(m => m.url === url)
      if (model) {
        const bytes = await this.gpuCachedBytes(model.id)
        if (bytes > 0) out.push({ url, sizeMb: Math.round(bytes / (1024 * 1024)) })
      }
    }
    return out
  }

  async cachedBytesFor(url: string): Promise<number> {
    const blob = await store().open(url).catch(() => null)
    if (blob && blob.size > 0) return blob.size
    const model = GHOST_MODELS.find(m => m.url === url)
    return model ? this.gpuCachedBytes(model.id) : 0
  }

  /* ---------- download ---------- */

  async download(
    model: GhostModel,
    onProgress: (p: DownloadProgress) => void,
  ): Promise<void> {
    if (await this.useGpu()) {
      // TURBO path: transformers.js fetches its own ONNX weights into the
      // Cache API; progress arrives aggregated (progress_total) and is NOT
      // cancellable — the price of the experimental toggle.
      await this.ensurePipeline(model.id, onProgress)
      const bytes = gpuBytesCache.get(model.id) ?? model.sizeMb * 1048576
      gpuBytesCache.set(model.id, bytes)
      await gpuMark(model.id, bytes)
      setSelectedModel(model.id)
      try { localStorage.setItem("deriva-ghost-ready", "1") } catch {}
      onProgress({ phase: "done", fraction: 1, loadedMb: bytes / 1048576, totalMb: bytes / 1048576, speedMbps: 0, etaSec: null })
      return
    }
    await this.downloadGguf(model, onProgress)
  }

  /** CPU path: stream the GGUF straight into OPFS, resuming a partial
   *  file when the CDN honours Range, cancelling cleanly, and reporting
   *  throttled, honest, monotonic progress with live speed + ETA. */
  private async downloadGguf(
    model: GhostModel,
    onProgress: (p: DownloadProgress) => void,
  ): Promise<void> {
    const c = store()
    // idempotence: a verified copy already on device → nothing to do
    const existing = await c.open(model.url).catch(() => null)
    if (existing && existing.size > 4) {
      const magic = await existing.slice(0, 4).text()
      const expected = await c.getOriginalSize(model.url).catch(() => 0)
      if (magic === "GGUF" && (expected === 0 || Math.abs(existing.size - expected) <= 1024)) {
        setSelectedModel(model.id)
        try { localStorage.setItem("deriva-ghost-ready", "1") } catch {}
        onProgress({ phase: "done", fraction: 1, loadedMb: existing.size / 1048576, totalMb: existing.size / 1048576, speedMbps: 0, etaSec: null })
        return
      }
    }

    const abort = new AbortController()
    this.downloadAbort = abort

    // resume: any bytes already in the .part file are kept and the fetch
    // continues from that offset when the server answers 206.
    const part = await c.partHandle(model.url)
    let start = 0
    try { start = (await part.getFile()).size } catch { start = 0 }
    let resumed = false
    let total = 0

    onProgress({ phase: "connect", fraction: 0, loadedMb: start / 1048576, totalMb: total / 1048576, speedMbps: 0, etaSec: null, resumedMb: start > 0 ? start / 1048576 : undefined })

    try {
      const headers: Record<string, string> = {}
      if (start > 0) headers.Range = `bytes=${start}-`
      const res = await fetch(model.url, { headers, signal: abort.signal })
      if (!res.ok && res.status !== 206) throw new Error(`Download failed (HTTP ${res.status})`)
      if (!res.body) throw new Error("Download failed — no stream from the network")
      if (res.status === 206 && start > 0) {
        resumed = true
        const contentRange = res.headers.get("content-range") // "bytes s-e/total"
        const rangeTotal = contentRange ? Number(contentRange.split("/").pop()) : 0
        total = rangeTotal > 0 ? rangeTotal : start + Number(res.headers.get("content-length") || 0)
      } else {
        // fresh copy — the server ignored Range or nothing to resume
        start = 0
        resumed = false
        total = Number(res.headers.get("content-length")) || model.sizeMb * 1048576
      }

      // keepExistingData keeps prior .part bytes when resuming; a fresh
      // writable truncates, which is exactly what a restart wants.
      const writable = await part.createWritable({ keepExistingData: resumed })
      const reader = res.body.getReader()
      let received = 0
      let position = start
      let speed = 0
      let lastEmit = 0
      let lastFraction = -1
      const t0 = performance.now()
      const emit = (force = false) => {
        const now = performance.now()
        const loaded = start + received
        const fraction = total > 0 ? Math.min(1, loaded / total) : 0
        if (!force && now - lastEmit < 300 && fraction - lastFraction < 0.03) return
        lastEmit = now
        lastFraction = fraction
        const inst = received > 0 ? (received / 1048576) / Math.max((now - t0) / 1000, 0.001) : 0
        speed = speed > 0 ? 0.7 * speed + 0.3 * inst : inst
        const etaSec = speed > 0.01 && total > loaded ? Math.round((total - loaded) / 1048576 / speed) : null
        onProgress({
          phase: "fetch",
          fraction,
          loadedMb: loaded / 1048576,
          totalMb: total / 1048576,
          speedMbps: speed,
          etaSec,
          resumedMb: resumed && start > 0 ? start / 1048576 : undefined,
        })
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writable.write({ type: "write", position, data: value })
          position += value.byteLength
          received += value.byteLength
          emit()
        }
        await writable.close()
      } catch (streamErr) {
        // abort mid-stream: close the writer so flushed bytes survive in
        // the .part — the next attempt resumes from them.
        if (abort.signal.aborted) {
          try { await writable.close() } catch {}
          throw new Error("Download cancelled — it will resume from here.")
        }
        try { await writable.abort?.(streamErr) } catch { try { await writable.close() } catch {} }
        throw streamErr
      }

      // verify before trusting: magic + size
      onProgress({ phase: "verify", fraction: 0.995, loadedMb: total / 1048576, totalMb: total / 1048576, speedMbps: speed, etaSec: 0 })
      const partFile = await part.getFile()
      const magic = await partFile.slice(0, 4).text()
      if (magic !== "GGUF" || (total > 0 && Math.abs(partFile.size - total) > 1024)) {
        await c.removePart(model.url)
        throw new Error("Download verification failed — the file was damaged in transit. Try again.")
      }

      // commit: rename .part → final, then write the trust meta
      onProgress({ phase: "store", fraction: 0.998, loadedMb: total / 1048576, totalMb: total / 1048576, speedMbps: speed, etaSec: 0 })
      await c.commitPart(model.url)
      await c.writeMeta(model.url, partFile.size)

      setSelectedModel(model.id)
      try { localStorage.setItem("deriva-ghost-ready", "1") } catch {}
      onProgress({ phase: "done", fraction: 1, loadedMb: total / 1048576, totalMb: total / 1048576, speedMbps: speed, etaSec: 0 })
    } finally {
      if (this.downloadAbort === abort) this.downloadAbort = null
    }
  }

  /** abort an in-flight download (CPU path). The partial .part file is
   *  kept so the next attempt resumes instead of restarting. */
  cancelDownload(): void {
    try { this.downloadAbort?.abort() } catch {}
  }

  /* ---------- lifecycle ---------- */

  async load(model: GhostModel, onProgress?: (label: string) => void): Promise<void> {
    onProgress?.(`waking ${model.name}`)
    if (await this.useGpu()) {
      try {
        await this.ensurePipeline(model.id)
        return
      } catch (err) {
        // GPU pipeline failed to build — demote for this device and fall
        // through to CPU. Silent unless even CPU fails.
        this.gpuFailed = true
        setBackendPref("cpu")
        console.warn("[ghost] WebGPU pipeline failed — demoted to CPU:", err)
        onProgress?.("gpu refused · falling back to cpu")
      }
    }
    await this.ensureLoaded(model.url)
  }

  async chat(
    model: GhostModel,
    messages: { role: string; content: string }[],
    maxTokens: number,
    onToken?: (piece: string) => void,
  ): Promise<{ text: string; tps: number }> {
    const started = performance.now()
    // ONE prompt, BOTH backends: hand-built ChatML + the model's assistant
    // suffix. A raw string prompt bypasses transformers.js's own chat
    // templating, so the turbo path follows the exact same non-thinking
    // contract as the CPU path (no template drift between backends).
    const promptStr = buildPrompt(messages ?? [], model.assistantSuffix)
    const cap = Math.min(maxTokens || GHOST_MAX_TOKENS, GHOST_MAX_TOKENS)

    let useGpu = await this.useGpu()
    if (useGpu) {
      try {
        const pipe = (await this.ensurePipeline(model.id)) as {
          (prompt: string, opts?: Record<string, unknown>): Promise<Array<{ generated_text: string }>>
          tokenizer: unknown
        }
        this.stopDetached = false
        let tokens = 0
        let currentText = ""
        let emitted = ""
        const T = await tf()
        const streamer = new T.TextStreamer(pipe.tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (piece: string) => {
            tokens += 1
            currentText += piece
            // full-text cleaning (v15): piece-wise cleaning could not hide
            // a think block spanning several pieces.
            const delta = visibleDelta(currentText, emitted)
            if (delta && !this.stopDetached) {
              emitted += delta
              onToken?.(delta)
            }
          },
        })
        const run = (async () => {
          await pipe(promptStr, {
            max_new_tokens: cap,
            do_sample: true,
            temperature: model.temp,
            top_p: model.topP,
            repetition_penalty: 1.1,
            streamer,
          })
          return cleanFinal(currentText)
        })()
        let timer: ReturnType<typeof setTimeout> | undefined
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Ghost timed out — try again.")), 120000)
        })
        try {
          const text = await Promise.race([run, timeout])
          const seconds = (performance.now() - started) / 1000
          return { text, tps: seconds > 0 ? Math.max(tokens, 1) / seconds : 0 }
        } finally {
          if (timer) clearTimeout(timer)
        }
      } catch (err) {
        // First GPU generation failed → demote and rerun on CPU below.
        this.gpuFailed = true
        setBackendPref("cpu")
        console.warn("[ghost] WebGPU generation failed — demoted to CPU:", err)
        useGpu = false
      }
    }

    await this.ensureLoaded(model.url)
    const wllama = this.instance!

    // stopTokens are TOKEN IDs in v2 — resolve once per loaded model.
    if (!this.stopTokenIds || this.stopIdsUrl !== model.url) {
      const ids = new Set<number>()
      const eos = wllama.getEOS()
      if (eos >= 0) ids.add(eos)
      for (const piece of [...CHATML_STOP, "<|startoftext|>"]) {
        try {
          const id = await wllama.lookupToken(piece)
          if (id >= 0) ids.add(id)
        } catch {}
      }
      this.stopTokenIds = [...ids]
      this.stopIdsUrl = model.url
    }

    const abort = new AbortController()
    this.activeAbort = abort

    const run = (async () => {
      let tokens = 0
      let currentText = ""
      let emitted = ""
      try {
        const text = await wllama.createCompletion(promptStr, {
          nPredict: cap,
          // ⚡ THE fix: reuse the KV cache across turns. Without this,
          // wllama kvClear()s and re-prefills the entire conversation
          // every single message — the main source of dead time on phones.
          useCache: true,
          sampling: {
            temp: model.temp,
            top_p: model.topP,
            min_p: model.minP,
            penalty_repeat: 1.15,
            penalty_last_n: 64,
          },
          stopTokens: this.stopTokenIds!,
          abortSignal: abort.signal,
          // wllama hands us the FULL decoded text so far as arg 3 — the
          // decoder in the worker already joined multi-byte characters
          // correctly, so cleaning can run over the whole text.
          onNewToken: (_token, _piece, fullText) => {
            tokens += 1
            currentText = fullText
            const delta = visibleDelta(fullText, emitted)
            if (delta) {
              emitted += delta
              onToken?.(delta)
            }
          },
        })
        const finalText = cleanFinal(typeof text === "string" && text ? text : currentText)
        const seconds = (performance.now() - started) / 1000
        return { text: finalText, tps: seconds > 0 ? Math.max(tokens, 1) / seconds : 0 }
      } catch (err) {
        const name = (err as Error)?.name || ""
        const msg = String((err as Error)?.message || err)
        if (abort.signal.aborted || /abort/i.test(name) || /abort/i.test(msg)) {
          // User pressed stop — hand back whatever was generated so far.
          const seconds = (performance.now() - started) / 1000
          return { text: cleanFinal(currentText), tps: seconds > 0 ? Math.max(tokens, 1) / seconds : 0 }
        }
        throw err
      } finally {
        if (this.activeAbort === abort) this.activeAbort = null
      }
    })()

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        // unwind the generation instead of leaving the worker hot
        try { abort.abort() } catch {}
        reject(new Error("Ghost timed out — the phone reclaimed the brain. Try again."))
      }, 120000)
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
    this.stopDetached = true
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

  // Cold delete: purge every trace across ALL storage layers, then verify.
  async delete(url: string): Promise<{ verified: boolean; freedEntries?: number }> {
    const modelId = GHOST_MODELS.find(m => m.url === url)?.id ?? ""
    const repo = GPU_MODEL_REPOS[modelId]
    gpuBytesCache.delete(modelId)
    this.pipes.delete(modelId)
    await gpuUnmark(modelId).catch(() => {})
    let removed = 0
    try {
      const cache = await caches.open("transformers-cache")
      for (const req of await cache.keys()) {
        if (!repo || req.url.includes(repo)) { await cache.delete(req); removed += 1 }
      }
    } catch {}
    await this.releaseRuntime()
    try {
      const c = store()
      await c.delete(url).catch(() => {})
      let blob = await c.open(url).catch(() => null)
      if (blob && blob.size > 0) {
        await opfsSweep(baseName(url))
        blob = await c.open(url).catch(() => null)
      }
      const manifestGone = (await gpuBytes(modelId).catch(() => 0)) === 0
      return { verified: (!blob || blob.size === 0) && manifestGone, freedEntries: removed }
    } catch {
      return { verified: false }
    }
  }

  async clearAll(): Promise<void> {
    await this.releaseRuntime()
    this.pipes.clear()
    gpuBytesCache.clear()
    // Every OPFS directory Ghost or its past engines ever used.
    for (const dir of ["cache", "ghost-gpu", "wllama", "ghost-models"]) {
      await wipeDir(dir)
    }
    // Every browser cache that could plausibly hold model weights.
    try {
      for (const name of await caches.keys()) {
        if (/transformers|onnx|models-cache/i.test(name)) await caches.delete(name)
      }
    } catch {}
    for (const url of [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]) {
      await store().delete(url).catch(() => {})
    }
    try { localStorage.removeItem("deriva-ghost-ready") } catch {}
  }
}

export const ghostEngine = new GhostEngine()

export function ghostWasReady(): boolean {
  try { return localStorage.getItem("deriva-ghost-ready") === "1" } catch { return false }
}
