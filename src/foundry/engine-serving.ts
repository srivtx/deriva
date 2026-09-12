// Station 04 — Serving Floor.
// A discrete-event inference-server simulator. Every mechanism is real at
// toy scale: KV cache priced by dtype, prefill chunks at 64 tokens/tick,
// one decode token per tick per active request (memory-bound batches),
// static vs continuous batching, contiguous vs paged KV allocation, OOM
// preemption and queue timeouts. Deterministic — no RNG, only the workload.

export type Dtype = "fp16" | "q8" | "q4"

export const DTYPE_MB_PER_TOKEN: Record<Dtype, number> = {
  fp16: 0.5,
  q8: 0.25,
  q4: 0.125,
}

export const PAGE_TOKENS = 16
export const PREFILL_TOKENS_PER_TICK = 64
export const QUEUE_PATIENCE_TICKS = 150

export type ServingConfig = {
  kvPoolMB: number
  dtype: Dtype
  slots: number
  paging: boolean
  continuous: boolean
}

export type Arrival = { t: number; prefill: number; decode: number }
export type Workload = { arrivals: Arrival[]; patienceTicks?: number }

export type DropReason = "timeout" | "oom" | "kv-preempt"

export type RequestOutcome = {
  id: number
  arrive: number
  firstToken: number | null
  done: number | null
  dropped: DropReason | null
}

export type TickSnapshot = {
  tick: number
  active: number
  queue: number
  kvAllocMB: number
  kvUsedMB: number
  decodedThisTick: number
}

export type ServingResult = {
  ticks: number
  outcomes: RequestOutcome[]
  metrics: {
    served: number
    dropped: number
    dropReasons: Record<string, number>
    throughputTokPerTick: number
    p50TTFT: number
    p99TTFT: number
    p99Latency: number
    kvPeakMB: number
    kvWastePeakMB: number
    avgBatchOccupancy: number
  }
  trace: TickSnapshot[]
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const index = Math.min(sorted.length - 1, Math.floor(q * sorted.length))
  return sorted[index]
}

