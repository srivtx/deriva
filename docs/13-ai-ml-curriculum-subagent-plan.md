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

## Exact lesson backlog

The subagent must build these lessons in this order. Do not invent a different first
batch or skip directly to neural networks.

### Track 0 — Engineering and data

#### 0.1 What counts as training data?

- Kind: `data-lab`
- Thinking move: make messy reality measurable
- Learner builds: a dataset contract and validator
- Fixture: 30 document rows with duplicates, missing labels, malformed text, and one
  train/test leak
- Execute trace: accepted rows, rejected rows, rejection reasons
- Artifact: dataset card
- Gate: learner correctly rejects the leaked row and explains why

#### 0.2 Split the evidence

- Kind: `data-lab`
- Thinking move: protect the evidence from the learner
- Learner builds: train/validation/test splitter
- Fixture: labelled documents with repeated author/source groups
- Execute trace: row assignment and group leakage warnings
- Artifact: split policy
- Gate: no source group appears in both train and test

#### 0.3 Features are a decision

- Kind: `data-lab`
- Thinking move: turn language into comparable signals
- Learner builds: a deterministic bag-of-words feature extractor
- Fixture: short support-ticket documents
- Execute trace: tokenization, vocabulary, feature vectors
- Artifact: feature contract
- Gate: learner identifies a feature that leaks the label and removes it

#### 0.4 The baseline earns the right to improve

- Kind: `model-lab`
- Thinking move: measure before optimizing
- Learner builds: majority-class and keyword baselines
- Fixture: imbalanced support-ticket labels
- Execute trace: predictions, confusion matrix counts, metric calculations
- Artifact: baseline report
- Gate: learner chooses precision or recall for the stated product cost

### Track 1 — Classical learning from scratch

#### 1.1 A score is not a prediction

- Kind: `model-lab`
- Thinking move: separate score from decision
- Learner builds: linear score function and threshold rule
- Fixture: two-feature binary dataset
- Execute trace: weighted sum, threshold, prediction
- Artifact: model contract
- Gate: learner changes the threshold and predicts the confusion-matrix tradeoff

#### 1.2 Learn by reducing error

- Kind: `model-lab`
- Thinking move: adjust parameters to reduce loss
- Learner builds: logistic regression with gradient descent from scratch
- Fixture: linearly separable and non-separable variants
- Execute trace: score, loss, gradient, parameter update per step
- Artifact: training run report
- Gate: learner predicts the effect of doubling the learning rate

#### 1.3 The learning rate is a system choice

- Kind: `experiment-lab`
- Thinking move: change one cause at a time
- Learner builds: controlled learning-rate experiment
- Fixture: fixed dataset and fixed seed
- Execute trace: loss curves for three learning rates
- Artifact: experiment table
- Gate: learner identifies under-step, stable, and divergent runs

#### 1.4 When a good score lies

- Kind: `failure-lab`
- Thinking move: distrust aggregate metrics
- Learner builds: error-analysis report
- Fixture: imbalanced labels with a high-accuracy bad model
- Execute trace: per-class metrics and false-positive/false-negative examples
- Artifact: metric decision memo
- Gate: learner rejects accuracy as the sole acceptance metric

#### 1.5 Regularization is a tradeoff

- Kind: `experiment-lab`
- Thinking move: pay a little bias to reduce variance
- Learner builds: L2-regularized classifier
- Fixture: noisy high-dimensional features
- Execute trace: train/validation loss and parameter magnitudes
- Artifact: regularization comparison
- Gate: learner explains why training loss can rise while validation performance improves

### Track 2 — Experiments and model judgment

#### 2.1 Reproducibility is part of correctness

- Kind: `experiment-lab`
- Thinking move: make a result repeatable
- Learner builds: seeded experiment runner
- Fixture: fixed dataset plus shuffled training order
- Execute trace: seed, config, metrics, artifact hash
- Artifact: reproducibility record
- Gate: two runs with the same config produce the same result

#### 2.2 Find the error family

- Kind: `failure-lab`
- Thinking move: group failures before fixing them
- Learner builds: error taxonomy and filterable report
- Fixture: prediction errors caused by length, vocabulary, label noise, and leakage
- Execute trace: error category assignment
- Artifact: error taxonomy
- Gate: learner selects a fix that addresses the largest error family

#### 2.3 Build a better baseline honestly

- Kind: `experiment-lab`
- Thinking move: improve one variable with evidence
- Learner builds: feature ablation runner
- Fixture: same data and split as earlier lessons
- Execute trace: baseline vs one-feature-change comparisons
- Artifact: ablation report
- Gate: learner rejects an improvement that is not statistically or practically useful

### Track 3 — Service engineering

#### 3.1 A model needs a contract

- Kind: `service-lab`
- Thinking move: make inference behavior explicit
- Learner builds: request/response API contract
- Fixture: valid, missing-field, oversized, and unknown-version requests
- Execute trace: validation and structured error events
- Artifact: API contract
- Gate: learner separates client errors from server errors

#### 3.2 Serve the model safely

- Kind: `service-lab`
- Thinking move: isolate prediction from transport
- Learner builds: inference service wrapper around the trained classifier
- Fixture: request batch with valid and invalid payloads
- Execute trace: request start, validation, inference, response, latency
- Artifact: service README and example requests
- Gate: malformed input never reaches model inference

