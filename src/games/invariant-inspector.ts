export type InspectorRound = {
  title: string
  instruction: string
  relation: string
  repairedRelation: string
  nodes: { label: string; state: "safe" | "broken" }[]
  predictionOptions: { label: string; value: string }[]
  predictionCorrect: string
  actionOptions: { label: string; value: string }[]
  actionCorrect: string
  success: string
  failure: string
}

export const INVARIANT_INSPECTOR = {
  id: "invariant-inspector",
  title: "Invariant Inspector",
  rounds: [
    {
      title: "The range leak",
      instruction: "Predict which node is illegal before you repair the tree.",
      relation: "8 → 3 → 12 (right child of 3)",
      repairedRelation: "8 → 3       12 → right of 8",
      nodes: [{ label: "8", state: "safe" }, { label: "3", state: "safe" }, { label: "12", state: "broken" }],
      predictionOptions: [{ label: "Node 3", value: "3" }, { label: "Node 12", value: "12" }, { label: "The root 8", value: "8" }],
      predictionCorrect: "12",
      actionOptions: [{ label: "Move 12 outside 3's legal range", value: "range" }, { label: "Sort only node 3's children", value: "local" }, { label: "Leave it and check during search", value: "later" }],
      actionCorrect: "range",
      success: "The constraint came from the whole path: 12 must be greater than 8, not merely greater than 3.",
      failure: "Checking only a node's immediate children misses a bound inherited from an ancestor.",
    },
    {
      title: "The severed link",
      instruction: "A pointer operation has hidden the rest of the list. Predict the first broken link.",
      relation: "head → A → B ↘ head",
      repairedRelation: "head → A → B → C → end",
      nodes: [{ label: "head", state: "safe" }, { label: "A", state: "safe" }, { label: "B.next", state: "broken" }, { label: "C", state: "safe" }],
      predictionOptions: [{ label: "head", value: "head" }, { label: "B.next", value: "B.next" }, { label: "A.next", value: "A.next" }],
      predictionCorrect: "B.next",
      actionOptions: [{ label: "Save C, then set B.next to C", value: "save" }, { label: "Overwrite B.next and find C later", value: "overwrite" }, { label: "Copy the entire list first", value: "copy" }],
      actionCorrect: "save",
      success: "Pointer surgery preserved the forward path before changing the arrow.",
      failure: "Once the only forward pointer is overwritten, the unreachable suffix cannot be recovered from the list.",
    },
    {
      title: "The missing sentinel",
      instruction: "The empty-list operation should be safe. Predict which state breaks the invariant.",
      relation: "insert(HEAD, X) → HEAD.next is undefined",
      repairedRelation: "sentinel → X → end",
      nodes: [{ label: "sentinel", state: "broken" }, { label: "X", state: "safe" }, { label: "end", state: "safe" }],
      predictionOptions: [{ label: "The inserted value X", value: "value" }, { label: "The missing sentinel link", value: "sentinel" }, { label: "The end marker", value: "end" }],
      predictionCorrect: "sentinel",
      actionOptions: [{ label: "Keep a permanent sentinel before the first item", value: "sentinel" }, { label: "Special-case every head insertion", value: "special" }, { label: "Insert after a random node", value: "random" }],
      actionCorrect: "sentinel",
      success: "The sentinel makes the empty and non-empty cases share one pointer rule.",
      failure: "A missing boundary object turns the first insertion into a separate, fragile case.",
    },
    {
      title: "The local repair trap",
      instruction: "One child looks ordered locally, but the ancestor's rule still fails. Find the first illegal state.",
      relation: "10 → 5 → 7 (left child of 5)",
      repairedRelation: "10 → 5 → 7 (right child of 5)",
      nodes: [{ label: "10", state: "safe" }, { label: "5", state: "safe" }, { label: "7", state: "broken" }],
      predictionOptions: [{ label: "5, because it has two children", value: "5" }, { label: "7, because it violates 5's side", value: "7" }, { label: "10, because it is largest", value: "10" }],
      predictionCorrect: "7",
      actionOptions: [{ label: "Relink 7 as 5's right child", value: "relink" }, { label: "Swap 10 and 5", value: "swap" }, { label: "Inspect only the root", value: "root" }],
      actionCorrect: "relink",
      success: "A local relink restores the ordering without rewriting the whole tree.",
      failure: "The repair must change the operation that created the illegal state, not hide it with a later scan.",
    },
  ] satisfies InspectorRound[],
}
