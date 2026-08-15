# System AI/ML Projects Plan

## Mission

Create a separate Systems Projects mode for Deriva. The learner should build real,
small AI/ML systems from scratch, one function and one tested level at a time.

This is not another list of theory questions. It is a persistent project ladder:

~~~text
project card → five cumulative levels → spec + tests + editor + output → artifact
~~~

The final system is a knowledge-intelligence platform:

~~~text
raw documents
  → validated/versioned data
  → features
  → baselines and metrics
  → trained model
  → experiment evidence
  → inference service
  → search and retrieval
  → grounded answers
  → monitoring, rollback, and failure handling
~~~

The existing AI/ML question bank and nine-stage labs remain useful. They teach the
reasoning. This mode makes the learner ship the corresponding system. A question can
link to a build level, but answering the question must never count as completing the
build.

The supplied `Build Everything — 37 Projects from First Principles` PDF is a companion
lane, surfaced at `/ai-ml/build-everything`. It preserves the book's four tiers (19
atomic skills, 8 first combinations, 7 real systems, 3 frontier capstones) as typed
five-move build contracts, and every project has an executable problem/editor/tests/
artifact workspace. The browser version uses dependency-free kernels for GPU/model-hub
projects before handing the artifact to a real library environment. It is intentionally
separate from this 15-project knowledge-system ladder: the PDF lane teaches mechanisms
and combinations; this lane ships one dependable product through a five-level workbench.

## Product promise

Every level must answer five questions:

1. What real system behavior is being added?
2. Which public function or class must the learner implement?
3. Which fixtures and tests prove it works?
4. What failure does the level make visible?
5. Which artifact is carried into the next level?

If a level cannot answer all five, it is a quiz or a toy exercise and does not belong in
this mode.

## From-scratch boundary

The core implementation runs in the existing Python/Pyodide worker with deterministic
fixtures:

- no sklearn classifier for classifier levels;
- no vector database for search levels;
- no LangChain or hosted LLM for grounded-answer levels;
- no PyTorch autograd or transformer for deep-learning levels;
- no network calls, secret keys, or paid model APIs;
- no production server is required for the first browser milestone.

A later comparison level may show a library implementation, but the learner first writes
the mechanism themselves.

## Relationship to the nine-stage flow

Every project level is still one Deriva problem:

~~~text
Understand → Play → Reason → Discover → Design → Implement → Execute → Reflect → Generalize
~~~

The reference screenshot is the Stage 6/7 workbench after the design gate. Before the
gate, the editor pane is replaced by the compact design surface. This preserves the
non-negotiable rule that code appears only after a design exists.

The five project levels add a systems progression:

| Level | Systems progression | New move |
|---|---|---|
| L1 | One deterministic core function | Define the contract |
| L2 | State, composition, or persistence | Preserve an invariant |
| L3 | Evidence and integration | Measure behavior |
| L4 | Deliberate failure | Bound a failure |
| L5 | Shippable project artifact | Make an operational decision |

Each level reuses roughly 90% of the previous vocabulary and code shape. Only the
remaining 10% should be new.

## Target experience

### Project map

The project map route is /ai-ml/projects.

Each card must have:

- a family label and project icon;
- a real-system pitch;
- 0/5 through 5/5 progress;
- five level rows;
- level title, duration, and chevron;
- completed/current/locked states;
- dependency ordering, never Easy/Medium/Hard ordering;
- one-column mobile layout.

Example card:

~~~text
Document Intelligence Platform
Data + ML systems · 5 levels
Build a dependable document classifier and knowledge service from raw rows.

○ L1 Row Contract & Validator                   ~12 min →
○ L2 Deduplication + Dataset Version            ~15 min →
○ L3 Group-Safe Split                           ~18 min →
○ L4 Incremental Ingest + Dead Letters          ~20 min →
○ L5 Rebuildable Dataset Release                ~25 min →
~~~

### Level workbench

The route is /ai-ml/projects/[projectId]/level/[levelId].

After the design gate it should resemble the supplied Practice Lab screen:

~~~text
← Projects   project / L1   Row Contract & Validator   ~12 min
L1   L2   L3   L4   L5                         AI Hint  Hints  Run Tests

