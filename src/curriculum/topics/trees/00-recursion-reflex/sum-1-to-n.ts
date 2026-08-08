// Trees · Beat 0 (Reflex) — Lesson 1: The Recursion Reflex
// Vehicle: sum from 1 to N. The thinking-move: trust the subproblem.
// This module is the reference implementation for docs/12. Every later lesson
// copies this shape without inventing a new learning flow.

import { defineLesson } from "../../../schema/lesson"

export default defineLesson({
  id: "trees/00-recursion-reflex/sum-1-to-n",
  routeSlug: "sum-1-to-n",
  title: "The Recursion Reflex",
  topic: "trees",
  beat: "reflex",
  thinkingMove: "trust the subproblem's answer",
  purpose:
    "Isolate and install the recursion reflex before trees exist: a function that " +
    "answers a smaller copy of its own question can be trusted without re-checking. " +
    "Every tree algorithm later stands on this reflex.",
  dependencies: [],

  stageMoves: {
    understand: "predict outputs before answers exist",
    play: "feel one problem hiding inside another",
    reason: "trust the smaller answer completely",
    discover: "state the contract in one line",
    design: "commit the contract before any code",
    implement: "translate your contract into Python",
    execute: "watch trust travel down and back",
    reflect: "name the leap you just took",
    generalize: "spot the same leap elsewhere",
  },

  // Rule A3 exception, recorded explicitly (docs/12 acceptance criteria):
  naiveOptimizedContrast: {
    status: "exception",
    reason:
      "Recursion-reflex lesson: sum 1→N has no natural wasteful variant worth " +
      "teaching — iteration is equally direct and inventing a worse one is ritual, " +
      "not insight (03 A3 exception clause). The naive/optimization contrast first " +
      "applies at Trees beat 4 (Diameter by recomputation).",
  },

  probes: {
    understand: {
      question: "Without adding one by one: sum_to(4) = ?",
      options: [
        { label: "10", value: "10" },
        { label: "4", value: "4" },
        { label: "24", value: "24" },
      ],
      correct: "10",
      explanation: "1+2+3+4 = 10. You already own the mechanics — this lesson is about a new way to think, not to add.",
    },
    play: {
      question: "sum_to(5) can be written as 5 + ___. Fill the blank.",
      options: [
        { label: "sum_to(4)", value: "smaller" },
        { label: "sum_to(5)", value: "same" },
        { label: "4", value: "four" },
      ],
      correct: "smaller",
      explanation: "5 + sum_to(4) = 5 + 10 = 15. The same problem, one size smaller — that's the whole trick.",
    },
    reason: {
      question: "Why can you USE sum_to(n−1)'s answer without re-checking it?",
      options: [
        { label: "Because it's the same function on a smaller input — if it works at all, it works there", value: "trust" },
        { label: "Because small sums are easy to verify by hand", value: "verify" },
        { label: "Because the computer checks it for you", value: "computer" },
      ],
      correct: "trust",
      explanation: "Exactly. One level of trust, repeated. Re-checking every level would be doing the whole problem yourself.",
    },
    discover: {
      question: "State the full contract for sum_to in one line.",
      options: [
        { label: "sum_to(n) = n + sum_to(n−1), stopping at n ≤ 1", value: "contract" },
        { label: "sum_to(n) = sum_to(n−1) + sum_to(n−2)", value: "fib" },
        { label: "sum_to(n) = n × (n+1) / 2", value: "gauss" },
      ],
      correct: "contract",
      explanation: "That's the recursion contract: combine the current number with a trusted smaller answer, and stop where no help is needed.",
    },
    design: {
      question: "For n = 5, how many total calls does sum_to make?",
      options: [
        { label: "5 — one per number", value: "5" },
        { label: "1", value: "1" },
        { label: "25", value: "25" },
      ],
      correct: "5",
      explanation: "sum_to(5)→(4)→(3)→(2)→(1). Five calls, each doing O(1) work — O(n) total.",
    },
  },

  stages: {
    // ── STAGE 1 — UNDERSTAND ──────────────────────────────────────────
    understand: {
      prose: [
        {
          body: "Add the numbers from 1 to 5. Go on, in your head: 1 + 2 + 3 + 4 + 5. You got 15, and it took a few seconds.",
        },
        {
          body: "Now imagine n = 10,000. You could still do it — but you'd be doing the same tiny operation, over and over, ten thousand times. Computers are good at that part. The interesting question is different:",
        },
        {
          heading: "The real question",
          body: "How would you DESCRIBE the task so that the description itself is short — no matter how big n gets? Not the answer. The shape of the answer.",
        },
        {
          body: "In this lesson you'll invent a way of describing 'sum from 1 to n' that is two lines long, works for any n, and is the single most important idea behind every tree algorithm you will ever write. Nobody will tell you the trick. You'll build it.",
        },
      ],
      examples: [
        { id: "ex1", given: "sum_to(1)", result: "1" },
        { id: "ex2", given: "sum_to(3)", result: "6" },
        { id: "ex3", given: "sum_to(5)", result: "15" },
      ],
      prediction: {
        prompt: "Before anything is explained — commit: sum_to(4) = ?",
        kind: "choice",
        options: [
          { label: "6", value: "6" },
          { label: "10", value: "10" },
          { label: "16", value: "16" },
        ],
        correct: "10",
        explanation: "1+2+3+4 = 10. Notice what you did NOT need: a formula, a trick, or help. Hold onto that confidence — you'll need it in a stranger place soon.",
      },
    },

    // ── STAGE 2 — PLAY ────────────────────────────────────────────────
    play: {
      sandbox: {
        type: "peel-strip",
        initial: { n: 5 },
        prompt: "Here's a strip: 1 2 3 4 5, summing to 15. Peel the last number off. Then peel again. Don't think — just touch.",
      },
      experiments: [
        {
          id: "peel-once",
          prompt: "Peel once. The total (15) split into two parts. What are they?",
          reveal: "15 = 5 + 10. The last number, and everything before it. Obvious — and yet this is 90% of the lesson.",
        },
        {
          id: "peel-down",
          prompt: "Keep peeling. Each leftover strip is ALSO a 'sum from 1 to something'. When does a strip stop needing any peeling?",
          reveal: "At 1. A strip of just [1] is its own answer — no help needed. Every problem has a floor like this; finding it matters more than finding the answer.",
        },
        {
          id: "build-back",
          prompt: "Now un-peel all the way back. At each step, what did you add to rebuild the total?",
          reveal: "Just the number you were holding. Each step: take the smaller total you already trust, add your number, hand it up. You just ran a recursion by hand.",
        },
      ],
    },

    // ── STAGE 3 — REASON ──────────────────────────────────────────────
    reason: {
      socraticLadder: [
        {
          id: "q1",
          question: "A friend hands you a sealed note: 'the sum from 1 to 4 is 10.' You need the sum from 1 to 5. What do you do?",
          options: [
            { label: "Add 5 to 10. Done.", value: "use-note" },
            { label: "Start over: 1+2+3+4+5", value: "restart" },
            { label: "Open the note and check their work first", value: "check" },
          ],
          correct: "use-note",
          feedback: {
            correct: "Right — 15, in one step. The note did 90% of the work and you finished it in one move.",
            wrong: "You could — but then what was the note for? The interesting move is using a finished smaller answer.",
          },
        },
        {
          id: "q2",
          question: "When you added 5 to 10, what did you trust WITHOUT re-checking?",
          options: [
            { label: "That the sum from 1 to 4 really is 10", value: "trust-10" },
            { label: "That 5 is the last number", value: "five" },
            { label: "That your friend is honest", value: "honest" },
          ],
          correct: "trust-10",
          feedback: {
            correct: "Yes. You used sum(1..4) as a FACT. You didn't re-add it. That trust — using a smaller answer without redoing it — is the entire skill this lesson installs.",
            wrong: "Focus on the 10: you used it as a finished fact. You never re-added 1+2+3+4. That trust is the point.",
          },
        },
        {
          id: "q3",
          question: "Now the flip side: your friend got THEIR note from a friend, who got it from a friend… If the chain never stops, what happens?",
          options: [
            { label: "The asking goes down forever: 4, 3, 2, 1, 0, −1… nobody ever answers", value: "forever" },
            { label: "Nothing bad — asking is free", value: "free" },
            { label: "The sums get too large to compute", value: "large" },
          ],
          correct: "forever",
          feedback: {
            correct: "Exactly. A chain of trust with no floor never produces an answer. Every recursion needs a place where someone finally says: I don't need to ask anyone — I just know.",
            wrong: "Trace it: each friend needs a smaller sum first. If no one ever answers directly, no answer ever comes back up.",
          },
        },
        {
          id: "q4",
          question: "So where should the asking stop? What's a sum you can answer with zero help?",
          options: [
            { label: "sum_to(1) = 1 — the smallest possible sum", value: "one" },
            { label: "sum_to(10) = 55 — round numbers are safe", value: "ten" },
            { label: "sum_to(0) needs a friend too", value: "zero" },
          ],
          correct: "one",
          feedback: {
            correct: "That's the base case: n ≤ 1 → the answer is just n. Small enough that asking for help would be absurd.",
            wrong: "You want the point where asking for help becomes absurd. What's the smallest 'sum from 1 to n' that exists?",
          },
        },
      ],
    },

    // ── STAGE 4 — DISCOVER ────────────────────────────────────────────
    discover: {
      artifact: {
        type: "contract-builder",
        prompt: "Build the contract yourself. Three blanks. Get them right and you will have stated — in your own construction — the idea most students only ever memorize.",
        slots: [
          {
            name: "combine",
            label: "sum_to(n) = n + ___",
            options: [
              { label: "sum_to(n − 1)", value: "smaller" },
              { label: "sum_to(n)", value: "same" },
              { label: "sum_to(1)", value: "one" },
              { label: "n − 1", value: "minus" },
            ],
            correct: "smaller",
          },
          {
            name: "shrink",
            label: "Every recursive ask must make the problem ___",
            options: [
              { label: "smaller", value: "smaller" },
              { label: "bigger", value: "bigger" },
              { label: "the same size", value: "same" },
            ],
            correct: "smaller",
          },
          {
            name: "stop",
            label: "The asking stops at n ≤ 1, where the answer is ___",
            options: [
              { label: "just n — no help needed", value: "n" },
              { label: "0, always", value: "zero" },
              { label: "unknown until computed", value: "unknown" },
            ],
            correct: "n",
          },
        ],
        crystallized:
          "Your contract: sum_to(n) = n + sum_to(n−1), and at n ≤ 1 the answer is n itself. " +
          "Two clauses. That is a complete algorithm — and it is YOURS. The code in Stage 6 " +
          "will be a translation of this sentence, nothing more.",
      },
    },

    // ── STAGE 5 — DESIGN ──────────────────────────────────────────────
    design: {
      contract: {
        signature: {
          prompt: "Name your function and its input. It takes one number and returns one number.",
          defaultName: "sum_to",
          defaultParam: "n",
        },
        baseCase: {
          prompt: "The base case — where does the asking stop?",
          options: [
            { label: "when n ≤ 1 → return n", value: "floor" },
            { label: "when n = 5 → return 15", value: "five" },
            { label: "when n is even → return 0", value: "even" },
          ],
          correct: "floor",
          wrongFeedback: "That case doesn't END the chain — the asking would march past it into negatives forever. You want the floor: the smallest question that needs no help.",
        },
        recursiveStep: {
          prompt: "The recursive step — how does each call use its smaller answer?",
          options: [
            { label: "return n + sum_to(n − 1)", value: "step" },
            { label: "return sum_to(n) + 1", value: "self" },
            { label: "return n + sum_to(n)", value: "same" },
          ],
          correct: "step",
          wrongFeedback: "Check the argument inside the call: if it isn't SMALLER than n, the chain never reaches the floor you just defined.",
        },
        complexity: {
          prompt: "Commit a cost hypothesis from the call shape you designed. What kind of growth should one shrinking call per number produce?",
          options: [
            { label: "One shrinking call per number; constant work each", value: "linear" },
            { label: "One call total; the input size does not matter", value: "constant" },
            { label: "Every call repeats the whole chain", value: "quadratic" },
          ],
          correct: "linear",
          wrongFeedback: "Look at the shape: each call makes one smaller call and does one combine step. Does that repeat a whole chain or move one link toward the floor?",
          derivation: "One call per number from n down to 1, each doing a single addition: n calls × O(1) = O(n) time, and the call chain itself is O(n) space.",
        },
      },
    },

    // ── STAGE 6 — IMPLEMENT ───────────────────────────────────────────
    implement: {
      entryPoint: "sum_to",
      starter: `def sum_to(n):
    # YOUR contract (you designed this in Stage 5):
    #   base case:     n <= 1  ->  return n
    #   recursive step:         return n + sum_to(n - 1)
    #
    # Translate it. Two lines is enough.

`,
      tests: [
        { call: "sum_to(1)", expect: 1 },
        { call: "sum_to(3)", expect: 6 },
        { call: "sum_to(5)", expect: 15 },
        { call: "sum_to(8)", expect: 36 },
        { call: "sum_to(100)", expect: 5050 },
      ],
      hints: [
        { level: 1, type: "question", text: "What is the ONE input your function must answer with zero help — and what does it return there?" },
        { level: 2, type: "question", text: "If n is too big for the base case, what two things combine: the number you're holding, and… what?" },
        { level: 3, type: "question", text: "Inside your own call, what argument makes the problem smaller — n, n − 1, or 1? Why not the others?" },
        { level: 4, type: "assertion", text: "if n <= 1: return n — otherwise: return n + sum_to(n - 1)" },
      ],
      solution: `def sum_to(n):
    if n <= 1:
        return n
    return n + sum_to(n - 1)
`,
    },

    // ── STAGE 7 — EXECUTE ─────────────────────────────────────────────
    execute: {
      traceInput: { n: 6 },
      budget: 500,
      vizPanels: ["call-stack"],
    },

    // ── STAGE 8 — REFLECT ─────────────────────────────────────────────
    reflect: {
      prompts: [
        "Why could you trust sum_to(n−1) before you had even finished writing sum_to?",
        "In the trace, find the moment the deepest call returned. Did ANY level re-check the small sums on the way back up? What does that tell you about the cost of trust?",
        "A classmate wants to add a print after every recursive call 'to verify each sub-answer.' From the trace's point of view, what would they be re-doing?",
      ],
      pattern: {
        id: "recursive-leap-of-faith",
        name: "Recursive Leap of Faith",
        definition:
          "Define what the function returns, trust that it works on the smaller " +
          "input, and spend your energy only on the combine step and the floor. " +
          "One level of trust, repeated, replaces checking every level.",
      },
    },

    // ── STAGE 9 — GENERALIZE ──────────────────────────────────────────
    generalize: {
      related: [
        {
          title: "Factorial — the same leap, a different combine",
          why: "factorial(n) = n × factorial(n−1), floor at n ≤ 1. Identical skeleton; only the operator changes. If you can write sum_to, you already own factorial.",
          href: "/practice?topic=trees&problem=2",
        },
        {
          title: "Count the nodes of a tree — the leap, twice per call",
          why: "count(node) = 1 + count(left) + count(right). The same trust, now placed in TWO smaller answers at once. This is why the reflex had to exist before trees did.",
          href: "/practice?topic=trees&problem=6",
        },
      ],
      revisitInDays: [3, 7, 21],
    },
  },
})
