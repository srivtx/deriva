// ai-ml topic metadata (docs/13). Pure data — surfaced by the /lab route and
// future mobile navigation; no UI imports.

export const aiMlTopic = {
  id: "ai-ml",
  name: "AI/ML Systems",
  tagline: "From messy rows to a dependable service — derive the pipeline, don't memorize it.",
  labKinds: [
    { kind: "data-lab", label: "Data labs" },
    { kind: "model-lab", label: "Model labs" },
    { kind: "experiment-lab", label: "Experiment labs" },
    { kind: "service-lab", label: "Service labs" },
    { kind: "failure-lab", label: "Failure labs" },
  ] as const,
  artifactChain: [
    "dataset card",
    "split policy",
    "feature contract",
    "baseline report",
    "training report",
    "experiment table",
    "error taxonomy",
    "API contract",
    "service SLO sheet",
    "failure policy",
  ],
}

// Labs not yet authored — surfaced so the map is complete and questions always
// have a home (docs/13 §Product navigation). Titles from the lesson backlog.
export const plannedLabs: Record<string, { title: string; kind: string; thinkingMove: string }> = {
  "ai-ml/00-data-contract/split-the-evidence": { title: "Split the evidence", kind: "data-lab", thinkingMove: "protect the evidence from the learner" },
  "ai-ml/00-data-contract/features-are-a-decision": { title: "Features are a decision", kind: "data-lab", thinkingMove: "turn language into comparable signals" },
  "ai-ml/01-baseline/the-baseline-earns-the-right-to-improve": { title: "The baseline earns the right to improve", kind: "model-lab", thinkingMove: "measure before optimizing" },
  "ai-ml/01-baseline/a-score-is-not-a-prediction": { title: "A score is not a prediction", kind: "model-lab", thinkingMove: "separate score from decision" },
  "ai-ml/02-linear-classifier/learn-by-reducing-error": { title: "Learn by reducing error", kind: "model-lab", thinkingMove: "adjust parameters to reduce loss" },
  "ai-ml/02-linear-classifier/when-a-good-score-lies": { title: "When a good score lies", kind: "failure-lab", thinkingMove: "distrust aggregate metrics" },
  "ai-ml/03-experiments/the-learning-rate-is-a-system-choice": { title: "The learning rate is a system choice", kind: "experiment-lab", thinkingMove: "change one cause at a time" },
  "ai-ml/03-experiments/regularization-is-a-tradeoff": { title: "Regularization is a tradeoff", kind: "experiment-lab", thinkingMove: "pay a little bias to reduce variance" },
  "ai-ml/03-experiments/reproducibility-is-part-of-correctness": { title: "Reproducibility is part of correctness", kind: "experiment-lab", thinkingMove: "make a result repeatable" },
  "ai-ml/03-experiments/build-a-better-baseline-honestly": { title: "Build a better baseline honestly", kind: "experiment-lab", thinkingMove: "improve one variable with evidence" },
  "ai-ml/05-failure-lab/find-the-error-family": { title: "Find the error family", kind: "failure-lab", thinkingMove: "group failures before fixing them" },
  "ai-ml/04-inference-service/a-model-needs-a-contract": { title: "A model needs a contract", kind: "service-lab", thinkingMove: "make inference behavior explicit" },
  "ai-ml/04-inference-service/serve-the-model-safely": { title: "Serve the model safely", kind: "service-lab", thinkingMove: "isolate prediction from transport" },
  "ai-ml/05-failure-lab/timeouts-and-retries-are-not-free": { title: "Timeouts and retries are not free", kind: "failure-lab", thinkingMove: "bound work before scaling it" },
  "ai-ml/04-inference-service/measure-the-service-not-just-the-model": { title: "Measure the service, not just the model", kind: "service-lab", thinkingMove: "connect quality to operations" },
  "ai-ml/06-retrieval/search-before-generation": { title: "Search before generation", kind: "model-lab", thinkingMove: "retrieve evidence before answering" },
  "ai-ml/06-retrieval/similarity-is-a-representation-choice": { title: "Similarity is a representation choice", kind: "model-lab", thinkingMove: "make semantic closeness computable" },
  "ai-ml/06-retrieval/ranking-is-a-separate-responsibility": { title: "Ranking is a separate responsibility", kind: "experiment-lab", thinkingMove: "separate candidate generation from ordering" },
  "ai-ml/06-retrieval/cite-the-evidence": { title: "Cite the evidence", kind: "service-lab", thinkingMove: "keep generated claims attached to sources" },
  "ai-ml/07-deep-learning/tensors-are-structured-data": { title: "Tensors are structured data", kind: "model-lab", thinkingMove: "make batched computation explicit" },
  "ai-ml/07-deep-learning/gradients-are-dependency-accounting": { title: "Gradients are dependency accounting", kind: "model-lab", thinkingMove: "propagate responsibility backward" },
  "ai-ml/07-deep-learning/compose-a-neural-network": { title: "Compose a neural network", kind: "model-lab", thinkingMove: "compose differentiable transformations" },
  "ai-ml/07-deep-learning/context-changes-representation": { title: "Context changes representation", kind: "model-lab", thinkingMove: "condition a token on its neighbors" },
  "ai-ml/07-deep-learning/build-a-tiny-language-model": { title: "Build a tiny language model", kind: "model-lab", thinkingMove: "predict the next piece from context" },
}