Spec | Tests                    solution.py                    Test Output
──────────────────────          ─────────────────────           ─────────────
Build ...                       learner editor                 no results yet
Required API ...                Reset                          ✓ / ✗ rows
Behavior ...                    Run Tests                      failure details

← Projects                                      Level 1 of 5                    L2 →
~~~

Required behavior:

- Spec explains product behavior, API, constraints, and examples.
- Tests shows visible contract tests and hidden edge-test count.
- The editor starts with a didactic skeleton, never a blank file.
- Run Tests executes the learner's code in the worker with event/time budgets.
- Output shows each test, expected value, actual value, and invariant explanation.
- Hints are question-first and reveal one level at a time.
- Solutions are hidden behind the existing reveal policy and reveal is persisted.
- Completion requires tests plus the artifact gate; a checkbox is insufficient.
- On mobile, panes become Spec, Code, and Output tabs with a sticky Run Tests action.

### Answers and correctness

There are two kinds of answer:

1. Executable answer: the learner's function/class runs against visible and hidden
   tests. Passing the contract tests is the main correctness signal.
2. Engineering answer: the learner records a metric decision, design choice, or failure
   policy. Required fields and a rubric are checked, then an artifact is saved.

The platform must not show a prose answer before an attempt. The question-bank answer can
link to the build level, but question completion is not build completion.

## Routes

Add or evolve these surfaces:

~~~text
/ai-ml/projects
  project card map

/ai-ml/projects/[projectId]
  project brief, five levels, prerequisites, artifact chain

/ai-ml/projects/[projectId]/level/[levelId]
  nine-stage level shell; Stage 6 uses the workbench

/ai-ml/projects/[projectId]/level/[levelId]/artifact
  saved artifact, evidence, reflection, and next-level decision
~~~

Every level links to its related lab, questions, prerequisite artifact, next level, and
pattern journal entry. The learner never needs to type a URL.

## Typed project model

Add a curriculum-only contract under src/curriculum/schema. It must not import React,
execution, or UI code.

~~~text
SystemsProject:
  id, family, title, pitch, userStory
  prerequisites, artifactInputs, artifactOutputs
  levels: exactly five SystemsProjectLevel values

SystemsProjectLevel:
  id, number 1..5, title, durationMinutes
  thinkingMove (≤ 8 words), purpose, dependencies
  relatedQuestionIds, relatedLessonIds
  spec: brief, requiredApi, behavior, constraints, examples
  implementation: entryPoint, starter, visibleTests, hiddenTestCases, hints, solution
  fixtureId, traceConfig, artifact, failureDrill, exitGate
~~~

Build-time validation must reject:

- fewer or more than five levels;
- a level without a public function/class contract;
- a level without fixtures, tests, hints, solution, trace, artifact, failure drill, and
  exit gate;
- an L2–L5 artifact input that no earlier level produces;
- model/retrieval levels without a baseline and metric;
- service levels without validation and failure behavior;
- an empty trace configuration;
- a thinking move longer than eight words.

## Shared virtual repository

The learner builds one coherent repository even though the first milestone stores drafts
and artifacts locally in the browser:

~~~text
knowledge-system/
  data/            raw_documents, manifests, releases
  features/        tokenizer, vectorizer, feature_store
  metrics/         classification, ranking, slices
  models/          baselines, logistic, registry
  experiments/     runner, reports
  serving/         contract, inference, queue
  search/          inverted_index, vector_index, ranker
  generation/      citations, abstention, answer_service
  monitoring/      drift, slo, incidents
  nn/              tensor, autograd, transformer
  tests/
  artifacts/
~~~

A level opens the files it owns and imports the previous artifact. A later container or
backend lane may map this virtual repository to a real checkout without changing the
curriculum contract.

## Artifact chain

~~~text
dataset card
  → dataset release + lineage
  → feature contract
  → baseline/metric report
  → model artifact
  → experiment table
  → error taxonomy
  → inference API contract
  → queue/retry policy
  → retrieval index + relevance report
  → grounded-answer evaluation set
  → registry + rollout record
  → SLO/drift report
  → final system design review