export function simulateServing(config: ServingConfig, workload: Workload): ServingResult {
  const bpt = DTYPE_MB_PER_TOKEN[config.dtype]
  const patience = workload.patienceTicks ?? QUEUE_PATIENCE_TICKS
  const arrivals = workload.arrivals.map((a, i) => ({ ...a, id: i })).sort((a, b) => a.t - b.t || a.id - b.id)
  type StampedArrival = Arrival & { id: number }
  const maxTicks = (arrivals.length ? arrivals[arrivals.length - 1].t : 0) + 2500

  type Active = {
    id: number
    arrive: number
    prefill: number
    decodeTarget: number
    phase: "prefill" | "decode"
    prefillLeft: number
    decoded: number
    kvAllocMB: number
    firstToken: number | null
    done: number | null
  }

  const queue: typeof arrivals = []
  const active: Active[] = []
  const outcomes: RequestOutcome[] = []
  const trace: TickSnapshot[] = []

  let kvAllocMB = 0
  let kvPeakMB = 0
  let kvWastePeakMB = 0
  let totalDecoded = 0
  let activeTickSum = 0
  let busyTicks = 0

  const admitNeed = (arrival: Arrival, paging: boolean): number =>
    paging ? Math.ceil((arrival.prefill + 1) / PAGE_TOKENS) * PAGE_TOKENS * bpt : (arrival.prefill + arrival.decode) * bpt

  const admit = (arrival: StampedArrival): Active => {
    const alloc = admitNeed(arrival, config.paging)
    kvAllocMB += alloc
    return {
      id: arrival.id,
      arrive: arrival.t,
      prefill: arrival.prefill,
      decodeTarget: arrival.decode,
      phase: "prefill",
      prefillLeft: Math.ceil(arrival.prefill / PREFILL_TOKENS_PER_TICK),
      decoded: 0,
      kvAllocMB: alloc,
      firstToken: null,
      done: null,
    }
  }

  const finish = (request: Active, tick: number) => {
    request.done = tick
    kvAllocMB -= request.kvAllocMB
    outcomes.push({ id: request.id, arrive: request.arrive, firstToken: request.firstToken, done: tick, dropped: null })
  }

  const drop = (request: Active, reason: DropReason, tick: number) => {
    kvAllocMB -= request.kvAllocMB
    outcomes.push({ id: request.id, arrive: request.arrive, firstToken: request.firstToken, done: tick, dropped: reason })
  }

  let tick = 0
  while (tick < maxTicks && (active.length > 0 || queue.length > 0 || arrivals.some(a => a.t <= tick))) {
    // 1. New arrivals join the FIFO queue.
    while (arrivals.length && arrivals[0].t <= tick) queue.push(arrivals.shift()!)

    // 2. Admission. Continuous batching admits whenever a slot + KV room
    //    exist. Static batching admits only when the floor is empty, then
    //    the whole batch runs to completion (stragglers block the next).
    const mayAdmit = config.continuous || active.length === 0
    if (mayAdmit) {
      let budget = config.slots - active.length
      while (budget > 0 && queue.length) {
        const head = queue[0]
        const need = admitNeed(head, config.paging)
        if (need > config.kvPoolMB) {
          queue.shift()
          outcomes.push({ id: head.id, arrive: head.t, firstToken: null, done: tick, dropped: "oom" })
          continue
        }
        if (kvAllocMB + need > config.kvPoolMB) break // head-of-line, like real allocators
        queue.shift()
        active.push(admit(head))
        budget -= 1
      }
    }

    // 3. Queue patience (per-workload SLA).
    for (let i = queue.length - 1; i >= 0; i--) {
      if (tick - queue[i].t > patience) {
        const timedOut = queue.splice(i, 1)[0]
        outcomes.push({ id: timedOut.id, arrive: timedOut.t, firstToken: null, done: tick, dropped: "timeout" })
      }
    }

    // 4. Progress: prefill in 64-token chunks, then one decode token per
    //    tick for every active request — the memory-bound batch insight.
    let decodedThisTick = 0
    for (const request of [...active]) {
      if (request.phase === "prefill") {
        request.prefillLeft -= 1
        if (request.prefillLeft <= 0) {
          request.phase = "decode"
          request.decoded = 1
          request.firstToken = tick
          decodedThisTick += 1
        }
      } else {
        request.decoded += 1
        decodedThisTick += 1
        if (config.paging) {
          const pagesNeeded = Math.ceil((request.prefill + request.decoded) / PAGE_TOKENS)
          const pagesOwned = Math.round(request.kvAllocMB / (PAGE_TOKENS * bpt))
          if (pagesNeeded > pagesOwned) {
            const pageMB = PAGE_TOKENS * bpt
            if (kvAllocMB + pageMB <= config.kvPoolMB) {
              request.kvAllocMB += pageMB
              kvAllocMB += pageMB
            } else {
              drop(request, "kv-preempt", tick)
              active.splice(active.indexOf(request), 1)
              continue
            }
          }
        }
      }
      if (request.phase === "decode" && request.decoded >= request.decodeTarget) {
        finish(request, tick)
        active.splice(active.indexOf(request), 1)
      }
    }
    totalDecoded += decodedThisTick

    // 5. Accounting for the replay trace.
    const kvUsedMB = active.reduce((acc, r) => acc + (r.prefill + r.decoded) * bpt, 0)
    kvPeakMB = Math.max(kvPeakMB, kvAllocMB)
    kvWastePeakMB = Math.max(kvWastePeakMB, kvAllocMB - kvUsedMB)
    if (active.length > 0) {
      activeTickSum += active.length
      busyTicks += 1
    }
    trace.push({ tick, active: active.length, queue: queue.length, kvAllocMB, kvUsedMB, decodedThisTick })
    tick += 1
  }

  const served = outcomes.filter(o => !o.dropped)
  const ttft = served.filter(o => o.firstToken !== null).map(o => (o.firstToken ?? 0) - o.arrive).sort((a, b) => a - b)
  const latency = served.map(o => (o.done ?? 0) - o.arrive).sort((a, b) => a - b)
  const dropReasons: Record<string, number> = {}
  for (const o of outcomes) {
    if (o.dropped) dropReasons[o.dropped] = (dropReasons[o.dropped] ?? 0) + 1
  }

  return {
    ticks: tick,
    outcomes,
    metrics: {
      served: served.length,
      dropped: outcomes.length - served.length,
      dropReasons,
      throughputTokPerTick: tick > 0 ? totalDecoded / tick : 0,
      p50TTFT: percentile(ttft, 0.5),
      p99TTFT: percentile(ttft, 0.99),
      p99Latency: percentile(latency, 0.99),
      kvPeakMB,
      kvWastePeakMB,
      avgBatchOccupancy: busyTicks > 0 ? activeTickSum / busyTicks : 0,
    },
    trace,
  }
}

