# Systems Atelier World Plan

## Decision

Systems Atelier should become a playable production world, not an eight-card
scenario list.

The learner operates one evolving AI product. Each mission introduces one new
system phenomenon, reuses the previous topology, and makes the next system
necessary. The product should feel like an investigation inside a living
platform: requests arrive, dependencies slow down, queues grow, contracts
break, and policy changes have visible consequences.

The current S1-S5 slice remains the first beta foundation. This document is the
content and interaction plan that must be approved before authoring S3+.

Implementation status: W1 has started with the S2 SignalDesk control room. The
first slice now supports traffic, dependency-failure, and slow-tail
interventions, a prediction checkpoint, baseline capture, and locked
deterministic comparison. The full world map remains planned rather than
authored content.

## Product Experience

The core fantasy is:

> You are responsible for keeping an AI product healthy while its traffic,
> dependencies, data, and failure modes change underneath you.

Every mission has three layers:

1. **Playground** — manipulate traffic, requests, topology, and failure knobs
   without code.
2. **Incident** — run the naive policy under a named operational objective and
   discover the failure from the trace.
3. **Build** — design and implement the smallest policy or handler change that
   fixes the observed failure, then prove the tradeoff with a replay.

The learner is never asked to admire a dashboard. Every visual must answer a
question the learner can act on:

- Which request is waiting?
- Which dependency caused the wait?
- What changed after the policy intervention?
- What did the fix save, and what did it sacrifice?

## The Shared World

Use one fictional AI product, **SignalDesk**, a support-ticket intelligence
platform. The product gives every system a persistent purpose and lets the
learner recognize the same components as the world grows.

```text
User request
    |
    v
Edge Gateway -- rate limits, auth, request budgets
    |
    +--> Inference API -- Feature API -- Feature Store
    |                         |
    |                         +--> Model Registry
    |
    +--> Search API -- Query Cache -- Sharded Search Index
    |
    +--> Ticket Write API -- Queue -- Index Workers -- Search Index
                                  |
                                  +--> Dead Letter Queue
    |
    +--> Ratings API -- Leader DB -- Read Replicas
```

The world has four persistent actors:

- **Customer** — cares about availability, latency, and useful answers.
- **Product service** — composes dependencies and chooses policies.
- **Platform operator** — controls capacity, rollouts, budgets, and recovery.
- **Data plane** — stores tickets, features, indexes, model artifacts, and
  ratings with different freshness and consistency guarantees.

The scenario seed fixes the world, but the learner's interventions determine
the branch. A mission is not a separate toy universe.

## System Map

Each system has one primary thinking move. The numbered systems are proposed
content, not authored status.

| ID | System | Phenomenon | Learner intervention | Durable artifact |
|---|---|---|---|---|
| S0 | Boundary Lab | A contract is executable | Edit payloads, versions, and response fields | API contract |
| S1 | Ticket Search Monolith | Queueing hides inside latency | Change timeout and service capacity | Queue report |
| S2 | Inference Calls Features | Synchronous coupling composes tails | Set a dependency budget and fallback | Coupling ledger |
| S3 | Retry Storm | Retries multiply shared failure | Change attempts, backoff, and idempotency | Retry policy |
| S4 | Circuit Breaker | Stop spending work on a known failure | Tune breaker thresholds and recovery | Failure policy |
| S5 | Edge Gateway | Admission control protects the system | Apply rate limits, quotas, and bulkheads | Capacity budget |
| S6 | Feature Cache | Shared misses create a herd | Choose key, TTL, capacity, and coalescing | Cache policy |
| S7 | Async Ticket Ingestion | Backpressure moves failure safely | Set queue capacity, workers, leases, and DLQ | Recovery runbook |
| S8 | Batch Inference | Batching trades latency for throughput | Choose batch window and max batch size | Batch SLO |
| S9 | Search Shards | Skew turns distribution into a lie | Choose partition key and rebalance policy | Shard plan |
| S10 | Ratings Replicas | Freshness is a product decision | Choose read route and consistency mode | Consistency memo |
| S11 | Model Rollout | A new model is a distributed change | Route canary traffic and roll back | Release record |
| S12 | Observability | Signals must support diagnosis | Select spans, metrics, alerts, and SLOs | SLO sheet |
| S13 | Safety Gateway | Useful output is not the only objective | Add policy checks, redaction, and abstention | Safety report |
| S14 | Compound Incident | Recovery requires an ordered plan | Coordinate degradation, rollback, and replay | Postmortem |

### Why These Systems

The current ladder covers queueing, coupling, retries, caches, queues,
partitioning, replication, and a compound incident. The missing systems are
important because they create the operational choices that make the world feel
real rather than merely observable:

