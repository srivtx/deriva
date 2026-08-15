// Deriva extensions to the supplied 37-project sequence.
//
// These projects close the gaps that appear when a learner moves from a working
// model to a trustworthy product: data contracts, reproducibility, evaluation,
// temporal correctness, monitoring, rollout, safety, privacy, and experimentation.
// They use sourcePage=0 because they are authored extensions, not PDF projects.

import { BuildEverythingProjectSchema, type BuildEverythingProject, type BuildEverythingTier } from "../../schema/build-everything"

type ExtensionDraft = Omit<BuildEverythingProject, "steps" | "implementation">

function extension(draft: ExtensionDraft): BuildEverythingProject {
  return BuildEverythingProjectSchema.parse({
    ...draft,
    steps: [
      { id: `${draft.id}-derive`, number: 1, kind: "derive", title: "Derive the idea", prompt: draft.theory, deliverable: "State the invariant in one sentence." },
      { id: `${draft.id}-build`, number: 2, kind: "build", title: "Build the smallest version", prompt: draft.build, deliverable: "Type the smallest deterministic implementation." },
      { id: `${draft.id}-verify`, number: 3, kind: "verify", title: "Verify the invariant", prompt: draft.verify, deliverable: "Record a normal case and a boundary case." },
      { id: `${draft.id}-break`, number: 4, kind: "break", title: "Break one assumption", prompt: draft.experiment, deliverable: "Name the failure signal and the guard you would add." },
      { id: `${draft.id}-ship`, number: 5, kind: "ship", title: "Package the artifact", prompt: draft.artifact, deliverable: "Save the contract, evidence, and handoff note." },
    ],
  })
}

const x = (
  order: number,
  code: string,
  id: string,
  title: string,
  lines: number,
  durationMinutes: number,
  coolFactor: string,
  sourceReuse: string,
  dependencies: string[],
  thinkingMove: string,
  theory: string,
  build: string,
  verify: string,
  experiment: string,
  artifact: string,
  externalDependencies: string[] = [],
) => extension({
  tier: "extension" as BuildEverythingTier,
  order, code, id, title, lines, durationMinutes, coolFactor, sourcePage: 0,
  sourceReuse, dependencies, externalDependencies, thinkingMove, theory, build,
  verify, experiment, artifact,
})

