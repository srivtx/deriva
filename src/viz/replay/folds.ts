// Replay folds — pure reducers: (events, cursor) → panel model (05 §4.3)
// No React, no execution — golden-trace testable in Vitest without a browser.

import type { TraceEvent } from "@/execution/trace/types"

export interface StackFrameModel {
  frame: string
  fn: string
  arg: number | null
  depth: number
  status: "active" | "settled"
  returnValue?: number | null
}

export interface CallStackModel {
  stack: StackFrameModel[]      // bottom → top (top = currently executing)
  calls: number
  returns: number
  caption: string               // narrated line — also the screen-reader track (09 §6)
}

function num(v: unknown): number | null {
  if (typeof v === "number") return v
  if (v && typeof v === "object" && "value" in (v as Record<string, unknown>)) {
    const inner = (v as { value: unknown }).value
    return typeof inner === "number" ? inner : null
  }
  return null
}

export function foldCallStack(events: TraceEvent[], cursor: number): CallStackModel {
  const stack: StackFrameModel[] = []
  const byFrame = new Map<string, StackFrameModel>()
  let calls = 0
  let returns = 0
  let caption = "Ready."

  const end = Math.min(cursor, events.length)
  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t === "call") {
      calls++
      const arg = num(e.args?.n)
      const model: StackFrameModel = { frame: e.frame, fn: e.fn, arg, depth: e.depth, status: "active" }
      stack.push(model)
      byFrame.set(e.frame, model)
      caption = `${e.fn}(${arg ?? "?"}) called — waiting on ${e.fn}(${(arg ?? 1) - 1})…`
    } else if (e.t === "return") {
      returns++
      const value = num(e.value)
      // Pop the topmost active frame (the one returning)
      const top = stack[stack.length - 1]
      if (top) {
        top.status = "settled"
        top.returnValue = value
        caption = `${top.fn}(${top.arg ?? "?"}) returned ${value ?? "?"}`
        stack.pop()
        if (stack.length === 0) caption += " — the chain is empty. Done."
      } else {
        caption = `returned ${value ?? "?"}`
      }
    }
  }
  return { stack, calls, returns, caption }
}

// ── AI/ML folds (docs/13 Step 4) — pure reducers over semantic events ──

export interface DatasetFoldModel {
  accepted: number[]                  // row indexes accepted so far
  rejected: { rowId: number; reason: string }[]
  byReason: Record<string, number>
  caption: string                     // narrated line — also the a11y track
}

export function foldDataset(events: TraceEvent[], cursor: number): DatasetFoldModel {
  const accepted: number[] = []
  const rejected: { rowId: number; reason: string }[] = []
  const byReason: Record<string, number> = {}
  let caption = "Ready — validation hasn't run yet."

  const end = Math.min(cursor, events.length)
  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    if (e.op.kind === "data.accept") {
      accepted.push(e.op.rowId)
      caption = `row ${e.op.rowId} accepted — label present, not a duplicate, not reserved`
    } else if (e.op.kind === "data.reject") {
      rejected.push({ rowId: e.op.rowId, reason: e.op.reason })
      byReason[e.op.reason] = (byReason[e.op.reason] ?? 0) + 1
      caption = `row ${e.op.rowId} rejected — ${e.op.reason}`
    }
  }
  return {
    accepted,
    rejected,
    byReason,
    caption: end === 0 ? caption : `${caption} · ${accepted.length} accepted, ${rejected.length} rejected`,
  }
}

export interface RequestFoldItem {
  requestId: string
  started: boolean
  ended: boolean
  status?: number
  latencyMs?: number
}

