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

## Master coverage map

This is the complete program map. No curriculum, engineering, evaluation, or release
dependency is complete unless it appears here and has an exit check.

### A. Mathematics and theory

#### A1. Mathematical language

- scalars, vectors, matrices, tensors;
- shape, rank, broadcasting, sparse vs dense representation;
- dot products, norms, projections, cosine similarity;
- matrix multiplication and computational cost;
- numerical precision, overflow, and stability.

Artifacts: tensor specification, shape-error tests, and a similarity calculator.

#### A2. Probability and statistics

- random variables and distributions;
- conditional probability and Bayes reasoning;
- expectation, variance, covariance;
- sampling and sampling bias;
- confidence intervals and calibration;
- correlation versus causation.

Artifacts: sampling simulator, confidence-interval report, calibration plot.

#### A3. Calculus and optimization

- derivative as local change;
- partial derivatives and chain rule;
- gradient and gradient field;
- convex versus non-convex loss;
- gradient descent;
- stochastic and mini-batch updates;
- learning-rate schedules.

Artifacts: loss-surface explorer, finite-difference gradient checker, optimizer report.

#### A4. Learning theory

- generalization;
- bias/variance;
- overfitting;
- regularization;
- train/validation/test roles;
- leakage;
- distribution shift;
- class imbalance.

Artifacts: controlled overfit experiment, leakage counterexample, shift report.

#### A5. Information and representation

- entropy and cross-entropy;
- mutual-information intuition;
- tokenization;
- sparse representations;
- dense representations;
- dimensionality reduction.

Artifacts: entropy calculator, tokenization inspector, sparse-versus-dense comparison.

### B. Data engineering

Lessons must cover:

- data contracts, schemas, validation, versioning;
- collection, provenance, licensing, consent, lineage;
- cleaning, deduplication, missing values, noisy labels;
- annotation guidelines, disagreement, adjudication;
- random, temporal, group, and stratified splits;
- batch/incremental ingestion, checkpoints, retries, dead letters, idempotency;
- freshness, schema drift, distribution drift, missingness, and outliers.

Required project: a versioned document dataset pipeline with a dataset card, lineage,
quality report, reproducible rebuild, and drift warning.

### C. Classical ML

Lessons must cover:

- majority, keyword, random, and retrieval baselines;
- linear regression and logistic regression;
- nearest neighbors;
- decision trees and random forests;
- clustering and dimensionality reduction;
- cross-validation and hyperparameter search;
- threshold selection, calibration, confidence, abstention;
- accuracy, precision, recall, F1, ROC-AUC, PR-AUC, regression error, ranking metrics,
  calibration, and slice evaluation.

Required project: a document classifier with baseline comparison, error taxonomy,
calibrated confidence, and abstention.

### D. Deep learning

Lessons must cover:

- tensor storage, shape checks, broadcasting, reductions, batching;
- computation graphs and automatic differentiation;
- gradient checks;
- linear layers, activations, initialization, normalization, dropout;
- training loops and checkpointing;
- convolution and receptive fields;
- sequence representation, recurrence, hidden state, vanishing gradients;
- queries, keys, values, positional information, masking, multi-head attention;
- transformer blocks and scaling behavior.

Required project: a deterministic tiny transformer with attention inspection,
checkpointing, and a generation failure report.

### E. Retrieval and recommendation

Lessons must cover:

- inverted indexes, term frequency, inverse document frequency, BM25;
- embeddings, nearest neighbors, approximate search, index freshness;
- ranking features, pairwise/listwise intuition, reranking;
- popularity, content similarity, collaborative signals, cold start, feedback loops.

Required project: hybrid search and recommendation with relevance labels, retrieval
metrics, ranking metrics, and an index freshness policy.

### F. Generative AI

Lessons must cover:

- token prediction, cross-entropy, causal masking, sampling;
- temperature, top-k, top-p;
- context selection, truncation, structured output, prompt versioning;
- retrieval-augmented generation;
- citations, abstention, groundedness;
- tool contracts, planning/execution, validation, retries, human approval;
- groundedness, relevance, citation correctness, refusal quality, regression sets.

