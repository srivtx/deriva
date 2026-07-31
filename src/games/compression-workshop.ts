export type CompressionRound = {
  title: string
  instruction: string
  kind: "trie" | "heap" | "mask" | "elimination"
  before: string[]
  after: string[]
  predictionOptions: { label: string; value: string }[]
  predictionCorrect: string
  actionOptions: { label: string; value: string }[]
  actionCorrect: string
  success: string
  failure: string
}

export const COMPRESSION_WORKSHOP = {
  id: "compression-workshop",
  title: "Compression Workshop",
  rounds: [
    {
      title: "Share the prefix",
      instruction: "Predict where the new word belongs before adding it to the prefix structure.",
      kind: "trie",
      before: ["c", " └ a", "    └ t", "        └ r"],
      after: ["c", " └ a", "    ├ t", "    │   └ r", "    └ p", "        └ e"],
      predictionOptions: [{ label: "Create a fresh root for cape", value: "fresh" }, { label: "Reuse c → a, then branch at p", value: "share" }, { label: "Sort all words after insertion", value: "sort" }],
      predictionCorrect: "share",
      actionOptions: [{ label: "Insert cape through the shared c → a path", value: "insert" }, { label: "Scan every word for each letter", value: "scan" }, { label: "Replace cat with cape", value: "replace" }],
      actionCorrect: "insert",
      success: "The trie paid once for the shared prefix and stored only the new suffix.",
      failure: "Compression means sharing repeated structure, not merely moving the same scan somewhere else.",
    },
    {
      title: "Expose the urgent extreme",
      instruction: "The next task is the largest priority. Predict which operation keeps that extreme available.",
      kind: "heap",
      before: ["root 9", "├─ 7", "└─ 5", "   └─ 3"],
      after: ["root 7", "├─ 3", "└─ 5"],
      predictionOptions: [{ label: "Read the heap root", value: "root" }, { label: "Sort the whole array again", value: "sort" }, { label: "Scan from the leaves", value: "scan" }],
      predictionCorrect: "root",
      actionOptions: [{ label: "Extract 9, then restore the heap locally", value: "extract" }, { label: "Remove 9 and leave the gap", value: "gap" }, { label: "Sort every value before popping", value: "sort" }],
      actionCorrect: "extract",
      success: "A local parent-child rule keeps the global extreme at the root.",
      failure: "If the useful extreme is not maintained at a known boundary, every query pays for another search.",
    },
    {
      title: "Toggle one membership bit",
      instruction: "The mask 10101 records selected items. Predict what one bit can answer.",
      kind: "mask",
      before: ["items: 4 3 2 1 0", "mask:  1 0 1 0 1", "selected: {4, 2, 0}"],
      after: ["items: 4 3 2 1 0", "mask:  1 1 1 0 1", "selected: {4, 3, 2, 0}"],
      predictionOptions: [{ label: "Whether item 3 belongs to the set", value: "member" }, { label: "The full value of item 3", value: "value" }, { label: "The order items were selected", value: "order" }],
      predictionCorrect: "member",
      actionOptions: [{ label: "Set bit 3: 10101 → 11101", value: "toggle" }, { label: "Rewrite every selected item", value: "rewrite" }, { label: "Sort the bit positions", value: "sort" }],
      actionCorrect: "toggle",
      success: "One bit changed one yes/no membership decision without copying the set.",
      failure: "A mask compresses membership. It does not pretend to remember arbitrary object data or insertion order.",
    },
    {
      title: "Eliminate the resolved work",
      instruction: "One candidate has already lost its comparison. Predict what the compressed frontier should discard.",
      kind: "elimination",
      before: ["frontier: A(8) · B(5) · C(8)", "winner so far: B(5)", "A and C still unresolved"],
      after: ["frontier: B(5)", "discarded: A(8), C(8)", "winner: B(5)"],
      predictionOptions: [{ label: "Keep every defeated candidate forever", value: "keep" }, { label: "Eliminate candidates that cannot beat B", value: "discard" }, { label: "Restart comparisons from the beginning", value: "restart" }],
      predictionCorrect: "discard",
      actionOptions: [{ label: "Remove A and C from the active frontier", value: "remove" }, { label: "Duplicate B three times", value: "duplicate" }, { label: "Sort the full history again", value: "sort" }],
      actionCorrect: "remove",
      success: "The frontier remembers only candidates that can still affect the answer.",
      failure: "A compressed representation is useful only when it safely eliminates work that no future query needs.",
    },
  ] satisfies CompressionRound[],
}