// Request lifecycle fold: start/end order and latency are preserved; an item
// is in-flight until its end event appears.
export function foldRequests(events: TraceEvent[], cursor: number): RequestFoldItem[] {
  const byId = new Map<string, RequestFoldItem>()
  const order: string[] = []
  const end = Math.min(cursor, events.length)
  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    if (e.op.kind === "request.start") {
      if (!byId.has(e.op.requestId)) order.push(e.op.requestId)
      byId.set(e.op.requestId, { requestId: e.op.requestId, started: true, ended: false })
    } else if (e.op.kind === "request.end") {
      const item = byId.get(e.op.requestId)
      if (item) {
        item.ended = true
        item.status = e.op.status
        item.latencyMs = e.op.latencyMs
      } else {
        byId.set(e.op.requestId, { requestId: e.op.requestId, started: false, ended: true, status: e.op.status, latencyMs: e.op.latencyMs })
        order.push(e.op.requestId)
      }
    }
  }
  return order.map(id => byId.get(id)!)
}

// Systems-project trace fold (system-ai/ml-projects-plan.md §Fixtures/traces).
// Pure: buckets semantic events by kind, narrates the last one at the cursor.
export interface ProjectTraceFold {
  counts: Record<string, number>
  byReason: Record<string, number>
  caption: string
}

export function foldProjectEvents(events: TraceEvent[], cursor: number): ProjectTraceFold {
  const counts: Record<string, number> = {}
  const byReason: Record<string, number> = {}
  let caption = "Ready — no run yet."
  const end = Math.min(cursor, events.length)

  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    const kind = e.op.kind
    counts[kind] = (counts[kind] ?? 0) + 1
    if ("reason" in e.op && e.op.reason) {
      byReason[e.op.reason] = (byReason[e.op.reason] ?? 0) + 1
    }
    if (kind === "data.accept") {
      caption = `step ${i} · row ${(e.op as { rowId: number }).rowId} accepted`
    } else if (kind === "data.reject") {
      caption = `step ${i} · row ${(e.op as { rowId: number }).rowId} rejected: ${(e.op as { reason: string }).reason}`
    } else if (kind === "data.split") {
      caption = `step ${i} · row ${(e.op as { rowId: number }).rowId} → ${(e.op as { split: string }).split}`
    } else if (kind === "data.version") {
      caption = `step ${i} · release version ${(e.op as { version: string }).version}`
    } else {
      caption = `step ${i} · ${kind}`
    }
  }
  return { counts, byReason, caption: end === 0 ? caption : `${caption} · ${end} events seen` }
}

// ── Systems Atelier folds (system-ai/systems-atelier-plan.md §Observation) ──
// Pure: the distributed request path, derived metrics, and the per-second
// series — computed once from the run's event log. No execution, no React.

export interface SimulationHop {
  spanId: string
  parentId: string | null
  component: string
  status: number
  latencyMs: number
  depth: number
  startAt: number
}

export interface SimulationRequestModel {
  requestId: string
  status: number
  latencyMs: number
  at: number
  hops: SimulationHop[]
  attempts: number
}

export interface SimulationSeriesBucket {
  second: number
  arrivals: number
  completions: number
  errors: number
  queueDepth: number
}

export interface SimulationMetrics {
  arrivals: number
  completed: number
  apiCalls: number
  contractRejects: number
  errorRate: number
  latencyMs: { p50: number; p95: number; p99: number; max: number }
  cache: { hits: number; misses: number; hitRatio: number }
  maxAttemptsPerRequest: number
  timeoutCount: number
  queueDepthMax: number
  queueDepthByQueue: Record<string, number>
  components: Record<string, {
    requests: number
    errors: number
    retries: number
    latencyMs: { p50: number; p99: number }
  }>
}

export interface SimulationFold {
  requests: SimulationRequestModel[]
  metrics: SimulationMetrics
  series: SimulationSeriesBucket[]
  status: "complete" | "empty" | "error" | "truncated"
  eligible: boolean
}

export interface SimulationRunValidity {
  error?: string | null
  truncated?: boolean
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1))
  return sorted[index]!
}

function hopAt(op: { kind: string } & Record<string, unknown>): number {
  return typeof op.at === "number" ? op.at : 0
}

