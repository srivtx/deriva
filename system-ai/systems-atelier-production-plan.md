# Systems Atelier Production Plan

## Status

The current Systems Atelier is an S1/S2 experimental vertical slice. It is not
production-ready and must not be described as an eight-scenario finished lane.

This plan turns the experiment into a reliable curriculum product for learning
how systems interact at scale. The first production concept is explicit:

~~~text
Service A → versioned API boundary → Service B
~~~

The learner must see what crosses the boundary, what B promises, what A assumes,
how latency and failure propagate, and what evidence changes when A changes its
policy.

## Product Promise

The learner should finish a scenario able to answer, from their own trace:

1. What contract does each system expose?
2. What request did A send to B?
3. What response did B return, and did it satisfy the contract?
4. Where did time accumulate: service work, queue wait, retry, or timeout?
5. Which failure was local and which came from the dependency?
6. What policy changed the system behavior, and what metric proves it?

If the learner can only describe a function or read a final score, the scenario
has failed its purpose.

## Production Boundaries

### Curriculum boundary

Systems Atelier is a composition and operations lane above Systems Projects. The
projects build understandable components. Atelier composes those components and
runs them under load. It does not replace the existing DSA curriculum or turn
the 15-project map into a second unrelated course.

### Execution boundary

The browser milestone uses a deterministic in-process transport, not real HTTP.
It models the important production semantics without requiring a network:

- versioned request and response contracts;
- serialization and transport overhead;
- monotonic virtual time;
- arrival queues and bounded service capacity;
- concurrent workers represented by a discrete-event scheduler;
- timeouts, cancellation, retries, backoff, and circuit breakers;
- cache namespaces, TTL, capacity, and eviction;
- explicit failure injection;
- immutable trace events with a schema version.

The learner writes handlers and policies. The runtime owns transport, scheduling,
load, and failure injection. The runtime must never silently turn a failed or
partial run into a passing run.

### Persistence boundary

IndexedDB via the repository described in `docs/08` is the source of truth for
drafts, progress, run summaries, bounded traces, and learning events. `localStorage`
identifier. Export/import is part of the first durable milestone.

## Canonical Scenario Contract

Every scenario is versioned and build-validated:

~~~text
ScenarioManifest
  schemaVersion, engineVersion, fixtureVersion
  id, title, purpose, thinkingMove
  stages: Understand → Play → Reason → Discover → Design → Implement → Execute → Reflect → Generalize
  topology
    components
      id, role, handler, apiVersion
      requestSchema, responseSchema
      latencyModel, failureModel, capacity
  loadModel
    seed, duration, arrival process, burst schedule
  policies
    timeout, retry, cache, circuit, worker, partition, consistency
  naiveProgram, starterProgram, referenceProgram
  systemGates
  artifactContract
  relatedPatterns, relatedQuestions, relatedLessons
~~~

Build validation must reject duplicate IDs, invalid references, invalid gate
answers, impossible load windows, missing API fields, missing handlers, missing
reference programs, and scenario programs that do not execute against fixtures.

## Trace Contract

Trace version 2 is immutable and append-only. Every event has:

~~~text
sequence, virtualTimeMs, requestId, spanId?, parentSpanId?, component?, kind, payload
~~~

Required interaction events:

~~~text
load.arrival
request.start / request.end
api.request / api.response
contract.reject
queue.enqueue / queue.dequeue / queue.wait
retry.scheduled / retry.attempt
timeout / cancellation
circuit.open / circuit.half_open / circuit.close
cache.hit / cache.miss / cache.evict
failure.injected / failure.detected
~~~

The trace must contain a run envelope as metadata:

~~~text
runId, scenarioId, seed, engineVersion, fixtureVersion
status: complete | error | truncated | budget-exceeded
error?, eventCount, startedAt, finishedAt
~~~

Metrics and visual state are pure folds over `(trace, cursor)`. A fold may expose
an incomplete model, but gates may pass only for a complete run envelope.

## Learning Contract

The systems lane uses the nine-stage flow with a systems-specific emphasis:

