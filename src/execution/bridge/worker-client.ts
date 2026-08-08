// Pyodide worker bridge — execution sandbox (05 §2, §4.2).
// Every request is isolated behind a hard timeout. A timed-out or aborted run
// terminates the worker so student code cannot keep executing in the background.

import type { Trace } from "../trace/types"

export interface WorkerTestResult {
  call: string
  expect: unknown
  got: unknown
  ok: boolean
  error?: string
}

type WorkerRequest =
  | { type: "runTests"; code: string; tests: { call: string; expect: unknown }[] }
  | { type: "runTrace"; code: string; entryPoint: string; arg: number; budget: number }
  | { type: "warmup" }

export type WorkerMessage = WorkerRequest & { id: string }

export type WorkerResponse =
  | { type: "test-result"; id: string; results: WorkerTestResult[]; syntaxError?: string }
  | { type: "trace"; id: string; trace: Trace; result: unknown; error: string | null }
  | { type: "error"; id?: string; message: string }
  | { type: "ready"; id?: string }
  | { type: "status"; id?: string; message: string }

type Pending = {
  resolve: (response: WorkerResponse) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const DEFAULT_TIMEOUT_MS = 15_000

class WorkerBridge {
  private worker: Worker | null = null
  private sequence = 0
  private pending = new Map<string, Pending>()

  private createWorker(): Worker {
    if (typeof Worker === "undefined") throw new Error("Web Workers are unavailable in this browser")
    const worker = new Worker(new URL("./sandbox.worker.ts", import.meta.url))
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handleResponse(event.data)
    worker.onerror = event => {
      this.reset(new Error(event.message || "Python worker failed"))
    }
    this.worker = worker
    return worker
  }

  private getWorker() {
    return this.worker || this.createWorker()
  }

  private handleResponse(response: WorkerResponse) {
    if (!response.id) return
    const request = this.pending.get(response.id)
    if (!request) return
    this.pending.delete(response.id)
    clearTimeout(request.timer)
    if (response.type === "error") request.reject(new Error(response.message))
    else request.resolve(response)
  }

  private reset(reason?: Error) {
    const worker = this.worker
    this.worker = null
    worker?.terminate()
    if (reason) {
      for (const request of this.pending.values()) {
        clearTimeout(request.timer)
        request.reject(reason)
      }
      this.pending.clear()
    }
  }

  private request(message: WorkerRequest, timeoutMs = DEFAULT_TIMEOUT_MS, signal?: AbortSignal) {
    const id = `execution-${++this.sequence}`
    const fullMessage: WorkerMessage = { ...message, id }
    return new Promise<WorkerResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new Error("Python execution timed out; the worker was terminated")
        this.reset(error)
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer })

      const abort = () => {
        signal?.removeEventListener("abort", abort)
        this.reset(new Error("Python execution cancelled"))
      }
      if (signal?.aborted) {
        abort()
        return
      }
      signal?.addEventListener("abort", abort, { once: true })

      try {
        this.getWorker().postMessage(fullMessage)
      } catch (error) {
        signal?.removeEventListener("abort", abort)
        clearTimeout(timer)
        this.pending.delete(id)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  async runTests(code: string, tests: { call: string; expect: unknown }[], signal?: AbortSignal) {
    const response = await this.request({ type: "runTests", code, tests }, DEFAULT_TIMEOUT_MS, signal)
    if (response.type !== "test-result") throw new Error("Worker returned an invalid test response")
    return response
  }

  async runTrace(code: string, entryPoint: string, arg: number, budget: number, signal?: AbortSignal) {
    const response = await this.request({ type: "runTrace", code, entryPoint, arg, budget }, DEFAULT_TIMEOUT_MS, signal)
    if (response.type !== "trace") throw new Error("Worker returned an invalid trace response")
    return response
  }

  warmup() {
    const id = `warmup-${++this.sequence}`
    this.getWorker().postMessage({ type: "warmup", id } satisfies WorkerMessage)
  }

  cancel() {
    this.reset(new Error("Python execution cancelled"))
  }
}

export const workerBridge = new WorkerBridge()