~~~

At every project boundary the learner chooses keep, revise, or reject for the previous
artifact, with a persisted explanation.

# Complete project ladder

There are 15 project cards. Every card has exactly five cumulative levels. These 75
levels are the implementation backlog; do not turn them into static informational cards.

## Project 1 — Data Contract Lab

Family: Data systems. Build a versioned, validated document dataset.

Fixture: 30 support documents with duplicates, missing labels, malformed rows, reserved
evaluation rows, source groups, and deterministic timestamps.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Row Contract & Validator | validate_row(row) → (ok, reason); require id, text, label, metadata | malformed, missing, reserved, and no-mutation tests; leaked-row drill; row contract | ~12m |
| L2 Deduplication + Provenance | dedupe_rows(rows) → accepted, rejected, provenance; normalized first-occurrence key | exact/normalized duplicates and stable order; duplicate class-skew drill; dedup report | ~15m |
| L3 Group-Safe Split | split_dataset(rows, ratios, group_key, seed) → SplitReport | deterministic ratios and no group crossing train/test; author-leak drill; split policy | ~18m |
| L4 Incremental Ingest + Dead Letters | ingest_batch(state, batch) → state, report with cursor and rejected records | retries, partial batches, cursor resume; retry-duplicates drill; checkpoint artifact | ~20m |
| L5 Rebuildable Dataset Release | rebuild_release(manifest, batches) → DatasetRelease with hash, lineage, counts | identical rebuild hash, schema/label drift, incomplete manifest; dataset card/release | ~25m |

Exit: later projects load this release by ID and reproduce its rows and split.

## Project 2 — Metrics Lab

Family: Evaluation systems. Build metrics and a baseline that earns the right to be
improved.

Fixture: imbalanced bug/question labels, prediction scores, and product costs for false
positives and false negatives.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Confusion Matrix | confusion_counts(y_true, y_pred) → tp, fp, fn, tn | empty, unknown-label, length mismatch; swapped-label drill; confusion matrix | ~10m |
| L2 Precision, Recall, F1 | precision_recall_f1(counts), including zero-denominator policy | perfect, no-positive, and imbalanced cases; accuracy-only drill; metric card | ~12m |
| L3 Majority + Keyword Baselines | majority_predict(rows), keyword_predict(rows, terms) | same split, deterministic predictions; leaked-feature drill; baseline report | ~15m |
| L4 Slices + Thresholds | metrics_by_slice(records, key), choose_threshold(scores, costs) | per-class/source slices and threshold tradeoffs; hidden bad slice; decision memo | ~18m |
| L5 Evaluation Gate | evaluate_run(run, acceptance_policy) → EvaluationReport | baseline, metric, worst-slice, and safety gates; reject impressive unsafe run | ~22m |

Exit: Project 3 must beat or explicitly explain this baseline.

## Project 3 — Classifier Lab

Family: Classical ML. Build logistic classification without a model library.

Fixture: Project 1 split and Project 2 feature vectors.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Score Function | linear_score(weights, features, bias), predict_score(row) | shape, zero/negative weights, score trace; score-is-not-probability drill | ~12m |
| L2 Thresholded Prediction | predict_label(score, threshold), batch prediction | boundary values and threshold/confusion prediction; cost-threshold drill | ~14m |
| L3 Sigmoid + Log Loss | sigmoid(z), binary_cross_entropy(p, y) | extreme logits, finite outputs, y=0/1; numeric overflow drill | ~16m |
| L4 Gradient Descent | gradient_step(...) and fit_logistic(...) | finite-difference gradient, loss decrease, divergent rate; wrong-direction drill | ~22m |
| L5 Trainable Artifact | Classifier.fit, predict_proba, predict, serialize, load | round trip, deterministic seed, batch inference, baseline comparison; feature-version mismatch | ~28m |

Exit: the model artifact is consumable by Projects 4, 6, and 14.

## Project 4 — Experiment Lab

Family: Evidence and judgment. Build a reproducible runner and error-analysis workflow.