Required project: a citation-backed knowledge service that abstains when evidence is
insufficient and passes a grounded-answer evaluation set.

### G. Backend and distributed AI engineering

Lessons must cover:

- request/response contracts;
- synchronous versus asynchronous work;
- health versus readiness;
- versioned model endpoints;
- batching, caching, streaming, concurrency;
- CPU/GPU scheduling, memory limits, cold starts;
- timeouts, retries, idempotency, circuit breakers, backpressure;
- queues, workers, leases, checkpoints, replay, partial failure;
- relational metadata, object storage, model artifacts, vector indexes, migrations.

Required project: asynchronous ingestion plus inference API with retries, idempotency,
queue visibility, and a failure-recovery exercise.

### H. MLOps and platform engineering

Lessons must cover:

- run configuration, seeds, artifact hashes, metric persistence;
- model registry, version promotion, approval gates, rollback, deprecation;
- containers, environment configuration, secrets, health checks, rollout strategies;
- logs, metrics, traces, latency percentiles, error rates, quality, and cost;
- golden sets, regression tests, shadow evaluation, drift triggers, human review.

Required project: deployable model service with registry, evaluation gate, rollback,
observability dashboard, and cost report.

### I. Security, privacy, and responsible AI

Lessons must cover:

- PII identification, redaction, retention, access, deletion, provenance;
- prompt injection, data exfiltration, unsafe tools, untrusted retrieval;
- output validation;
- slice metrics, subgroup performance, label bias, human escalation;
- rate limits, quotas, audit logs, abuse fixtures, incident response.

Required project: red-team suite and remediation report for the knowledge service.

### J. Product and communication

Lessons must cover:

- user, operator, success definition, constraints, non-goals;
- product, model, system, and guardrail metrics;
- build versus buy;
- quality versus latency;
- quality versus cost;
- freshness versus stability;
- architecture review;
- model card, dataset card, experiment memo, and incident postmortem.

Required project: final design review with tradeoffs and one explicitly rejected
alternative.

## Complete project ladder

The program must produce these cumulative builds:

1. Data Contract Lab — validate and version messy documents.
2. Metrics Lab — implement metrics and a majority baseline.
3. Classifier Lab — train a linear classifier from scratch.
4. Experiment Lab — compare controlled runs and classify errors.
5. Data Pipeline — ingest, clean, split, checkpoint, and rebuild data.
6. Inference API — serve the classifier with validation and structured errors.
7. Async Ingestion Service — queue work, retry safely, and recover failures.
8. Lexical Search — build an index and evaluate retrieval.
9. Vector Search — build embeddings and nearest-neighbor retrieval.
10. Hybrid Ranker — combine lexical and semantic candidates.
11. Grounded Answer Service — retrieve, cite, abstain, and evaluate.
12. Tensor/Autograd Engine — implement tensors and gradients from scratch.
13. Mini Transformer — train and inspect a tiny language model.
14. Production AI Platform — registry, deployment, observability, rollback, and cost.
15. Final Knowledge Intelligence System — integrate all preceding artifacts.

Every project must include a problem statement, design contract, from-scratch core,
tests, baseline, evaluation report, failure exercise, operational artifact,
reflection/postmortem, and transfer exercise.

## Required practice inventory

Every major track must include all ten practice types:

1. Derivation — derive an equation, invariant, or contract.
2. Prediction — predict a score, gradient, metric, or system state.
3. Construction — assemble a pipeline, model, or API contract.
4. Implementation — write the minimal working component.
5. Debugging — repair a deliberately broken implementation.
6. Counterexample — create input that defeats a tempting rule.
7. Comparison — compare baseline and improved system.
8. Operations — respond to timeout, drift, queue, or deployment failure.
9. Communication — write a model card, design memo, or incident report.
10. Transfer — apply the pattern in an unfamiliar domain.

No track is complete if it contains only coding exercises.

## End-to-end milestones

### M0 — Curriculum contract

Deliver schema extensions, artifact/evaluation contracts, trace vocabulary, first fixture,
and the lesson What counts as training data?

Exit: schema rejects incomplete AI lessons; all nine stages work; learner produces a
dataset card before implementation.

### M1 — Foundations and classical model

