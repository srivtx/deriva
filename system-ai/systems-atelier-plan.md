# Systems Atelier Plan

## Mission

Create a third AI/ML mode: a Systems Atelier at /ai-ml/systems where the learner
builds small but real systems at scale — several components with a topology,
running under deterministic load and injected failure — and watches them
interact.

This is not a code project. The star of the show is the SYSTEM: composition,
queueing, coupling, retry storms, caches, partitions, replication, and cascading
failure. The learner writes the component handlers and declares the policies
(timeouts, retries, cache capacity, worker count, partition count). The platform
supplies the runtime: transport, load generator, failure injection, and a
simulated clock. Their code + their policies run under load, and the interaction
trace is the product.

~~~text
scenario brief → design gates → handlers + policy config → run under load
  → observe the interaction (waterfall, queues, percentiles) → system gate → artifact
~~~

## Why a simulation is the right object

The phenomena that define systems at scale are EMERGENT. They do not exist
inside a single function:

- a queue only exists when one component feeds another that is slower;
- a retry storm only exists when a failing dependency is called by many
  requests;
- a thundering herd only exists when many requests miss a cold cache at once;
- a cascade only exists when a partial failure propagates through a topology.

Deriva's rule "the trace is the product" scales: the trace becomes a
distributed request path through a simulated world, and the dashboard
(throughput, p50/p95/p99, queue depth, error rate, cache hit ratio) is computed
from the learner's own system run.

Determinism is non-negotiable: same code + same seed → identical event log.
Latency and failure samples come from seeded distributions declared in the
scenario. A double-run equality test enforces it. Nothing random without a seed,
no real network, no external APIs, no production server.

## Pedagogical spine

Every scenario is still one Deriva problem (Understand → … → Generalize), and
the binding rules from docs/03 hold:

- Rule A3, naive before optimized: every scenario ships a Naive Run — a
  deliberately broken configuration of the same handlers (no timeouts, retry
  forever, cache everything with ttl 0, one worker, all keys to one partition).
  The learner runs it first, watches it collapse, explains why, then builds the
  fix. The failure is SEEN, never described.
- Rule A1, one thinking move per stage: each scenario teaches exactly one
  interaction phenomenon.
- Code appears only after design: the scenario page opens on design gates
  (topology + policy decisions). The editor stays locked until they pass —
  same rule as the projects workbench.
