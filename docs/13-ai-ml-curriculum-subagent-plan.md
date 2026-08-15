# Subagent Plan — AI/ML Systems Curriculum Vertical Slice

## Mission

Build the first systems-level AI/ML curriculum vertical slice for Deriva.

This is curriculum engineering, not a generic AI tutorial and not a UI-only task. The
learner must build a small, real system from first principles, measure it, expose it as
a service, and explain its failures.

The first slice is intentionally small:

    raw documents -> validated dataset -> linear classifier -> evaluation -> API

Do not attempt the whole AI/ML program in this task. Make the curriculum model and one
complete slice strong enough that later agents can copy it.

## Required reading

Read these files before editing:

1. AGENTS.md
2. docs/01-product-requirements.md
3. docs/02-learning-philosophy.md
4. docs/03-curriculum-design-rules.md
5. docs/04-curriculum-architecture.md
6. docs/05-system-architecture.md
7. docs/06-folder-structure.md
8. docs/09-ui-ux-design-system.md
9. src/curriculum/schema/lesson.ts
10. src/curriculum/topics/trees/00-recursion-reflex/sum-1-to-n.ts

The existing DSA curriculum is the reference for Deriva’s authored-data style. The
existing LessonModuleSchema is the contract to extend, not bypass.

## Product and learning constraints

- Concepts -> reasoning -> patterns -> implementation -> systems -> reliability.
- One new thinking move per stage.
- The learner constructs the model and experiment before seeing implementation.
- The code editor cannot appear before Design.
- Every lesson produces a durable artifact.
- A model is never accepted without a baseline and an evaluation explanation.
- A service is never accepted without an API contract and failure behavior.
- Use authored prompts and deterministic fixtures; do not generate curriculum prose with
  an LLM.
- Keep all phone layouts compatible with the existing app shell and bottom navigation.

## First curriculum slice

### Module A — Data is a contract

Thinking move: make messy reality measurable.

Artifact: versioned document dataset, schema validation report, rejected-record report,
and dataset card.

Core ideas: raw vs cleaned data, labels and features, missing values, duplicates,
leakage, and reproducibility.

### Module B — A baseline earns the right to improve

Thinking move: measure before optimizing.

Artifact: majority-class baseline, metric choice memo, and baseline evaluation report.

Core ideas: train/validation/test split, accuracy vs precision/recall, class imbalance,
and meaningful success criteria.

### Module C — Learn a boundary from data

Thinking move: adjust parameters to reduce error.

Artifact: linear/logistic classifier from scratch, loss curve, parameter trace, and
prediction examples.

Core ideas: score function, sigmoid/logistic output, loss, gradient, gradient descent,
and learning rate.

### Module D — Experiments are evidence

Thinking move: change one cause at a time.

Artifact: experiment table, controlled comparison, error taxonomy, and conclusion.

Core ideas: ablations, reproducible seeds, overfitting, regularization, and feature
impact.

### Module E — Put the model behind a service boundary

Thinking move: turn a model into a dependable contract.

Artifact: inference API contract, request/response examples, validation/error policy,
and latency measurement.

Core ideas: input validation, serialization, model version, timeout, structured errors,
and health/readiness distinction.

### Module F — Break it on purpose

Thinking move: find the boundary where confidence fails.

Artifact: adversarial/error fixture set, failure report, and remediation decision.

Core ideas: malformed input, distribution shift, low-confidence prediction, stale model
artifact, and service timeout.

## Nine-stage lesson shape

Every module must use the existing nine-stage order:

1. Understand — inspect a small real-looking dataset and predict accepted, rejected, or
   misclassified cases.
2. Play — edit rows, labels, features, or request payloads in a bounded sandbox.
3. Reason — answer Socratic questions about representation, error, or system state.
4. Discover — construct the dataset contract, metric, model state, or API contract from
   constrained options.
5. Design — declare the experiment/model/service design; this is the gate.
6. Implement — write Python only after the design passes.
7. Execute — inspect deterministic traces: rows, scores, loss, gradients, or request
   lifecycle.
8. Reflect — explain what failed, what changed, and what evidence supports the result.
9. Generalize — apply the same pattern to a new dataset or backend scenario.

Short modules may compress stage weight, never stage order.

## Implementation work breakdown

### Step 1 — Extend the curriculum schema

Edit src/curriculum/schema/lesson.ts.

Add a validated AI/ML lesson kind:

    data-lab | model-lab | experiment-lab | service-lab | failure-lab

Add these fields:

    AiArtifact:
      kind: dataset-card | baseline | model | experiment | api-contract | failure-report
      title: string
      requiredFields: string[]

    EvaluationContract:
      metrics: string[]
      baseline: string
      acceptanceQuestion: string

    SystemConstraint:
      label: string
      value: string
      whyItMatters: string

Rules:

- every AI/ML lesson declares at least one artifact;
- model lessons declare a baseline and metric;
- service lessons declare an API contract and failure policy;
- failure lessons declare a counterexample fixture;
- all stage moves remain eight words or fewer;
- invalid lessons fail pnpm build.

Do not make the schema depend on React components or execution internals.

### Step 2 — Add curriculum data directories

Create:

    src/curriculum/topics/ai-ml/
    ├── topic.ts
    ├── 00-data-contract/lesson.ts
    ├── 01-baseline/lesson.ts
    ├── 02-linear-classifier/lesson.ts
    ├── 03-experiments/lesson.ts
    ├── 04-inference-service/lesson.ts
    └── 05-failure-lab/lesson.ts

Start with one complete lesson, 00-data-contract. Add later modules only after its
schema and rendering shape are stable.

### Step 3 — Seed deterministic fixtures

Create small JSON/TypeScript fixtures under the topic directory:

- 20–40 document rows;
- intentional duplicates;
- missing labels;
- malformed records;
- a small class imbalance;
- a held-out evaluation set.

Use a fixed seed. Keep fixtures small enough for mobile/browser execution.

### Step 4 — Add trace semantics

Extend src/execution/trace/types.ts with AI/ML semantic events:

    data.accept(rowId)
    data.reject(rowId, reason)
    feature.write(name, value)
    model.score(rowId, score)
    loss.update(value)
    gradient.update(parameter, value)
    request.start(requestId)
    request.end(requestId, status, latencyMs)
    failure.detected(category)

Trace events must be snapshots. Visualizers remain pure functions of trace and cursor;
they must never execute model code.

### Step 5 — Build reusable lesson surfaces

Add under src/learning/stages/ or another boundary-safe feature directory:

- dataset inspector
- metric builder
- parameter trace
- experiment table
- API contract builder
- failure fixture builder
- artifact card

Phone rules:

- one decision per screen;
- bottom-sheet option pickers instead of native selects;
- primary action above the fixed tab bar;
- charts have text summaries;
- wide tables have a deliberate mobile alternative.

### Step 6 — Add a safe execution seam

For this first slice, run only tiny deterministic Python experiments in the existing
browser worker. Do not introduce a production server yet.

Create a typed request seam with:

    lessonId
    artifact
    fixtureId
    budget: maxEvents and maxMs

The browser runner enforces event and time budgets. Backend/container execution is the
next milestone.

### Step 7 — Add registry and route metadata

Extend src/curriculum/index.ts with the AI/ML registry without coupling curriculum data
to UI components. Add topic metadata that can later be surfaced in mobile navigation.
Do not change existing DSA IDs.

### Step 8 — Add tests before expanding content

Create:

    tests/curriculum/ai-ml-schema.test.ts
    tests/curriculum/ai-ml-fixtures.test.ts
    tests/viz/ai-ml-folds.test.ts

Test:

- invalid lesson without an artifact fails;
- model lesson without baseline fails;
- service lesson without API/failure contract fails;
- deterministic fixtures produce the same result twice;
- data folds reconstruct the correct dataset summary;
- score/loss folds are correct at every cursor;
- request folds preserve start/end order and latency.

## First lesson authoring specification

### ai-ml/00-data-contract

Title: What counts as training data?

Thinking move: make messy reality measurable.

Purpose: establish that a model cannot repair an undefined dataset.

Contrast status: exception. This is a reflex/contract lesson; the contrast is between an
unvalidated dataset and a declared contract, not two algorithms.

Artifacts:

- dataset contract;
- accepted/rejected row list;
- dataset card.

Understand: predict which rows are valid, which duplicate survives, and what happens
when a label is missing.

Play: tap a row, edit a label or feature, mark a duplicate, and watch counts change.

Reason: what does one row represent, which fields are required, can training include an
unknown label, and what happens if test data leaks into training?

Discover: choose required fields, duplicate policy, missing-value policy, and split
policy.

Design: select the contract and explain one rejection reason.

Implement: write validate_dataset(rows) returning accepted rows and structured reasons.

Execute: replay data accept/reject events and show counts/reasons at the cursor.

Reflect: explain what the naive “just load the CSV” approach hid and which failure would
invalidate every later metric.

Generalize: apply the contract to API requests and inference payloads.

## Definition of done

The subagent is finished only when:

- one AI/ML lesson validates through the curriculum schema;
- all nine stages are authored;
- the learner creates an artifact before implementation;
- deterministic execution emits semantic AI/ML trace events;
- the lesson works at 390px in light and dark themes;
- schema, fixture, and fold tests pass;
- pnpm typecheck, pnpm build, and git diff --check pass;
- docs 04, 05, 06, and 09 are updated for changed contracts or boundaries.

Do not add the next AI/ML lesson until this first vertical slice feels like an
engineering investigation rather than a quiz.
