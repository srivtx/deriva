export type StateRound = {
  title: string
  instruction: string
  table: string[]
  focus: string
  predictionOptions: { label: string; value: string }[]
  predictionCorrect: string
  actionOptions: { label: string; value: string }[]
  actionCorrect: string
  result: string
  success: string
  failure: string
}

export const STATE_FORGE = {
  id: "state-forge",
  title: "State Forge",
  rounds: [
    {
      title: "Pass the amnesia test",
      instruction: "If the solver forgets the past at i = 4, predict the smallest state that keeps the answer recoverable.",
      table: ["0", "1", "1", "2", "?"],
      focus: "dp[4]",
      predictionOptions: [{ label: "Remember the entire call history", value: "history" }, { label: "Remember dp[3] and dp[2]", value: "pair" }, { label: "Remember only the final answer", value: "final" }],
      predictionCorrect: "pair",
      actionOptions: [{ label: "Forge dp[4] = dp[3] + dp[2] = 3", value: "fill" }, { label: "Forge dp[4] = 4 from the index", value: "index" }, { label: "Erase dp[2] to save space", value: "erase" }],
      actionCorrect: "fill",
      result: "3",
      success: "Only the two values that change the future survive the amnesia test.",
      failure: "The state is too large if it remembers history, and too small if it forgets a needed dependency.",
    },
    {
      title: "Reuse the overlap",
      instruction: "Two branches ask for the same subproblem. Predict what the memory table should do before recomputing it.",
      table: ["fib(5)", "fib(4)", "fib(3)", "fib(3) ↺", "?"],
      focus: "fib(3)",
      predictionOptions: [{ label: "Compute fib(3) again", value: "again" }, { label: "Read the cached fib(3)", value: "reuse" }, { label: "Forget the first branch", value: "forget" }],
      predictionCorrect: "reuse",
      actionOptions: [{ label: "Read cache[fib(3)] = 2", value: "read" }, { label: "Open another recursive branch", value: "branch" }, { label: "Delete cache[fib(3)]", value: "delete" }],
      actionCorrect: "read",
      result: "2",
      success: "The call tree becomes a table when identical states share one stored answer.",
      failure: "Repeated state is evidence of overlap. Recomputing it throws away the compression the table can provide.",
    },
    {
      title: "Follow dependencies",
      instruction: "A grid cell can only be forged after its north and west neighbors. Predict the legal fill order.",
      table: ["1", "1", "1", "1", "?", "3"],
      focus: "grid[1][1]",
      predictionOptions: [{ label: "Fill from the dependencies outward", value: "deps" }, { label: "Fill the goal first", value: "goal" }, { label: "Fill cells randomly", value: "random" }],
      predictionCorrect: "deps",
      actionOptions: [{ label: "Forge ? = north 1 + west 1 = 2", value: "fill" }, { label: "Forge ? = 1 because every cell is one", value: "one" }, { label: "Forge ? before its neighbors", value: "early" }],
      actionCorrect: "fill",
      result: "2",
      success: "A table is a dependency graph made visible: every cell waits for the answers it uses.",
      failure: "Tabulation is not a drawing exercise. Filling before dependencies exist invents information.",
    },
    {
      title: "Keep the right coordinate",
      instruction: "A capacity problem is at item 3. Predict which state coordinate distinguishes the future subproblem.",
      table: ["i=1, cap=4", "i=2, cap=4", "i=3, cap=4", "i=3, cap=2", "?"],
      focus: "dp[3][2]",
      predictionOptions: [{ label: "Only the item index i", value: "index" }, { label: "Only the original input list", value: "input" }, { label: "The item index and remaining capacity", value: "pair" }],
      predictionCorrect: "pair",
      actionOptions: [{ label: "Forge dp[3][2] from the two capacity choices", value: "fill" }, { label: "Use dp[3][4] for every capacity", value: "same" }, { label: "Restart from item 1", value: "restart" }],
      actionCorrect: "fill",
      result: "best(keep, skip)",
      success: "The state names exactly what changes the future: where we are and what capacity remains.",
      failure: "Leaving out a future-relevant coordinate makes two different subproblems look falsely identical.",
    },
  ] satisfies StateRound[],
}
