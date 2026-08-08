// Safe Python execution facade. The implementation lives in the worker bridge;
// callers do not get a main-thread Pyodide escape hatch.

"use client"

import { workerBridge, type WorkerTestResult } from "./bridge/worker-client"
import type { Trace } from "./trace/types"

export interface TestResult extends WorkerTestResult {}

export interface ExecutionOptions {
  signal?: AbortSignal
}

export async function runTests(
  code: string,
  tests: { call: string; expect: unknown }[],
  options?: ExecutionOptions,
): Promise<{ results: TestResult[]; syntaxError?: string }> {
  const response = await workerBridge.runTests(code, tests, options?.signal)
  return { results: response.results, syntaxError: response.syntaxError }
}

export interface TraceRun {
  trace: Trace
  result: unknown
  error: string | null
}

export async function runTraced(
  code: string,
  entryPoint: string,
  arg: number,
  budget: number,
  options?: ExecutionOptions,
): Promise<TraceRun> {
  const response = await workerBridge.runTrace(code, entryPoint, arg, budget, options?.signal)
  return { trace: response.trace, result: response.result, error: response.error }
}

export function cancelPythonExecution() {
  workerBridge.cancel()
}
