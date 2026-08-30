import type { PdbProblem } from "./pdb"

// ── PDB B: stages 3-6 — The Shape Law · The NaN Swamp · The Dtype Trap ·
// Ghosts & Aliases ────────────────────────────────────────────────────────────

export const PROBLEMS_PDB_B: PdbProblem[] = [
  // ══ STAGE 3 — The Shape Law ══
  {
    id: 14, stage: 3, title: "Wrong Axis", pattern: "axis-choice", skill: "say the shape of every reduction", file: "sensors.py", bugCount: 1,
    statement: "sensors.py reports the mean of each COLUMN (one number per feature). The suite gets back the wrong shape AND the wrong numbers — yet numpy raised no error.\n\nRun the tests, then answer before editing: with X of shape (2, 3), what shape does X.mean(axis=1) have? And axis=0?",
    diagram: `        col0  col1  col2
   row0 [ 1.,  2.,  3. ]     axis=0 ↓ collapses rows
   row1 [ 4.,  5.,  6. ]     → one mean per COLUMN: [2.5, 3.5, 4.5]
                             axis=1 → collapses columns: per row`,
    examples: [
      { input: "column_means([[1, 2, 3], [4, 5, 6]])", output: "[2.5, 3.5, 4.5]", explain: "one mean per column" },
      { input: "shape of the result", output: "(3,)", explain: "one number per feature, not per row" },
    ],
    why: "axis=0 walks DOWN the rows (collapsing them), axis=1 walks ACROSS the columns. Silent axis bugs are the most common NumPy failure in the wild precisely because broadcasting papers over them: no crash, just confident nonsense. Saying the expected shape aloud — before running — is the cheapest test there is.",
    starterCode: "import numpy as np\n\ndef column_means(X):\n    \"\"\"Mean of each column: one number per feature.\"\"\"\n    return X.mean(axis=1)\n",
    hints: [
      "X has shape (2, 3). What is X.mean(axis=1).shape? Is that 'one number per feature'?",
      "axis=1 collapses each ROW into one number — that is a per-row mean here.",
      "Collapsing rows (axis=0) leaves one mean per column: shape (3,).",
    ],
    solution: "import numpy as np\n\ndef column_means(X):\n    \"\"\"Mean of each column: one number per feature.\"\"\"\n    return X.mean(axis=0)\n",
    walkthrough: "The suite wanted shape (3,) and got (2,) — the shape check alone convicts axis=1, which collapses each row. axis=0 collapses rows together and leaves one mean per column: (1+4)/2 = 2.5, exactly the expected first value. No error ever fired because both reductions are perfectly legal NumPy; the contract, not the interpreter, decides which axis is true.",
    testCode: "X = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])\ncheck_call('result has one value per column', lambda: tuple(np.shape(column_means(X))), (3,))\ncheck_call('column means are correct', lambda: list(np.round(column_means(X), 6)), [2.5, 3.5, 4.5])\ncheck_call('works on a single row', lambda: list(np.round(column_means(np.array([[7.0, 8.0, 9.0]])), 6)), [7.0, 8.0, 9.0])\nfinish()",
    entry: "column_means(np.array([[1., 2., 3.], [4., 5., 6.]]))",
    pdbLoad: ["args", "p X.shape", "p X.mean(axis=0).shape", "p X.mean(axis=1).shape", "c"],
  },
  {
    id: 15, stage: 3, title: "Center of Gravity", pattern: "keepdims-broadcast", skill: "control what broadcasts where", file: "center.py", bugCount: 1,
    statement: "center.py must subtract each ROW's own mean from that row, so every row ends with mean 0. The result looks plausible but the rows refuse to centre.\n\nThe subtraction broadcasts a per-COLUMN mean across rows. Decide what shape the row-means need (keepdims exists for exactly this), then fix the axis.",
    diagram: `   X = [[1, 2, 3],        row means: 2 and 5  → shape (2, 1) with keepdims
        [4, 5, 6]]        subtract per row:   [[-1, 0, 1],
                                            [-1, 0, 1]]
   axis=0 means (shape (3,)) would slide DOWN the columns — wrong here`,
    examples: [
      { input: "center_rows([[1, 2, 3], [4, 5, 6]])", output: "[[-1, 0, 1], [-1, 0, 1]]", explain: "each row loses its own mean" },
      { input: "row means afterwards", output: "[0, 0]", explain: "the whole point" },
    ],
    why: "To subtract per-row statistics you need them shaped (n, 1), so the single column stretches across the row's width. mean(axis=1) alone returns (n,), which broadcasts DOWN the columns — a completely different operation. keepdims=True is the honest way to say 'I want a column of row-means'.",
    starterCode: "import numpy as np\n\ndef center_rows(X):\n    \"\"\"Subtract each row's own mean from that row.\"\"\"\n    return X - X.mean(axis=0)\n",
    hints: [
      "Which axis's mean belongs to a ROW of X? Check the shapes in the debugger: p X.mean(axis=0).shape vs axis=1.",
      "A (n,) result broadcasts across (n, m) row by row — that centres COLUMNS here. Which extra dimension stops that?",
      "X.mean(axis=1, keepdims=True) has shape (2, 1) — one mean per row, ready to stretch across the row.",
    ],
    solution: "import numpy as np\n\ndef center_rows(X):\n    \"\"\"Subtract each row's own mean from that row.\"\"\"\n    return X - X.mean(axis=1, keepdims=True)\n",
    walkthrough: "X.mean(axis=0) has shape (3,) — column means — and (3,) minus-spread over (2, 3) shifts every column by its own mean, leaving row means at [−1.5, 1.5] instead of [0, 0]. The debugger shows both shapes; the fix is axis=1 with keepdims=True so the (2, 1) result stretches along each row. One keyword converts 'legal broadcasting' into 'intended broadcasting'.",
    testCode: "X = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])\ncheck_call('every row ends with mean 0', lambda: list(np.round(center_rows(X).mean(axis=1), 9)), [0.0, 0.0])\ncheck_call('first row centered correctly', lambda: list(np.round(center_rows(X)[0], 6)), [-1.0, 0.0, 1.0])\ncheck_call('shape is preserved', lambda: center_rows(X).shape, (2, 3))\ncheck_call('single-row input still centres', lambda: bool(np.allclose(center_rows(np.array([[3.0, 6.0, 9.0]])), [[-3.0, 0.0, 3.0]])), True)\nfinish()",
    entry: "center_rows(np.array([[1., 2., 3.], [4., 5., 6.]]))",
    pdbLoad: ["args", "p X.shape", "p X.mean(axis=0).shape", "p X.mean(axis=1).shape", "p X.mean(axis=1, keepdims=True).shape", "c"],
  },
  {
    id: 16, stage: 3, title: "Flatten Order", pattern: "reshape-order", skill: "reshape regroups, never reorders", file: "grid.py", bugCount: 1,
    statement: "grid.py flattens a 2×3 sensor grid into a 6-vector, row by row: [[1,2,3],[4,5,6]] → [1,2,3,4,5,6]. The function returns the right SIZE in the wrong ORDER.\n\nSomeone transposed the grid before flattening, misreading the firmware docs ('data arrives column-major' — it does not). Run the tests, print the actual output, and remove the detour.",
    diagram: `   [[1, 2, 3],     row-major order →  1 2 3 4 5 6
    [4, 5, 6]]     .T first →  1 4 2 5 3 6  ✗
                              (transpose reorders; ravel just reads)`,
    examples: [
      { input: "grid_to_vector([[1, 2, 3], [4, 5, 6]])", output: "[1, 2, 3, 4, 5, 6]", explain: "row 0, then row 1" },
      { input: "last element", output: "6", explain: "the grid's bottom-right cell" },
    ],
    why: "reshape regroups the same values in row-major order — it never reorders. transpose is the operation that DOES reorder: chaining .T before a flatten reads the data column by column. When output values are a rearrangement of the input, suspect a transpose (not a reshape) sitting between you and the answer, and print the array at each step.",
    starterCode: "import numpy as np\n\ndef grid_to_vector(grid):\n    \"\"\"Flatten the 2x3 grid into a 6-vector, row by row.\n\n    (The firmware docs said column-major. They were wrong.)\n    \"\"\"\n    return np.asarray(grid).T.ravel()\n",
    hints: [
      "Print the output for [[1,2,3],[4,5,6]]. Which sequence do you see — and what does .T do to a (2, 3) grid?",
      "reshape never reorders, but transpose does: grid.T stacks the columns. Was any transposing actually needed?",
      "The data arrives row-major. Flatten the grid directly: np.asarray(grid).ravel().",
    ],
    solution: "import numpy as np\n\ndef grid_to_vector(grid):\n    \"\"\"Flatten the 2x3 grid into a 6-vector, row by row.\"\"\"\n    return np.asarray(grid).ravel()\n",
    walkthrough: "The output [1, 4, 2, 5, 3, 6] reads the grid DOWN the columns — the fingerprint of a transpose before the flatten. The debugger shows it plainly: `p np.asarray(grid).T` is [[1,4],[2,5],[3,6]], and ravel just reads that off. The firmware comment was a misdiagnosis someone enshrined in code; row-major data needs no transpose, so grid.ravel() walks memory in the right order. Remember the pair: reshape regroups, transpose reorders.",
    testCode: "g = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])\ncheck_call('flattens row by row', lambda: list(grid_to_vector(g)), [1.0, 2.0, 3.0, 4.0, 5.0, 6.0])\ncheck_call('output is a 6-vector', lambda: tuple(np.shape(grid_to_vector(g))), (6,))\ncheck_call('last element is bottom-right', lambda: grid_to_vector(g)[-1], 6.0)\ncheck_call('first row comes first', lambda: list(grid_to_vector(g)[:3]), [1.0, 2.0, 3.0])\nfinish()",
    entry: "grid_to_vector(np.array([[1., 2., 3.], [4., 5., 6.]]))",
    pdbLoad: ["args", "p grid", "p np.asarray(grid).T", "p np.asarray(grid).ravel()", "c"],
  },
  {
    id: 17, stage: 3, title: "Stack, Don't Zip", pattern: "column-stack", skill: "build (n, 2) from two (n,) columns", file: "features.py", bugCount: 1,
    statement: "features.py must build the design matrix: n rows, 2 columns — column 0 is age, column 1 is income. The suite gets a matrix with the axes swapped.\n\nnp.array([age, income]) stacks as new ROWS. Which stacking call makes them COLUMNS?",
    diagram: `   age = [21, 34, 45]   income = [1200, 2400, 3100]

   np.array([age, income])   → shape (2, 3)   ✗ two rows
   np.column_stack([...])    → shape (3, 2)   ✓ row per sample`,
    examples: [
      { input: "design_matrix([21, 34], [1200, 2400])", output: "shape (2, 2)", explain: "one row per sample" },
      { input: "X[:, 0]", output: "[21, 34]", explain: "column 0 is age" },
    ],
    why: "np.array([a, b]) interprets the list as two rows of a new matrix; np.column_stack lays the vectors side by side as columns. Both are legal, only one matches the (n_samples, n_features) convention every downstream model assumes. Shape assertions catch this instantly — which is why the suite checks shape before values.",
    starterCode: "import numpy as np\n\ndef design_matrix(age, income):\n    \"\"\"n x 2 matrix: column 0 = age, column 1 = income.\"\"\"\n    return np.array([age, income])\n",
    hints: [
      "For the three-sample case the suite expects shape (3, 2). What shape does np.array([age, income]) give instead?",
      "A (2, n) matrix means the samples went in as ROWS. Which numpy call stacks vectors as columns?",
      "np.column_stack([age, income]) — or np.stack([age, income], axis=1).",
    ],
    solution: "import numpy as np\n\ndef design_matrix(age, income):\n    \"\"\"n x 2 matrix: column 0 = age, column 1 = income.\"\"\"\n    return np.column_stack([age, income])\n",
    walkthrough: "np.array([age, income]) builds a (2, n) matrix — samples became rows, features became samples. The moment n ≠ 2 the shape test fails loudly; at n = 2 it would silently pass with columns and rows swapped, which the value tests then catch on X[:, 0]. column_stack pairs element i of age with element i of income in row i: the (n, 2) dataset every model expects.",
    testCode: "X = design_matrix([21.0, 34.0, 45.0], [1200.0, 2400.0, 3100.0])\ncheck_call('shape is (3, 2)', lambda: X.shape, (3, 2))\ncheck_call('column 0 is age', lambda: list(X[:, 0]), [21.0, 34.0, 45.0])\ncheck_call('column 1 is income', lambda: list(X[:, 1]), [1200.0, 2400.0, 3100.0])\ncheck_call('row 0 pairs age 21 with 1200', lambda: list(X[0]), [21.0, 1200.0])\nfinish()",
    entry: "design_matrix(np.array([21., 34.]), np.array([1200., 2400.]))",
    pdbLoad: ["args", "p np.array([age, income]).shape", "p np.column_stack([age, income]).shape", "c"],
  },

  // ══ STAGE 4 — The NaN Swamp ══
  {
    id: 18, stage: 4, title: "Zero Times Infinity", pattern: "nan-entropy", skill: "never evaluate p·log(p) at p = 0", file: "entropy.py", bugCount: 1,
    statement: "entropy.py measures label entropy in bits. Uniform label sets come back nan instead of 0 — the test suite is very clear about that.\n\nThe culprit is arithmetic, not logic: for a class with probability 0, the term p·log2(p) is 0 · (−∞). Convince yourself in the debugger, then skip the terms that don't exist.",
    diagram: `   labels [1, 1, 1] → probs [0., 1.]
   p * log2(p) → [0 * -inf, 1 * 0] = [nan, 0]   ← 0 · ∞ is undefined
   sum → nan ✗     the p=0 term contributes 0 BY DEFINITION`,
    examples: [
      { input: "entropy([1, 1, 1])", output: "0.0", explain: "no uncertainty at all" },
      { input: "entropy([0, 1, 0, 1])", output: "1.0", explain: "a fair coin is one bit" },
    ],
    why: "0 · log2(0) is the canonical NaN trap: numpy computes log2(0) = −inf, then 0 · −inf = nan, and one poisoned term drags the whole sum to nan. Mathematically the p=0 class contributes 0 — the fix is to evaluate only the terms with p > 0. This exact bug is a rite of passage.",
    starterCode: "import numpy as np\n\ndef entropy(labels):\n    \"\"\"Entropy of a label vector, in bits.\"\"\"\n    counts = np.bincount(labels)\n    probs = counts / len(labels)\n    return float(-np.sum(probs * np.log2(probs)))\n",
    hints: [
      "In the debugger: p probs, then p probs * np.log2(probs). Which entry is nan, and what probability produced it?",
      "What is the DEFINITION of the p = 0 class's contribution to entropy?",
      "Filter first, sum second: probs[probs > 0] keeps only the terms that exist.",
    ],
    solution: "import numpy as np\n\ndef entropy(labels):\n    \"\"\"Entropy of a label vector, in bits.\"\"\"\n    counts = np.bincount(labels)\n    probs = counts / len(labels)\n    probs = probs[probs > 0]\n    return float(-np.sum(probs * np.log2(probs)))\n",
    walkthrough: "The debugger session: `p probs` → [0., 1.]; `p probs * np.log2(probs)` → [nan, 0.]. log2(0) is −inf, and 0 · −inf is nan — one missing class poisons the entire sum. The mathematics already told us that class contributes exactly 0, so drop it before the product: probs[probs > 0]. Every uniform case turns green; the mixed cases were green before because none of their probabilities were 0.",
    testCode: "check_call('entropy([1, 1, 1]) is 0', lambda: entropy(np.array([1, 1, 1])), 0.0)\ncheck_call('entropy([2, 2, 2, 2]) is 0', lambda: entropy(np.array([2, 2, 2, 2])), 0.0)\ncheck_call('entropy([0, 1, 0, 1]) is 1 bit', lambda: entropy(np.array([0, 1, 0, 1])), 1.0)\ncheck_call('entropy([0, 1, 2]) is log2(3)', lambda: round(entropy(np.array([0, 1, 2])), 6), round(1.584962500721156, 6))\ncheck_call('entropy([0, 0, 0, 1])', lambda: round(entropy(np.array([0, 0, 0, 1])), 6), round(0.8112781244591328, 6))\nfinish()",
    entry: "entropy(np.array([1, 1, 1]))",
    pdbLoad: ["n", "p counts", "n", "p probs", "p probs * np.log2(probs)", "c"],
  },
  {
    id: 19, stage: 4, title: "NaN Is Not Equal", pattern: "isnan-vs-eq", skill: "NaN equals nothing, not even itself", file: "quality.py", bugCount: 1,
    statement: "quality.py counts missing sensor readings, where missing means NaN. The counter reports zero missing while the data visibly contains holes.\n\nThe comparison itself is the bug: NaN == anything is False, including NaN == NaN. Verify in the debugger, then count the honest way.",
    examples: [
      { input: "count_missing([1.0, nan, 3.0])", output: "1", explain: "exactly one hole" },
      { input: "count_missing([nan, nan])", output: "2", explain: "every NaN counts" },
    ],
    why: "IEEE 754 defines NaN != NaN so that silent data corruption is detectable — which also means equality checks can never find NaN. np.isnan (or math.isnan) is the only correct test. 'Why is my missing-data counter finding nothing?' is one of the most common data-pipeline bugs in existence.",
    starterCode: "import numpy as np\n\ndef count_missing(readings):\n    \"\"\"How many readings are NaN?\"\"\"\n    return int(sum(r == np.nan for r in readings))\n",
    hints: [
      "In the debugger: p np.nan == np.nan. Now read the loop again.",
      "r == np.nan is False for every value, every time. Which numpy function tests for NaN directly?",
      "Replace the equality with np.isnan(r).",
    ],
    solution: "import numpy as np\n\ndef count_missing(readings):\n    \"\"\"How many readings are NaN?\"\"\"\n    return int(sum(np.isnan(r) for r in readings))\n",
    walkthrough: "`p np.nan == np.nan` in the debugger prints False — the comparison can never fire, so the sum is 0 forever. np.isnan is the designated test. Note the discipline: we didn't 'fix the loop', we replaced a semantic error (equality with a NaN) with the predicate the domain actually defines. Any pipeline that filters NaN with == has a hole exactly the size of its missing data.",
    testCode: "check_call('finds the hole between valid readings', lambda: count_missing([1.0, float(\"nan\"), 3.0]), 1)\ncheck_call('two NaNs count twice', lambda: count_missing([float(\"nan\"), float(\"nan\")]), 2)\ncheck_call('clean data has zero missing', lambda: count_missing([1.0, 2.0, 3.0]), 0)\ncheck_call('empty input has zero missing', lambda: count_missing([]), 0)\nfinish()",
    entry: "count_missing(np.array([1.0, np.nan, 3.0]))",
    pdbLoad: ["args", "p np.nan == np.nan", "p 1.0 == np.nan", "p np.isnan(np.nan)", "c"],
  },
  {
    id: 20, stage: 4, title: "The Poisoned Mean", pattern: "nan-aware-reduction", skill: "one NaN ruins every raw reduction", file: "uptime.py", bugCount: 1,
    statement: "uptime.py averages daily readings where failed sensors report NaN. Every day with a single failed sensor reports nan — the working 20 sensors vanish with it.\n\nThe spec: average the valid readings; if there are none, the honest answer is nan. The fix is one mask. Build it, don't guess it.",
    examples: [
      { input: "daily_average([10, 20, nan])", output: "15.0", explain: "the hole is skipped, not spread" },
      { input: "daily_average([nan, nan])", output: "nan", explain: "no valid data — say so" },
    ],
    why: "Any raw reduction over an array containing NaN returns NaN: the poison propagates through sum, mean, max, everything. The nan-aware family (nanmean, nanmax) exists for this — but knowing how to build the mask yourself (~np.isnan) is what lets you handle the cases the family doesn't cover, like 'average or None'.",
    starterCode: "import numpy as np\n\ndef daily_average(readings):\n    \"\"\"Mean of the valid readings; nan when none are valid.\"\"\"\n    readings = np.asarray(readings, dtype=float)\n    return float(np.mean(readings))\n",
    hints: [
      "What does np.mean([10, 20, nan]) return, and why?",
      "Build the valid mask with ~np.isnan(readings), then index: readings[mask].",
      "Guard the empty case: if no valid readings remain, return float('nan') per the spec.",
    ],
    solution: "import numpy as np\n\ndef daily_average(readings):\n    \"\"\"Mean of the valid readings; nan when none are valid.\"\"\"\n    readings = np.asarray(readings, dtype=float)\n    valid = readings[~np.isnan(readings)]\n    if len(valid) == 0:\n        return float(\"nan\")\n    return float(valid.mean())\n",
    walkthrough: "np.mean over [10, 20, nan] adds the poison into every partial sum, so one hole averages the whole day into nan. The fix builds the valid mask with ~np.isnan (note the ~: the mask keeps non-NaN), indexes the array with it, and averages survivors — with an explicit nan when nothing survives, as the contract demands. np.nanmean would pass most tests but cannot express the 'no data at all' case cleanly; owning the mask does.",
    testCode: "check_call('skips the single hole', lambda: daily_average([10.0, 20.0, float(\"nan\")]), 15.0)\ncheck_call('all-valid day is unchanged', lambda: daily_average([4.0, 8.0]), 6.0)\ncheck('no valid data stays nan', np.isnan(daily_average([float(\"nan\"), float(\"nan\")])), 'the honest answer for no data is nan')\ncheck_call('holes on both ends still average', lambda: daily_average([float(\"nan\"), 4.0, 8.0, float(\"nan\")]), 6.0)\nfinish()",
    entry: "daily_average(np.array([10.0, 20.0, np.nan]))",
    pdbLoad: ["args", "p readings", "p np.isnan(readings)", "p ~np.isnan(readings)", "p readings[~np.isnan(readings)]", "c"],
  },
  {
    id: 21, stage: 4, title: "All-NaN Looks Different", pattern: "nan-comparison", skill: "min != max is true when both are nan", file: "features.py", bugCount: 1,
    statement: "features.py screens dataset columns for usability: a column is usable if its non-NaN values actually vary. The screener keeps a completely dead (all-NaN) column and drops a merely constant one is not the issue — the dead column slipping through is.\n\nRun the tests. The dead column survives because nanmin and nanmax both return nan, and nan != nan is True. Add the missing condition.",
    examples: [
      { input: "usable_features([[nan, 3, 4], [nan, 3, 5]])", output: "[2]", explain: "column 0 is dead; 1 is constant; 2 varies" },
      { input: "usable_features([[1, 5], [2, 4]])", output: "[0, 1]", explain: "both vary" },
    ],
    why: "This is a two-bug-in-one classic: nanmin/nanmax of an all-NaN column are both nan, and nan != nan evaluates True — so the 'varies' test passes for the least variable column possible. Correct NaN handling means asking BOTH questions: does it have data, and does that data vary.",
    starterCode: "import numpy as np\n\ndef usable_features(X):\n    \"\"\"Indices of columns whose values actually vary.\"\"\"\n    lo = np.nanmin(X, axis=0)\n    hi = np.nanmax(X, axis=0)\n    return np.where(lo != hi)[0]\n",
    hints: [
      "In the debugger: p lo, hi for a matrix with a dead column. What are lo[0] and hi[0], and is lo[0] != hi[0] True or False?",
      "A column with no data cannot vary — it must be excluded regardless of the min/max comparison.",
      "has_data = ~np.isnan(X).all(axis=0); keep columns where has_data AND (lo != hi).",
    ],
    solution: "import numpy as np\n\ndef usable_features(X):\n    \"\"\"Indices of columns whose values actually vary.\"\"\"\n    lo = np.nanmin(X, axis=0)\n    hi = np.nanmax(X, axis=0)\n    has_data = ~np.isnan(X).all(axis=0)\n    return np.where(has_data & (lo != hi))[0]\n",
    walkthrough: "For the dead column, nanmin and nanmax both return nan — and the debugger shows `lo[0] != hi[0]` is True, because nan != nan. The 'varies' test inverted itself for the least varying column imaginable. The repair adds the missing precondition: has_data = ~np.isnan(X).all(axis=0) asks 'does any non-NaN value exist at all', and the final mask ANDs it with the variation test. Downstream, this exact oversight is what makes rng.uniform(nan, nan) explode — kill it at the source.",
    testCode: "X = np.array([[np.nan, 3.0, 4.0], [np.nan, 3.0, 5.0]])\ncheck_call('dead column is excluded', lambda: list(usable_features(X)), [2])\ncheck_call('varying columns survive', lambda: list(usable_features(np.array([[1.0, 5.0], [2.0, 4.0]]))), [0, 1])\ncheck_call('constant column is excluded', lambda: list(usable_features(np.array([[1.0, 7.0], [1.0, 7.0]]))), [1])\ncheck_call('partially-NaN column with spread survives', lambda: list(usable_features(np.array([[1.0, 2.0], [3.0, float(\"nan\")]]))), [0])\nfinish()",
    entry: "usable_features(np.array([[np.nan, 3., 4.], [np.nan, 3., 5.]]))",
    pdbLoad: ["args", "p X", "n", "n", "p lo", "p hi", "p lo != hi", "c"],
  },

  // ══ STAGE 5 — The Dtype Trap ══
  {
    id: 22, stage: 5, title: "The Vanishing Dtype", pattern: "dtype-preservation", skill: "numpy scalars can silently become Python floats", file: "threshold.py", bugCount: 1,
    statement: "threshold.py picks a random split point strictly between a feature's min and max. The contract: the returned value must carry the DATA's dtype (float16 stays float16, float32 stays float32).\n\nThe values come back right but the type is wrong — rng.uniform returns a plain Python float. The suite checks isinstance. Fix the return without changing the value.",
    examples: [
      { input: "random_threshold(float16 values)", output: "np.float16 in (min, max)", explain: "value AND type preserved" },
      { input: "random_threshold(float32 values)", output: "np.float32 in (min, max)", explain: "the dtype travels with the data" },
    ],
    why: "rng.uniform returns a Python float (float64 in disguise), silently stripping float16/float32 inputs of their type. Downstream code that stores the result back into a typed buffer, or a test that checks isinstance, exposes the demotion. The fix — values.dtype.type(x) — is the idiomatic 'cast back to my own dtype' and appears in real ML code constantly.",
    starterCode: "import numpy as np\n\ndef random_threshold(values, rng):\n    \"\"\"A split strictly between min and max, in the data's own dtype.\"\"\"\n    lo, hi = np.min(values), np.max(values)\n    return rng.uniform(lo, hi)\n",
    hints: [
      "In the debugger: p type(random_threshold(...)) — what does Python say the object is?",
      "The value is fine; the type is not. How do you ask an array for its own dtype as a type object?",
      "values.dtype.type(rng.uniform(lo, hi)) casts the draw back into the data's world.",
    ],
    solution: "import numpy as np\n\ndef random_threshold(values, rng):\n    \"\"\"A split strictly between min and max, in the data's own dtype.\"\"\"\n    lo, hi = np.min(values), np.max(values)\n    return values.dtype.type(rng.uniform(lo, hi))\n",
    walkthrough: "`p type(...)` prints <class 'float'> for every input dtype — numpy scalars from arithmetic on float16 often surface as Python floats, and rng.uniform always does. The suite's isinstance checks convict it: the contract is dtype preservation, so the draw is re-cast through values.dtype.type. Note the subtlety the suite also teaches: np.float64 IS a Python float subclass, so only the small dtypes actually catch this bug — tests are written where the bug is visible.",
    testCode: "rs = np.random.RandomState(0)\nx16 = np.array([0.0, 6e-08], dtype=np.float16)\nt16 = random_threshold(x16, rs)\ncheck('float16 draw keeps float16 type', isinstance(t16, np.float16), f'got {type(t16).__name__}')\nx32 = np.array([0.0, 1e-45], dtype=np.float32)\nt32 = random_threshold(x32, rs)\ncheck('float32 draw keeps float32 type', isinstance(t32, np.float32), f'got {type(t32).__name__}')\nx64 = np.array([2.5, 7.5], dtype=np.float64)\nt64 = random_threshold(x64, rs)\ncheck('draw lands strictly inside the range', bool(2.5 < t64 < 7.5), f'got {t64!r}')\ncheck('float64 draw keeps float64 type', isinstance(random_threshold(x64, rs), np.float64), f'got {type(random_threshold(x64, rs)).__name__}')\nfinish()",
    entry: "random_threshold(np.array([0.0, 6e-08], dtype=np.float16), np.random.RandomState(0))",
    pdbLoad: ["args", "p values.dtype", "n", "p type(lo)", "p type(rng.uniform(lo, hi))", "c"],
  },
  {
    id: 23, stage: 5, title: "The Melting Total", pattern: "dtype-overflow", skill: "small dtypes overflow where float64 shrugs", file: "runtime.py", bugCount: 1,
    statement: "runtime.py totals 400 task durations, each 300 seconds, stored as float16. The profiler reports inf.\n\nNothing is wrong with the arithmetic — it is wrong with the ACCUMULATOR. float16 overflows at ~65504. Compute in a dtype that can hold the answer, and keep the sum honest.",
    examples: [
      { input: "total_runtime(400 × 300.0 as float16)", output: "120000.0", explain: "not inf — 400 × 300 exceeds float16's ceiling" },
      { input: "total_runtime([1.5, 2.5])", output: "4.0", explain: "small sums were never the problem" },
    ],
    why: "float16 maxes out at 65504 and its precision collapses long before that; a running sum silently walks into inf. The rule: accumulate in a wide dtype (float64), even when storage is narrow — np.sum accepts dtype= precisely for this. Any 'suddenly infinite' aggregate deserves a dtype interrogation before any other hypothesis.",
    starterCode: "import numpy as np\n\ndef total_runtime(task_seconds):\n    \"\"\"Total duration of many short tasks (stored as float16).\"\"\"\n    return float(np.sum(task_seconds))\n",
    hints: [
      "What is np.finfo(np.float16).max? What is 400 × 300?",
      "np.sum accumulated in float16 because the INPUT is float16. Which parameter lets the accumulation happen in float64?",
      "np.sum(task_seconds, dtype=np.float64) — storage dtype and accumulator dtype are different decisions.",
    ],
    solution: "import numpy as np\n\ndef total_runtime(task_seconds):\n    \"\"\"Total duration of many short tasks (stored as float16).\"\"\"\n    return float(np.sum(task_seconds, dtype=np.float64))\n",
    walkthrough: "400 tasks at 300 s is 120000 — comfortably past float16's ceiling of 65504, so the float16 accumulator saturates at inf mid-sum. The debugger confirms the input dtype (`p task_seconds.dtype` → float16) and the poisoned output. The fix tells np.sum to accumulate in float64 regardless of storage dtype; the input array is untouched, the answer is exact. Overflow to inf is always an accumulator story — storage and arithmetic are separate choices.",
    testCode: "durations = np.full(400, 300.0, dtype=np.float16)\ncheck_call('big sum is not inf', lambda: float(\"inf\") != total_runtime(durations), True)\ncheck_call('big sum is exact', lambda: total_runtime(durations), 120000.0)\ncheck_call('small sums still work', lambda: total_runtime(np.array([1.5, 2.5], dtype=np.float16)), 4.0)\ncheck_call('input dtype is untouched', lambda: durations.dtype, np.float16)\nfinish()",
    entry: "total_runtime(np.full(400, 300.0, dtype=np.float16))",
    pdbLoad: ["args", "p task_seconds.dtype", "p np.finfo(np.float16).max", "n", "c"],
  },
  {
    id: 24, stage: 5, title: "Truncated Before Judged", pattern: "cast-before-compare", skill: "compare in floats, then format", file: "honors.py", bugCount: 1,
    statement: "honors.py lists students scoring ABOVE 90% (strictly) for the honours board. Students at 90.1% are missing from the list.\n\nThe code converts scores to whole percents BEFORE comparing — 90.1 becomes 90 and misses the cut. Reorder the logic: judge in float, format afterwards.",
    diagram: `   score 0.901 → ×100 → 90.1 → int → 90 → "not > 90"  ✗ missed
   score 0.901 → compare 0.901 > 0.9 → True            ✓ then format`,
    examples: [
      { input: "honors([0.901, 0.9, 0.95])", output: "[0, 2]", explain: "90.1% makes the board; 90.0 does not" },
      { input: "honors([0.5])", output: "[]", explain: "well below the cut" },
    ],
    why: "Casting to int truncates toward zero: 90.1 → 90, 49.99 → 49. Any comparison performed after the cast judges the truncated world, and boundary students vanish. The discipline: make decisions on the data's true precision, and cast only for display or storage — the ordering IS the correctness.",
    starterCode: "import numpy as np\n\ndef honors(scores):\n    \"\"\"Indices of scores strictly above 90%.\"\"\"\n    pct = (np.asarray(scores) * 100).astype(np.int64)\n    return list(np.where(pct > 90)[0])\n",
    hints: [
      "Trace 0.901 through the pipeline: multiply, cast, compare. At which step does it become 90?",
      "The comparison pct > 90 is correct — the number fed to it is not. Which comparison on the raw scores is equivalent and honest?",
      "scores > 0.9 judged on floats finds 90.1%. Cast only at the end, or not at all.",
    ],
    solution: "import numpy as np\n\ndef honors(scores):\n    \"\"\"Indices of scores strictly above 90%.\"\"\"\n    scores = np.asarray(scores, dtype=float)\n    return list(np.where(scores > 0.9)[0])\n",
    walkthrough: "(0.901 × 100).astype(np.int64) is 90 — the evidence needed for the honours list was destroyed one step before the judgement. The suite's boundary test (0.901 → honored) fails exactly there. The repair moves the comparison BEFORE the cast, comparing floats against 0.9 directly; if display needed whole percents, that cast would come after the decision. Truncate-then-judge is a whole family of bugs; this is the canonical specimen.",
    testCode: "check_call('90.1 percent makes the board', lambda: honors([0.901, 0.9, 0.95]), [0, 2])\ncheck_call('exactly 90 is not honored', lambda: honors([0.9, 0.91]), [1])\ncheck_call('mid scores are ignored', lambda: honors([0.5, 0.3]), [])\ncheck_call('works on an empty class', lambda: honors([]), [])\nfinish()",
    entry: "honors(np.array([0.901, 0.9, 0.95]))",
    pdbLoad: ["args", "p scores * 100", "p (scores * 100).astype(np.int64)", "p scores > 0.9", "c"],
  },

  // ══ STAGE 6 — Ghosts & Aliases ══
  {
    id: 25, stage: 6, title: "Same Object, Twice", pattern: "list-aliasing", skill: "[x]*n is one object with n nametags", file: "grid.py", bugCount: 1,
    statement: "grid.py builds a rows×cols grid of zeros where rows must be INDEPENDENT lists. Editing one cell rewrites an entire column of the grid.\n\nRun the tests. Then ask the debugger `g[0] is g[1]` and read the answer out loud before fixing.",
    diagram: `   [[0] * cols] * rows
        └──one list──┘  → rows nametags to the SAME list

   g = make_grid(2, 3);  g[0][0] = 9
   g → [[9, 0, 0],       row 1 changed too
        [9, 0, 0]]       ✗ rows must be independent`,
    examples: [
      { input: "g = make_grid(2, 3); g[0][0] = 9", output: "g[1][0] == 0", explain: "row 1 must not move" },
      { input: "make_grid(3, 2)", output: "[[0, 0], [0, 0], [0, 0]]", explain: "three independent rows" },
    ],
    why: "Multiplying a list repeats REFERENCES, not contents: [[0]*cols]*rows is one inner list behind several nametags. The fix builds a fresh inner list per row with a comprehension. This is the same object-identity bug as [tree] * m in an ensemble — same lesson, different costume.",
    starterCode: "def make_grid(rows, cols):\n    \"\"\"A rows x cols grid of zeros with independent rows.\"\"\"\n    return [[0] * cols] * rows\n",
    hints: [
      "In the debugger: p g[0] is g[1]. Is that consistent with 'independent rows'?",
      "Which part of the expression is evaluated once, and which part does *rows repeat?",
      "A comprehension creates a NEW inner list every lap: [[0] * cols for _ in range(rows)].",
    ],
    solution: "def make_grid(rows, cols):\n    \"\"\"A rows x cols grid of zeros with independent rows.\"\"\"\n    return [[0] * cols for _ in range(rows)]\n",
    walkthrough: "The mutation test convicts it: setting g[0][0] = 9 also sets g[1][0] — and `p g[0] is g[1]` in the debugger prints True. The outer * duplicated a REFERENCE to one inner list; there is exactly one list in memory. The comprehension evaluates [0] * cols fresh on every lap, so each row gets its own object. Identity (is), not equality (==), is the test that sees this bug.",
    testCode: "g = make_grid(2, 3)\ng[0][0] = 9\ncheck_call('editing row 0 leaves row 1 alone', lambda: g[1][0], 0)\ncheck_call('grid has the right shape', lambda: (len(g), len(g[0])), (2, 3))\ncheck_call('rows are distinct objects', lambda: g[0] is g[1], False)\nh = make_grid(3, 2)\nh[2][1] = 5\ncheck_call('last row is independent too', lambda: (h[0][1], h[1][1]), (0, 0))\nfinish()",
    entry: "make_grid(2, 3)",
    pdbLoad: ["p rows, cols", "p ([[0] * cols] * rows)[0] is ([[0] * cols] * rows)[1]", "c"],
  },
  {
    id: 26, stage: 6, title: "The Input Ate Itself", pattern: "in-place-mutation", skill: "-= mutates the caller's array", file: "scale.py", bugCount: 1,
    statement: "scale.py standardizes columns to mean 0 and std 1. The returned matrix is correct — but the caller's ORIGINAL data has been silently rewritten to the standardized version.\n\nThe spec promises the input is untouched. The function uses in-place operators on the array it was handed. Fix it out-of-place.",
    examples: [
      { input: "X before and after standardize(X)", output: "identical", explain: "the input must survive the call" },
      { input: "standardize([[1, 2], [3, 4]])", output: "[[-1, -1], [1, 1]]", explain: "columns to mean 0, std 1" },
    ],
    why: "`x -= y` and `x /= y` mutate x in place; if x is the caller's array (asarray returns the same object for matching dtypes), the caller's data changes under them. The out-of-place equivalents (x = x - y) build new arrays. Distinguishing in-place from rebinding is a core Python/NumPy competency — and a favourite assessment bug.",
    starterCode: "import numpy as np\n\ndef standardize(X):\n    \"\"\"Columns to mean 0, std 1. Returns a new array; input untouched.\"\"\"\n    X = np.asarray(X, dtype=float)\n    X -= X.mean(axis=0)\n    X /= X.std(axis=0)\n    return X\n",
    hints: [
      "The suite snapshots X before the call and compares after. What does it find?",
      "In the debugger: p id(X) before and after the -=. Same object? Whose object is it?",
      "Rebind, don't mutate: X = (X - X.mean(axis=0)) / X.std(axis=0).",
    ],
    solution: "import numpy as np\n\ndef standardize(X):\n    \"\"\"Columns to mean 0, std 1. Returns a new array; input untouched.\"\"\"\n    X = np.asarray(X, dtype=float)\n    return (X - X.mean(axis=0)) / X.std(axis=0)\n",
    walkthrough: "asarray on a float64 input returns the SAME object, so `X -= mean` subtracted in place from the caller's data — the snapshot comparison in the suite catches the evidence trail. The debugger's `p X is original` (True) and the arithmetic both point at the in-place operators. The out-of-place pipeline builds a fresh array at each step: the caller's data survives, the return value is unchanged, and the spec's promise holds.",
    testCode: "X = np.array([[1.0, 2.0], [3.0, 4.0]])\nX_before = X.copy()\nout = standardize(X)\ncheck_call('columns end at mean 0, std 1', lambda: list(np.round(out.mean(axis=0), 9)), [0.0, 0.0])\ncheck_call('input is untouched', lambda: bool(np.array_equal(X, X_before)), True)\ncheck_call('standardized values are correct', lambda: list(np.round(out.ravel(), 6)), [-1.0, -1.0, 1.0, 1.0])\nfinish()",
    entry: "standardize(np.array([[1., 2.], [3., 4.]]))",
    pdbLoad: ["args", "p id(X)", "n", "p id(X)", "n", "p X", "c"],
  },
  {
    id: 27, stage: 6, title: "The Cache That Lies", pattern: "cache-returns-reference", skill: "hand out copies, keep the master", file: "rates.py", bugCount: 1,
    statement: "rates.py caches FX rate lists per region. The contract: callers may treat the returned list as their own — mutating it must never corrupt the cache. Today, one caller's append poisons every later call.\n\nThe cache stores the master list and returns IT. Decide what should be handed out instead, and fix one return.",
    examples: [
      { input: "rates = get_rates('usd'); rates.append(99)", output: "get_rates('usd') unchanged", explain: "the cache must not see the mutation" },
      { input: "get_rates('usd') twice", output: "equal values, different objects", explain: "fresh copy each call" },
    ],
    why: "A cache that returns its internal object hands every caller the same mutable state — the first mutation anywhere corrupts the 'immutable past'. The fix costs one copy: return list(cached) (or cached.copy()). Object-identity thinking — who else holds this reference? — is what finds it; equality checks cannot.",
    starterCode: "_cache = {}\n\ndef get_rates(region):\n    \"\"\"Rate list for a region; callers own their copy.\"\"\"\n    if region not in _cache:\n        _cache[region] = [1.0, 0.9, 1.1]\n    return _cache[region]\n",
    hints: [
      "The suite mutates a returned list, calls again, and compares. What leaks between the calls?",
      "In the debugger: p a is b for two calls with no mutation. Is handing out the same object compatible with the contract?",
      "The cache should keep the master; return list(_cache[region]) — a fresh copy per call.",
    ],
    solution: "_cache = {}\n\ndef get_rates(region):\n    \"\"\"Rate list for a region; callers own their copy.\"\"\"\n    if region not in _cache:\n        _cache[region] = [1.0, 0.9, 1.1]\n    return list(_cache[region])\n",
    walkthrough: "Caller A appends 99.0; caller B's 'fresh' rates now contain it — because A appended to the master list the cache is built on. `p a is b` (True) confirms one shared object behind two names. The contract says callers own their copy, so the return becomes list(_cache[region]): the cache keeps its master, every caller gets a disposable copy, and the equality tests stay green while the identity test finally passes. Mutability at a boundary is a copy problem, always.",
    testCode: "first = get_rates(\"usd\")\nfirst.append(99.0)\ncheck_call('mutation does not poison the cache', lambda: get_rates(\"usd\"), [1.0, 0.9, 1.1])\ncheck_call('two calls are not the same object', lambda: get_rates(\"usd\") is get_rates(\"usd\"), False)\ncheck_call('values are still correct', lambda: get_rates(\"eur\"), [1.0, 0.9, 1.1])\nfinish()",
    entry: "get_rates('usd')",
    pdbLoad: ["args", "p region", "n", "p _cache.get(region)", "n", "p _cache[region]", "c"],
  },
  {
    id: 28, stage: 6, title: "One RNG, Two Thieves", pattern: "shared-random-state", skill: "a shared RandomState makes determinism order-dependent", file: "sim.py", bugCount: 1,
    statement: "sim.py bootstraps a mean from a sample. The contract: same seed, same answer, every call, in any order. Today the first call and the second call disagree — same function, same data.\n\nOne module-level RandomState is being consumed by every call. Give each call its own deterministic stream.",
    examples: [
      { input: "bootstrap_mean(xs); bootstrap_mean(xs)", output: "equal", explain: "same seed, same resample" },
      { input: "bootstrap_mean(xs, seed=0) vs seed=1", output: "usually different", explain: "different streams, by design" },
    ],
    why: "A RandomState is a stream: every draw advances it. Sharing one stream between calls makes results depend on call ORDER — determinism in name only. The fix is the same pattern production code uses: take a seed, construct a fresh RandomState inside the call. This exact bug class (shared/consumed RNG state) is on the assessment's topic list.",
    starterCode: "import numpy as np\n\n_rng = np.random.RandomState(7)\n\ndef bootstrap_mean(xs, seed=7):\n    \"\"\"Mean of a resample of xs — deterministic for a given seed.\"\"\"\n    idx = _rng.randint(0, len(xs), len(xs))\n    return float(np.mean(np.asarray(xs)[idx]))\n",
    hints: [
      "Call the function twice on the same data in the suite. Why do the two answers differ?",
      "In the debugger: p _rng after a draw. Did its state move? Who else shares that state?",
      "Inside the call, build the stream you own: rng = np.random.RandomState(seed), then draw from it.",
    ],
    solution: "import numpy as np\n\ndef bootstrap_mean(xs, seed=7):\n    \"\"\"Mean of a resample of xs — deterministic for a given seed.\"\"\"\n    rng = np.random.RandomState(seed)\n    idx = rng.randint(0, len(xs), len(xs))\n    return float(np.mean(np.asarray(xs)[idx]))\n",
    walkthrough: "The suite calls bootstrap_mean twice on identical data and gets two different answers: the module-level _rng advanced between draws, so 'deterministic' only held for a call sequence nobody agreed to. The debugger can watch it — `p _rng` after each draw shows the state marching. The fix constructs a fresh RandomState(seed) inside the call: the stream now starts at the same place every time, the two calls agree, and different seeds still produce different resamples by design.",
    testCode: "xs = [3.0, 5.0, 8.0, 13.0, 21.0]\na = bootstrap_mean(xs)\nb = bootstrap_mean(xs)\ncheck_call('same seed gives the same answer', lambda: a, b)\ncheck_call('seed is part of the contract', lambda: bootstrap_mean(xs, seed=7), a)\ncheck_call('seed 0 runs deterministically too', lambda: bootstrap_mean(xs, seed=0), bootstrap_mean(xs, seed=0))\ncheck_call('answer is a plausible mean of xs', lambda: 3.0 <= a <= 21.0, True)\nfinish()",
    entry: "bootstrap_mean([3.0, 5.0, 8.0, 13.0, 21.0])",
    pdbLoad: ["args", "n", "n", "p idx[:5]", "p _rng", "c"],
  },
]