Fixture: fixed dataset/split, feature variants, seeded configurations.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Reproducible Run Config | make_run_config(seed, split_id, feature_version, model_config) | canonical serialization and invalid config; hidden-seed drill; run config | ~12m |
| L2 Experiment Runner | run_experiment(config, dataset, model) → RunRecord | same config gives same metrics/hash; two-variable-change drill; run record | ~18m |
| L3 Ablation + Comparison | compare_runs(runs, metric, practical_delta) | baseline, one-feature changes, fixed split; noise-as-improvement drill | ~18m |
| L4 Error Taxonomy | classify_errors(records, rules) → ErrorReport | vocabulary, length, label-noise, leakage, threshold categories; symptom-fix drill | ~20m |
| L5 Evidence-Based Selection | select_run(report, policy) → Decision | metric, slice, practical-value, reproducibility gates; overfit-selection drill | ~24m |

Exit: only a selected run can enter the registry or serving projects.

## Project 5 — Data Pipeline

Family: Data engineering. Build restartable ingestion, cleaning, lineage, and drift
detection.

Fixture: cursored batches, transient failures, dead letters, schema versions, historical
label distributions.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Source Adapter | read_batch(source, cursor, limit) → Batch | stable order, end-of-stream, malformed source; silent-skip drill | ~12m |
| L2 Checkpointed Pipeline | process_batch(state, batch) → PipelineState | interruption resume, no loss/duplication; commit-before-durable drill | ~16m |
| L3 Retry + Dead Letter | retry_or_dead_letter(record, error, policy) | retryable/permanent classification and bounded attempts; infinite-retry drill | ~18m |
| L4 Rebuild from Manifest | rebuild_from_manifest(manifest) → DatasetRelease | same hash and explicit missing batch; latest-files drift drill | ~20m |
| L5 Drift Warning | compare_distributions(previous, current, thresholds) | missingness, label, feature, schema drift; train-on-shift drill | ~24m |

Exit: classifier training chooses a release by manifest, never by implicit latest path.

## Project 6 — Inference API

Family: Serving. Build a typed, bounded inference service around the classifier.

The first version is a pure request dispatcher inside Pyodide. An HTTP adapter can be
added later around the same functions.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Request Contract | validate_request(payload, feature_version, max_chars) | missing/unknown/oversized/version errors; malformed input reaching model | ~12m |
| L2 Model Adapter | predict_payload(model, payload) → Prediction | version check, score/probability/label, model ID; wrong feature order | ~15m |
| L3 Request Dispatcher | handle_request(request, service) → Response | valid, client, model, timeout-shaped responses; leaked stack-trace drill | ~18m |
| L4 Health + Readiness | health(), readiness(registry, feature_store) | health vs readiness and unavailable dependency; traffic-to-unready drill | ~16m |
| L5 Batch + Lifecycle Trace | handle_batch(requests, service) | mixed requests, IDs, start/end/latency; one bad request aborting batch | ~22m |

Exit: Project 14 can deploy this service behind a registry decision.

## Project 7 — Async Ingestion Service

Family: Backend reliability. Build a queue-backed worker with safe retries and recovery.

Fixture: transient/permanent errors, duplicate request IDs, delayed jobs, dead letters.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Queue State | enqueue, dequeue, ack, fail over typed job state | FIFO, empty/unknown job, state transitions; lost-between-dequeue-and-work | ~12m |
| L2 Worker Loop | process_once(queue, handler, clock) | success/error/bounded work; mark-success-before-handler drill | ~15m |
| L3 Backoff + Dead Letter | retry_delay(attempt, policy), DLQ routing | cap, retry classification, no amplification; retry-storm drill | ~18m |
| L4 Idempotency | idempotent_process(job, store, handler) | same ID has one side effect; duplicate-ingestion drill | ~18m |
| L5 Checkpoint + Backpressure | run_worker_pool(queue, workers, max_inflight) | crash resume, bounded inflight, drain, metrics; unbounded-memory drill | ~24m |

Exit: ingestion is safe under duplicate and partial work.

## Project 8 — Lexical Search

Family: Retrieval. Build an inverted-index search engine and evaluation set.