#### 3.3 Timeouts and retries are not free

- Kind: `failure-lab`
- Thinking move: bound work before scaling it
- Learner builds: timeout, retry, and idempotency policy
- Fixture: delayed model calls and duplicate request IDs
- Execute trace: retry count, timeout, completion, deduplication
- Artifact: failure policy
- Gate: learner prevents retry amplification and duplicate side effects

#### 3.4 Measure the service, not just the model

- Kind: `service-lab`
- Thinking move: connect quality to operations
- Learner builds: request metrics dashboard model
- Fixture: mixed request sizes and response outcomes
- Execute trace: latency, status, model version, confidence, and cost estimate
- Artifact: service SLO sheet
- Gate: learner identifies a model-quality regression separately from a latency regression

### Track 4 — Retrieval and language systems

These lessons come only after Tracks 0–3 pass. They extend the same document service.

#### 4.1 Search before generation

- Kind: `model-lab`
- Thinking move: retrieve evidence before answering
- Learner builds: TF-IDF/BM25-style lexical search
- Fixture: the same document corpus plus query set
- Execute trace: token overlap, scores, ranked results
- Artifact: retrieval evaluation set
- Gate: learner distinguishes retrieval failure from answer failure

#### 4.2 Similarity is a representation choice

- Kind: `model-lab`
- Thinking move: make semantic closeness computable
- Learner builds: embeddings from a small deterministic encoder and cosine retrieval
- Fixture: paraphrased documents and distractors
- Execute trace: vectors, similarities, nearest results
- Artifact: lexical-vs-semantic comparison
- Gate: learner explains one query where lexical search wins and one where embeddings win

#### 4.3 Ranking is a separate responsibility

- Kind: `experiment-lab`
- Thinking move: separate candidate generation from ordering
- Learner builds: hybrid retrieval and reranking pipeline
- Fixture: candidate sets with relevance labels
- Execute trace: candidate retrieval, feature scoring, final ordering
- Artifact: ranking report
- Gate: learner diagnoses whether a failure came from recall or ranking

#### 4.4 Cite the evidence

- Kind: `service-lab`
- Thinking move: keep generated claims attached to sources
- Learner builds: retrieval-backed answer endpoint with citations
- Fixture: answerable, ambiguous, and unanswerable questions
- Execute trace: retrieved chunks, citation selection, abstention
- Artifact: grounded-answer evaluation set
- Gate: system abstains when evidence is insufficient

### Track 5 — Deep learning and transformers

These lessons are a separate later milestone; do not mix them into the first vertical
slice.

#### 5.1 Tensors are structured data

- Kind: `model-lab`
- Thinking move: make batched computation explicit
- Learner builds: tiny tensor class with shape checks and broadcasting
- Artifact: tensor operation tests

#### 5.2 Gradients are dependency accounting

- Kind: `model-lab`
- Thinking move: propagate responsibility backward
- Learner builds: scalar autograd engine
- Artifact: gradient-check report

#### 5.3 Compose a neural network

- Kind: `model-lab`
- Thinking move: compose differentiable transformations
- Learner builds: MLP and training loop from scratch
- Artifact: training trace and checkpoint

#### 5.4 Context changes representation

- Kind: `model-lab`
- Thinking move: condition a token on its neighbors
- Learner builds: single-head self-attention with causal masking
- Artifact: attention inspection report

#### 5.5 Build a tiny language model

- Kind: `model-lab`
- Thinking move: predict the next piece from context
- Learner builds: tokenizer, mini-transformer, training loop, and sampler
- Artifact: model card and generation failure report

## Required learner artifact chain

The subagent must connect artifacts across lessons rather than resetting after every
exercise:

    dataset card
      -> split policy
      -> feature contract
      -> baseline report
      -> model/training report
      -> experiment table
      -> error taxonomy
      -> model artifact
      -> API contract
      -> service SLO sheet
      -> failure policy
      -> retrieval evaluation set
      -> grounded-answer evaluation set

Every later lesson should load the previous artifact and make the learner decide whether
to keep, revise, or reject it.

## Subagent execution order

1. Implement schema extensions and tests.
2. Author and render only lesson 0.1.
3. Add deterministic fixtures and trace folds for lesson 0.1.
4. Add lesson 0.2 and 0.3 using the same surfaces.
5. Add lessons 0.4 and 1.1–1.2.
6. Add experiment lessons 1.3–1.5 and 2.1–2.3.
7. Add service lessons 3.1–3.4.
8. Stop and review the vertical slice before starting retrieval.
9. Add Tracks 4 and 5 only as separate milestones.

After each lesson, run:

    pnpm typecheck
    pnpm build
    git diff --check

## Definition of done for the first milestone

The first milestone is complete when lessons 0.1–1.2 are authored and usable. A learner
must be able to go from messy rows to a trained-from-scratch classifier, with a dataset
contract, baseline, loss/gradient trace, evaluation report, and reflection artifact.

Do not claim the AI/ML curriculum is complete until Tracks 0–4 include the service and
retrieval work. Do not claim production readiness until the failure labs, evaluation,
observability, and backend execution lane exist.
