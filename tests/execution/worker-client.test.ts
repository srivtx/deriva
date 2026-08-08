import { afterEach, describe, expect, it } from "vitest"
import { workerBridge, type WorkerMessage, type WorkerResponse } from "../../src/execution/bridge/worker-client"

class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  terminated = false
  mode: "respond" | "silent" | "error" = "respond"

  constructor() {
    FakeWorker.instances.push(this)
  }

  postMessage(message: WorkerMessage) {
    if (this.mode === "silent") return
    queueMicrotask(() => {
      if (this.terminated) return
      if (this.mode === "error") {
        this.onmessage?.({ data: { type: "error", id: message.id, message: "worker rejected the run" } } as unknown as MessageEvent<WorkerResponse>)
        return
      }
      if (message.type === "runTests") {
        this.onmessage?.({ data: { type: "test-result", id: message.id, results: [] } } as unknown as MessageEvent<WorkerResponse>)
      } else if (message.type === "runTrace") {
        this.onmessage?.({ data: {
          type: "trace",
          id: message.id,
          trace: { version: 1, language: "python", source: message.code, input: { n: message.arg }, events: [], budget: { maxEvents: message.budget, truncated: false } },
          result: message.arg,
          error: null,
        } } as unknown as MessageEvent<WorkerResponse>)
      }
    })
  }

  terminate() {
    this.terminated = true
  }
}

Object.defineProperty(globalThis, "Worker", { configurable: true, writable: true, value: FakeWorker })

describe("worker execution bridge", () => {
  afterEach(() => {
    workerBridge.cancel()
    FakeWorker.instances.length = 0
  })

  it("routes tests and traces through a worker response", async () => {
    const tests = await workerBridge.runTests("def f(n): return n", [{ call: "f(1)", expect: 1 }])
    expect(tests.results).toEqual([])

    const trace = await workerBridge.runTrace("def f(n): return n", "f", 3, 50)
    expect(trace.result).toBe(3)
    expect(trace.trace.budget.maxEvents).toBe(50)
    expect(FakeWorker.instances).toHaveLength(1)
  })

  it("rejects worker errors without leaving a pending request", async () => {
    const request = workerBridge.runTrace("broken", "f", 1, 10)
    FakeWorker.instances[0].mode = "error"
    await expect(request).rejects.toThrow("worker rejected the run")
  })

  it("terminates the worker when an execution is cancelled", async () => {
    const controller = new AbortController()
    const request = workerBridge.runTrace("while True: pass", "f", 1, 10, controller.signal)
    controller.abort()

    await expect(request).rejects.toThrow("cancelled")
    expect(FakeWorker.instances[0].terminated).toBe(true)
  })
})