Fixture: the common document release, queries, relevance labels, and updates/deletes.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Tokenizer | tokenize(text) → tokens with normalization policy | punctuation, case, empty text; meaningful-token removal drill | ~10m |
| L2 Inverted Index | build_index(documents) → InvertedIndex | posting lists, document frequency, duplicates; full-rescan drill | ~16m |
| L3 BM25-Style Score | score(query_terms, document_id, index) | term frequency, IDF, length normalization; common-term dominance drill | ~18m |
| L4 Query + Freshness | search(index, query, k), add/update/delete | stable ties and stale removal; edit-without-index-update drill | ~20m |
| L5 Retrieval Evaluation | recall_at_k, mrr, evaluate_search(gold, searcher) | frozen golden queries and regression threshold; one-good-query drill | ~22m |

Exit: Projects 10 and 11 receive ranked evidence with provenance.

## Project 9 — Vector Search

Family: Representation and retrieval. Build deterministic embeddings and nearest-neighbor
search without a vector database.

Fixture: paraphrases, distractors, and a tiny deterministic encoder.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Deterministic Encoder | encode(text, vocabulary) → vector | stable dimension, unknown-token policy; evaluation-text leakage | ~14m |
| L2 Cosine Similarity | cosine(a, b) with zero-vector policy | identical, orthogonal, opposite, zero vectors; magnitude-ranking drill | ~12m |
| L3 Exact Top-k | nearest(query_vector, items, k) | stable ties, k bounds, empty index; high-norm distractor | ~16m |
| L4 Versioned Updates | upsert, delete, refresh(index, release) | atomic refresh and stale-vector removal; changed-text-old-vector drill | ~20m |
| L5 Semantic Evaluation | compare_retrievers(lexical, vector, gold) | recall/MRR by query family; replace-without-measuring drill | ~24m |

Exit: the hybrid project can measure where each representation wins.

## Project 10 — Hybrid Ranker

Family: Retrieval systems. Separate candidate generation, feature scoring, and reranking.

Fixture: lexical/vector candidates, relevance labels, duplicates, freshness metadata.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Candidate Merge | merge_candidates(lexical, vector, limit) | dedup while preserving evidence; discard-source drill | ~12m |
| L2 Ranking Features | rank_features(query, candidate, context) | overlap, semantic score, recency, missing defaults; noisy-feature drill | ~16m |
| L3 Reranker | rerank(candidates, weights, k) | weight effects, baseline, stable ties; tune-on-evaluation drill | ~18m |
| L4 Diversity + Freshness | diversify(results, group_key, freshness_policy) | coverage/relevance floor, stale rejection; identical-chunk crowding | ~18m |
| L5 Ranking Evaluation | ndcg_at_k, mrr, regression gate | lexical/vector/hybrid comparison and per-query failures; aggregate-hides-critical-query drill | ~24m |

Exit: grounded answering receives a ranked evidence set, not an opaque list.

## Project 11 — Grounded Answer Service

Family: Retrieval-augmented systems. Build citation-backed answers with abstention. The
first answer composer is deterministic; a model adapter is optional later.

Fixture: answerable, ambiguous, unsupported, conflicting, and prompt-injection cases.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Context Selector | select_context(query, ranked_chunks, budget) | relevance threshold, budget, order, no duplicate spans; first-N drill | ~14m |
| L2 Citation Binder | bind_citations(claims, context) | each claim has a supporting span; false-citation drill | ~18m |
| L3 Structured Answer Validator | validate_answer(answer) for answer/confidence/sources/status | missing types, unknown sources, malformed output; unvalidated-text drill | ~16m |
| L4 Abstention + Safety | decide_answer(evidence, confidence, policy) | no evidence, conflict, untrusted instructions, cost threshold; fluent hallucination drill | ~20m |
| L5 End-to-End Service | answer_question(query, retriever, composer, policy) | golden questions, citation correctness, groundedness, refusal, latency; retrieval-vs-generation diagnosis | ~28m |

Exit: the knowledge service can answer, cite, or safely abstain.

## Project 12 — Tensor/Autograd Engine

Family: Deep-learning foundations. Build a tiny tensor and automatic-differentiation
runtime with Python lists and explicit shape checks.