export const buildEverythingExtensions: BuildEverythingProject[] = [
  x(38, "X1", "x1-data-contract-leakage-firewall", "Dataset Contract + Leakage Firewall", 45, 90, "Reject a training row before it poisons evaluation", "F1 + A1", ["f1-download-tokenize-dataset", "a1-gradient-descent"], "make data admissible", "Reliable models begin with a versioned row contract: identity, required fields, label policy, and a reserved evaluation set.", "Validate raw rows, reject malformed records with one stable reason, and refuse IDs reserved for the holdout set.", "Accepted IDs, rejection reasons, and reserved-ID leaks must be deterministic and complete.", "Add a duplicate, an empty label, and a reserved ID; check that no row disappears silently.", "A dataset validation report that can gate every later training run."),
  x(39, "X2", "x2-reproducible-experiment-runner", "Reproducible Experiment Runner", 40, 75, "Make two runs prove they used the same evidence", "A1 + F1 + M7", ["a1-gradient-descent", "f1-download-tokenize-dataset", "m7-ddp-training"], "name every cause", "An experiment is evidence only when configuration, seed, data identity, and code version can be reconstructed.", "Create a stable run key from a config object, ordered dataset IDs, and a random seed without relying on process hash order.", "Equivalent inputs produce the same key; changing one cause changes the key and leaves inputs untouched.", "Reorder config keys, change one hyperparameter, and use a different dataset split.", "A reproducibility manifest and a one-cause-at-a-time experiment table."),
  x(40, "X3", "x3-evaluation-harness-calibration", "Evaluation Harness + Calibration", 55, 105, "Know when a confident prediction is wrong", "B2 + S7", ["b2-mlp-mnist", "s7-aligned-chatbot"], "measure the right failure", "A single average score hides class imbalance and confidence errors; evaluation needs confusion counts and calibrated probabilities.", "Compute accuracy, precision, recall, F1, and expected calibration error from deterministic predictions and confidence buckets.", "Metrics must handle empty classes, preserve input order, and expose the confusion matrix rather than only one headline number.", "Swap the positive class, add an overconfident wrong prediction, and compare the metric deltas.", "An evaluation card with metric definitions, confusion counts, and a calibration note."),
  x(41, "X4", "x4-point-in-time-feature-store", "Point-in-Time Feature Store", 55, 105, "Prevent tomorrow's feature from leaking into yesterday", "F1 + M6", ["f1-download-tokenize-dataset", "m6-rag-pipeline"], "respect prediction time", "Features must be computed from information available at the prediction timestamp; otherwise offline scores lie.", "Join entity events to request timestamps and return only the latest value at or before each request.", "Every request gets at most one historical value, equal timestamps are allowed, and future events are never selected.", "Move an event one minute into the future and confirm the training row changes or becomes missing.", "A point-in-time join report with leakage checks and missing-feature counts."),
  x(42, "X5", "x5-drift-monitor", "Data Drift + Quality Monitor", 50, 90, "Catch a production distribution changing under your model", "X1 + S1", ["x1-data-contract-leakage-firewall", "s1-production-inference-server"], "turn change into a signal", "Monitoring compares a trusted reference distribution with current traffic and separates drift from malformed input.", "Build a small histogram monitor that reports per-bin proportions and the maximum absolute gap.", "Reference and current proportions sum to one, empty traffic is explicit, and a known shift crosses the alert threshold.", "Inject a missing value, a new category, and a gradual shift; distinguish quality failure from drift.", "A monitoring snapshot with alert thresholds, evidence, and a runbook link."),
  x(43, "X6", "x6-model-registry-canary", "Model Registry + Canary Rollout", 60, 120, "Roll out a model without betting the whole service", "S1 + S6", ["s1-production-inference-server", "s6-distributed-trainer"], "promote with evidence", "A model version is a deployable artifact with metrics, latency, and a reversible promotion decision—not a filename.", "Compare stable and canary quality/error/latency and return promote, hold, or rollback using explicit thresholds.", "A canary with worse safety or latency must roll back; an improved canary may promote; an inconclusive one must hold.", "Increase traffic weight, inject a latency spike, and test that the decision remains reversible.", "A registry entry, canary decision record, and rollback command."),
  x(44, "X7", "x7-inference-observability-trace", "Inference Observability Trace", 55, 105, "Explain one slow request from trace data", "S1 + S4", ["s1-production-inference-server", "s4-ai-coding-agent"], "instrument before debugging", "Production behavior becomes diagnosable when each request emits structured spans, errors, tokens, latency, and cost signals.", "Aggregate span records into request count, error count, p95 latency, token usage, and total cost without hiding failed spans.", "Empty traces, one slow request, and failed spans have explicit outputs; p95 is deterministic.", "Add a queue span, a model span, and a tool span; locate which component moved p95.", "An inspectable request trace and an SLO snapshot."),
  x(45, "X8", "x8-rag-evaluation", "RAG Retrieval Evaluation", 55, 105, "Know whether a bad answer came from search or generation", "M6 + F2", ["m6-rag-pipeline", "f2-build-vector-index"], "separate retrieval from generation", "Grounded generation is a pipeline: recall and rank evidence first, then judge whether the answer cites it.", "Compute recall@k and reciprocal rank from relevant document IDs and a retrieved list.", "The metrics must ignore duplicate hits, return zero for no relevant evidence, and preserve the first relevant rank.", "Remove the top evidence, add a distractor, and compare retrieval failure with a generation failure.", "A retrieval benchmark with recall, MRR, failure buckets, and a groundedness handoff."),
  x(46, "X9", "x9-safety-policy-gateway", "Safety Policy Gateway", 60, 120, "Stop a prompt injection before it reaches a tool", "F3 + S4 + S7", ["f3-function-calling", "s4-ai-coding-agent", "s7-aligned-chatbot"], "constrain the capability", "A model-facing tool gateway must validate content, requested capability, and size before dispatch; policy is part of the API.", "Reject common instruction-overrides, unknown tools, and oversized requests; return a structured allow/reason decision.", "Safe requests pass, policy violations abstain with one stable reason, and the gateway never mutates the input.", "Try casing changes, encoded instruction text, an unknown tool, and a request over the limit.", "A policy decision log, allowlist, and red-team fixture set.", ["NIST AI RMF Generative AI Profile"]),
  x(47, "X10", "x10-differential-privacy-budget", "Differential Privacy Budget", 50, 105, "Make privacy a number you cannot accidentally overspend", "S6 + X2", ["s6-distributed-trainer", "x2-reproducible-experiment-runner"], "account the privacy loss", "Differential privacy composes: every release spends part of a declared epsilon budget, so an analysis needs a ledger before it queries data.", "Accept queries while their epsilon costs fit the budget and return accepted names, rejected names, and remaining budget.", "The ledger never overspends, preserves query order, and reports an empty or exhausted budget explicitly.", "Split one budget across three queries, exceed it with an adaptive query, and compare utility versus privacy.", "A privacy ledger with unit of privacy, epsilon budget, and release policy.", ["OpenDP composition model"]),
  x(48, "X11", "x11-federated-averaging", "Federated Averaging", 55, 105, "Train without centralizing every client's raw rows", "M7 + S6", ["m7-ddp-training", "s6-distributed-trainer"], "aggregate updates not data", "Federated learning sends bounded model updates from clients and averages them by sample count instead of pooling raw records.", "Compute a weighted elementwise average of client parameter vectors without mutating any client model.", "Equal weights reduce to a mean, zero clients return an empty vector, and output length matches every client.", "Skew one client's sample count, add a divergent update, and inspect how the aggregate moves.", "A federated round trace with client counts, update norms, and aggregation policy."),
  x(49, "X12", "x12-online-ab-experiment", "Online A/B Experiment", 55, 105, "Ship a change only when the comparison earns it", "X2 + X3 + X6", ["x2-reproducible-experiment-runner", "x3-evaluation-harness-calibration", "x6-model-registry-canary"], "compare under a guardrail", "Online experiments need a fixed assignment, a primary metric, a minimum practical lift, and a guardrail metric before promotion.", "Summarize binary outcomes for control and treatment and return rates, lift, and ship/hold using a minimum lift threshold.", "The summary is deterministic, handles empty groups, and refuses to ship when the guardrail or lift is insufficient.", "Change the threshold, add a treatment regression, and compare a statistically noisy win with a safe hold.", "An experiment readout with assignment policy, primary metric, guardrail, and rollout decision."),
]