- **Boundary Lab** gives the learner a tactile contract before code.
- **Edge Gateway** teaches that protecting a dependency is not the same as
  making the dependency faster.
- **Batch Inference** exposes a central AI tradeoff: utilization versus
  per-request latency.
- **Model Rollout** connects AI engineering to distributed deployment and
  rollback rather than treating the model as a static function.
- **Observability** makes telemetry a design decision, not a dashboard that
  appears after the fact.
- **Safety Gateway** keeps the systems lane specific to AI/ML without turning
  safety into a prose-only policy lesson.

## Unlock Sequence

Do not publish all systems as a flat map. Use dependency arcs:

```text
S0 Boundary
  -> S1 Queueing
  -> S2 Coupling
  -> S3 Retry Storm
  -> S4 Circuit Breaker

S2 Coupling
  -> S5 Admission Control
  -> S6 Cache
  -> S7 Async Work
  -> S8 Batching

S7 Async Work
  -> S9 Partitioning
  -> S10 Consistency

S2 + S10
  -> S11 Model Rollout
  -> S12 Observability
  -> S13 Safety Gateway
  -> S14 Compound Incident
```

Each unlock must pass the Inevitability Test:

- S3 is necessary because S2's timeout turns slow work into errors, and the
  product now needs a failure policy.
- S5 is necessary because S3/S4 protect one dependency but do not protect the
  edge from overload.
- S8 is necessary because S7's queue proves that individual work is too small
  and too expensive to process independently.
- S11 is necessary because S10 proves that changing a model-backed response is
  a data and consistency problem, not just a code deploy.
- S12 is necessary because the learner cannot operate S11 reliably without
  choosing evidence and alert boundaries.
- S14 is only available after the learner has built the individual recovery
  mechanisms.

## Mission Format

Every mission uses the nine-stage Deriva flow, but the Play and Execute stages
are systems-native:

| Stage | SignalDesk experience |
|---|---|
| Understand | Read the incident brief and inspect the topology and contracts |
| Play | Send requests, drag traffic, inject one failure, and watch the world |
| Reason | Predict where work, time, or errors will accumulate |
| Discover | Assemble the relevant policy from constrained choices |
| Design | Commit a budget, capacity, failure, or consistency contract |
| Implement | Write only the handler or policy required by the design |
| Execute | Run naive and fixed branches in the same seeded world |
| Reflect | Select the first divergence and explain the tradeoff |
| Generalize | Apply the pattern to a new SignalDesk subsystem |

The first five stages must be useful without code. The learner should be able
to discover the phenomenon by changing a knob and watching the trace before the
editor opens.

## The Playable Mission Loop

Each mission should fit into a focused 5-10 minute session:

1. **Briefing:** a customer-facing objective, not a technical title.
2. **Baseline:** learner runs the naive world and sees the failure.
3. **Intervene:** learner gets three to five controls tied to the phenomenon.
4. **Predict:** learner commits what will improve and what may worsen.
5. **Build:** learner encodes the policy after the design gate.
6. **Replay:** learner scrubs the same request or incident across both runs.
7. **Verdict:** gates evaluate the objective and expose the tradeoff.
8. **Artifact:** learner writes the operational decision in their own words.

Example S3 briefing:

> Feature API B is returning 10% errors. Checkout traffic is normal. Keep
> successful purchases above 90% without creating more than 2 attempts per
> request.

The learner can change retry count and backoff, run the naive branch, watch
request volume multiply, then design a bounded policy. The fix is not “turn
off retries”; the artifact must state when retrying is safe and why.

## Interaction Surfaces

The production experience needs these surfaces, in this order:

### 1. World View

- topology as a live map, not decorative boxes;
- animated request tokens with status and age;
- queue depth, in-flight work, and dependency state on each component;
- click a component to inspect its contract and policy.

### 2. Experiment Console

- request composer with valid and invalid payload presets;
- traffic rate and burst controls;
- failure injectors with explicit scope and duration;
- policy controls that expose tradeoffs rather than arbitrary settings;
- a prediction checkpoint before Run.

### 3. Trace Replay

- one request waterfall;
- system timeline for arrivals, queues, retries, and completions;
- first-divergence marker between naive and fixed branches;
- cursor-linked topology state;
- text event stream for keyboard and screen-reader use.

### 4. Incident Board

- objective and current SLO;
- evidence selected from the trace;
- policy changes and their consequences;
- timeline of interventions;
- final decision and postmortem fields.

The console should be the memorable surface. The dashboard is supporting
evidence, never the main activity.

## Runtime Requirements

The existing deterministic simulation engine is the correct foundation, but the
world plan adds explicit concepts:

```text
WorldManifest
  worldVersion, fixtureVersion
  entities, components, contracts
  baselinePolicies, interventionLimits
  loadProfiles, incidentSchedules

MissionManifest
  prerequisite, objective, phenomenon
  allowedControls, predictionPrompts
  naivePolicy, referencePolicy
  systemGates, artifactContract

ExperimentBranch
  branchId, parentRunId?, seed
  interventions[], trace, metrics, status
```

Required trace additions:

- `control.changed`
- `load.profile_changed`
- `policy.applied`
- `deploy.started / deploy.completed / deploy.rollback`
- `slo.breached / slo.recovered`
- `alert.opened / alert.closed`
- `branch.created`
- `artifact.evidence_selected`

The runtime must support deterministic branching:

- same world + same seed + same interventions = same trace;
- a branch records only its interventions and references its parent evidence;
- naive and fixed runs use the same scheduled arrivals and failure draws;
- live animation is a projection of an immutable trace, not a second execution
  path.

## Authoring Contract

No system is considered designed until its manifest includes:

- one thinking move in eight words or fewer;
- one prior system it reuses;
- one new phenomenon;
- customer-facing objective;
- topology and API contracts;
- seeded load and failure schedule;
- at least three learner controls;
- naive policy and why it is tempting;
- reference policy and its cost;
- trace events needed to prove the phenomenon;
- three system gates linked to evidence;
- durable artifact and transfer mission;
- mobile interaction alternative;
- golden trace and deterministic replay test.

## Delivery Plan

### Phase W0 — World design review

- Approve SignalDesk entities, system map, and unlock graph.
- Freeze the first four authored missions: S0-S3.
- Write one-page mission briefs before implementing controls.
- Reject any mission that introduces more than one new thinking move.

Exit: an author can explain why each mission is necessary and what prior
artifact it consumes.

### Phase W1 — First playable world

- Implement world topology rendering with live component state.
- Add request composer, traffic control, and one failure injector.
- Add branch metadata and intervention events.
- Convert S2 into the first full incident mission.
- Keep the existing S1-S2 tests as regression fixtures while adding S3 coverage.

Exit: a learner can cause, observe, explain, and fix the S2 coupling incident
without starting in the editor.

### Phase W2 — Reliability arc

- Author S3 retry storm and S4 circuit breaker.
- Add retry/backoff/circuit controls and branch replay.
- Add first-divergence selection and incident board artifact.

Exit: the learner can distinguish latency, error rate, request amplification,
and dependency protection from their own trace.

### Phase W3 — Capacity and work arc

- Author S5 admission control, S6 cache, S7 async work, and S8 batching.
- Add queue capacity, worker, cache, batch-window, and cancellation controls.
- Add objective presets for availability, freshness, and cost.

Exit: the learner can choose where to absorb load and explain what is lost when
the system refuses work, delays work, or groups work.

### Phase W4 — Data and release arc

- Author S9 partitioning, S10 consistency, and S11 model rollout.
- Add shard heat maps, replica lag, canary traffic, and rollback controls.
- Carry the same model and ticket artifacts between missions.

Exit: the learner can separate data freshness, model correctness, and serving
health as independent failure surfaces.

### Phase W5 — Operations and capstone

- Author S12 observability and S13 safety gateway.
- Author S14 compound incident with a changing incident schedule.
- Add postmortem review against evidence, not prose keywords.
- Test the full lane on 390px, keyboard, reduced motion, and offline reload.

Exit: the learner can operate SignalDesk through a compound incident and
produce a defensible recovery plan.

## Success Criteria

The world plan succeeds when a learner can:

1. Predict where a failure will appear before running code.
2. Cause the failure themselves through a bounded intervention.
3. Point to the first trace event that proves the cause.
4. Change one policy and explain the resulting tradeoff.
5. Reproduce the result in a branch with the same world seed.
6. Transfer the pattern to a different SignalDesk subsystem.

The product should measure these behaviors, not time spent on dashboards:

- intervention-to-correct-cause rate;
- first-divergence selection accuracy;
- naive-before-fix compliance;
- policy tradeoff quality;
- transfer success on a new subsystem;
- solution-reveal and hint depth.

## Explicit Non-Goals

- No multiplayer incident room in the first milestone.
- No real cloud services or production traffic.
- No arbitrary freeform chaos controls without pedagogical purpose.
- No flat scenario map that exposes every system before prerequisites.
- No LLM-generated incident explanation as a substitute for authored evidence.
- No additional scenario authoring until S2 is a complete playable mission.

## Immediate Next Work

1. Review and approve the SignalDesk world map.
2. Define the S2 mission manifest and intervention vocabulary.
3. Build the world view and experiment console around the existing runtime.
4. Add deterministic branch and control events.
5. Re-author S2 as the first complete incident, then stop for a learning review.