Fixture: small scalar/vector/matrix/graph examples; no large training data.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Tensor Shape Contract | Tensor(data, shape), reshape, size, elementwise add | shape/rank/copy/empty checks; silent-broadcast drill | ~16m |
| L2 Matmul + Broadcasting | matmul, broadcast_to, reduce_sum | inner dimensions, singleton axes, cost trace; wrong-transpose drill | ~22m |
| L3 Computation Graph | Value graph nodes for add, multiply, matmul, reduce | parent links, topological order, no duplicate visits; mutated-intermediate drill | ~20m |
| L4 Backward Pass | backward() and local derivative rules | branching accumulation and zero gradients; overwrite-vs-accumulate drill | ~24m |
| L5 Gradient Check + Optimizer | finite_difference, gradcheck, step(params, grads, lr) | numerical agreement and learning-rate behavior; wrong-direction drill | ~28m |

Exit: the tiny model can train on the learner's own runtime.

## Project 13 — Mini Transformer

Family: Deep-learning systems. Build a tiny causal language model with inspectable
attention, not a production LLM.

Fixture: tiny local corpus, tokenizer vocabulary, fixed train/validation split, short
context.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Tokenizer + Batches | encode, decode, make_batches(tokens, context) | round trip, unknown/padding/mask, deterministic batches; validation leakage | ~16m |
| L2 Embeddings + Positions | embed(tokens) and positional representation | shapes, position sensitivity, fixed initialization; same-vector positions | ~20m |
| L3 Masked Self-Attention | attention(q, k, v, causal_mask) | future-token masking, row normalization, shapes; answer-token visibility | ~26m |
| L4 Block + Train Step | forward, loss, optimizer step using Project 12 | loss on tiny fixture, residual shape, seed; train-down/val-up drill | ~30m |
| L5 Sampling + Failure Report | sample(prompt, temperature, top_k), evaluate_generation | seeded output, bounds, repetition/unsupported report; one-pleasing-sample drill | ~32m |

Exit: the learner can inspect why the model generated an output.

## Project 14 — Production AI Platform

Family: ML platform. Build registry, promotion, rollout, observability, and rollback.

Fixture: model versions, evaluation reports, traffic slices, latency samples, drift
events, and one simulated incident.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Model Registry | register_model, get_model, immutable manifests | hash/version uniqueness and compatibility; overwrite-production drill | ~16m |
| L2 Promotion Gate | promote(model, evaluation, policy) | baseline, metric, slice, safety, reproducibility gates; accuracy-over-recall drill | ~20m |
| L3 Rollout + Rollback | route(request, rollout), rollback(state) | deterministic percentage/sticky routing and immediate rollback; mixed-version drill | ~22m |
| L4 Observability + SLO | record_request, summarize_slo, quality/latency slices | p50/p95, error, confidence, cost, model version; quality regression hidden by uptime | ~24m |
| L5 Incident Recovery | detect_incident, choose_action, replay_requests | drift/latency/quality incident and remediation; retry storm during outage | ~28m |

Exit: the system can explain whether a model is safe to serve now.

## Project 15 — Final Knowledge Intelligence System

Family: Capstone. Integrate artifacts from Projects 1–14 into one reviewable system.

Fixture: complete corpus, classifier task, retrieval judgments, grounded-answer cases,
traffic logs, and injected incidents.

| Level | Build and public API | Tests, failure drill, artifact | Time |
|---|---|---|---:|
| L1 Ingest to Index | rebuild_knowledge_system(manifest) | release → features → lexical/vector indexes; stale-index drill; build manifest | ~24m |
| L2 Train to Registry | train_and_register(config) | compatibility, baseline, evaluation gate, immutable artifact; wrong-release drill | ~26m |
| L3 Unified Service | handle(query_or_ticket, system_state) | classify/search/answer/cite/abstain/errors; wrong-capability routing drill | ~28m |
| L4 Failure + Recovery | run_incident(scenario) → IncidentReport | schema drift, regression, stale index, timeout, duplicate retry, hallucination | ~30m |
| L5 Design Review + Release | release_system(candidate, acceptance_suite) | full acceptance, rebuild, SLO, rollback, rejected-tradeoff log; green aggregate/red slice drill | ~35m |

