// Pyodide client — lazy-loaded in-browser Python (F5).
// v0 runs on the main thread, consistent with /practice; the worker bridge in
// execution/bridge/ is the designed seam when trace budgets grow (07 D-record).

"use client"

import type { Trace, TraceEvent } from "@/execution/trace/types"

let pyodidePromise: Promise<PyodideLike> | null = null

interface PyodideLike {
  runPython: (code: string) => unknown
  runPythonAsync: (code: string) => Promise<unknown>
}

export function getPyodide(): Promise<PyodideLike> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      if (!(window as unknown as { loadPyodide?: unknown }).loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
          s.onload = () => resolve()
          s.onerror = () => reject(new Error("Failed to load Pyodide"))
          document.head.appendChild(s)
        })
      }
      return (window as unknown as { loadPyodide: () => Promise<PyodideLike> }).loadPyodide()
    })()
  }
  return pyodidePromise
}

// ── Test runner ──

export interface TestResult {
  call: string
  expect: unknown
  got: unknown
  ok: boolean
  error?: string
}

const TEST_RUNNER = `
import json

def __deriva_run_tests(tests_json, ns):
    tests = json.loads(tests_json)
    out = []
    for t in tests:
        try:
            got = eval(t["call"], dict(ns))
            out.append({"call": t["call"], "expect": t["expect"], "got": got, "ok": got == t["expect"]})
        except RecursionError:
            out.append({"call": t["call"], "expect": t["expect"], "got": None, "ok": False,
                        "error": "RecursionError: the chain never reached its floor — check your base case."})
        except Exception as e:
            out.append({"call": t["call"], "expect": t["expect"], "got": None, "ok": False, "error": f"{type(e).__name__}: {e}"})
    return json.dumps(out)
`

export async function runTests(
  code: string,
  tests: { call: string; expect: unknown }[]
): Promise<{ results: TestResult[]; syntaxError?: string }> {
  const py = await getPyodide()
  py.runPython(TEST_RUNNER)
  py.runPython("__deriva_ns = {}")
  try {
    py.runPython(`exec(${JSON.stringify(code)}, __deriva_ns)`)
  } catch (e) {
    return { results: [], syntaxError: String(e).split("\n").slice(-3).join("\n") }
  }
  const json = py.runPython(`__deriva_run_tests(${JSON.stringify(JSON.stringify(tests))}, __deriva_ns)`) as string
  return { results: JSON.parse(json) }
}

// ── Tracer (F6) — sys.settrace over the student's own function ──

const TRACER = `
import sys, json

def __deriva_trace(entry_name, arg, budget, ns):
    entry = ns[entry_name]
    events = []
    fids = {}
    state = {"depth": 0, "k": 0, "truncated": False}

    def tracer(frame, event, arg_):
        if state["truncated"]:
            return None
        if frame.f_code is not entry.__code__:
            return None
        if event == "call":
            if len(events) >= budget:
                state["truncated"] = True
                return None
            state["k"] += 1
            fid = "f" + str(state["k"])
            fids[id(frame)] = fid
            nv = frame.f_locals.get("n")
            events.append({"t": "call", "frame": fid, "fn": entry_name,
                           "args": {"n": nv}, "depth": state["depth"]})
            state["depth"] += 1
            return tracer
        if event == "return":
            fid = fids.pop(id(frame), None)
            if fid is None:
                return None
            state["depth"] -= 1
            events.append({"t": "return", "frame": fid, "value": arg_})
            return tracer
        return None

    sys.settrace(tracer)
    error = None
    try:
        result = entry(arg)
    except RecursionError:
        result = None
        error = "RecursionError — the chain never reached its floor."
    except Exception as e:
        result = None
        error = f"{type(e).__name__}: {e}"
    finally:
        sys.settrace(None)
    return json.dumps({"events": events, "result": result,
                       "truncated": state["truncated"], "error": error})
`

export interface TraceRun {
  trace: Trace
  result: unknown
  error: string | null
}

export async function runTraced(
  code: string,
  entryPoint: string,
  arg: number,
  budget: number
): Promise<TraceRun> {
  const py = await getPyodide()
  py.runPython(TRACER)
  py.runPython("__deriva_ns = {}")
  py.runPython(`exec(${JSON.stringify(code)}, __deriva_ns)`)
  const json = py.runPython(
    `__deriva_trace(${JSON.stringify(entryPoint)}, ${arg}, ${budget}, __deriva_ns)`
  ) as string
  const parsed = JSON.parse(json) as { events: TraceEvent[]; result: unknown; truncated: boolean; error: string | null }
  return {
    trace: {
      version: 1,
      language: "python",
      source: code,
      input: { n: arg },
      events: parsed.events,
      budget: { maxEvents: budget, truncated: parsed.truncated },
    },
    result: parsed.result,
    error: parsed.error,
  }
}
