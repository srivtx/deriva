export type GardenRound = {
  title: string
  instruction: string
  target: number
  path: number[]
  remaining: number[]
  predictionOptions: { label: string; value: string }[]
  predictionCorrect: string
  actionOptions: { label: string; value: string }[]
  actionCorrect: string
  nextPath: number[]
  nextRemaining: number[]
  success: string
  failure: string
}

export const DECISION_GARDEN = {
  id: "decision-garden",
  title: "Decision Garden",
  rounds: [
    {
      title: "Plant the first choice",
      instruction: "Predict the branch before touching the garden. The path must still be able to reach the target.",
      target: 7,
      path: [],
      remaining: [2, 5, 4],
      predictionOptions: [{ label: "Choose 2", value: "2" }, { label: "Choose 5", value: "5" }, { label: "Prune the whole garden", value: "prune" }],
      predictionCorrect: "2",
      actionOptions: [{ label: "Plant 2", value: "2" }, { label: "Plant 5", value: "5" }, { label: "Cut this branch", value: "prune" }],
      actionCorrect: "2",
      nextPath: [2],
      nextRemaining: [5, 4],
      success: "The path now carries a real partial answer: 2, with 5 still available to complete 7.",
      failure: "A branch is not a guess. Choose a value that leaves a possible completion.",
    },
    {
      title: "Explore the branch",
      instruction: "The first plant is 2. Predict which next choice completes the live branch.",
      target: 7,
      path: [2],
      remaining: [5, 4],
      predictionOptions: [{ label: "Choose 5", value: "5" }, { label: "Choose 4", value: "4" }, { label: "Undo 2 immediately", value: "undo" }],
      predictionCorrect: "5",
      actionOptions: [{ label: "Plant 5", value: "5" }, { label: "Plant 4", value: "4" }, { label: "Uproot 2", value: "undo" }],
      actionCorrect: "5",
      nextPath: [2, 5],
      nextRemaining: [4],
      success: "The garden found a complete combination. One path can now be recorded as an answer.",
      failure: "A sibling branch may look attractive, but this path already has a direct completion.",
    },
    {
      title: "Undo before the sibling",
      instruction: "The completed branch is recorded. Predict the move that restores the shared path before exploring 4.",
      target: 7,
      path: [2, 5],
      remaining: [4],
      predictionOptions: [{ label: "Keep 5 and add 4", value: "keep" }, { label: "Unchoose 5", value: "undo" }, { label: "Restart from the root", value: "restart" }],
      predictionCorrect: "undo",
      actionOptions: [{ label: "Uproot 5", value: "undo" }, { label: "Plant 4 beside 5", value: "keep" }, { label: "Clear every plant", value: "restart" }],
      actionCorrect: "undo",
      nextPath: [2],
      nextRemaining: [5, 4],
      success: "Unchoose restores the exact shared path. The next sibling can reuse it without contamination.",
      failure: "Without undo, one branch's choices leak into the next branch and the tree no longer means what it says.",
    },
    {
      title: "Prune what cannot recover",
      instruction: "With 2 selected, the next candidate is 4. Predict whether the branch can still reach 7.",
      target: 7,
      path: [2],
      remaining: [4],
      predictionOptions: [{ label: "Choose 4: the branch reaches 6", value: "choose" }, { label: "Prune: 6 cannot become 7", value: "prune" }, { label: "Choose 5 again", value: "repeat" }],
      predictionCorrect: "prune",
      actionOptions: [{ label: "Cut the 2 + 4 branch", value: "prune" }, { label: "Plant 4 anyway", value: "choose" }, { label: "Replant 5 without undoing", value: "repeat" }],
      actionCorrect: "prune",
      nextPath: [2],
      nextRemaining: [],
      success: "The cut is justified by a proof: even the best remaining completion is still below 7.",
      failure: "Pruning is not a speed hunch. It is legal only when the branch cannot recover.",
    },
  ] satisfies GardenRound[],
}
