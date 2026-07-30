// @ts-nocheck
// Pyodide sandbox worker — browser Web Worker
// Runs in a separate thread; loads Pyodide from CDN

import type { WorkerMessage, WorkerResponse } from "../bridge/worker-client"
import type { Trace } from "../trace/types"

// Worker context — use `self` in browser Web Workers
const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

let pyodide: unknown = null
let loaded = false

// Load Pyodide from CDN (or self-hosted in /public/pyodide/)
async function loadPyodide() {
  if (loaded) return pyodide
  // @ts-ignore — Pyodide global
  if (typeof window !== "undefined" && (window as any).loadPyodide) {
    // @ts-ignore
    pyodide = await (window as any).loadPyodide()
  } else {
    // Dynamic import — requires Pyodide to be available
    // In production: self-host in /public/pyodide/
    throw new Error("Pyodide not loaded. Add Pyodide script to index.html or self-host.")
  }
  loaded = true
  return pyodide
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data as WorkerMessage

  if (msg.type === "kill") {
    ctx.close() // Worker dies, main thread respawns
    return
  }

  if (msg.type === "warmup") {
    loadPyodide().then(() => {
      ctx.postMessage({ type: "ready" } as WorkerResponse)
    }).catch(err => {
      ctx.postMessage({ type: "error", message: (err as Error).message } as WorkerResponse)
    })
    return
  }

  if (msg.type === "run") {
    try {
      const py = await loadPyodide()

      // TODO: Set up tracer
      // TODO: Run harness + student code
      // Placeholder trace
      const trace: Trace = {
        version: 1,
        language: "python",
        source: msg.code,
        input: msg.input,
        events: [] as TraceEvent[],
        budget: { maxEvents: msg.budget, truncated: false },
      }

      ctx.postMessage({ type: "trace", trace } as WorkerResponse)
    } catch (err) {
      ctx.postMessage({ type: "error", message: (err as Error).message } as WorkerResponse)
    }
  }
}

ctx.postMessage({ type: "ready" } as WorkerResponse)