Exit: a portfolio-grade system composed of understandable, tested components.

## Questions inside project levels

Each level adds a small set of questions around the code:

- before implementation: one prediction or design question;
- on a failing test: one debugging question tied to the first failing fixture;
- after execution: one trace-reading question;
- before completion: one operations or transfer question.

The existing bank should link to build levels, for example:

~~~text
DATA-001   → project-01 / level-01
MODEL-010  → project-03 / level-04
API-001    → project-06 / level-01
SEARCH-004 → project-08 / level-04
GENEVAL-003 → project-11 / level-04
~~~

Question pages offer “Open build level”. Build pages offer “Practice the reasoning”.
This is the bridge between thinking and shipping.

## Fixtures, tests, and traces

Every level defines:

- a versioned fixture ID;
- 5–40 readable deterministic rows or small numerical inputs;
- fixed seeds for shuffling and initialization;
- one valid, boundary, and broken case;
- visible contract tests and hidden edge tests;
- an invariant-based failure message;
- at least one regression test for the previous artifact.

Hidden tests must prevent hard-coded fixture answers. Tests must run both in CI and in
the browser worker.

Semantic trace events should be snapshots folded purely from trace and cursor:

~~~text
data.accept / data.reject / data.version / data.split
feature.write / feature.cache_hit / feature.cache_miss
metric.count / metric.score / metric.slice
model.score / model.predict / loss.update / gradient.update / parameter.update
experiment.start / experiment.end / artifact.hash / artifact.register
queue.enqueue / queue.dequeue / queue.retry / queue.dead_letter / queue.ack
request.start / request.validate / request.end / request.timeout
search.tokenize / search.candidate / search.score / search.rank
context.select / citation.bind / answer.abstain / answer.emit
monitor.observe / monitor.alert / rollout.route / rollout.rollback
failure.detected
~~~

Example cursor captions:

~~~text
step 18 · request r-07 rejected before inference: feature_version is stale
step 42 · loss 0.81 → 0.64 after one gradient update
step 67 · citation bound to refund-policy.md lines 12–14
~~~

## Hint and solution policy

Every implementation level uses the four-step ladder:

1. Ask what invariant the failing test expects.
2. Ask which input changes the state.
3. Ask where the public contract is violated.
4. Give one assertion only after the first three questions.

Solutions remain hidden, require confirmation, and record the reveal. The solution uses
the same names as the Spec tab and never imports the library the learner is building.

## Persistence

Persist locally first:

- project/level status: new, started, tests-passing, complete;
- current stage and pane;
- editor draft and test output;
- hint depth, solution reveal, attempts;
- fixture version and trace cursor;
- artifact snapshots and keep/revise/reject decisions;
- linked question progress;
- last-opened project and next recommendation.

The map derives 0/5 through 5/5 from this state. A level is complete only after tests,
artifact fields, reflection, and exit gate pass.

## Implementation order for the subagent

Do not author all 75 levels as static cards. Prove the vertical slice first.

### Phase 1 — Workbench foundation

1. Read AGENTS.md and docs 01, 02, 03, 04, 05, 06, and 09.
2. Add typed project/level schemas and registry validation.
3. Add project progress and artifact persistence under src/persistence.
4. Add the project map, project overview, and level routes.
5. Add the three-pane workbench: Spec, Tests, Code, Output.
6. Reuse the existing worker, test runner, hint ladder, solution policy, and trace
   transport. Do not create a second execution engine.
7. Add project trace types and pure folds.
8. Add the mobile tab layout and sticky Run Tests action.

### Phase 2 — First vertical slice

Author Project 1, L1–L5 completely:

1. Row Contract & Validator
2. Deduplication + Dataset Version
3. Group-Safe Split
4. Incremental Ingest + Dead Letters
5. Rebuildable Dataset Release

The learner must start at the project map, open L1, write Python, run tests, inspect a
failure, reveal a hint, pass tests, inspect the trace, save an artifact, and open L2
with that artifact loaded.

### Phase 3 — Model slice

Author Projects 2–4: metrics/baseline, classifier from scratch, reproducible experiment
runner, and error taxonomy. Stop for a UX and pedagogy review here. The learner should
explain why a classifier is accepted, not merely report a score.

