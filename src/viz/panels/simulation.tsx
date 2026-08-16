"use client"

// Systems Atelier observation studio (system-ai/systems-atelier-plan.md
// §Observation surfaces). Pure renderers over the fold: waterfall, throughput/
// queue timeline, percentile + component summary, gate results, event list.
// The visualizer never executes code — everything comes from the run's log.

import { useMemo, useState } from "react"
import type { TraceEvent } from "@/execution/trace/types"
import type { GateResult, SimulationFold } from "@/viz/replay/folds"

const STATUS_LABEL: Record<number, string> = { 200: "200", 500: "500", 502: "502", 503: "503", 504: "504" }

export function SimulationSummary({ fold, gates }: { fold: SimulationFold; gates: GateResult[] }) {
  const { metrics } = fold
  const gatesPassed = gates.filter(gate => gate.passed).length
  return (
    <section className="sim-summary" aria-label="Run summary">
      <div className="sim-metrics">
        <div className="sim-metric-card">
          <span className="sim-metric-label">arrivals</span>
          <span className="sim-metric-value">{metrics.arrivals}</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">p50</span>
          <span className="sim-metric-value">{Math.round(metrics.latencyMs.p50)}ms</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">p95</span>
          <span className="sim-metric-value">{Math.round(metrics.latencyMs.p95)}ms</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">p99</span>
          <span className="sim-metric-value">{Math.round(metrics.latencyMs.p99)}ms</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">max</span>
          <span className="sim-metric-value">{Math.round(metrics.latencyMs.max)}ms</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">error rate</span>
          <span className="sim-metric-value">{(metrics.errorRate * 100).toFixed(1)}%</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">cache ratio</span>
          <span className="sim-metric-value">{Math.round(metrics.cache.hitRatio * 100)}%</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">max attempts</span>
          <span className="sim-metric-value">{metrics.maxAttemptsPerRequest}</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">circuit opens</span>
          <span className="sim-metric-value">{metrics.circuitOpenCount}</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">admission rejects</span>
          <span className="sim-metric-value">{metrics.admissionRejectCount}</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">API calls</span>
          <span className="sim-metric-value">{metrics.apiCalls}</span>
        </div>
        <div className="sim-metric-card">
          <span className="sim-metric-label">contract rejects</span>
          <span className="sim-metric-value">{metrics.contractRejects}</span>
        </div>
      </div>
      <div className="sim-gates">
        <span className="sim-gate-heading">{gatesPassed}/{gates.length} system gates passed</span>
        {gates.some(gate => !gate.eligible) && <div className="sim-error">This run is not eligible for completion. Fix the execution error or rerun after the trace finishes.</div>}
        {gates.map(gate => (
          <div key={gate.name} className={`sim-gate${gate.passed ? " ok" : " fail"}`}>
            <span className="sim-gate-status">{gate.passed ? "✓" : "✗"}</span>
            <span className="sim-gate-name">{gate.name}</span>
            <span className="sim-gate-numbers">
              {gate.metric} {gate.op} {gate.value} · actual {gate.actual.toFixed(gate.metric === "errorRate" || gate.metric === "cacheHitRatio" ? 3 : 0)}
            </span>
            <span className="sim-gate-invariant">{gate.invariant}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const SIM_COMPONENT_COLORS = ["sim-comp-a", "sim-comp-b", "sim-comp-c", "sim-comp-d"]

function componentClass(component: string, known: string[]): string {
  const index = known.indexOf(component)
  if (index < 0) return "sim-comp-x"
  return SIM_COMPONENT_COLORS[index % SIM_COMPONENT_COLORS.length]!
}

export function SimulationWaterfall({ fold, components }: { fold: SimulationFold; components: string[] }) {
  const range = useMemo(() => {
    if (fold.requests.length === 0) return { start: 0, span: 1 }
    const start = Math.min(...fold.requests.map(request => request.at))
    const end = Math.max(...fold.requests.map(request => request.at + request.latencyMs))
    return { start, span: Math.max(1, end - start) }
  }, [fold])

  const shown = fold.requests.slice(-60) // cap for readability; the summary covers the full run

  return (
    <section className="sim-waterfall" aria-label="Request waterfall">
      <span className="sim-studio-heading">waterfall · last {shown.length} requests</span>
      {shown.map(request => {
        const left = ((request.at - range.start) / range.span) * 100
        const width = Math.max(0.5, (request.latencyMs / range.span) * 100)
        const rootHop = request.hops[0]
        const segments = request.hops.slice(1) // the root bar is the container
        const status = STATUS_LABEL[request.status] ?? String(request.status)
        return (
          <div key={request.requestId} className="sim-request-row" style={{ display: "grid", gridTemplateColumns: "64px 1fr" }}>
            <span className="sim-request-id">{request.requestId}</span>
            <div className="sim-request-track">
              <div
                className={`sim-request-bar status-${request.status}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${request.requestId} → ${status} in ${Math.round(request.latencyMs)}ms`}
              >
                {segments.map((hop, index) => {
                  const hopLeft = ((hop.startAt - range.start) / range.span) * 100
                  const hopWidth = Math.max(0.5, (hop.latencyMs / range.span) * 100)
                  return (
                    <span
                      key={index}
                      className={`sim-hop ${componentClass(hop.component, components)}${hop.status !== 200 ? " failed" : ""}`}
                      style={{ left: `${hopLeft}%`, width: `${hopWidth}%` }}
                      title={`${hop.component} → ${STATUS_LABEL[hop.status] ?? hop.status} in ${Math.round(hop.latencyMs)}ms`}
                    />
                  )
                })}
                {rootHop && (
                  <span
                    className={`sim-hop-root status-${request.status}`}
                    style={{ left: "0%", width: `${Math.max(0.5, (rootHop.latencyMs / range.span) * 100)}%` }}
                    title={`root ${rootHop.component} → ${status} in ${Math.round(rootHop.latencyMs)}ms`}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export function SimulationTimeline({ fold }: { fold: SimulationFold }) {
  const max = Math.max(1, ...fold.series.flatMap(bucket => [bucket.arrivals, bucket.completions, bucket.queueDepth]))
  return (
    <section className="sim-timeline" aria-label="Throughput and queue depth over time">
      <span className="sim-studio-heading">load, completions, and queue depth per second</span>
      <div className="sim-timeline-chart">
        {fold.series.map(bucket => (
          <div key={bucket.second} className="sim-bucket" title={`t=${bucket.second}s · ${bucket.arrivals} arrivals · ${bucket.completions} completed · queue ${bucket.queueDepth}`}>
            <div className="sim-bucket-stack">
              <span className="sim-bucket-arrivals" style={{ height: `${(bucket.arrivals / max) * 100}%` }} />
              <span className="sim-bucket-completions" style={{ height: `${(bucket.completions / max) * 100}%` }} />
              <span className="sim-bucket-queue" style={{ height: `${(bucket.queueDepth / max) * 100}%` }} />
            </div>
            <span className="sim-bucket-second">{bucket.second}s</span>
          </div>
        ))}
      </div>
      <div className="sim-legend">
        <span className="sim-legend-item arrivals">arrivals</span>
        <span className="sim-legend-item completions">completions</span>
        <span className="sim-legend-item queue">queue depth</span>
      </div>
    </section>
  )
}

export function SimulationComponents({ fold, components }: { fold: SimulationFold; components: string[] }) {
  return (
    <section className="sim-components" aria-label="Component cards">
      {components.map(component => {
        const card = fold.metrics.components[component]
        return (
          <div key={component} className={`sim-component-card ${componentClass(component, components)}`}>
            <span className="sim-component-name">{component}</span>
            {card ? (
              <>
                <span className="sim-component-line">{card.requests} hops · {card.errors} failures</span>
                <span className="sim-component-line">p50 {Math.round(card.latencyMs.p50)}ms · p99 {Math.round(card.latencyMs.p99)}ms</span>
                <span className="sim-component-line">{card.retries} retries</span>
              </>
            ) : (
              <span className="sim-component-line">no hops in this run</span>
            )}
          </div>
        )
      })}
    </section>
  )
}

const KIND_LABEL: Record<string, string> = {
  "load.arrival": "arrival", "request.start": "start", "request.end": "end",
  "cache.hit": "cache hit", "cache.miss": "cache miss",
  "queue.enqueue": "enqueue", "queue.dequeue": "dequeue",
  "retry.attempt": "retry", "circuit.open": "circuit open", "circuit.close": "circuit close",
  "api.request": "API request", "api.response": "API response", "contract.reject": "contract reject",
  "failure.detected": "failure", "control.changed": "control changed",
}

export function SimulationEvents({ events, filter, onFilter }: {
  events: TraceEvent[]
  filter: string | null
  onFilter: (kind: string | null) => void
}) {
  const kinds = useMemo(() => {
    const set = new Set<string>()
    for (const event of events) {
      if (event.t === "structure") set.add(event.op.kind)
    }
    return [...set]
  }, [events])
  const shown = events.filter((event): event is Extract<TraceEvent, { t: "structure" }> =>
    event.t === "structure" && (filter === null || event.op.kind === filter))

  return (
    <section className="sim-events" aria-label="Event log">
      <div className="sim-event-kinds" role="tablist" aria-label="Filter events by kind">
        <button role="tab" aria-selected={filter === null} className={`sim-kind-chip${filter === null ? " active" : ""}`} onClick={() => onFilter(null)}>all ({kinds.length} kinds)</button>
        {kinds.map(kind => (
          <button key={kind} role="tab" aria-selected={filter === kind} className={`sim-kind-chip${filter === kind ? " active" : ""}`} onClick={() => onFilter(kind)}>
            {KIND_LABEL[kind] ?? kind}
          </button>
        ))}
      </div>
      <ol className="sim-event-list">
        {shown.slice(-80).map((event, index) => {
          const op = event.op as { kind: string } & Record<string, unknown>
          const at = typeof op.at === "number" ? op.at : 0
          const detail = Object.entries(op)
            .filter(([key]) => key !== "kind" && key !== "at")
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(" ")
          return (
            <li key={index} className="sim-event-row">
              <span className="sim-event-at">{(at / 1000).toFixed(2)}s</span>
              <span className="sim-event-kind">{KIND_LABEL[op.kind] ?? op.kind}</span>
              <span className="sim-event-detail">{detail}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
