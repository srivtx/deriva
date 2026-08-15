// AI/ML schema rules (docs/13 Step 1) — mechanically enforced at build time.
// AI-1: every AI lesson declares at least one artifact.
// AI-2: model-lab lessons declare a baseline and metric.
// AI-3: service-lab lessons declare an API contract and failure policy.
// AI-4: failure-lab lessons declare a counterexample fixture.

import { describe, it, expect } from "vitest"
import {
  LessonModuleSchema,
  EvaluationContractSchema,
  AiLabSchema,
  type LessonModule,
} from "../../src/curriculum/schema/lesson"

// ── helpers: build a fully valid lesson, then break only the AI rules ──

function probe(question: string) {
  return {
    question,
    options: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
    correct: "a",
    explanation: "A is the answer.",
  }
}

function validLesson(ai: unknown): unknown {
  return {
    id: "ai-ml/00-data-contract/what-counts-as-training-data",
    routeSlug: "what-counts-as-training-data",
    title: "What counts as training data?",
    topic: "ai-ml",
    beat: "reflex",
    thinkingMove: "make messy reality measurable",
    purpose: "A model cannot repair an undefined dataset.",
    dependencies: [],
    stageMoves: {
      understand: "predict which rows survive",
      play: "edit rows and watch counts",
      reason: "name what one row must carry",
      discover: "choose the contract clauses",
      design: "commit the contract first",
      implement: "translate the contract into Python",
      execute: "watch accept and reject fire",
      reflect: "name what naive loading hid",
      generalize: "apply the contract to requests",
    },
    naiveOptimizedContrast: {
      status: "exception",
      reason:
        "Reflex/contract lesson: the contrast is between an unvalidated dataset " +
        "and a declared contract, not two algorithms.",
    },
    probes: {
      understand: probe("Which row survives the contract?"),
      play: probe("What happens when the label is missing?"),
      reason: probe("What does one row represent?"),
      discover: probe("Which policy rejects the leaked row?"),
      design: probe("Commit: the contract rejects which row?"),
    },
    stages: {
      understand: {
        prose: [{ body: "Rows arrive from the wild." }],
        examples: [{ id: "ex1", given: "row A", result: "accepted" }],
        prediction: {
          prompt: "Which row will be rejected?",
          kind: "choice",
          options: [
            { label: "Missing label", value: "missing" },
            { label: "Clean row", value: "clean" },
          ],
          correct: "missing",
          explanation: "A row without a label cannot be trained on.",
        },
      },
      play: {
        sandbox: { type: "array", initial: {}, prompt: "Edit a row." },
        experiments: [{ id: "exp1", prompt: "Remove the label.", reveal: "The count dropped." }],
      },
      reason: {
        socraticLadder: [
          {
            id: "q1",
            question: "What happens if training includes a leaked row?",
            options: [
              { label: "Metrics look too good", value: "leak" },
              { label: "Nothing", value: "nothing" },
            ],
            correct: "leak",
            feedback: {
              correct: "The test has been seen before.",
              wrong: "The model saw the answer before being graded.",
            },
          },
          {
            id: "q2",
            question: "Which fields are required?",
            options: [
              { label: "The ones you train on", value: "train" },
              { label: "All of them", value: "all" },
            ],
            correct: "train",
            feedback: {
              correct: "The contract names what the model needs.",
              wrong: "Only the fields the model consumes must exist.",
            },
          },
        ],
      },
      discover: {
        artifact: {
          type: "contract-builder",
          prompt: "Build the contract.",
          slots: [
            {
              name: "required",
              label: "A row is accepted only when ___ is present",
              options: [
                { label: "label", value: "label" },
                { label: "timestamp", value: "timestamp" },
              ],
              correct: "label",
            },
          ],
          crystallized: "A row needs a label. That is the contract.",
        },
      },
      design: {
        contract: {
          signature: {
            prompt: "Name the validator.",
            defaultName: "validate_dataset",
            defaultParam: "rows",
          },
          baseCase: {
            prompt: "When is a row accepted?",
            options: [
              { label: "All required fields present", value: "valid" },
              { label: "Never", value: "never" },
            ],
            correct: "valid",
            wrongFeedback: "The contract accepts rows that carry everything required.",
          },
          recursiveStep: {
            prompt: "How does a rejected row behave?",
            options: [
              { label: "Reported with a reason", value: "reason" },
              { label: "Silently dropped", value: "silent" },
            ],
            correct: "reason",
            wrongFeedback: "A silent drop hides the problem from every later stage.",
          },
          complexity: {
            prompt: "Cost of validating n rows?",
            options: [
              { label: "One pass, linear", value: "linear" },
              { label: "No work at all", value: "none" },
            ],
            correct: "linear",
            wrongFeedback: "Each row is checked once.",
            derivation: "One pass over n rows at O(1) per row: O(n) time.",
          },
        },
      },
      implement: {
        entryPoint: "validate_dataset",
        starter: "def validate_dataset(rows):\n    # your contract, translated\n",
        tests: [
          { call: "validate_dataset([])", expect: [] },
          { call: "validate_dataset([{'label': 'x'}])", expect: [["ok", 0]] },
        ],
        hints: [
          { level: 1, type: "question", text: "What single field decides acceptance?" },
          { level: 2, type: "question", text: "Where does a rejected row go?" },
          { level: 3, type: "question", text: "What does the learner need to see in the trace?" },
          { level: 4, type: "assertion", text: "append accepted rows to one list, rejected rows with reasons to another" },
        ],
        solution: "def validate_dataset(rows):\n    accepted = []\n    rejected = []\n    return accepted, rejected\n",
      },
      execute: {
        traceInput: { rows: [] },
        budget: 500,
        vizPanels: ["call-stack"],
      },
      reflect: {
        prompts: ["What did naive loading hide?", "Which failure invalidates every later metric?"],
        pattern: {
          id: "dataset-contract",
          name: "Dataset Contract",
          definition: "Make messy reality measurable: name what a row must carry before any training.",
        },
      },
      generalize: {
        related: [
          { title: "Split the evidence", why: "Same contract, now over train and test.", href: "/learn/ai-ml/split-the-evidence" },
          { title: "API requests", why: "A request payload is a row in disguise.", href: "/learn/ai-ml/api-contract" },
        ],
      },
    },
    ai,
  }
}