Deliver lessons 0.1–1.5, tensor/metric/gradient traces, baseline and classifier projects,
experiment runner, and error-analysis artifacts.

Exit: learner builds and evaluates a classifier from scratch; baseline comparison and
failure report are complete.

### M2 — Data and experiment operations

Deliver data pipelines, reproducibility records, artifact hashes, quality checks, drift,
and leakage labs.

Exit: dataset rebuild is reproducible; changed source creates a quality warning;
experiments are comparable.

### M3 — Backend inference service

Deliver service contract lessons, API builder, inference runner, validation/errors,
request traces, latency, timeout, retry, and idempotency labs.

Exit: model is behind a documented service contract; malformed inputs and duplicate jobs
are safe; quality, latency, and failure metrics are distinct.

### M4 — Retrieval and knowledge service

Deliver lexical retrieval, vector retrieval, ranking, hybrid search, citation-backed
answers, groundedness, and abstention evaluation.

Exit: learner diagnoses retrieval failure versus generation failure; answers cite or
abstain; retrieval evaluation is reproducible.

### M5 — Deep learning foundations

Deliver tensor engine, autograd, MLP, optimizer, sequence, attention, and mini-transformer
lessons.

Exit: learner explains forward/backward computation; training and inference are
reproducible; failures are captured in a model card.

### M6 — MLOps and reliability

Deliver registry, deployment, observability, continuous evaluation, drift, rollback,
cost, security, and red-team labs.

Exit: model version can be promoted, monitored, rejected, and rolled back; quality and
operational alerts are distinct; runbook and postmortem exist.

### M7 — Final system capstone

Deliver integrated knowledge system, architecture review, load test, evaluation,
security, cost report, final demo, and transfer review.

Exit: learner can rebuild from clean artifacts, every component has tests/failure
policy, and tradeoffs are explainable mathematically, operationally, and product-wise.

## Cross-cutting acceptance gates

Every lesson must pass schema validation, nine-stage completeness, one thinking move per
stage, deterministic fixture execution, 390px layout, light/dark contrast, keyboard,
reduced-motion, artifact-before-implementation, trace replay, reflection, and transfer.

Every project must additionally pass baseline comparison, evaluation, failure fixture,
reproducibility, system contract, observability, cost/tradeoff note, and security/privacy
review where data or generation is involved.

## Completeness checklist

- [ ] math and probability
- [ ] statistics and evaluation
- [ ] data contracts and provenance
- [ ] cleaning and labeling
- [ ] splitting and leakage
- [ ] classical baselines and supervised learning
- [ ] unsupervised learning
- [ ] model selection and calibration
- [ ] tensors and automatic differentiation
- [ ] neural networks and convolution
- [ ] sequence modeling and transformers
- [ ] lexical, vector, and hybrid retrieval
- [ ] ranking and recommendations
- [ ] language modeling and RAG
- [ ] tool workflows and generative evaluation
- [ ] API contracts and inference
- [ ] queues, workers, batching, caching, and streaming
- [ ] timeouts, retries, idempotency, and backpressure
- [ ] storage and model artifacts
- [ ] experiments and reproducibility
- [ ] registry and promotion
- [ ] deployment and observability
- [ ] continuous evaluation, drift, and rollback
- [ ] privacy and PII
- [ ] prompt/model security
- [ ] fairness and slice evaluation
- [ ] abuse controls and incident response
- [ ] product metrics, cost, tradeoffs, and communication
- [ ] final integrated capstone

If a checkbox has no lesson ID, artifact, fixture, and exit test attached to it, the
curriculum is not complete.

## Product navigation and question bank

The labs must be surfaced in the product. A learner must never need to guess or type a
route URL.

### Required routes

    /ai-ml
    /ai-ml/track/[trackId]
    /ai-ml/lab/[lessonId]
    /ai-ml/question/[questionId]
    /ai-ml/projects
    /ai-ml/patterns

The AI/ML home screen shows Continue, Current Build, Tracks, Labs, Practice Queue,
Projects, and Patterns. Every card has Start or Resume. Any question is reachable in
three taps: track, lab, question.