export function foldSimulation(events: TraceEvent[], cursor: number, validity: SimulationRunValidity = {}): SimulationFold {
  const end = Math.min(cursor, events.length)
  const requests: SimulationRequestModel[] = []
  const byId = new Map<string, SimulationRequestModel>()
  const stacks = new Map<string, { spanId: string; component: string; depth: number }[]>()
  const attemptsByRequest = new Map<string, number>()
  const arrivalAt = new Map<string, number>()
  const bucketSeconds = new Map<number, SimulationSeriesBucket>()
  let arrivalCount = 0

  let queueDepth = 0
  const queueDepthCurrentByQueue: Record<string, number> = {}
  const queueDepthMaxByQueue: Record<string, number> = {}
  const queueDepthMax = { value: 0 }
  const cache = { hits: 0, misses: 0 }
  const componentLatency: Record<string, number[]> = {}
  const componentErrors: Record<string, number> = {}
  const componentRetries: Record<string, number> = {}
  const componentRequests: Record<string, number> = {}
  const timeoutCount = { value: 0 }
  const attemptsMax = { value: 0 }
  const apiCallCount = { value: 0 }
  const contractRejectCount = { value: 0 }

  const bucket = (at: number) => {
    const second = Math.floor(at / 1000)
    let model = bucketSeconds.get(second)
    if (!model) {
      model = { second, arrivals: 0, completions: 0, errors: 0, queueDepth: 0 }
      bucketSeconds.set(second, model)
    }
    return model
  }

  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    const op = e.op
    const at = hopAt(op as { kind: string } & Record<string, unknown>)
    const bucketModel = bucket(at)

    if (op.kind === "load.arrival") {
      arrivalAt.set(op.requestId, at)
      arrivalCount++
      bucketModel.arrivals++
    } else if (op.kind === "request.start") {
      let stack = stacks.get(op.requestId)
      if (!stack) {
        stack = []
        stacks.set(op.requestId, stack)
        byId.set(op.requestId, { requestId: op.requestId, status: 0, latencyMs: 0, at: 0, hops: [], attempts: 0 })
      }
      const depth = stack.length
      const model = byId.get(op.requestId)!
      const spanId = op.spanId ?? `${op.requestId}:${op.component ?? "?"}:${model.hops.length}`
      stack.push({ spanId, component: op.component ?? "?", depth })
      if (depth === 0) attemptsByRequest.set(op.requestId, 1)
      model.hops.push({ spanId, parentId: op.parentId ?? null, component: op.component ?? "?", status: 0, latencyMs: 0, depth, startAt: at })
      model.at = arrivalAt.get(op.requestId) ?? at
    } else if (op.kind === "request.end") {
      const stack = stacks.get(op.requestId)
      const open = stack?.pop()
      const model = byId.get(op.requestId)
      if (open && model) {
        const hop = model.hops.find(candidate => candidate.spanId === (op.spanId ?? open.spanId) && candidate.status === 0)
        if (hop) {
          hop.status = op.status
          hop.latencyMs = op.latencyMs
        }
        if (stack!.length === 0) {
          model.status = op.status
          model.latencyMs = op.latencyMs
          model.attempts = attemptsByRequest.get(op.requestId) ?? 0
          requests.push(model)
          bucketModel.completions++
          if (op.status !== 200) {
            bucketModel.errors++
            if (op.status === 504) timeoutCount.value++
          }
        }
      }
    } else if (op.kind === "retry.attempt") {
      attemptsByRequest.set(op.requestId, Math.max(attemptsByRequest.get(op.requestId) ?? 1, op.attempt))
      attemptsMax.value = Math.max(attemptsMax.value, op.attempt)
      componentRetries[op.target] = (componentRetries[op.target] ?? 0) + 1
    } else if (op.kind === "api.request") {
      apiCallCount.value++
    } else if (op.kind === "contract.reject") {
      contractRejectCount.value++
    } else if (op.kind === "cache.hit") {
      cache.hits++
    } else if (op.kind === "cache.miss") {
      cache.misses++
    } else if (op.kind === "queue.enqueue") {
      queueDepth++
      queueDepthCurrentByQueue[op.queue] = (queueDepthCurrentByQueue[op.queue] ?? 0) + 1
      queueDepthMax.value = Math.max(queueDepthMax.value, queueDepth)
      queueDepthMaxByQueue[op.queue] = Math.max(queueDepthMaxByQueue[op.queue] ?? 0, queueDepthCurrentByQueue[op.queue])
      bucketModel.queueDepth = Math.max(bucketModel.queueDepth, queueDepth)
    } else if (op.kind === "queue.dequeue") {
      queueDepth = Math.max(0, queueDepth - 1)
      queueDepthCurrentByQueue[op.queue] = Math.max(0, (queueDepthCurrentByQueue[op.queue] ?? 0) - 1)
      bucketModel.queueDepth = Math.max(bucketModel.queueDepth, queueDepth)
    } else if (op.kind === "failure.detected") {
      // failures are already attributed via hop statuses; the category informs nothing structural here
    }
  }

  // attribute per-component aggregates from hops
  for (const model of requests) {
    for (const hop of model.hops) {
      const latencies = componentLatency[hop.component] ?? (componentLatency[hop.component] = [])
      latencies.push(hop.latencyMs)
      componentRequests[hop.component] = (componentRequests[hop.component] ?? 0) + 1
      if (hop.status !== 200 && hop.status !== 0) componentErrors[hop.component] = (componentErrors[hop.component] ?? 0) + 1
    }
  }

  const allLatencies = requests.map(request => request.latencyMs).sort((a, b) => a - b)
  const metrics: SimulationMetrics = {
    arrivals: arrivalCount,
    completed: requests.length,
    apiCalls: apiCallCount.value,
    contractRejects: contractRejectCount.value,
    errorRate: requests.length === 0 ? 0 : requests.filter(request => request.status !== 200).length / requests.length,
    latencyMs: {
      p50: percentile(allLatencies, 0.5),
      p95: percentile(allLatencies, 0.95),
      p99: percentile(allLatencies, 0.99),
      max: allLatencies[allLatencies.length - 1] ?? 0,
    },
    cache: {
      hits: cache.hits,
      misses: cache.misses,
      hitRatio: cache.hits + cache.misses === 0 ? 0 : cache.hits / (cache.hits + cache.misses),
    },
    maxAttemptsPerRequest: attemptsMax.value,
    timeoutCount: timeoutCount.value,
    queueDepthMax: queueDepthMax.value,
    queueDepthByQueue: queueDepthMaxByQueue,
    components: Object.fromEntries(Object.entries(componentLatency).map(([component, values]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return [component, {
        requests: componentRequests[component] ?? 0,
        errors: componentErrors[component] ?? 0,
        retries: componentRetries[component] ?? 0,
        latencyMs: { p50: percentile(sorted, 0.5), p99: percentile(sorted, 0.99) },
      }]
    })),
  }

  const series = [...bucketSeconds.values()].sort((a, b) => a.second - b.second)
  const status = validity.error ? "error" : validity.truncated ? "truncated" : requests.length === 0 ? "empty" : "complete"
  return { requests, metrics, series, status, eligible: status === "complete" }
}

export interface GateResult {
  name: string
  invariant: string
  metric: string
  op: string
  value: number
  actual: number
  passed: boolean
  eligible: boolean
  reason?: string
}

export function evaluateSystemGates(
  gates: { metric: string; op: string; value: number; name: string; invariant: string }[],
  metrics: SimulationMetrics,
  eligible = true,
): GateResult[] {
  return gates.map(gate => {
    let actual: number
    switch (gate.metric) {
      case "p50Ms": actual = metrics.latencyMs.p50; break
      case "p95Ms": actual = metrics.latencyMs.p95; break
      case "p99Ms": actual = metrics.latencyMs.p99; break
      case "errorRate": actual = metrics.errorRate; break
      case "cacheHitRatio": actual = metrics.cache.hitRatio; break
      case "maxAttemptsPerRequest": actual = metrics.maxAttemptsPerRequest; break
      case "timeoutCount": actual = metrics.timeoutCount; break
      default: actual = 0
    }
    const passed = eligible && (gate.op === "<=" ? actual <= gate.value : actual >= gate.value)
    return { name: gate.name, invariant: gate.invariant, metric: gate.metric, op: gate.op, value: gate.value, actual, passed, eligible, reason: eligible ? undefined : "run is not complete" }
  })
}
