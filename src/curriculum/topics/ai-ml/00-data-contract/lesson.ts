// ai-ml · 00-data-contract — "What counts as training data?" (docs/13 §0.1)
// Kind: data-lab. Thinking move: make messy reality measurable.
// The learner builds a dataset contract and validator BEFORE any model exists;
// the Execute stage replays their data.accept / data.reject events.

import { defineLesson } from "../../../schema/lesson"

export default defineLesson({
  id: "ai-ml/00-data-contract/what-counts-as-training-data",
  routeSlug: "what-counts-as-training-data",
  title: "What counts as training data?",
  topic: "ai-ml",
  beat: "reflex",
  thinkingMove: "make messy reality measurable",
  purpose:
    "Establish that a model cannot repair an undefined dataset: before any " +
    "training, the learner declares what a row must carry, what duplicates mean, " +
    "and which rows are off-limits. Every later module depends on this contract.",
  dependencies: [],

  stageMoves: {
    understand: "predict which rows survive",
    play: "edit rows and watch counts",
    reason: "name what one row carries",
    discover: "choose the contract clauses",
    design: "commit the contract first",
    implement: "translate the contract into Python",
    execute: "watch accept and reject fire",
    reflect: "name what naive loading hid",
    generalize: "apply the contract to requests",
  },

  // Rule A3 exception: the contrast is between an unvalidated dataset and a
  // declared contract — two datasets, not two algorithms.
  naiveOptimizedContrast: {
    status: "exception",
    reason:
      "Data-contract lesson (docs/13 §0.1): the contrast is between an " +
      "unvalidated dataset and a declared contract, not between a naive and " +
      "optimized algorithm. The naive/optimization contrast first applies at " +
      "Module B (majority-class baseline vs a learned boundary).",
  },

  probes: {
    understand: {
      question: "Before any training: which row must the contract reject?",
      options: [
        { label: "A row already reserved for the held-out set", value: "leak" },
        { label: "A row written by a new author", value: "author" },
        { label: "The longest row in the file", value: "long" },
      ],
      correct: "leak",
      explanation: "Training on a row the evaluation set will reuse is how every later metric silently lies. The contract catches this before any model exists.",
    },
    play: {
      question: "A row loses its label. What happens to the data?",
      options: [
        { label: "It can no longer be trained on", value: "unlabeled" },
        { label: "Nothing — labels are optional", value: "optional" },
        { label: "The row becomes a duplicate", value: "duplicate" },
      ],
      correct: "unlabeled",
      explanation: "A supervised model learns from (text → label) pairs. A row without a label has no answer to learn from.",
    },
    reason: {
      question: "Why must the leaked row be rejected BEFORE training, not removed after?",
      options: [
        { label: "Because metrics computed on the held-out set would already be contaminated", value: "contaminated" },
        { label: "Because the file would look neater", value: "neat" },
        { label: "Because duplicates slow down training", value: "slow" },
      ],
      correct: "contaminated",
      explanation: "The damage happens the moment the model sees the row — no cleanup later can un-see it. Prevention is the only cure.",
    },
    discover: {
      question: "Which policy closes the leak?",
      options: [
        { label: "Reject any row reserved for the held-out set", value: "reject-reserved" },
        { label: "Train on it but mark it in a log", value: "log" },
        { label: "Move it to the end of the file", value: "move" },
      ],
      correct: "reject-reserved",
      explanation: "Off-limits rows must never reach training. Logging or reordering still trains on the exam.",
    },
    design: {
      question: "How many times should validate_dataset read each row?",
      options: [
        { label: "Once — one pass, each row decided exactly once", value: "once" },
        { label: "Twice — once to count, once to decide", value: "twice" },
        { label: "As many as needed to be safe", value: "many" },
      ],
      correct: "once",
      explanation: "A single pass keeps the contract O(n): every row enters the same check pipeline exactly once.",
    },
  },

  stages: {
    // ── STAGE 1 — UNDERSTAND ──────────────────────────────────────────
    understand: {
      prose: [
        {
          body: "Someone hands you a CSV of support tickets. 30 rows. 'Train a model to route them,' they say. Before you write a single line of model code, something else has to happen first — and most pipelines skip it.",
        },
        {
          heading: "The rows are lying to you",
          body: "Two rows are identical. One row has no label at all. One row isn't even a row — the text field is missing, and another one's 'text' is a number. And one row was already used in last week's evaluation export. A model doesn't care about any of this. It will happily learn from every one of them — and then quietly fail on real tickets.",
        },
        {
          heading: "The real question",
          body: "What would you require a row to be, before you allowed it near a model? That requirement is a contract. This lesson is about writing it — before any training, before any evaluation, before any service.",
        },
      ],
      examples: [
        { id: "ex1", given: "row r05 · label present · unique", result: "accepted" },
        { id: "ex2", given: "row r25 · label missing", result: "rejected: missing-label" },
        { id: "ex3", given: "row r23 · exact duplicate of r05", result: "rejected: duplicate" },
        { id: "ex4", given: "row eval-104 · reserved for eval", result: "rejected: reserved" },
      ],
      prediction: {
        prompt: "Commit before anything is explained: which row is the most dangerous to train on?",
        kind: "choice",
        options: [
          { label: "A row already reserved for the held-out set", value: "leak" },
          { label: "A duplicate row", value: "duplicate" },
          { label: "A row with a missing label", value: "missing" },
        ],
        correct: "leak",
        explanation: "A duplicate wastes a little learning; a missing label teaches nothing. The reserved row teaches the model the exact answer it will later be graded on. That is the one failure that invalidates every metric after it.",
      },
    },

    // ── STAGE 2 — PLAY ────────────────────────────────────────────────
    play: {
      sandbox: {
        type: "dataset",
        initial: { fixture: "tickets-30" },
        prompt: "Here are the 30 tickets, exactly as they arrived. Touch them: remove a label, mark a duplicate, find the reserved row. Watch the counts change. Don't think — just touch.",
      },
      experiments: [
        {
          id: "unlabel",
          prompt: "Remove the label from a clean row. What happens to the counts?",
          reveal: "Accepted fell by one, rejected grew by one. A row without a label has no answer to learn from — the contract refuses it.",
        },
        {
          id: "duplicate",
          prompt: "Mark a row as an exact duplicate of an earlier one. What does the contract keep?",
          reveal: "The first occurrence survives; the second is rejected. Identical rows teach nothing the first row didn't already teach.",
        },
        {
          id: "leak",
          prompt: "Now find the row that was already reserved for the held-out evaluation set. What should happen to it?",
          reveal: "It must be rejected before training. If the model sees it once, the evaluation set is no longer an exam — it's a homework key.",
        },
      ],
    },

    // ── STAGE 3 — REASON ──────────────────────────────────────────────
    reason: {
      socraticLadder: [
        {
          id: "q1",
          question: "One row is one support ticket. What does a single row actually carry?",
          options: [
            { label: "A document and the answer we want the model to learn", value: "pair" },
            { label: "Just a string of text", value: "text" },
            { label: "Whatever the author felt like writing", value: "noise" },
          ],
          correct: "pair",
          feedback: {
            correct: "Right — every training row is a (text → label) pair. Lose the label and the pair breaks.",
            wrong: "Look at what the model will need: input AND a known answer to learn from. Which part is missing in your description?",
          },
        },
        {
          id: "q2",
          question: "A row arrives with no label. Can training include it?",
          options: [
            { label: "No — there is nothing to learn from it", value: "no" },
            { label: "Yes — more data is always better", value: "yes" },
            { label: "Only if it's a question", value: "question" },
          ],
          correct: "no",
          feedback: {
            correct: "Exactly. Without the label there is no answer for the model to predict — it's a dangling half-pair.",
            wrong: "What would the model be asked to reproduce for that row? If there's no answer, there's no lesson.",
          },
        },
        {
          id: "q3",
          question: "Two rows: identical text, identical label. Is keeping both harmless?",
          options: [
            { label: "No — the second one teaches nothing new and biases counts", value: "noise" },
            { label: "Yes — more examples, more learning", value: "harmless" },
            { label: "Yes — but only if different authors wrote them", value: "authors" },
          ],
          correct: "noise",
          feedback: {
            correct: "Correct. The second copy quietly doubles the weight of the first — a bias you never see, in a metric you trust.",
            wrong: "What did the first copy already teach? What would the second copy add beyond double-counting it?",
          },
        },
        {
          id: "q4",
          question: "A row from the held-out evaluation set sneaks into training. What breaks?",
          options: [
            { label: "Every later metric — the exam was leaked", value: "leak" },
            { label: "Nothing — it's just one row", value: "nothing" },
            { label: "Only the duplicate check", value: "dup" },
          ],
          correct: "leak",
          feedback: {
            correct: "Yes. From that moment the evaluation set stops measuring skill and starts measuring memory. The whole evidence chain is contaminated.",
            wrong: "The held-out set is the exam. What happens to a grade when the student has already seen the answer key?",
          },
        },
      ],
    },

    // ── STAGE 4 — DISCOVER ────────────────────────────────────────────
    discover: {
      artifact: {
        type: "contract-builder",
        prompt: "Build the contract yourself. Three clauses. Get them right and you will have stated — in your own construction — the decision most pipelines skip.",
        slots: [
          {
            name: "required",
            label: "A row is accepted only when ___ is present",
            options: [
              { label: "the label", value: "label" },
              { label: "the author", value: "author" },
              { label: "a timestamp", value: "timestamp" },
            ],
            correct: "label",
          },
          {
            name: "duplicate",
            label: "The duplicate policy: keep the first occurrence, ___ the rest",
            options: [
              { label: "reject", value: "reject" },
              { label: "keep quietly", value: "keep" },
              { label: "rename", value: "rename" },
            ],
            correct: "reject",
          },
          {
            name: "split",
            label: "A row already reserved for the held-out set must be ___",
            options: [
              { label: "rejected before training", value: "rejected" },
              { label: "trained on with a note", value: "note" },
              { label: "moved to the end of the file", value: "end" },
            ],
            correct: "rejected",
          },
        ],
        crystallized:
          "Your contract: a row needs a label; the first occurrence of a duplicate survives; and anything reserved for the held-out set never trains. " +
          "Three clauses — that is a complete dataset policy. The code in Stage 6 will be a translation of this sentence, nothing more.",
        wrongFeedback:
          "Check each clause: does every accepted row carry a label? does a duplicate survive the pass? does the reserved row still reach training?",
      },
    },

    // ── STAGE 5 — DESIGN ──────────────────────────────────────────────
    design: {
      contract: {
        signature: {
          prompt: "Name your validator and its input. It reads the row list and returns the accepted rows plus the rejected (rowId, reason) pairs.",
          defaultName: "validate_dataset",
          defaultParam: "rows",
          returns: "(accepted, rejected)",
        },
        baseCase: {
          prompt: "The acceptance rule — when is a row kept?",
          options: [
            { label: "id, text, label present · not a duplicate · not reserved", value: "valid" },
            { label: "Whenever the text is non-empty", value: "text-only" },
            { label: "Whenever it has an id", value: "id-only" },
          ],
          correct: "valid",
          wrongFeedback: "That rule lets an unlabeled row train — or lets the reserved row in. Read each clause: what did you leave out?",
        },
        recursiveStep: {
          prompt: "The rejection behavior — what happens to a row that fails?",
          options: [
            { label: "Reported with a structured reason", value: "reason" },
            { label: "Silently skipped", value: "silent" },
            { label: "Kept until a human checks it", value: "defer" },
          ],
          correct: "reason",
          wrongFeedback: "A silent drop hides the data problem from every later stage. What will the trace show if rejections carry no reason?",
        },
        complexity: {
          prompt: "Commit a cost hypothesis. How should the pass scale with the number of rows?",
          options: [
            { label: "One pass, linear in the row count", value: "linear" },
            { label: "One pass per row — quadratic", value: "quadratic" },
            { label: "Constant — the file size does not matter", value: "constant" },
          ],
          correct: "linear",
          wrongFeedback: "Each row is visited once and decided once. Does the work double when the file doubles?",
          derivation: "One pass over n rows, constant work per row (presence checks plus a set lookup for duplicates): O(n) time, O(n) space for the seen set.",
        },
      },
    },

    // ── STAGE 6 — IMPLEMENT ───────────────────────────────────────────
    implement: {
      entryPoint: "validate_dataset",
      starter: `def validate_dataset(rows):
    # rows: list of dicts, each with "id", "text", "label" (and maybe "in_eval").
    # Emit evidence as you decide (the trace will replay it):
    #   __deriva_emit("data.accept", rowId=i)
    #   __deriva_emit("data.reject", rowId=i, reason="missing-label")
    # Return [accepted_rows, rejected_pairs] where rejected_pairs is
    # a list of (rowId, reason) tuples.
    #
    # Your contract (you designed this in Stage 5):
    #   accept when id + text + label are present, not a duplicate,
    #   and not reserved for the held-out set.
    #   report every rejection with a structured reason.

`,
      tests: [
        { call: "validate_dataset([])", expect: [[], []] },
        { call: "validate_dataset([{'id': 'a', 'text': 'hi', 'label': 'bug'}])", expect: [[{ id: "a", text: "hi", label: "bug" }], []] },
        { call: "validate_dataset([{'id': 'a', 'text': 'hi', 'label': None}])", expect: [[], [[0, "missing-label"]]] },
        { call: "validate_dataset([{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'hi', 'label': 'bug'}])", expect: [[{ id: "a", text: "hi", label: "bug" }], [[1, "duplicate"]]] },
        { call: "validate_dataset([{'id': 'a', 'text': 'hi', 'label': 'bug', 'in_eval': True}])", expect: [[], [[0, "reserved"]]] },
      ],
      hints: [
        { level: 1, type: "question", text: "Which single check decides whether a row even has an answer to learn from?" },
        { level: 2, type: "question", text: "After the label check passes, which two other failures can still send a row to the rejected list?" },
        { level: 3, type: "question", text: "Where does the first-occurrence-wins rule live — before or after you append to accepted?" },
        { level: 4, type: "assertion", text: "check label via row.get('label') is None; track seen (text, label) pairs in a set; reject row.get('in_eval'); emit data.accept / data.reject for every row" },
      ],
      solution: `def validate_dataset(rows):
    accepted = []
    rejected = []
    seen = set()
    for i, row in enumerate(rows):
        if not isinstance(row, dict) or not isinstance(row.get("text"), str) or not row.get("text").strip():
            __deriva_emit("data.reject", rowId=i, reason="malformed")
            rejected.append((i, "malformed"))
            continue
        if row.get("label") is None:
            __deriva_emit("data.reject", rowId=i, reason="missing-label")
            rejected.append((i, "missing-label"))
            continue
        if row.get("in_eval"):
            __deriva_emit("data.reject", rowId=i, reason="reserved")
            rejected.append((i, "reserved"))
            continue
        key = (row["text"].strip().lower(), row["label"])
        if key in seen:
            __deriva_emit("data.reject", rowId=i, reason="duplicate")
            rejected.append((i, "duplicate"))
            continue
        seen.add(key)
        __deriva_emit("data.accept", rowId=i)
        accepted.append(row)
    return [accepted, rejected]
`,
    },

    // ── STAGE 7 — EXECUTE ─────────────────────────────────────────────
    execute: {
      traceInput: { fixture: "tickets-30" },
      budget: 300,
      vizPanels: ["dataset"],
    },

    // ── STAGE 8 — REFLECT ─────────────────────────────────────────────
    reflect: {
      prompts: [
        "What did the naive 'just load the CSV' approach hide — and where would that have surfaced first?",
        "Which single failure would invalidate every later metric, and how does the contract prevent it before any training?",
        "In the trace, find the reserved row: why must rejection happen during validation, not as a cleanup after training?",
      ],
      pattern: {
        id: "dataset-contract",
        name: "Dataset Contract",
        definition:
          "Make messy reality measurable before any model exists: name what a row must carry, how duplicates resolve, " +
          "and which rows are off-limits. Every later artifact — baseline, model, service — inherits this contract.",
      },
    },

    // ── STAGE 9 — GENERALIZE ──────────────────────────────────────────
    generalize: {
      related: [
        {
          title: "Split the evidence",
          why: "The same contract, one step later: rows can be valid yet still off-limits — train, validation, and test must never share a row or a source group.",
          href: "/lab",
        },
        {
          title: "API requests are rows in disguise",
          why: "A request payload has required fields, duplicates (retries), and malformed values. Your contract is the API's validation layer.",
          href: "/lab",
        },
      ],
      revisitInDays: [3, 7, 21],
    },
  },

  ai: {
    kind: "data-lab",
    artifacts: [
      {
        kind: "dataset-card",
        title: "Dataset contract with accepted/rejected row lists",
        requiredFields: ["required fields", "duplicate policy", "missing-value policy", "split policy"],
      },
    ],
    constraints: [
      {
        label: "Fixture size",
        value: "30 rows · 8-row held-out set",
        whyItMatters: "Small enough to replay every accept/reject decision in the browser worker.",
      },
      {
        label: "Determinism",
        value: "Fixed rows, fixed order, first-occurrence-wins",
        whyItMatters: "Duplicates and the leak must be findable, testable, and reproducible across runs.",
      },
    ],
  },
})