Track pages filter by status, type, prerequisite, artifact, and review date. Persist
last lesson, stage, artifact draft, attempts, hints, trace cursor, and review date.
Every lab links to its questions, project, artifact, prerequisite, and next action.

### Typed question contract

Every question must contain:

    id, track, lessonId, kind, prompt, contextFixture,
    expectedArtifact or expectedTraceObservation,
    rubric, hints, pattern, prerequisites, nextQuestionId, reviewIntervals

Kinds are derivation, prediction, construction, implementation, debugging,
counterexample, comparison, operations, communication, and transfer. A question
without a fixture, rubric, hints, and next question is incomplete.

### Author the first 180 real questions

#### Foundations and mathematics

1. MATH-001: What shape does a batch have after adding three features?
2. MATH-002: Why does a dot product rank these two documents differently?
3. MATH-003: Find the cosine similarity of these supplied vectors.
4. MATH-004: Which matrix multiplication is invalid, and why?
5. MATH-005: Predict dense versus sparse memory cost for this vocabulary.
6. MATH-006: Repair this broadcasting error without changing the batch dimension.
7. STAT-001: Which sampling process creates selection bias?
8. STAT-002: Predict how this class imbalance changes accuracy.
9. STAT-003: Calculate precision, recall, and F1 from this confusion matrix.
10. STAT-004: Which confidence interval is narrower, and what caused the difference?
11. STAT-005: Identify correlation here without evidence of causation.
12. STAT-006: Diagnose this badly calibrated confidence score.
13. OPT-001: Estimate this derivative with finite differences.
14. OPT-002: Derive the gradient of this one-parameter squared loss.
15. OPT-003: Trace one gradient-descent update by hand.
16. OPT-004: Predict the effect of doubling this learning rate.
17. OPT-005: Find the exploding update in this loss trace.
18. OPT-006: Choose a batch size under this memory constraint.
19. INFO-001: Calculate entropy for these two label distributions.
20. INFO-002: Why does cross-entropy punish this confident wrong prediction?
21. INFO-003: Tokenize this string under the supplied vocabulary.
22. INFO-004: Find the tokenization that creates the longest context.
23. INFO-005: Choose sparse or dense features for this dataset and justify it.
24. INFO-006: Identify what this dimensionality reduction discarded.
25. THEORY-001: Find the train/test leakage in this feature.
26. THEORY-002: Predict which of these models will overfit.
27. THEORY-003: Construct a distribution shift that breaks this model.
28. THEORY-004: Choose regularization for the stated failure.
29. THEORY-005: Explain why more training data may not fix this bias.
30. THEORY-006: Design a split that respects time and user groups.

#### Data and classical ML

31. DATA-001: Choose required fields for this document contract.
32. DATA-002: Decide which duplicate record survives and explain the rule.
33. DATA-003: Repair this malformed record without hiding the error.
34. DATA-004: Separate missing, unknown, and invalid values.
35. DATA-005: Build a rejection reason for this leaked label.
36. DATA-006: Predict the result of this temporal split.
37. DATA-007: Find the group that appears in both train and test.
38. DATA-008: Design a dataset version identifier.
39. DATA-009: Recover this failed ingestion job from its checkpoint.
40. DATA-010: Decide whether this retry is idempotent.
41. BASE-001: Build a majority-class baseline for these labels.
42. BASE-002: Build a keyword baseline and state its blind spot.
43. BASE-003: Choose a baseline for this ranking problem.
44. BASE-004: Compare this baseline and model without changing the split.
45. BASE-005: Explain why this random baseline is still useful.
46. MODEL-001: Convert these feature weights into a linear score.
47. MODEL-002: Choose a classification threshold for this asymmetric cost.
48. MODEL-003: Implement logistic prediction from scratch.
49. MODEL-004: Trace this classifier’s loss and gradient.
50. MODEL-005: Debug the sign error in this gradient descent loop.
51. MODEL-006: Diagnose why this model predicts only one class.
52. MODEL-007: Choose regularization strength from these validation curves.
53. MODEL-008: Calibrate this accurate but overconfident model.
54. MODEL-009: Decide when this model should abstain.
55. MODEL-010: Explain one false positive and one false negative.
56. UNSUP-001: Choose the number of clusters from this plot.
57. UNSUP-002: Trace one centroid update.
58. UNSUP-003: Identify the cluster created by a scaling error.
59. UNSUP-004: Explain what this dimensionality reduction discarded.
60. UNSUP-005: Design a manual inspection sample for these clusters.
61. TREE-ML-001: Choose a split that reduces impurity for these rows.
62. TREE-ML-002: Find the feature split that overfits the training set.
63. TREE-ML-003: Explain why an ensemble is more stable here.
64. TREE-ML-004: Debug a tree that uses a leaked feature.
65. TREE-ML-005: Compare nearest-neighbor behavior before and after scaling.