### Phase 4 — Service slice

Author Projects 5–7: restartable data pipeline, typed inference API, and
queue/retry/idempotency. Use synthetic requests and a deterministic clock. Keep the
service core independent from any future HTTP adapter.

### Phase 5 — Retrieval and grounded answers

Author Projects 8–11 using the same document release and provenance. Do not create a
new unrelated corpus for each search lesson.

### Phase 6 — Deep learning

Author Projects 12–13 with tiny shapes and short sequences. Every numerical result needs
a shape, invariant, finite-difference, or gradient check where appropriate.

### Phase 7 — Operations and capstone

Author Projects 14–15. The capstone must load artifacts produced by earlier projects and
fail when a dependency is incompatible or stale.

## First-level implementation specification

This is the template the subagent should copy.

### Project and level

~~~text
projectId: document-intelligence
levelId: l1-row-contract
title: Row Contract & Validator
thinkingMove: make one row trustworthy
duration: 12 minutes
~~~

### Student brief

“A document classifier cannot learn from a row with no stable identity, empty text,
absent label, or evaluation reservation. Implement the validator that decides whether a
raw row may enter the training release. Never silently discard a row.”

### Required API

~~~python
def validate_row(row, reserved_ids=None):
    return (ok, reason)
~~~

### Required behavior

1. row is a dictionary;
2. id is a non-empty string;
3. text is a non-empty trimmed string;
4. label is present and allowed;
5. reserved evaluation IDs are rejected before training;
6. every rejection has one stable reason;
7. the input row is not mutated.

### Visible tests

~~~text
valid row              → accepted
empty text             → missing-text
missing label          → missing-label
non-dict row           → malformed
reserved id            → reserved
input after call       → unchanged
~~~

Hidden tests add whitespace-only text, unknown labels, non-string IDs, and an otherwise
valid reserved row.

### Trace, artifact, exit

Emit one data.accept or data.reject event per row. Fold it into accepted count,
rejected count, and reason buckets.

The row-contract artifact contains required fields, accepted labels, rejection reasons,
and reserved-ID policy. Completion requires all tests plus the reflection question:
“Why must the reserved row be rejected before training?”

## Definition of done

### Curriculum

- all 15 projects are registered;
- each project has exactly five levels;
- every level has one purpose, API, fixture, visible/hidden tests, hints, solution,
  trace, artifact, failure drill, and exit gate;
- artifact inputs form an acyclic chain;
- model/retrieval levels have baselines and metrics;
- service levels have validation, timeout/error behavior, and operations artifacts.

### Learning

- editor unavailable before Design;
- baseline/naive behavior appears before optimization;
- learner sees their own trace, never a canned execution;
- complexity/performance claims come from trace evidence;
- every level ends in reflection and transfer;
- a question cannot falsely complete a build level.

### Engineering

- pnpm typecheck, pnpm test, pnpm build, and git diff --check pass;
- worker has event and wall-clock budgets;
- hidden tests prevent hard-coded answers;
- trace folds are pure and tested;
- progress and artifacts survive reload;
- first milestone requires no external model/API/network.

### Product

- project map matches the reference card pattern on desktop and at 390px;
- level workbench matches the Spec/Tests/Code/Output pattern;
- mobile uses tabs instead of squeezed panes;
- every card, level, question, artifact, and next action is reachable by tapping;
- dark mode keeps editor, spec, output, failures, and cards readable;
- Project 1 can be completed without manually typing a route.

## Non-negotiable scope decisions

- Do not reduce this to 180 text questions.
- Do not make levels static reading pages with fake completion.
- Do not start with external LLM integration.
- Do not use a hosted vector database for the browser milestone.
- Do not reset to a new toy dataset at every level.
- Do not show a model score without baseline, split, and failure case.
- Do not ship a service without validation, timeout behavior, structured errors, and trace.
- Do not call the ladder complete until the capstone consumes previous artifacts.

Success means the learner can point to the function they wrote, the tests constraining it,
the trace explaining it, the artifact it produced, and the next system component that
depends on it.