| Stage | Systems Atelier behavior |
|---|---|
| Understand | Read the system story and inspect the API contracts |
| Play | Send example requests and inspect valid/invalid responses |
| Reason | Predict what A inherits from B: latency, errors, and schema assumptions |
| Discover | Construct topology and dependency policy choices |
| Design | Commit timeout, retry, cache, capacity, and degradation decisions |
| Implement | Write handlers only after the boundary design exists |
| Execute | Run naive and fixed programs under the same seeded world |
| Reflect | Compare traces and explain the first divergence |
| Generalize | Apply the interaction pattern to a new system surface |

Naive-first is enforced by state, not copy. The fixed run is unavailable until
the naive run is complete. Completion requires a changed policy, a complete run,
passing system gates, evidence-backed reflection, and a transfer answer.

## Delivery Phases

### P0 — Stop the line

- Failed, empty, timed-out, and truncated runs are ineligible for gates.
- Worker errors are visible and recoverable.
- Fixed execution is locked until the naive run completes.
- Resume status derives from the persisted run summary, not stale React state.
- Scenario map is labeled S1/S2 beta until the remaining scenarios exist.
- Add regression tests for every release-blocking case.

### P1 — Correct simulation semantics

- Replace the current serial clock reset with a monotonic discrete-event
  scheduler.
- Model arrivals waiting behind service capacity.
- Add worker concurrency, service time, queue wait, cancellation, and completion
  events.
- Use independent seeded random streams for arrivals, latency, and failures so
  policy changes do not accidentally change unrelated random draws.
- Make root failures, per-queue depth, retries, and attempts correct.
- Add golden traces for S1 and S2.

### P2 — Durable local product

- Add the IndexedDB repository and migrations from the current localStorage
  progress format.
- Store bounded run summaries, recent traces, cursor, filters, artifacts, and
  append-only learning events.
- Add export/import and storage-pressure handling.
- Resume the exact run evidence after reload.

### P3 — Replay-first observation studio

- Add cursor transport: play, pause, step, scrub, request selection, and span
  expansion.
- Add text equivalents for waterfall, timeline, gates, and component metrics.
- Add accessible tab/tabpanel semantics and keyboard navigation.
- Make the first divergence between naive and fixed runs directly selectable.

### P4 — Curriculum completion

- Implement all nine stages for the S2 coupling scenario.
- Remove complete reference code from the initial starter; reveal it only after
  an attempt or explicit solution action.
- Add a real API contract failure drill, timeout drill, and version negotiation
  decision.
- Validate artifact reflection and transfer, not only text presence.

### P5 — Scale phenomena

Author one phenomenon at a time and stop for review after each group:

1. S3 retry storms and circuit breaking
2. S4 cache invalidation and thundering herd
3. S5 queues, workers, backpressure, and dead letters
4. S6 partitioning and hot keys
5. S7 replication, read-after-write, and staleness
6. S8 compound incident and postmortem

No card is published as authored until its runtime behavior, trace, gates,
artifact, and nine-stage experience are complete.

### P6 — Execution hardening

- Restrict learner imports and builtins with explicit denial tests.
- Enforce message size, event count, wall-clock, and memory budgets.
- Terminate and respawn the worker on timeout or policy violation.
- Self-host pinned Pyodide assets with integrity checks and service-worker cache.
- Add browser security regression tests for filesystem, network, JavaScript
  interop, dynamic imports, and runaway memory.

### P7 — Production verification

- CI executes every authored naive, starter, contract-drill, and reference
  program.
- Golden trace snapshots detect engine drift.
- Accessibility tests cover keyboard, screen reader labels, 390px, 768px, and
  desktop layouts.
- Performance tests cover event volume, trace fold time, IndexedDB writes, and
  mobile rendering.
- Release checklist blocks publishing when any gate, migration, or route fails.

## Definition Of Done

Systems Atelier is production-ready only when:

- S2 is a complete nine-stage lesson, not only a workbench;
- all gates reject invalid or incomplete runs;
- S1 queueing is represented by the scheduler, not implied by prose;
- traces replay deterministically from persisted evidence;
- local data uses IndexedDB with export/import and migrations;
- learner execution is explicitly restricted and killable;
- desktop and mobile layouts have separate tested compositions;
- every authored scenario passes CI with its reference and failure programs;
- the map claims exactly the number of scenarios actually authored.

Until then, the UI must say `Systems Atelier beta · S1–S2` rather than implying
an eight-scenario production curriculum.
