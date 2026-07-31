// Expedition curriculum is intentionally separate from src/data.
// Existing practice questions remain a read-only transfer shelf.

export type ExpeditionStep = "retrieve" | "derive" | "failure" | "transfer" | "notebook"

export type RetrievalPrompt = {
  question: string
  options: { label: string; value: string }[]
  correct: string
  explanation: string
}

export type FailureLab = {
  question: string
  options: { label: string; value: string }[]
  correct: string
  brokenTrace: string[]
  repair: string
}

export type TransferChallenge = {
  title: string
  prompt: string
  options: { label: string; value: string }[]
  correct: string
  explanation: string
  existingHref?: string
}

export type PatternCapsule = {
  id: string
  name: string
  oneThinkingMove: string
  coreQuestion: string
  definition: string
  anchorHref: string
  retrieval: RetrievalPrompt
  derive: {
    title: string
    paragraphs: string[]
    prompt: string
    options: { label: string; value: string }[]
    correct: string
    commitment: string
  }
  failure: FailureLab
  transfer: TransferChallenge
  breadcrumb: string
  revisitDays: number[]
}

export const RECURSIVE_LEAP: PatternCapsule = {
  id: "recursive-leap-of-faith",
  name: "Recursive Leap of Faith",
  oneThinkingMove: "Trust the smaller answer",
  coreQuestion: "How can a function use an answer it has not finished computing?",
  definition: "Define the promise, trust it on a smaller input, and focus only on the combine step and the floor.",
  anchorHref: "/learn/trees/sum-1-to-n",
  retrieval: {
    question: "A recursive function calls itself with a smaller input. What must be true before that call can be trusted?",
    options: [
      { label: "The function's contract is already clear", value: "contract" },
      { label: "The function must be fully executed first", value: "execute" },
      { label: "The smaller input must be a different problem", value: "different" },
    ],
    correct: "contract",
    explanation: "The leap is not blind faith. It is a precise promise: define what comes back, then trust the same promise on a smaller input.",
  },
  derive: {
    title: "Make the promise precise",
    paragraphs: [
      "A recursive call is useful only when it returns something the current call knows how to use. The smaller call is not a mystery; it is the same question with less work left.",
      "The current function should have exactly three pieces: a promise, a floor where no help is needed, and a combine step that uses the smaller answer.",
      "Before you move on, say the pattern in your own head: I do not solve every level. I define one level and trust the next smaller one.",
    ],
    prompt: "Complete the contract: I can trust the smaller call when…",
    options: [
      { label: "the function's promise is clear and the input moves toward a floor", value: "contract" },
      { label: "the recursive call looks shorter than the current code", value: "shorter" },
      { label: "I have already memorized the implementation", value: "memorized" },
    ],
    correct: "contract",
    commitment: "A recursive function is trustworthy when its contract, floor, and combine step are explicit.",
  },
  failure: {
    question: "This recursive function never returns. Which part of the contract is broken?",
    options: [
      { label: "There is no floor that stops the chain", value: "floor" },
      { label: "The current number is too small", value: "small" },
      { label: "The recursive call is always useful", value: "useful" },
    ],
    correct: "floor",
    brokenTrace: [
      "sum_to(4) asks sum_to(3)",
      "sum_to(3) asks sum_to(2)",
      "sum_to(2) asks sum_to(1)",
      "sum_to(1) asks sum_to(0)",
      "sum_to(0) asks sum_to(-1) …",
    ],
    repair: "Every recursive chain needs a floor: the smallest case that answers itself without another call.",
  },
  transfer: {
    title: "Same leap, two children",
    prompt: "A tree function counts nodes. What does the current node need to trust?",
    options: [
      { label: "The count from the left subtree and the count from the right subtree", value: "children" },
      { label: "Only the value stored at the current node", value: "value" },
      { label: "A completely different algorithm for every child", value: "different" },
    ],
    correct: "children",
    explanation: "The surface changed from a number to a tree, but the move survived: trust smaller answers, then combine them at the current node.",
    existingHref: "/practice?topic=trees&problem=6",
  },
  breadcrumb: "Next: trust two smaller answers at once.",
  revisitDays: [1, 3, 7, 21],
}

export const EXPEDITION_CAPSULES = [RECURSIVE_LEAP]
