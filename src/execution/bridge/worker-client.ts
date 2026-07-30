// Pyodide worker bridge — execution sandbox (05 §2, §4.2)
// Runs in a Web Worker; main thread communicates via postMessage.

import type { Trace, TraceEvent } from "../trace/types"

// Worker protocol
export type WorkerMessage =
  | { type: "run"; code: string; harness: string; input: unknown; budget: number }
  | { type: "kill" }
  | { type: "warmup" }

export type WorkerResponse =
  | { type: "trace"; trace: Trace }
  | { type: "error"; message: string }
  | { type: "ready" }
  | { type: "status"; message: string }

// Main-thread bridge
class WorkerBridge {
  private worker: Worker | null = null
  private warmWorker: Worker | null = null
  private listeners: ((resp: WorkerResponse) => void)[] = []

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("./sandbox.worker.ts", import.meta.url), { type: "module" })
      this.worker.onmessage = (e) => {
        this.listeners.forEach(fn => fn(e.data))
      }
    }
    return this.worker
  }

  onResponse(fn: (resp: WorkerResponse) => void) {
    this.listeners.push(fn)
    return () => { this.listeners = this.listeners.filter(l => l !== fn) }
  }

  async run(code: string, harness: string, input: unknown, budget = 5000): Promise<Trace> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker()
      const unsub = this.onResponse((resp) => {
        if (resp.type === "trace") {
          unsub()
          resolve(resp.trace)
        } else if (resp.type === "error") {
          unsub()
          reject(new Error(resp.message))
        }
      })
      worker.postMessage({ type: "run", code, harness, input, budget })
    })
  }

  kill() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  warmup() {
    if (!this.warmWorker) {
      this.warmWorker = new Worker(new URL("./sandbox.worker.ts", import.meta.url), { type: "module" })
      this.warmWorker.postMessage({ type: "warmup" })
    }
  }
}

export const workerBridge = new WorkerBridge()