- Evidence over claims: every complexity claim ("we need a cache", "retries
  made it worse") must be backed by a before/after metric from the learner's
  own runs.
- Every scenario ends with an engineering answer, never a checkbox: the
  artifact is the explanation/postmortem, checked against required fields.

## The runtime contract

Learner code is a set of Python handler functions plus one policy dict. The
platform runtime drives the event loop.

~~~python
def search_component(request, ctx):
    hits = ctx.call("index", {"q": request["q"]}, timeout_ms=150, api_version="v3")
    if ctx.circuit("index").open():
        return degraded(request)
    ctx.cache_set("q:" + request["q"], hits, ttl=60)
    return render(request, hits)

POLICY = {
    "timeouts": {"index": 150, "feature": 120},
    "retry": {"max_attempts": 3, "backoff_ms": [50, 200, 800], "jitter": True},
    "cache": {"capacity": 1000, "eviction": "lru"},
    "workers": 4,
    "partitions": 8,
    "replicas": 2,
    "read_consistency": "leader",
}
~~~

The ctx surface (platform-provided, in the same Python interpreter):

- ctx.call(target, payload, timeout_ms, api_version) — one API hop; validates the
  request fields and version before applying the target's latency distribution
  and failure rate (seeded), then validates the response fields and version.
  It emits a distinct child request span plus api.request/api.response and
  contract.reject events, raises Timeout/Unavailable/ContractRejected inside
  the caller's boundary;
- ctx.cache_get(key) / ctx.cache_set(key, value, ttl) — capacity + eviction per
  policy, emits cache.hit / cache.miss, cold-start and invalidation rules;
- ctx.enqueue(queue, item) / ctx.dequeue(queue) / ctx.ack() — queue depth is
  tracked, emits queue.enqueue / queue.dequeue;
- ctx.circuit(name) — breaker state per target: closed/open/half-open;
- ctx.sleep(ms), ctx.now(), ctx.emit(kind, detail);
- a simulated clock: sim seconds can run faster than wall clock; runs are
  budgeted in events and wall-clock milliseconds.

The learner never implements the transport, the load generator, or the failure
injection. That is the point: the system-level behavior comes from running their
policies, and the same handlers can be re-run under a different load shape to
answer "what if".

## Worker contract

Add one additive message to the existing Pyodide worker:

~~~text
{ type: "runSimulation", scenarioId, code, seed }
  → { events: TraceEvent[], metrics: SimulationMetrics }
~~~

Discrete-event loop: arrivals are drawn from the scenario's load shape (seeded),
each arrival is a request root, requests flow through the topology by calling
handler functions, every hop emits events, latency/failure samples come from
per-component seeded distributions. Derived metrics (arrivals, completed,
throughput, p50/p95/p99, error rate, per-component aggregates, queue depth
series, cache hit ratio, retry counts, circuit events) are computed once per
run. Same seed + same code ⇒ identical log.

Budgets: event budget and a hard wall-clock cap per run; a runaway handler ends
the run with a structured error, not a hang.

## Trace events to add (additive, semantic)

~~~text
api.request / api.response / contract.reject
cache.hit / cache.miss
queue.enqueue / queue.dequeue
retry.attempt / circuit.open / circuit.close
load.arrival / request.timeout (or request.end with status 504)
~~~

Existing ops (request.start/end, failure.detected, data.*, model.*, …) are
reused as-is. A pure fold derives the view state — the viz never executes code.

## Observation surfaces

The Atelier workbench (three panes on desktop, tabs on mobile):

- Spec | Code | Output on the left, plus a Run panel: Naive Run / Run under load
  with the seed shown, and the load shape chart (r/s over sim time with the
  burst and failure-injection windows marked).
- The Observation Studio below/beside:
  - Waterfall: one bar per request, hops as segments colored by component,
    timeouts and failures marked; selecting a request expands its hops and
    emits;
  - Throughput + queue depth timeline (arrivals, completions, queue depth,
    error rate over sim time);
  - Percentile summary: p50/p95/p99 before/after with the system-gate markers;
  - Component cards: latency, error rate, retries, circuit state, cache hit
    ratio;
  - Event list filterable by kind.
- System gates: properties checked against the run's real metrics, e.g.
  "p99 ≤ 500 ms under the spike", "max 2 attempts per request", "cache hit
  ratio ≥ 60%", "no request exceeds its budget". Gates are never passed by
  prose — only by a run's metrics — and each gate links to the trace evidence.

## Scenario ladder

Eight scenarios, one phenomenon each. Load shapes and failure schedules are
declared per scenario; seeds are fixed so the naive run and the fixed run are
the same world.

| # | Scenario (real system in disguise) | Thinking move | Load | Naive trap (must be run first) |
|---|---|---|---|---|
| S1 | Ticket search monolith | See queueing in a latency tail | spike 200 → 2000 r/s | one serial process, no timeouts: p99 is the queue |
| S2 | Inference service calling a feature API | Feel synchronous coupling | steady 500 r/s, slow-tail upstream | no timeout: A's p99 equals B's p99 |
| S3 | Checkout gateway with a failing upstream | Break the retry storm | steady + 10% failure injection | retry forever: request count multiplies, cascade |
| S4 | Feature/content cache | Tame the thundering herd | bursty concentrated queries | cache with ttl 0, or no cache at all |
| S5 | Order ingestion over a queue | Apply backpressure | burst + slow consumers | unbounded queue, workers pull without limit |
| S6 | Search index over shards | Partition the hot key | skewed key distribution | all keys to one partition: 1/8 of the nodes do all work |
| S7 | Ratings DB with read replicas | Accept the staleness | read-heavy + writes | always read a replica: read-your-writes breaks |
| S8 | The full incident | Run the degradation ladder | spike + multi-component failure | no degradation plan: full outage, unreadable trace |

S2 is the canonical thought experiment this lane grew from: A needs B. A's
contract is composed of B's contract, failure belongs to the dependency, the
latency budget is arithmetic, and versioning is a conversation.

Each scenario defines: spec (the disguised real system, the contracts each
component exposes), design gates (topology and policy decisions, options with
tradeoffs), required handlers, naive run + fixed run, system gates, artifact
fields + reflection, relatedQuestionIds and relatedLessonIds.

## Routes

~~~text
/ai-ml/systems                scenario ladder (S1–S8 cards with progress)
/ai-ml/systems/[scenarioId]   scenario shell: gates → atelier → observation → artifact
~~~

Every scenario links to its related labs, questions, and pattern entries. The
ladder is reachable from the /ai-ml hub and the home Explore surface, next to
Labs and Projects.

## Typed scenario model

Add a curriculum-only contract under src/curriculum/schema (no React, no
execution imports). Parse-all at module scope: an incomplete scenario fails the
build.

~~~text
SystemScenario:
  id, number, title, thinkingMove (≤ 8 words), pitch, realSystem
  loadShape: seed, baseRate, burstShape, simSeconds, failureSchedule
  components: [{ id, exposes, api: { version, requestFields, responseFields },
    latencyMs (p50/p99), failureRate, queueCapacity?, cacheCapacity? }]
  designGates: [DesignQuestion] (topology + policy; editor locked until passed)
  handlers: [{ name, signature, purpose }]
  naivePolicy / fixedPolicy hints (naive run must be the first run offered)
  systemGates: [{ name, check (on metrics), invariant }]
  artifact: fields + reflectionQuestion
  relatedQuestionIds, relatedLessonIds
~~~

Build-time validation rejects: fewer than four design gates, a handler without
an entry point, a system gate without an invariant, a load shape without a seed,
a thinking move over eight words, and any component that no handler calls.

## Persistence

Extend the existing localStorage boundary under src/persistence:

- scenario status: new, gates-passed, naive-run-done, fixed-run-done, complete;
- last run seed, last run metrics (bounded), selected event filters;
- editor draft per scenario;
- design-gate and system-gate state;
- artifact snapshots;
- last-opened scenario.

## Surfaces and layout

Reuse the design system tokens and the existing workbench shell. The observation
studio is the new surface: waterfall, timelines, percentile bars, component
cards, filterable event list. Mobile: tabs for Spec/Code/Output and a sticky
Run action; the observation studio stacks waterfall → timeline → percentiles →
events.

## Implementation order

### Phase 0 — Runtime + observation foundation

1. Add runSimulation to the worker (additive message; reuse the pyodide client
   and execution shell; no second engine).
2. Implement the simulation package: load generator, in-process transport,
   cache/queue/circuit primitives, seeded latency/failure sampling, metric
   aggregation, event budgets.
3. Add the new trace event kinds and foldSimulation (pure, tested).
4. Build the observation panels (waterfall, throughput/queue timeline,
   percentile summary, component cards, event list).
5. Wire one demo scenario (S2) as a vertical slice through the whole surface.
6. Tests: double-run determinism, metric math, gate evaluation, budget
   enforcement. Validation: pnpm typecheck, test, build, git diff --check.

### Phase 1 — The coupling pair

Author S1 (monolith under spike) and S2 (inference calls feature API) fully:
spec, gates, naive run, fixed run, system gates, artifacts. This includes the
original thought experiment: A's contract is composed of B's contract, failure
belongs to the dependency, the latency budget is arithmetic.

### Phase 2 — Failure and load management

Author S3 (retry storm + circuit breaking), S4 (caching + thundering herd),
S5 (backpressure + async). Stop for a UX and pedagogy review here.

### Phase 3 — Scale-out and the incident

Author S6 (partitioning), S7 (replication + consistency), S8 (the incident
capstone with a degradation ladder and postmortem).

## Non-negotiable scope decisions

- Do not reduce this to readings about systems. Every phenomenon is run,
  observed, and explained from the learner's own event log.
- Do not create a second execution engine; runSimulation is additive in the
  existing worker.
- Do not run the naive and fixed variants on different worlds; the seed is the
  same, only the policies differ.
- Do not pass system gates on prose; only a run's metrics pass a gate, and each
  gate links to trace evidence.
- Do not use real network, hosted services, or external APIs in the first
  milestone; the transport is in-process and deterministic.
- Do not reset to a new toy world per scenario; later scenarios reuse S2's
  service shapes and contracts where sensible.
- Do not skip budgets: event budget and wall-clock cap per run, structured
  error on runaway handlers.

Success means the learner can explain a system-level failure with their own
trace — where it queued, where it retried, what degraded, and what policy they
changed to fix it, with before/after metrics to prove it.
