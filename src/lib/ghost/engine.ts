"use client"

// Ghost engine — typed client for the wllama worker. Zero bundle cost until used:
// the Worker is only spawned on explicit user action.

export const GHOST_MODEL_URL =
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf"
export const GHOST_MODEL_LABEL = "Qwen2.5 · 0.5B · Q4_K_M"
const WORKER_URL = "/ghost/ghost-worker.js"

export type GhostPhase = "probe" | "intro" | "downloading" | "loading" | "ready"

type Pending = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  onProgress?: (loaded: number, total: number) => void
  onToken?: (piece: string) => void
}

export interface GhostCapabilities {
  webgpu: boolean
  storageQuotaMb: number | null
  cached: boolean
  cachedMb: number | null
}

class GhostEngine {
  private worker: Worker | null = null
  private pending = new Map<number, Pending>()
  private seq = 0

  private spawn(): Worker {
    if (this.worker) return this.worker
    const worker = new Worker(WORKER_URL, { type: "module" })
    worker.onmessage = (event: MessageEvent) => this.handle(event.data)
    worker.onerror = () => {
      for (const pending of this.pending.values()) pending.reject(new Error("Ghost engine crashed"))
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
      pending.reject(new Error(String(msg.message ?? "Ghost engine error")))
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
    const cacheInfo = await this.request<{ cached: boolean; size: number }>("cached", { url: GHOST_MODEL_URL })
    return {
      webgpu: data.webgpu,
      storageQuotaMb,
      cached: cacheInfo.cached,
      cachedMb: cacheInfo.size > 0 ? Math.round(cacheInfo.size / (1024 * 1024)) : null,
    }
  }

  download(onProgress: (fraction: number, mbLoaded: number, mbTotal: number) => void): Promise<void> {
    return this.request<void>(
      "download",
      { url: GHOST_MODEL_URL },
      {
        onProgress: (loaded, total) =>
          onProgress(total > 0 ? loaded / total : 0, loaded / (1024 * 1024), total / (1024 * 1024)),
      },
    ).then(() => {
      try { localStorage.setItem("deriva-ghost-ready", "1") } catch {}
    })
  }

  load(onProgress: (label: string) => void): Promise<void> {
    onProgress("waking ghost")
    return this.request<void>("load", { url: GHOST_MODEL_URL })
  }

  chat(
    messages: { role: string; content: string }[],
    maxTokens: number,
    onToken: (piece: string) => void,
  ): Promise<{ text: string; tps: number }> {
    return this.request<{ text: string; tps: number }>(
      "chat",
      { messages, maxTokens },
      { onToken },
    )
  }

  stop(): Promise<void> {
    if (!this.worker) return Promise.resolve()
    return this.request<void>("stop")
  }

  async eject(): Promise<void> {
    await this.request<void>("eject", { url: GHOST_MODEL_URL }).catch(() => {})
    this.worker?.terminate()
    this.worker = null
    try { localStorage.removeItem("deriva-ghost-ready") } catch {}
  }
}

export const ghostEngine = new GhostEngine()

export function ghostWasReady(): boolean {
  try { return localStorage.getItem("deriva-ghost-ready") === "1" } catch { return false }
}
