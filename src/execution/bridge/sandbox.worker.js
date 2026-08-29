// Pyodide sandbox worker — PLAIN JAVASCRIPT ON PURPOSE.
// `new Worker(new URL("./sandbox.worker.js", import.meta.url))` must survive the
// production bundle: Turbopack emits `new URL(...)` targets as raw static media
// files, and a raw .ts file is not executable — the worker died instantly on the
// deployed site while dev (which compiles on request) worked. Raw .js is valid
// input for the Worker constructor in both modes. Keep this file free of
// imports and TypeScript syntax; it is served verbatim.

const PYODIDE_VERSION = "0.25.0"
const PYODIDE_SCRIPT = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

const ctx = self

// Surface async failures that never reach the message try/catch — without this
// the client only sees an empty onerror and nobody can diagnose the crash.
self.addEventListener("unhandledrejection", (event) => {
  ctx.postMessage({ type: "error", message: "sandbox promise rejected: " + String(event.reason) })
})
self.addEventListener("error", (event) => {
  ctx.postMessage({ type: "error", message: "sandbox top-level error: " + (event.message || "unknown") + (event.filename ? ` (${event.filename}:${event.lineno})` : "") })
})

let pyodide = null

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

async function runScript(msg) {
  const py = await loadPyodide()
  const source = [msg.setup, msg.code, msg.testCode].filter(Boolean).join("\n\n")
  // sqlite3 is unvendored in Pyodide 0.25 — load it only when a script needs it
  // (the DB ladder), so every other drill keeps its zero-extra-download warmup.
  if (source.includes("sqlite3")) {
    await py.loadPackage("sqlite3")
  }
  py.runPython(`import io, sys\n__deriva_out = io.StringIO()\nsys.stdout = __deriva_out\nsys.stderr = __deriva_out`)
  try {
    py.runPython(source)
    const output = py.runPython("__deriva_out.getvalue()")
    ctx.postMessage({ type: "script-result", id: msg.id, output: output || "No output.", error: null })
  } catch (error) {
    const output = py.runPython("__deriva_out.getvalue()")
    ctx.postMessage({ type: "script-result", id: msg.id, output, error: String(error) })
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

async function runTests(msg) {
  const py = await loadPyodide()
  py.runPython(TEST_RUNNER)
  py.runPython("__deriva_ns = {}")
  try {
    py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  } catch (error) {
    ctx.postMessage({ type: "test-result", id: msg.id, results: [], syntaxError: String(error).split("\\n").slice(-3).join("\\n") })
    return
  }
  const json = py.runPython(`__deriva_run_tests(${JSON.stringify(JSON.stringify(msg.tests))}, __deriva_ns)`)
  ctx.postMessage({ type: "test-result", id: msg.id, results: JSON.parse(json) })
}

async function runTrace(msg) {
  const py = await loadPyodide()
  py.runPython(TRACER)
  py.runPython("__deriva_ns = {}")
  py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  const json = py.runPython(`__deriva_trace(${JSON.stringify(msg.entryPoint)}, ${msg.arg}, ${msg.budget}, __deriva_ns)`)
  const parsed = JSON.parse(json)
  const trace = {
    version: 1,
    language: "python",
    source: msg.code,
    input: { n: msg.arg },
    events: parsed.events,
    budget: { maxEvents: msg.budget, truncated: parsed.truncated },
  }
  ctx.postMessage({ type: "trace", id: msg.id, trace, result: parsed.result, error: parsed.error })
}

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

async function runAiTrace(msg) {
  const py = await loadPyodide()
  py.runPython(AI_TRACER)
  py.runPython("__deriva_ns = {}")
  py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  const json = py.runPython(`__deriva_trace(${JSON.stringify(msg.entryPoint)}, ${JSON.stringify(JSON.stringify(msg.payload))}, ${msg.budget}, __deriva_ns)`)
  const parsed = JSON.parse(json)
  const trace = {
    version: 1,
    language: "python",
    source: msg.code,
    input: msg.payload,
    events: parsed.events,
    budget: { maxEvents: msg.budget, truncated: parsed.truncated },
  }
  ctx.postMessage({ type: "trace", id: msg.id, trace, result: parsed.result, error: parsed.error })
}

// Systems Atelier simulation runner — deterministic load shape over the
// learner's handlers; metrics fold on the client.
const SIM_RUNTIME = `
import json, math, random

HOP_OVERHEAD_MS = 2
NINETY_NINE = 2.326  # z-score for p99 of a normal

class SimRuntimeError(Exception):
    pass

class Timeout(SimRuntimeError):
    pass

class Unavailable(SimRuntimeError):
    pass

class ContractRejected(SimRuntimeError):
    pass

class RateLimited(SimRuntimeError):
    pass

class Simulation:
    def __init__(self, ns, scenario, latency_rng, failure_rng, budget):
        self.ns = ns
        self.scenario = scenario
        self.latency_rng = latency_rng
        self.failure_rng = failure_rng
        self.budget = budget
        self.interventions = scenario.get("interventions") or {}
        self.now = 0
        self.events = []
        self.truncated = False
        self.span_counter = 0
        self.breakers = {}
        self.admission_counts = {}
        self.components = {}
        for comp in scenario["components"]:
            self.components[comp["id"]] = comp
            handler = ns.get(comp["handler"])
            if handler is None:
                raise SimRuntimeError("missing handler for component %r: define %s(request, ctx)" % (comp["id"], comp["handler"]))
        if scenario["rootComponent"] not in self.components:
            raise SimRuntimeError("root component %r is not declared" % scenario["rootComponent"])
        policy = ns.get("POLICY") or {}
        cache_cfg = policy.get("cache") or {}
        self.cache = Cache(self, int(cache_cfg.get("capacity", 0)), str(cache_cfg.get("eviction", "lru")))
        circuit_cfg = policy.get("circuit") or {}
        self.circuit_threshold = int(circuit_cfg.get("threshold", 0))
        self.queues = {}
        shape = scenario["loadShape"]
        self.end_ms = int(shape["simSeconds"] * 1000) + 30_000

    def new_span_id(self, request_id):
        self.span_counter += 1
        return "%s:call-%d" % (request_id, self.span_counter)

    def emit(self, kind, **kw):
        if self.truncated:
            return
        if len(self.events) >= self.budget:
            self.truncated = True
            return
        kw.setdefault("at", self.now)
        self.events.append({"t": "structure", "op": {"kind": kind, **kw}})

    def sleep(self, ms):
        if ms < 0:
            ms = 0
        self.now += ms
        if self.now > self.end_ms:
            raise SimRuntimeError("simulation clock exceeded its window; a handler is sleeping forever")

    def latency_sample(self, comp):
        mean = math.log(comp["latency"]["p50"])
        sigma = math.log(comp["latency"]["p99"] / comp["latency"]["p50"]) / NINETY_NINE
        z = self.latency_rng.gauss(0, 1)
        multiplier = float((self.interventions.get("latencyMultiplierOverrides") or {}).get(comp["id"], 1.0))
        return HOP_OVERHEAD_MS + max(0.5, math.exp(mean + sigma * z) * max(0.1, multiplier))

    def failure_rate(self, comp):
        overrides = self.interventions.get("failureRateOverrides") or {}
        if comp["id"] in overrides:
            return float(overrides[comp["id"]])
        base = float(comp.get("failureRate", 0.0))
        win = comp.get("failureWindow")
        if win and win["from"] <= self.now / 1000.0 < win.get("until", 10 ** 9):
            return float(win.get("rate", base))
        return base

    def queue(self, name):
        if name not in self.queues:
            self.queues[name] = SimQueue(self, name)
        return self.queues[name]


class Circuit:
    def __init__(self, sim, target, threshold):
        self.sim = sim
        self.target = target
        self.threshold = threshold
        self.consecutive = 0
        self.open_ = False

    def is_open(self):
        return self.open_

    def record_failure(self):
        if self.open_:
            return
        if self.threshold > 0:
            self.consecutive += 1
            if self.consecutive >= self.threshold:
                self.open_ = True
                self.sim.emit("circuit.open", target=self.target)

    def record_success(self):
        if self.open_:
            self.open_ = False
            self.sim.emit("circuit.close", target=self.target)
        self.consecutive = 0

    def open(self):
        if not self.open_:
            self.open_ = True
            self.sim.emit("circuit.open", target=self.target)

    def close(self):
        if self.open_:
            self.open_ = False
            self.sim.emit("circuit.close", target=self.target)
        self.consecutive = 0


class Cache:
    def __init__(self, sim, capacity, eviction):
        self.sim = sim
        self.capacity = capacity
        self.eviction = eviction
        self.items = {}
        self.order = []

    def get(self, key):
        if self.capacity <= 0:
            self.sim.emit("cache.miss", key=key)
            return None
        entry = self.items.get(key)
        if entry is None:
            self.sim.emit("cache.miss", key=key)
            return None
        value, expires = entry
        if expires is not None and self.sim.now >= expires:
            self._drop(key)
            self.sim.emit("cache.miss", key=key)
            return None
        if self.eviction == "lru":
            self.order.remove(key)
            self.order.append(key)
        self.sim.emit("cache.hit", key=key)
        return value

    def set(self, key, value, ttl_s=None):
        if self.capacity <= 0:
            return
        expires = None
        if ttl_s is not None:
            expires = self.sim.now + int(ttl_s * 1000)
        if key not in self.items:
            if len(self.items) >= self.capacity:
                victim = self.order.pop(0) if self.order else next(iter(self.items))
                self._drop(victim)
            self.order.append(key)
        elif self.eviction == "lru":
            self.order.remove(key)
            self.order.append(key)
        self.items[key] = [value, expires]

    def _drop(self, key):
        self.items.pop(key, None)
        if key in self.order:
            self.order.remove(key)


class SimQueue:
    def __init__(self, sim, name):
        self.sim = sim
        self.name = name
        self.items = []

    def enqueue(self, item):
        self.items.append(item)
        self.sim.emit("queue.enqueue", queue=self.name, item=item)

    def dequeue(self):
        if not self.items:
            return None
        item = self.items.pop(0)
        self.sim.emit("queue.dequeue", queue=self.name, item=item)
        return item

    def depth(self):
        return len(self.items)


class Ctx:
    def __init__(self, sim, request_id, span_id):
        self.sim = sim
        self.request_id = request_id
        self.span_id = span_id
        self.breakers = {}

    def emit(self, kind, **kw):
        self.sim.emit(kind, **kw)

    def admit(self, name, per_second):
        second = int(self.sim.now // 1000)
        key = (str(name), second)
        count = self.sim.admission_counts.get(key, 0)
        limit = max(1, int(per_second))
        if count >= limit:
            self.sim.emit("admission.reject", name=str(name), limit=limit)
            raise RateLimited("%s admission limit reached" % name)
        self.sim.admission_counts[key] = count + 1
        self.sim.emit("admission.accept", name=str(name), limit=limit)
        return True

    def now(self):
        return self.sim.now

    def sleep(self, ms):
        self.sim.sleep(ms)

    def call(self, target, payload, timeout_ms=None, api_version=None):
        sim = self.sim
        comp = sim.components.get(target)
        if comp is None:
            raise SimRuntimeError("ctx.call to unknown target %r" % target)
        span_id = sim.new_span_id(self.request_id)
        breaker = self.breaker(target)
        expected_version = comp["api"]["version"]
        sent_version = api_version or "unspecified"
        sim.emit("request.start", requestId=self.request_id, spanId=span_id, component=target, parentId=self.span_id)
        sim.emit("api.request", requestId=self.request_id, spanId=span_id, target=target, version=sent_version)
        start = sim.now
        missing = [field for field in comp["api"]["requestFields"] if field not in payload]
        if missing or sent_version != expected_version:
            reason = "missing request fields: %s" % ", ".join(missing) if missing else "expected version %s, got %s" % (expected_version, sent_version)
            status = 400 if missing else 409
            sim.emit("contract.reject", requestId=self.request_id, spanId=span_id, target=target, side="request", reason=reason)
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=status)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=status, latencyMs=0)
            raise ContractRejected("%s request contract: %s" % (target, reason))
        if breaker.is_open():
            sim.sleep(1)
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=503)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=503, latencyMs=sim.now - start)
            raise Unavailable("%s circuit open" % target)
        if sim.failure_rng.random() < sim.failure_rate(comp):
            sim.sleep(1)
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=502)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=502, latencyMs=sim.now - start)
            sim.emit("failure.detected", category="unavailable:%s" % target)
            breaker.record_failure()
            raise Unavailable("%s unavailable" % target)
        latency = sim.latency_sample(comp)
        if timeout_ms is not None and latency > timeout_ms:
            sim.sleep(timeout_ms)
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=504)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=504, latencyMs=sim.now - start)
            sim.emit("failure.detected", category="timeout:%s" % target)
            breaker.record_failure()
            raise Timeout("%s exceeded %sms" % (target, timeout_ms))
        sim.sleep(latency)
        handler = sim.ns[comp["handler"]]
        child_ctx = Ctx(sim, self.request_id, span_id)
        try:
            result = handler(payload, child_ctx)
        except Timeout:
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=504)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=504, latencyMs=sim.now - start)
            breaker.record_failure()
            raise
        except (Unavailable, ContractRejected):
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=503)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=503, latencyMs=sim.now - start)
            breaker.record_failure()
            raise
        except Exception:
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=500)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=500, latencyMs=sim.now - start)
            sim.emit("failure.detected", category="handler-error:%s" % target)
            breaker.record_failure()
            raise
        else:
            missing_response = [field for field in comp["api"]["responseFields"] if not isinstance(result, dict) or field not in result]
            if not missing_response and "version" in comp["api"]["responseFields"] and result.get("version") != expected_version:
                missing_response = ["version=%s (expected %s)" % (result.get("version"), expected_version)]
            if missing_response:
                reason = "missing response fields: %s" % ", ".join(missing_response)
                sim.emit("contract.reject", requestId=self.request_id, spanId=span_id, target=target, side="response", reason=reason)
                sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=502)
                sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=502, latencyMs=sim.now - start)
                sim.emit("failure.detected", category="contract:%s" % target)
                breaker.record_failure()
                raise ContractRejected("%s response contract: %s" % (target, reason))
            breaker.record_success()
            sim.emit("api.response", requestId=self.request_id, spanId=span_id, target=target, version=expected_version, status=200)
            sim.emit("request.end", requestId=self.request_id, spanId=span_id, status=200, latencyMs=sim.now - start)
            return result

    def call_with_retry(self, target, payload, timeout_ms=None, max_attempts=3, backoff_ms=100, api_version=None):
        last = None
        for attempt in range(1, max_attempts + 1):
            if attempt > 1:
                self.sim.emit("retry.attempt", requestId=self.request_id, target=target, attempt=attempt)
                self.sim.sleep(backoff_ms * (attempt - 1))
            try:
                return self.call(target, payload, timeout_ms=timeout_ms, api_version=api_version)
            except (Timeout, Unavailable, ContractRejected) as error:
                last = error
        if last is not None:
            raise last
        raise SimRuntimeError("call_with_retry needs max_attempts >= 1")

    def breaker(self, target):
        if target not in self.sim.breakers:
            self.sim.breakers[target] = Circuit(self.sim, target, self.sim.circuit_threshold)
        return self.sim.breakers[target]

    def circuit(self, target):
        return self.breaker(target)

    def cache_get(self, key):
        return self.sim.cache.get(key)

    def cache_set(self, key, value, ttl_s=None):
        self.sim.cache.set(key, value, ttl_s)

    def enqueue(self, queue_name, item):
        self.sim.queue(queue_name).enqueue(item)

    def dequeue(self, queue_name, poll_ms=None):
        queue = self.sim.queue(queue_name)
        while True:
            item = queue.dequeue()
            if item is not None:
                return item
            if poll_ms is None:
                return None
            self.sim.sleep(poll_ms)
            if self.sim.now > self.sim.end_ms:
                return None


def __deriva_arrival_times(shape, rng, interventions=None):
    times = []
    now = 0.0
    interventions = interventions or {}
    traffic_multiplier = max(0.25, float(interventions.get("trafficMultiplier", 1.0)))
    base = float(shape["baseRate"]) * traffic_multiplier
    burst = shape.get("burst")
    sim_seconds = float(shape["simSeconds"])
    max_requests = int(shape.get("maxRequests", 400) * traffic_multiplier)
    while len(times) < max_requests:
        rate = base
        if burst and burst["at"] <= now < burst.get("until", sim_seconds):
            rate = float(burst["rate"])
        now += rng.expovariate(max(rate, 0.01))
        if now >= sim_seconds:
            break
        times.append(int(now * 1000))
    return times


def __deriva_run_simulation(scenario_json, budget, ns):
    scenario = json.loads(scenario_json)
    seed = int(scenario["seed"])
    arrival_rng = random.Random(seed * 3 + 1)
    latency_rng = random.Random(seed * 3 + 2)
    failure_rng = random.Random(seed * 3 + 3)
    sim = Simulation(ns, scenario, latency_rng, failure_rng, budget)
    root_id = scenario["rootComponent"]
    root_handler = sim.ns[sim.components[root_id]["handler"]]
    interventions = scenario.get("interventions") or {}
    for control, value in sorted(interventions.get("failureRateOverrides", {}).items()):
        sim.emit("control.changed", control="failure:%s" % control, value=value)
    for control, value in sorted(interventions.get("latencyMultiplierOverrides", {}).items()):
        sim.emit("control.changed", control="latency:%s" % control, value=value)
    sim.emit("control.changed", control="traffic", value=interventions.get("trafficMultiplier", 1.0))
    arrival_times = __deriva_arrival_times(scenario["loadShape"], arrival_rng, interventions)
    try:
        for index, scheduled_at in enumerate(arrival_times):
            sim.now = max(sim.now, scheduled_at)
            request_id = "r-%03d" % (index + 1)
            sim.emit("load.arrival", requestId=request_id, scheduledAt=scheduled_at)
            if sim.now > scheduled_at:
                sim.emit("queue.wait", requestId=request_id, queue="root", waitMs=sim.now - scheduled_at)
            root_span = request_id + ":root"
            ctx = Ctx(sim, request_id, root_span)
            sim.emit("request.start", requestId=request_id, spanId=root_span, component=root_id, parentId=None)
            root_component = sim.components[root_id]
            root_version = root_component["api"]["version"]
            sim.emit("api.request", requestId=request_id, spanId=root_span, target=root_id, version=root_version)
            start = sim.now
            sim.sleep(sim.latency_sample(sim.components[root_id]))
            payload = {"request_id": request_id, "query": "query-%03d" % (index + 1), "__deriva_request": request_id}
            status = 200
            error = None
            try:
                missing = [field for field in root_component["api"]["requestFields"] if field not in payload]
                if missing:
                    reason = "missing request fields: %s" % ", ".join(missing)
                    sim.emit("contract.reject", requestId=request_id, spanId=root_span, target=root_id, side="request", reason=reason)
                    raise ContractRejected("%s request contract: %s" % (root_id, reason))
                result = root_handler(payload, ctx)
                missing_response = [field for field in root_component["api"]["responseFields"] if not isinstance(result, dict) or field not in result]
                if missing_response:
                    reason = "missing response fields: %s" % ", ".join(missing_response)
                    sim.emit("contract.reject", requestId=request_id, spanId=root_span, target=root_id, side="response", reason=reason)
                    raise ContractRejected("%s response contract: %s" % (root_id, reason))
            except Timeout:
                status = 504
                error = "root timed out"
            except Unavailable:
                status = 503
                error = "dependency unavailable"
            except ContractRejected as contract_error:
                status = 502
                error = str(contract_error)
            except RateLimited as rate_error:
                status = 429
                error = str(rate_error)
            except Exception as exception:
                status = 500
                error = "%s: %s" % (type(exception).__name__, exception)
                sim.emit("failure.detected", category="root-error")
            sim.emit("api.response", requestId=request_id, spanId=root_span, target=root_id, version=root_version, status=status)
            sim.emit("request.end", requestId=request_id, spanId=root_span, status=status, latencyMs=sim.now - scheduled_at)
            if error is not None:
                sim.emit("failure.detected", category=error)
            if sim.truncated:
                break
    except SimRuntimeError as runtime_error:
        return json.dumps({"events": sim.events, "truncated": True, "error": str(runtime_error)})
    return json.dumps({"events": sim.events, "truncated": sim.truncated, "error": None})
`

async function runSimulation(msg) {
  const py = await loadPyodide()
  py.runPython(SIM_RUNTIME)
  py.runPython("__deriva_ns = {}")
  try {
    py.runPython(`exec(${JSON.stringify(msg.code)}, __deriva_ns)`)
  } catch (error) {
    ctx.postMessage({ type: "simulation-result", id: msg.id, events: [], truncated: true, error: String(error).split("\\n").slice(-3).join("\\n") })
    return
  }
  const json = py.runPython(`__deriva_run_simulation(${JSON.stringify(JSON.stringify(msg.scenario))}, ${msg.budget}, __deriva_ns)`)
  const parsed = JSON.parse(json)
  ctx.postMessage({ type: "simulation-result", id: msg.id, events: parsed.events, truncated: parsed.truncated, error: parsed.error })
}

async function warm(msg) {
  const py = await loadPyodide()
  // DB ladder: pull the unvendored sqlite3 package while the user reads the
  // problem, so the first Run executes against a hot sandbox.
  if (msg.sqlite) await py.loadPackage("sqlite3")
  ctx.postMessage({ type: "ready", id: msg.id })
}

ctx.onmessage = async (event) => {
  const msg = event.data
  try {
    if (msg.type === "warmup") {
      await warm(msg)
    } else if (msg.type === "runTests") {
      await runTests(msg)
    } else if (msg.type === "runScript") {
      await runScript(msg)
    } else if (msg.type === "runTrace") {
      await runTrace(msg)
    } else if (msg.type === "runAiTrace") {
      await runAiTrace(msg)
    } else if (msg.type === "runSimulation") {
      await runSimulation(msg)
    }
  } catch (error) {
    ctx.postMessage({ type: "error", id: msg.id, message: error instanceof Error ? error.message : String(error) })
  }
}