describe("AI-1 — every AI lesson declares at least one artifact", () => {
  it("accepts an AI lesson with a dataset-card artifact", () => {
    expect(() => LessonModuleSchema.parse(validLesson({
      kind: "data-lab",
      artifacts: [{ kind: "dataset-card", title: "Dataset card", requiredFields: ["row_id", "label"] }],
    }))).not.toThrow()
  })

  it("rejects an AI lesson with no artifact", () => {
    expect(() => AiLabSchema.parse({
      kind: "data-lab",
      artifacts: [],
    })).toThrow()
  })
})

describe("AI-2 — model lessons declare a baseline and metric", () => {
  const modelLab = {
    kind: "model-lab",
    artifacts: [{ kind: "model", title: "Trained classifier", requiredFields: ["weights", "threshold"] }],
  }

  it("rejects a model-lab without an evaluation contract", () => {
    expect(() => AiLabSchema.parse(modelLab)).toThrow()
    expect(() => LessonModuleSchema.parse(validLesson(modelLab))).toThrow()
  })

  it("accepts a model-lab with metrics and a baseline", () => {
    expect(() => AiLabSchema.parse({
      ...modelLab,
      evaluation: {
        metrics: ["precision", "recall"],
        baseline: "majority-class",
        acceptanceQuestion: "Does the model beat majority-class recall?",
      },
    })).not.toThrow()
  })

  it("requires at least one metric name", () => {
    expect(() => EvaluationContractSchema.parse({
      metrics: [],
      baseline: "majority-class",
      acceptanceQuestion: "Does it beat the baseline?",
    })).toThrow()
  })
})

describe("AI-3 — service lessons declare an API contract and failure policy", () => {
  it("rejects a service-lab without an API contract", () => {
    expect(() => AiLabSchema.parse({
      kind: "service-lab",
      artifacts: [{ kind: "api-contract", title: "Inference API", requiredFields: ["method", "path"] }],
    })).toThrow()
  })

  it("accepts a service-lab with a contract and failure policy", () => {
    expect(() => AiLabSchema.parse({
      kind: "service-lab",
      artifacts: [{ kind: "api-contract", title: "Inference API", requiredFields: ["method", "path"] }],
      apiContract: {
        method: "POST",
        path: "/v1/predict",
        requestSchema: "{ text: string }",
        responseSchema: "{ label: string, confidence: number }",
        failurePolicy: {
          clientErrors: ["missing text", "unknown model version"],
          serverErrors: ["inference timeout", "model not loaded"],
        },
      },
    })).not.toThrow()
  })
})

describe("AI-4 — failure lessons declare a counterexample fixture", () => {
  it("rejects a failure-lab without a counterexample fixture", () => {
    expect(() => AiLabSchema.parse({
      kind: "failure-lab",
      artifacts: [{ kind: "failure-report", title: "Failure report", requiredFields: ["category", "example"] }],
    })).toThrow()
  })

  it("accepts a failure-lab with a fixture", () => {
    expect(() => AiLabSchema.parse({
      kind: "failure-lab",
      artifacts: [{ kind: "failure-report", title: "Failure report", requiredFields: ["category", "example"] }],
      counterexampleFixture: "malformed-inputs.json",
    })).not.toThrow()
  })
})

describe("AI lessons keep the constitutional rules", () => {
  it("a valid AI lesson still needs the 9-stage flow and probes", () => {
    const lesson = validLesson({
      kind: "data-lab",
      artifacts: [{ kind: "dataset-card", title: "Dataset card", requiredFields: ["row_id", "label"] }],
    })
    const parsed = LessonModuleSchema.parse(lesson)
    expect(parsed.stages.implement.entryPoint).toBe("validate_dataset")
    expect(parsed.ai?.kind).toBe("data-lab")
  })
})
