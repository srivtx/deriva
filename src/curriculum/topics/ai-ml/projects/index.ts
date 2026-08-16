// Systems Projects registry (system-ai/ml-projects-plan.md).
// Every project is executable: Project 1 is hand-authored as the vertical
// slice, and Projects 2–15 are adapted from the deterministic Build Everything
// contracts into the same five-level workbench shape. Parse-all at module scope
// means an incomplete contract fails the build instead of becoming a dead card.

import { SystemsProjectSchema, type SystemsProject, type SystemsProjectLevel } from "../../../schema/project"
import project01 from "./project-01-data-contract"
import { authoredLevelsForProject } from "./authored-levels"

interface PlannedLevelInput {
  id: string
  number: number
  title: string
  minutes: number
}

function plannedProject(
  id: string,
  number: number,
  family: string,
  title: string,
  pitch: string,
  userStory: string,
  levels: PlannedLevelInput[],
  prerequisites: string[] = [],
  artifactInputs: string[] = [],
): SystemsProject {
  return {
    id, number, family, title, pitch, userStory, prerequisites, artifactInputs,
    levels: authoredLevelsForProject(
      { id, number, title, userStory },
      levels.map(level => ({ id: level.id, number: level.number, title: level.title, durationMinutes: level.minutes })),
    ),
  }
}