#### Experiments and evaluation

66. EXP-001: Write a hypothesis before changing this feature.
67. EXP-002: Select the one variable allowed to change.
68. EXP-003: Detect this invalid comparison caused by different splits.
69. EXP-004: Reproduce this run from its config and seed.
70. EXP-005: Read this learning curve and diagnose underfitting.
71. EXP-006: Read this learning curve and diagnose overfitting.
72. EXP-007: Decide whether this improvement is practically meaningful.
73. EXP-008: Design an ablation for this feature group.
74. EXP-009: Classify these errors by root cause.
75. EXP-010: Choose the next experiment from this error taxonomy.
76. EVAL-001: Choose metrics for this high-recall moderation system.
77. EVAL-002: Calculate PR-AUC from these points.
78. EVAL-003: Find the metric that hides this minority-class failure.
79. EVAL-004: Design slice evaluation for these user segments.
80. EVAL-005: Interpret this calibration curve.
81. EVAL-006: Build a regression fixture for this previous failure.
82. EVAL-007: Decide whether this model is ready for shadow traffic.
83. EVAL-008: Separate data, model, and serving regressions.
84. EVAL-009: Explain why offline success did not transfer online.
85. EVAL-010: Write the acceptance question for this model release.

#### Deep learning and transformers

86. TENSOR-001: Repair this tensor shape mismatch.
87. TENSOR-002: Predict the output shape of this batched operation.
88. TENSOR-003: Implement a reduction without losing the batch dimension.
89. TENSOR-004: Compare dense and sparse memory for this vocabulary.
90. TENSOR-005: Find the operation that causes numerical overflow.
91. AUTOGRAD-001: Draw the computation graph for this scalar expression.
92. AUTOGRAD-002: Propagate one gradient through the graph.
93. AUTOGRAD-003: Find the missing backward edge.
94. AUTOGRAD-004: Validate this analytic gradient with finite differences.
95. AUTOGRAD-005: Debug the parameter that never receives a gradient.
96. NN-001: Choose an activation for this output contract.
97. NN-002: Predict how initialization changes activation scale.
98. NN-003: Trace one MLP forward pass.
99. NN-004: Trace one MLP backward pass.
100. NN-005: Diagnose these exploding gradients.
101. NN-006: Diagnose these vanishing gradients.
102. NN-007: Choose where normalization changes the system.
103. NN-008: Resume training from this checkpoint.
104. NN-009: Compare batch and mini-batch updates.
105. NN-010: Explain why this model memorizes training data.
106. ATTN-001: Construct queries, keys, and values for this sentence.
107. ATTN-002: Calculate one attention score.
108. ATTN-003: Apply this causal mask.
109. ATTN-004: Predict how context changes this token representation.
110. ATTN-005: Inspect and explain this attention failure.
111. ATTN-006: Compare one head and multiple heads.
112. ATTN-007: Explain the cost of a longer context.
113. ATTN-008: Debug this positional-information bug.
114. LM-001: Calculate next-token cross-entropy.
115. LM-002: Compare temperature and top-k sampling.

#### Retrieval, ranking, and recommendation

