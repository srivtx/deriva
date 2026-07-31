export type ProofRound = {
  title: string
  instruction: string
  claim: string
  before: string[]
  after: string[]
  predictionOptions: { label: string; value: string }[]
  predictionCorrect: string
  actionOptions: { label: string; value: string }[]
  actionCorrect: string
  success: string
  failure: string
}

export const PROOF_ARENA = {
  id: "proof-arena",
  title: "Proof Arena",
  rounds: [
    {
      title: "Challenge the greedy shortcut",
      instruction: "Predict the witness before running it. Does choosing the longest interval preserve the best schedule?",
      claim: "Always choose the longest interval.",
      before: ["claim: [1, 4] beats everything", "witness: [1, 4], [2, 3], [4, 5]", "score: not tested"],
      after: ["shortcut takes [1, 4]", "optimal takes [2, 3] + [4, 5]", "score: 1 < 2 · claim breaks"],
      predictionOptions: [{ label: "The claim survives", value: "survives" }, { label: "The witness breaks the claim", value: "breaks" }, { label: "There is no way to compare", value: "unknown" }],
      predictionCorrect: "breaks",
      actionOptions: [{ label: "Run the interval witness", value: "run" }, { label: "Hide the losing interval", value: "hide" }, { label: "Declare the claim true", value: "declare" }],
      actionCorrect: "run",
      success: "A counterexample is enough to reject a universal shortcut. The safe greedy rule needs an exchange argument instead.",
      failure: "One friendly example cannot prove a greedy rule. Ask for an input where the local choice blocks more future value.",
    },
    {
      title: "Preserve the common divisor",
      instruction: "Predict whether Euclid's reduction keeps the answer before applying the smaller pair.",
      claim: "gcd(a, b) = gcd(b, a mod b)",
      before: ["pair: (84, 30)", "common divisors: 1, 2, 3, 6", "next reduction: not applied"],
      after: ["pair: (30, 24)", "common divisors: 1, 2, 3, 6", "answer preserved: gcd = 6"],
      predictionOptions: [{ label: "The common divisors are preserved", value: "preserved" }, { label: "The remainder destroys the answer", value: "lost" }, { label: "Only equal inputs are safe", value: "equal" }],
      predictionCorrect: "preserved",
      actionOptions: [{ label: "Apply (84, 30) → (30, 24)", value: "reduce" }, { label: "Subtract a random number", value: "random" }, { label: "Keep both numbers unchanged", value: "keep" }],
      actionCorrect: "reduce",
      success: "The reduction shrinks the numbers while preserving exactly the property the answer asks for.",
      failure: "A shortcut earns trust only when its transformation preserves the answer, not merely when it makes numbers smaller.",
    },
    {
      title: "Halve the work",
      instruction: "Predict what repeated squaring does to x^16 before executing the next reduction.",
      claim: "Compute powers by reusing solved halves.",
      before: ["goal: x^16", "work remaining: 16 multiplications", "expression: x × x × … × x"],
      after: ["x^16 = (x^8)^2", "then x^8 = (x^4)^2", "work: 4 squarings"],
      predictionOptions: [{ label: "The exponent is split into halves", value: "halve" }, { label: "The exponent stays a chain of 16", value: "chain" }, { label: "The answer must be guessed", value: "guess" }],
      predictionCorrect: "halve",
      actionOptions: [{ label: "Square x^8, then reuse its half", value: "square" }, { label: "Multiply x sixteen separate times", value: "repeat" }, { label: "Drop the exponent", value: "drop" }],
      actionCorrect: "square",
      success: "The trace makes the proof visible: each square reuses a solved half and cuts the remaining exponent roughly in half.",
      failure: "A shorter expression is not the proof. Count the work the transformation actually removes.",
    },
    {
      title: "Exchange into the optimum",
      instruction: "A schedule starts with a later finishing choice. Predict the proof move that makes it safe to exchange.",
      claim: "An earliest-finish interval can replace the first interval in an optimal schedule.",
      before: ["optimal witness starts with [2, 3]", "candidate safe choice: [1, 2]", "remaining work: compare suffixes"],
      after: ["exchange [2, 3] → [1, 2]", "suffix remains feasible", "number scheduled: unchanged"],
      predictionOptions: [{ label: "Exchange the first choice and keep the suffix", value: "exchange" }, { label: "Discard the whole optimal schedule", value: "discard" }, { label: "Compare only interval lengths", value: "length" }],
      predictionCorrect: "exchange",
      actionOptions: [{ label: "Swap in [1, 2] and preserve the rest", value: "swap" }, { label: "Replace every interval", value: "all" }, { label: "Choose the longest interval", value: "longest" }],
      actionCorrect: "swap",
      success: "The exchange keeps the suffix feasible and shows an optimum can adopt the greedy first move.",
      failure: "An exchange argument changes one local choice while preserving the rest. A global rewrite proves nothing about the shortcut.",
    },
  ] satisfies ProofRound[],
}
