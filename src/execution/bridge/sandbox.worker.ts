// @ts-nocheck
// Pyodide sandbox worker. Student code never executes on the main thread.

import type { WorkerMessage, WorkerResponse } from "../bridge/worker-client"
import type { Trace } from "../trace/types"

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope
const PYODIDE_VERSION = "0.25.0"
const PYODIDE_SCRIPT = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

let pyodide: any = null

async function loadPyodide() {
  if (pyodide) return pyodide
  if (!ctx.loadPyodide) ctx.importScripts(PYODIDE_SCRIPT)
  if (!ctx.loadPyodide) throw new Error("Pyodide failed to load inside the worker")
  pyodide = await ctx.loadPyodide({ indexURL: PYODIDE_INDEX })
  return pyodide
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
            out.append({"call": t["call"], "expect": t["expect"], "got": None, "ok": False,
                        "error": f"{type(e).__name__}: {e}"})
    return json.dumps(out)
`

async function runScript(msg: Extract<WorkerMessage, { type: "runScript" }>) {
  const py = await loadPyodide()
  const source = [msg.setup, msg.code, msg.testCode].filter(Boolean).join("\n\n")
  py.runPython(`import io, sys\n__deriva_out = io.StringIO()\nsys.stdout = __deriva_out\nsys.stderr = __deriva_out`)
  try {
    py.runPython(source)
    const output = py.runPython("__deriva_out.getvalue()") as string
    ctx.postMessage({ type: "script-result", id: msg.id, output: output || "No output.", error: null } satisfies WorkerResponse)
  } catch (error) {
    const output = py.runPython("__deriva_out.getvalue()") as string
    ctx.postMessage({ type: "script-result", id: msg.id, output, error: String(error) } satisfies WorkerResponse)
  }
}

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
        if len(events) >= budget:
            state["truncated"] = True
            return None
        if event == "call":
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
        return tracer

    sys.settrace(tracer)
    error = None
    result = None
    try:
        result = entry(arg)
    except RecursionError:
        error = "RecursionError — the chain never reached its floor."
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
    finally:
        sys.settrace(None)
    return json.dumps({"events": events, "result": result,
                       "truncated": state["truncated"], "error": error})
`

// AI/ML lab tracer (docs/13 Step 4/6). Semantic events are emitted by the
// lesson's own code through __deriva_emit — the visualizer never re-executes.
const AI_TRACER = `
import sys, json

def __deriva_trace(entry_name, payload_json, budget, ns):
    payload = json.loads(payload_json)
    entry = ns[entry_name]
    events = []
    fids = {}
    state = {"depth": 0, "k": 0, "truncated": False}

    def emit(op, **kw):
        if state["truncated"]:
            return
        if len(events) >= budget:
            state["truncated"] = True
            return
        events.append({"t": "structure", "op": {"kind": op, **kw}})

    ns["__deriva_emit"] = emit

    def tracer(frame, event, arg_):
        if state["truncated"]:
            return None
        if frame.f_code is not entry.__code__:
            return None
        if len(events) >= budget:
            state["truncated"] = True
            return None
        if event == "call":
            state["k"] += 1
            fid = "f" + str(state["k"])
            fids[id(frame)] = fid
            events.append({"t": "call", "frame": fid, "fn": entry_name,
                           "args": {"rows": len(payload)}, "depth": state["depth"]})
            state["depth"] += 1
            return tracer
        if event == "return":
            fid = fids.pop(id(frame), None)
            if fid is None:
                return None
            state["depth"] -= 1
            events.append({"t": "return", "frame": fid, "value": arg_})
            return tracer
        return tracer

    sys.settrace(tracer)
    error = None
    result = None
    try:
        result = entry(payload)
    except RecursionError:
        error = "RecursionError — the chain never reached its floor."
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
    finally:
        sys.settrace(None)
    return json.dumps({"events": events, "result": result,
                       "truncated": state["truncated"], "error": error})
`

async function runTests(msg: Extract<WorkerMessage, { type: "runTests" }>) {
  const py = await loadPyodide()
  py.runPython(TEST_RUNNER)
  py.runPython("__deriva_ns = {}")
  try {
    py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  } catch (error) {
    ctx.postMessage({ type: "test-result", id: msg.id, results: [], syntaxError: String(error).split("\\n").slice(-3).join("\\n") } satisfies WorkerResponse)
    return
  }
  const json = py.runPython(`__deriva_run_tests(${JSON.stringify(JSON.stringify(msg.tests))}, __deriva_ns)`)
  ctx.postMessage({ type: "test-result", id: msg.id, results: JSON.parse(json) } satisfies WorkerResponse)
}

async function runTrace(msg: Extract<WorkerMessage, { type: "runTrace" }>) {
  const py = await loadPyodide()
  py.runPython(TRACER)
  py.runPython("__deriva_ns = {}")
  py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  const json = py.runPython(`__deriva_trace(${JSON.stringify(msg.entryPoint)}, ${msg.arg}, ${msg.budget}, __deriva_ns)`)
  const parsed = JSON.parse(json)
  const trace: Trace = {
    version: 1,
    language: "python",
    source: msg.code,
    input: { n: msg.arg },
    events: parsed.events,
    budget: { maxEvents: msg.budget, truncated: parsed.truncated },
  }
  ctx.postMessage({ type: "trace", id: msg.id, trace, result: parsed.result, error: parsed.error } satisfies WorkerResponse)
}

async function runAiTrace(msg: Extract<WorkerMessage, { type: "runAiTrace" }>) {
  const py = await loadPyodide()
  py.runPython(AI_TRACER)
  py.runPython("__deriva_ns = {}")
  py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  const json = py.runPython(`__deriva_trace(${JSON.stringify(msg.entryPoint)}, ${JSON.stringify(JSON.stringify(msg.payload))}, ${msg.budget}, __deriva_ns)`)
  const parsed = JSON.parse(json)
  const trace: Trace = {
    version: 1,
    language: "python",
    source: msg.code,
    input: msg.payload,
    events: parsed.events,
    budget: { maxEvents: msg.budget, truncated: parsed.truncated },
  }
  ctx.postMessage({ type: "trace", id: msg.id, trace, result: parsed.result, error: parsed.error } satisfies WorkerResponse)
}

ctx.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data
  try {
    if (msg.type === "warmup") {
      await loadPyodide()
      ctx.postMessage({ type: "ready", id: msg.id } satisfies WorkerResponse)
    } else if (msg.type === "runTests") {
      await runTests(msg)
    } else if (msg.type === "runScript") {
      await runScript(msg)
    } else if (msg.type === "runTrace") {
      await runTrace(msg)
    } else if (msg.type === "runAiTrace") {
      await runAiTrace(msg)
    }
  } catch (error) {
    ctx.postMessage({ type: "error", id: msg.id, message: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse)
  }
}