const projects: SystemsProject[] = [
  project01,
  plannedProject(
    "metrics-lab", 2, "Evaluation systems",
    "Metrics Lab",
    "Build metrics and a baseline that earns the right to be improved.",
    "An imbalanced bug/question dataset demands metrics that do not lie. The learner builds the confusion matrix, precision/recall/F1, baselines, slices, and an evaluation gate.",
    [
      { id: "l1-confusion-matrix", number: 1, title: "Confusion Matrix", minutes: 10 },
      { id: "l2-precision-recall-f1", number: 2, title: "Precision, Recall, F1", minutes: 12 },
      { id: "l3-baselines", number: 3, title: "Majority + Keyword Baselines", minutes: 15 },
      { id: "l4-slices-thresholds", number: 4, title: "Slices + Thresholds", minutes: 18 },
      { id: "l5-evaluation-gate", number: 5, title: "Evaluation Gate", minutes: 22 },
    ],
    ["document-intelligence"],
    ["dataset-release"],
  ),
  plannedProject(
    "classifier-lab", 3, "Classical ML",
    "Classifier Lab",
    "Build logistic classification without a model library.",
    "A score, a threshold, a loss, and a gradient — the learner fits a logistic classifier from scratch on the Project 1 split and Project 2 features.",
    [
      { id: "l1-score-function", number: 1, title: "Score Function", minutes: 12 },
      { id: "l2-thresholded-prediction", number: 2, title: "Thresholded Prediction", minutes: 14 },
      { id: "l3-sigmoid-logloss", number: 3, title: "Sigmoid + Log Loss", minutes: 16 },
      { id: "l4-gradient-descent", number: 4, title: "Gradient Descent", minutes: 22 },
      { id: "l5-trainable-artifact", number: 5, title: "Trainable Artifact", minutes: 28 },
    ],
    ["metrics-lab"],
    ["baseline-report", "feature-vectors"],
  ),
  plannedProject(
    "experiment-lab", 4, "Evidence and judgment",
    "Experiment Lab",
    "Build a reproducible runner and error-analysis workflow.",
    "The learner turns configs into reproducible runs, compares them honestly, classifies errors by root cause, and selects evidence.",
    [
      { id: "l1-run-config", number: 1, title: "Reproducible Run Config", minutes: 12 },
      { id: "l2-experiment-runner", number: 2, title: "Experiment Runner", minutes: 18 },
      { id: "l3-ablation-comparison", number: 3, title: "Ablation + Comparison", minutes: 18 },
      { id: "l4-error-taxonomy", number: 4, title: "Error Taxonomy", minutes: 20 },
      { id: "l5-evidence-selection", number: 5, title: "Evidence-Based Selection", minutes: 24 },
    ],
    ["classifier-lab"],
    ["model-artifact"],
  ),
  plannedProject(
    "data-pipeline", 5, "Data engineering",
    "Data Pipeline",
    "Build restartable ingestion, cleaning, lineage, and drift detection.",
    "Cursored batches, transient failures, and dead letters: the learner builds a pipeline that resumes, rebuilds from a manifest, and warns on drift.",
    [
      { id: "l1-source-adapter", number: 1, title: "Source Adapter", minutes: 12 },
      { id: "l2-checkpointed-pipeline", number: 2, title: "Checkpointed Pipeline", minutes: 16 },
      { id: "l3-retry-deadletter", number: 3, title: "Retry + Dead Letter", minutes: 18 },
      { id: "l4-rebuild-manifest", number: 4, title: "Rebuild from Manifest", minutes: 20 },
      { id: "l5-drift-warning", number: 5, title: "Drift Warning", minutes: 24 },
    ],
    ["document-intelligence"],
    ["dataset-release", "checkpoint"],
  ),
  plannedProject(
    "inference-api", 6, "Serving",
    "Inference API",
    "Build a typed, bounded inference service around the classifier.",
    "A pure request dispatcher inside the browser worker: validation, version checks, health/readiness, batching, and lifecycle traces.",
    [
      { id: "l1-request-contract", number: 1, title: "Request Contract", minutes: 12 },
      { id: "l2-model-adapter", number: 2, title: "Model Adapter", minutes: 15 },
      { id: "l3-request-dispatcher", number: 3, title: "Request Dispatcher", minutes: 18 },
      { id: "l4-health-readiness", number: 4, title: "Health + Readiness", minutes: 16 },
      { id: "l5-batch-lifecycle", number: 5, title: "Batch + Lifecycle Trace", minutes: 22 },
    ],
    ["classifier-lab"],
    ["model-artifact"],
  ),
  plannedProject(
    "async-ingestion", 7, "Backend reliability",
    "Async Ingestion Service",
    "Build a queue-backed worker with safe retries and recovery.",
    "Enqueue, dequeue, ack, retry, dead-letter, idempotency, and backpressure: the learner makes ingestion safe under duplicate and partial work.",
    [
      { id: "l1-queue-state", number: 1, title: "Queue State", minutes: 12 },
      { id: "l2-worker-loop", number: 2, title: "Worker Loop", minutes: 15 },
      { id: "l3-backoff-deadletter", number: 3, title: "Backoff + Dead Letter", minutes: 18 },
      { id: "l4-idempotency", number: 4, title: "Idempotency", minutes: 18 },
      { id: "l5-checkpoint-backpressure", number: 5, title: "Checkpoint + Backpressure", minutes: 24 },
    ],
    ["data-pipeline"],
    ["checkpoint"],
  ),
  plannedProject(
    "lexical-search", 8, "Retrieval",
    "Lexical Search",
    "Build an inverted-index search engine and evaluation set.",
    "Tokenizer, inverted index, BM25-style scoring, freshness, and frozen retrieval evaluation on the same document release.",
    [
      { id: "l1-tokenizer", number: 1, title: "Tokenizer", minutes: 10 },
      { id: "l2-inverted-index", number: 2, title: "Inverted Index", minutes: 16 },
      { id: "l3-bm25-score", number: 3, title: "BM25-Style Score", minutes: 18 },
      { id: "l4-query-freshness", number: 4, title: "Query + Freshness", minutes: 20 },
      { id: "l5-retrieval-evaluation", number: 5, title: "Retrieval Evaluation", minutes: 22 },
    ],
    ["document-intelligence"],
    ["dataset-release"],
  ),
  plannedProject(
    "vector-search", 9, "Representation and retrieval",
    "Vector Search",
    "Build deterministic embeddings and nearest-neighbor search without a vector database.",
    "A tiny deterministic encoder, cosine similarity, exact top-k, versioned updates, and a semantic evaluation that can name where each retriever wins.",
    [
      { id: "l1-deterministic-encoder", number: 1, title: "Deterministic Encoder", minutes: 14 },
      { id: "l2-cosine-similarity", number: 2, title: "Cosine Similarity", minutes: 12 },
      { id: "l3-exact-topk", number: 3, title: "Exact Top-k", minutes: 16 },
      { id: "l4-versioned-updates", number: 4, title: "Versioned Updates", minutes: 20 },
      { id: "l5-semantic-evaluation", number: 5, title: "Semantic Evaluation", minutes: 24 },
    ],
    ["lexical-search"],
    ["dataset-release"],
  ),
  plannedProject(
    "hybrid-ranker", 10, "Retrieval systems",
    "Hybrid Ranker",
    "Separate candidate generation, feature scoring, and reranking.",
    "Merge lexical and vector candidates with provenance, score ranking features, rerank, diversify, and gate on ranking metrics.",
    [
      { id: "l1-candidate-merge", number: 1, title: "Candidate Merge", minutes: 12 },
      { id: "l2-ranking-features", number: 2, title: "Ranking Features", minutes: 16 },
      { id: "l3-reranker", number: 3, title: "Reranker", minutes: 18 },
      { id: "l4-diversity-freshness", number: 4, title: "Diversity + Freshness", minutes: 18 },
      { id: "l5-ranking-evaluation", number: 5, title: "Ranking Evaluation", minutes: 24 },
    ],
    ["lexical-search", "vector-search"],
    ["retrieval-index", "relevance-report"],
  ),
  plannedProject(
    "grounded-answer", 11, "Retrieval-augmented systems",
    "Grounded Answer Service",
    "Build citation-backed answers with abstention.",
    "Context selection, citation binding, structured validation, abstention, and an end-to-end service that answers, cites, or safely abstains.",
    [
      { id: "l1-context-selector", number: 1, title: "Context Selector", minutes: 14 },
      { id: "l2-citation-binder", number: 2, title: "Citation Binder", minutes: 18 },
      { id: "l3-answer-validator", number: 3, title: "Structured Answer Validator", minutes: 16 },
      { id: "l4-abstention-safety", number: 4, title: "Abstention + Safety", minutes: 20 },
      { id: "l5-end-to-end", number: 5, title: "End-to-End Service", minutes: 28 },
    ],
    ["hybrid-ranker"],
    ["ranked-evidence"],
  ),
  plannedProject(
    "tensor-autograd", 12, "Deep-learning foundations",
    "Tensor/Autograd Engine",
    "Build a tiny tensor and automatic-differentiation runtime.",
    "Shape contracts, matmul and broadcasting, a computation graph, backward pass, and gradient checks — with Python lists only.",
    [
      { id: "l1-tensor-shape", number: 1, title: "Tensor Shape Contract", minutes: 16 },
      { id: "l2-matmul-broadcast", number: 2, title: "Matmul + Broadcasting", minutes: 22 },
      { id: "l3-computation-graph", number: 3, title: "Computation Graph", minutes: 20 },
      { id: "l4-backward-pass", number: 4, title: "Backward Pass", minutes: 24 },
      { id: "l5-gradient-check", number: 5, title: "Gradient Check + Optimizer", minutes: 28 },
    ],
    [],
    [],
  ),
  plannedProject(
    "mini-transformer", 13, "Deep-learning systems",
    "Mini Transformer",
    "Build a tiny causal language model with inspectable attention.",
    "Tokenizer and batches, embeddings and positions, masked self-attention, a train step on the Project 12 engine, and a sampling failure report.",
    [
      { id: "l1-tokenizer-batches", number: 1, title: "Tokenizer + Batches", minutes: 16 },
      { id: "l2-embeddings-positions", number: 2, title: "Embeddings + Positions", minutes: 20 },
      { id: "l3-masked-attention", number: 3, title: "Masked Self-Attention", minutes: 26 },
      { id: "l4-block-train-step", number: 4, title: "Block + Train Step", minutes: 30 },
      { id: "l5-sampling-report", number: 5, title: "Sampling + Failure Report", minutes: 32 },
    ],
    ["tensor-autograd"],
    ["tensor-engine"],
  ),
  plannedProject(
    "production-platform", 14, "ML platform",
    "Production AI Platform",
    "Build registry, promotion, rollout, observability, and rollback.",
    "Immutable model manifests, a promotion gate, percentage routing, SLO summaries, and incident recovery on one simulated outage.",
    [
      { id: "l1-model-registry", number: 1, title: "Model Registry", minutes: 16 },
      { id: "l2-promotion-gate", number: 2, title: "Promotion Gate", minutes: 20 },
      { id: "l3-rollout-rollback", number: 3, title: "Rollout + Rollback", minutes: 22 },
      { id: "l4-observability-slo", number: 4, title: "Observability + SLO", minutes: 24 },
      { id: "l5-incident-recovery", number: 5, title: "Incident Recovery", minutes: 28 },
    ],
    ["classifier-lab", "experiment-lab", "inference-api"],
    ["model-artifact", "experiment-table", "api-contract"],
  ),
  plannedProject(
    "knowledge-system", 15, "Capstone",
    "Final Knowledge Intelligence System",
    "Integrate artifacts from Projects 1–14 into one reviewable system.",
    "Ingest to index, train to registry, one unified service, a failure-and-recovery exercise, and a final design review with a rejected-tradeoff log.",
    [
      { id: "l1-ingest-to-index", number: 1, title: "Ingest to Index", minutes: 24 },
      { id: "l2-train-to-registry", number: 2, title: "Train to Registry", minutes: 26 },
      { id: "l3-unified-service", number: 3, title: "Unified Service", minutes: 28 },
      { id: "l4-failure-recovery", number: 4, title: "Failure + Recovery", minutes: 30 },
      { id: "l5-design-review", number: 5, title: "Design Review + Release", minutes: 35 },
    ],
    ["document-intelligence", "classifier-lab", "grounded-answer", "production-platform"],
    ["dataset-release", "model-artifact", "ranked-evidence", "slo-report"],
  ),
]

for (const project of projects) {
  SystemsProjectSchema.parse(project)
}

export const systemsProjects: SystemsProject[] = projects
export const projectById = new Map(projects.map(project => [project.id, project]))

export function getProjectById(id: string): SystemsProject | undefined {
  return projectById.get(id)
}

export function getProjectLevel(project: SystemsProject, levelId: string): SystemsProjectLevel | undefined {
  return project.levels.find(level => level.id === levelId)
}