// ── Authored workloads (deterministic, tuned so each lesson lands) ──

export const WORKLOAD_FIT: Workload = {
  arrivals: [
    { t: 0, prefill: 96, decode: 180 },
    { t: 0, prefill: 96, decode: 180 },
    { t: 2, prefill: 128, decode: 220 },
    { t: 2, prefill: 128, decode: 220 },
    { t: 5, prefill: 96, decode: 180 },
    { t: 5, prefill: 96, decode: 180 },
    { t: 5, prefill: 128, decode: 220 },
    { t: 5, prefill: 128, decode: 220 },
  ],
}

export const WORKLOAD_BATCHING: Workload = {
  patienceTicks: 400,
  arrivals: [
    { t: 0, prefill: 64, decode: 40 },
    { t: 0, prefill: 64, decode: 240 },
    { t: 1, prefill: 64, decode: 40 },
    { t: 1, prefill: 64, decode: 200 },
    { t: 130, prefill: 64, decode: 40 },
    { t: 130, prefill: 64, decode: 240 },
    { t: 131, prefill: 64, decode: 40 },
    { t: 131, prefill: 64, decode: 200 },
    { t: 260, prefill: 64, decode: 40 },
    { t: 260, prefill: 64, decode: 240 },
    { t: 261, prefill: 64, decode: 40 },
    { t: 261, prefill: 64, decode: 200 },
    { t: 390, prefill: 64, decode: 40 },
    { t: 390, prefill: 64, decode: 240 },
    { t: 391, prefill: 64, decode: 40 },
    { t: 391, prefill: 64, decode: 200 },
  ],
}

export const WORKLOAD_PAGING: Workload = {
  arrivals: [
    { t: 0, prefill: 48, decode: 32 },
    { t: 0, prefill: 48, decode: 250 },
    { t: 1, prefill: 48, decode: 32 },
    { t: 1, prefill: 48, decode: 250 },
    { t: 10, prefill: 48, decode: 48 },
    { t: 10, prefill: 48, decode: 48 },
    { t: 20, prefill: 48, decode: 32 },
    { t: 20, prefill: 48, decode: 250 },
    { t: 30, prefill: 48, decode: 48 },
    { t: 30, prefill: 48, decode: 48 },
    { t: 40, prefill: 48, decode: 32 },
    { t: 40, prefill: 48, decode: 250 },
  ],
}

export const WORKLOAD_CRISIS: Workload = {
  patienceTicks: 250,
  arrivals: [
    { t: 0, prefill: 128, decode: 64 },
    { t: 0, prefill: 96, decode: 48 },
    { t: 0, prefill: 128, decode: 64 },
    { t: 1, prefill: 96, decode: 48 },
    { t: 2, prefill: 128, decode: 96 },
    { t: 2, prefill: 96, decode: 48 },
    { t: 4, prefill: 128, decode: 64 },
    { t: 4, prefill: 96, decode: 48 },
    { t: 8, prefill: 128, decode: 96 },
    { t: 8, prefill: 96, decode: 48 },
    { t: 12, prefill: 128, decode: 64 },
    { t: 12, prefill: 96, decode: 48 },
    { t: 16, prefill: 128, decode: 96 },
    { t: 16, prefill: 96, decode: 48 },
    { t: 20, prefill: 128, decode: 64 },
    { t: 20, prefill: 96, decode: 48 },
    { t: 24, prefill: 128, decode: 96 },
    { t: 24, prefill: 96, decode: 48 },
    { t: 28, prefill: 128, decode: 64 },
    { t: 28, prefill: 96, decode: 48 },
    { t: 32, prefill: 128, decode: 96 },
    { t: 32, prefill: 96, decode: 48 },
    { t: 36, prefill: 128, decode: 64 },
    { t: 36, prefill: 96, decode: 48 },
  ],
}