116. SEARCH-001: Build an inverted index for these five documents.
117. SEARCH-002: Calculate term frequency and inverse document frequency.
118. SEARCH-003: Rank these documents with BM25-style evidence.
119. SEARCH-004: Diagnose this lexical retrieval miss.
120. SEARCH-005: Design a retrieval evaluation set.
121. VECTOR-001: Calculate nearest-neighbor similarity.
122. VECTOR-002: Diagnose this embedding-space collision.
123. VECTOR-003: Choose an index for latency versus freshness.
124. VECTOR-004: Detect stale vectors after these document updates.
125. VECTOR-005: Compare lexical and semantic retrieval for this query.
126. RANK-001: Separate candidate recall from final ranking.
127. RANK-002: Choose ranking features for this query.
128. RANK-003: Debug the reranker that reverses strong evidence.
129. RANK-004: Calculate this ranking metric.
130. RANK-005: Explain this relevance-label disagreement.
131. REC-001: Build a popularity baseline.
132. REC-002: Diagnose the cold-start problem.
133. REC-003: Identify feedback-loop amplification.
134. REC-004: Choose exploration versus exploitation.
135. REC-005: Design a recommendation slice evaluation.

#### Generative AI and RAG

136. RAG-001: Choose which chunks belong in this context.
137. RAG-002: Diagnose retrieval failure versus generation failure.
138. RAG-003: Construct a citation-backed answer.
139. RAG-004: Decide when this system must abstain.
140. RAG-005: Detect unsupported claims in this answer.
141. PROMPT-001: Separate instruction, context, and user data.
142. PROMPT-002: Prevent prompt injection from retrieved content.
143. PROMPT-003: Design a structured-output contract.
144. PROMPT-004: Handle context truncation.
145. PROMPT-005: Version this prompt without hiding the change.
146. TOOL-001: Define a safe tool contract.
147. TOOL-002: Validate tool arguments before execution.
148. TOOL-003: Decide where human approval is required.
149. TOOL-004: Make this tool call idempotent.
150. TOOL-005: Recover from this partial workflow.
151. GENEVAL-001: Build a groundedness evaluation case.
152. GENEVAL-002: Score citation correctness.
153. GENEVAL-003: Build a refusal-quality fixture.
154. GENEVAL-004: Detect a regression in answer relevance.
155. GENEVAL-005: Separate model quality from retrieval quality.

#### Backend, MLOps, and safety

156. API-001: Design the inference request/response contract.
157. API-002: Separate client errors from server errors.
158. API-003: Design health and readiness checks.
159. API-004: Version a model endpoint safely.
160. API-005: Validate an oversized request.
161. QUEUE-001: Choose synchronous versus asynchronous execution.
162. QUEUE-002: Make this job retry idempotent.
163. QUEUE-003: Handle this dead-letter record.
164. QUEUE-004: Design backpressure for a busy worker.
165. QUEUE-005: Recover this worker after its lease expires.
166. PERF-001: Choose a batching boundary.
167. PERF-002: Design a cache key for inference.
168. PERF-003: Diagnose this p99 latency spike.
169. PERF-004: Estimate cost per request.
170. PERF-005: Choose CPU or GPU for this workload.
171. MLOPS-001: Compare two model artifacts by hash and metrics.
172. MLOPS-002: Design a promotion gate.
173. MLOPS-003: Roll back this bad model version.
174. MLOPS-004: Choose logs, metrics, and traces for this failure.
175. MLOPS-005: Detect data drift before quality collapses.
176. SAFE-001: Identify PII and design redaction.
177. SAFE-002: Design retention and deletion behavior.
178. SAFE-003: Build a prompt-injection fixture.
179. SAFE-004: Find an unsafe tool boundary.
180. OPS-001: Write the incident timeline from these traces.

### Lab and question surfacing rules

Every lab card must display status, duration, prerequisite, thinking move, artifact, and
completion requirement. Every lab links to its questions, project, artifact, prerequisite,
and next action. Question pages show prompt, fixture, rubric, hint progression, trace or
artifact preview, save/resume, next question, and related lab.

The mobile AI/ML hub must be the primary entry point. It must expose Continue, Start
Next, Search, Filters, Review Queue, Projects, and Patterns. Any question must be
reachable in three taps. Every question must link to a lab and every lab must link back
to its question queue.

### Final completeness rule

The track is not complete when topics are listed. It is complete only when all 180
questions are typed, fixture-backed, rubric-scored, hint-supported, connected to a lab,
connected to a next question, and reachable from the mobile AI/ML hub.
