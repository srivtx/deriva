"use client"

// Ghost engine — typed client for the wllama worker. Zero bundle cost until used:
// the Worker is only spawned on explicit user action.

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

// Models that may linger from earlier builds — swept by Clear all.
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

type Pending = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  onProgress?: (loaded: number, total: number) => void
  onToken?: (piece: string) => void
}

export interface GhostCapabilities {
  webgpu: boolean
  storageQuotaMb: number | null
  cachedMb: number | null
}

class GhostEngine {
  private worker: Worker | null = null
  private pending = new Map<number, Pending>()
  private seq = 0

  private spawn(): Worker {
    if (this.worker) return this.worker
    const worker = new Worker("/ghost/ghost-worker.js", { type: "module" })
    worker.onmessage = (event: MessageEvent) => this.handle(event.data)
    worker.onerror = () => {
      for (const pending of this.pending.values()) pending.reject(new Error("Ghost engine crashed — reload the page"))
      this.pending.clear()
      this.worker = null
    }
    this.worker = worker
    return worker
  }

  private handle(msg: { id?: number; evt: string; [key: string]: unknown }) {
    const pending = msg.id != null ? this.pending.get(msg.id) : undefined
    if (!pending) return
    if (msg.evt === "progress") {
      pending.onProgress?.(Number(msg.loaded ?? 0), Number(msg.total ?? 0))
      return
    }
    if (msg.evt === "token") {
      pending.onToken?.(String(msg.piece ?? ""))
      return
    }
    this.pending.delete(msg.id!)
    if (msg.evt === "ok" || msg.evt === "done" || msg.evt === "stopped") {
      pending.resolve(msg.data ?? {})
    } else {
      const detail = [msg.message, msg.name, msg.hint].filter(Boolean).join(" · ")
      pending.reject(new Error(detail || "Ghost engine error"))
    }
  }

  private request<T>(cmd: string, payload: Record<string, unknown> = {}, hooks: Partial<Pending> = {}): Promise<T> {
    const worker = this.spawn()
    const id = ++this.seq
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject, ...hooks })
      worker.postMessage({ id, cmd, payload })
    })
  }

  async probe(): Promise<GhostCapabilities> {
    const data = await this.request<{ webgpu: boolean }>("probe")
    let storageQuotaMb: number | null = null
    try {
      const estimate = await navigator.storage.estimate()
      if (typeof estimate.quota === "number") storageQuotaMb = Math.round(estimate.quota / (1024 * 1024))
    } catch {}
    let cachedMb: number | null = null
    for (const model of GHOST_MODELS) {
      const info = await this.request<{ cached: boolean; size: number }>("cached", { url: model.url })
      if (info.cached && info.size > 0) cachedMb = Math.round(info.size / (1024 * 1024))
    }
    return { webgpu: data.webgpu, storageQuotaMb, cachedMb }
  }

  async cachedModelId(): Promise<string | null> {
    for (const model of GHOST_MODELS) {
      const info = await this.request<{ cached: boolean; size: number }>("cached", { url: model.url })
      if (info.cached) return model.id
    }
    return null
  }

  async cachedUrls(): Promise<string[]> {
    const out: string[] = []
    const all = [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]
    for (const url of all) {
      const info = await this.request<{ cached: boolean; size: number }>("cached", { url })
      if (info.cached) out.push(url)
    }
    return out
  }

  async scanStorage(): Promise<Array<{ url: string; sizeMb: number }>> {
    const out: Array<{ url: string; sizeMb: number }> = []
    const all = [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]
    for (const url of all) {
      const info = await this.request<{ cached: boolean; size: number }>("cached", { url })
      if (info.cached && info.size > 0) out.push({ url, sizeMb: Math.round(info.size / (1024 * 1024)) })
    }
    return out
  }

  download(model: GhostModel, onProgress: (fraction: number, mbLoaded: number, mbTotal: number) => void): Promise<void> {
    return this.request<void>(
      "download",
      { url: model.url },
      {
        onProgress: (loaded, total) =>
          onProgress(total > 0 ? loaded / total : 0, loaded / (1024 * 1024), total / (1024 * 1024)),
      },
    ).then(() => {
      setSelectedModel(model.id)
      try { localStorage.setItem("deriva-ghost-ready", "1") } catch {}
    })
  }

  load(model: GhostModel, onProgress?: (label: string) => void): Promise<void> {
    onProgress?.(`waking ${model.name}`)
    return this.request<void>("load", { url: model.url })
  }

  chat(
    model: GhostModel,
    messages: { role: string; content: string }[],
    maxTokens: number,
    _onToken?: (piece: string) => void,
  ): Promise<{ text: string; tps: number }> {
    const req = this.request<{ text: string; tps: number }>("chat", { messages, maxTokens })
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Ghost timed out — the phone reclaimed the brain. Try again.")), 120000),
    )
    return Promise.race([req, timeout])
  }

  // Hard stop: terminating releases the inference immediately and drops any
  // glue state — next send spawns a fresh worker (model stays cached).
  stop(): void {
    if (!this.worker) return
    try { this.worker.postMessage({ id: -1, cmd: "stop", payload: {} }) } catch {}
    this.worker.terminate()
    this.worker = null
  }

  async eject(): Promise<void> {
    const model = getSelectedModel()
    await this.request<void>("eject", { url: model.url }).catch(() => {})
    this.worker?.terminate()
    this.worker = null
    try { localStorage.removeItem("deriva-ghost-ready") } catch {}
  }

  swapModel(next: GhostModel): Promise<void> {
    const previous = getSelectedModel()
    return this.request<void>("eject", { url: previous.url }).catch(() => {}).then(async () => {
      this.worker?.terminate()
      this.worker = null
      setSelectedModel(next.id)
    })
  }

  // Cold-worker delete: a live wasm runtime keeps OPFS handles open, so
  // removeEntry fails silently. Terminate first (releases every lock),
  // then a fresh worker performs the delete and we demand verification.
  async delete(url: string): Promise<{ verified: boolean }> {
    this.worker?.terminate()
    this.worker = null
    try {
      const res = await this.request<{ deleted?: boolean; verified?: boolean }>("delete", { url })
      return { verified: res.verified !== false }
    } catch {
      return { verified: false }
    }
  }

  async clearAll(): Promise<void> {
    this.worker?.terminate()
    this.worker = null
    const urls = [...GHOST_MODELS.map(m => m.url), ...GHOST_LEGACY_URLS]
    for (const url of urls) {
      await this.request<void>("delete", { url }).catch(() => {})
    }
    try { localStorage.removeItem("deriva-ghost-ready") } catch {}
  }
}

export const ghostEngine = new GhostEngine()

export function ghostWasReady(): boolean {
  try { return localStorage.getItem("deriva-ghost-ready") === "1" } catch { return false }
}
