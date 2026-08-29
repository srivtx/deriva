// ── Ultron — the AI/ML ladder ────────────────────────────────────────────────
// 60 problems, 11 stages, strictly linear: every problem teaches exactly one
// ML thinking-move in pure NumPy, and every later problem composes only moves
// taught earlier. No sklearn, no torch — you build each model from math you
// can write on one napkin. Execution: real NumPy inside the Pyodide worker.
// Shared frozen datasets (line, exam, spam, cluster, tree, net) live in the
// workbench DEPS block — single source of truth; treat them as constants.

export interface UltronProblem {
  id: number; stage: number; title: string; pattern: string; skill: string
  statement: string; diagram?: string; examples: { input: string; output: string; explain?: string }[]
  why: string; starterCode: string; hints: string[]; solution: string; walkthrough: string; testCode: string
}

export const STAGES_ULTRON = [
  {
    id: 0, name: "The Substrate", desc: "arrays are the noun",
    creed: "Before models, there is the noun: the ndarray. Every dataset, label, weight and prediction you will ever touch is a rectangle of numbers with a shape, and ML is the craft of moving through those rectangles without copying them.\n\nThis stage drills the reflexes — building arrays, reshaping without reordering, broadcasting a (3,) against a (4,1), masking with a boolean array. None of it looks like intelligence. All of it is load-bearing: the shape error you learn to read here is the error you will hit inside a neural net in stage 8.\n\nThe bar to leave: when an operation fails, your first question is 'what are the two shapes?' — not 'what went wrong?'",
  },
  {
    id: 1, name: "The Line", desc: "your first model, from math",
    creed: "The first model is not a library call — it is two numbers, w and b, and a belief that the world is roughly straight. You define what 'wrong' means (mean squared error), take its derivative by hand, and watch the slope point downhill.\n\nBy the end of this stage you have derived gradient descent AND the closed-form normal equation on the same data, and checked that both land on the same line. That cross-check is the habit of a practitioner: two independent paths agreeing is the cheapest proof you own.\n\nThe bar to leave: you can predict with a line, measure the error, and say exactly how each parameter should move to reduce it.",
  },
  {
    id: 2, name: "The Descent", desc: "learning is controlling the step",
    creed: "Knowing the direction is half the craft; choosing how far to step is the other half — and it is where most training silently dies. Too bold and the loss explodes; too timid and you mistake slowness for convergence.\n\nThis stage makes the failure modes visible on purpose: the diverging rate, the ill-conditioned valley where raw features fight each other, the noise floor that mini-batches introduce and momentum rides through. You end by holding a validation set up against the training loss and stopping when the unseen data says stop.\n\nThe bar to leave: given a loss curve, you can name what is wrong — rate, conditioning, or noise — and fix it.",
  },
  {
    id: 3, name: "The Bend", desc: "a line that outputs probability",
    creed: "A straight line answers 'how much'; the world mostly asks 'yes or no'. One sigmoid bend turns any score into a probability, and one loss — cross-entropy — replaces the crude squared error with something that punishes confident mistakes.\n\nThe deep move here is the threshold: the model outputs 0.93 and 0.55, and YOU decide what counts as a positive. That decision, not the model, sets the false-alarm rate — and on imbalanced data the lazy 95%-accuracy model is exposed for what it is.\n\nThe bar to leave: you can train a classifier from scratch and defend where you drew the line.",
  },
  {
    id: 4, name: "The Judge", desc: "the error you can't see",
    creed: "Training error is a mirror — it only shows what the model already saw. This stage installs the discipline of judging models on data they never touched: holdout sets, the polynomial zoo where degree 9 memorizes noise, and ridge penalties that buy stability with bias.\n\nThen the machinery of honest comparison: k-fold cross-validation, and the leaked-exam bug — the single most common way real ML projects lie to themselves. Standardize inside the fold, never before.\n\nThe bar to leave: you trust no number that was computed on data the model trained on.",
  },
  {
    id: 5, name: "Neighbors & Clusters", desc: "similarity is geometry",
    creed: "Not every model draws a line. kNN predicts by geometry — find the closest examples and vote — and works startlingly well until a feature measured in dollars shouts down a feature measured in years. Scale, again, decides truth.\n\nThen the unsupervised turn: no labels at all, just structure. k-means asks the data to organize itself, and inertia shows the price of every assumption about how many clusters exist.\n\nThe bar to leave: you can predict by proximity and cluster by structure — and you know both live or die by the metric you measure distance with.",
  },
  {
    id: 6, name: "The Tree", desc: "split the world by asking",
    creed: "A tree learns by asking questions: is the amount above 4.5? Each split chooses the question that most reduces the mess — gini or entropy — and recursion does the rest. You build the search for the best split by hand, so 'the model found a rule' becomes 'the model counted every candidate threshold and took the cleanest'.\n\nThen the ensemble trick: one deep tree memorizes, but many shallow trees voting on bootstrap samples — bagging — average their disagreements into stability.\n\nThe bar to leave: you can grow a stump from raw counts and explain why a forest beats a tree.",
  },
  {
    id: 7, name: "The Network", desc: "stack the bends",
    creed: "Stack logistic units and something qualitatively new appears: layers bend the space, and bends compose. The forward pass is just matrix products with a nonlinearity between them — but without the nonlinearity, a hundred layers collapse into one straight line, as XOR proves.\n\nSoftmax extends the bend to many classes, and cross-entropy hands you a gradient so clean it feels like cheating: prediction minus truth.\n\nThe bar to leave: you can run data through a hand-built two-layer network and say why every piece — weights, bias, activation — is where it is.",
  },
  {
    id: 8, name: "Backprop", desc: "blame flows backwards",
    creed: "Training a network means asking every one of its parameters: how much did you contribute to this mistake? Backpropagation answers with the chain rule, flowing blame backwards through the graph. You verify every gradient against the numeric definition — because a gradient you have not checked is a rumor.\n\nThen the loop comes alive: forward, backward, step, repeat — and XOR, the problem a straight line can never solve, falls to a two-layer net. You assemble Adam from its parts and see momentum and adaptive scaling as one optimizer.\n\nThe bar to leave: you can differentiate a network by hand and trust it, because you checked it numerically.",
  },
  {
    id: 9, name: "The Craft", desc: "grade like a practitioner",
    creed: "A model is not finished when it trains; it is finished when it is graded honestly. The confusion grid turns '92% accurate' into four numbers you can argue with. Precision and recall force the trade a threshold hides. The ROC curve grades the ranking itself, independent of any cutoff.\n\nThen the practitioner's ritual on real data: k-fold model selection, a metrics report, and the discipline to let validation — not hope — pick the model.\n\nThe bar to leave: given any classifier, you can produce its confusion grid, its F1, and its ROC — and read all three aloud.",
  },
  {
    id: 10, name: "The Deep", desc: "beyond the ladder, where it compounds",
    creed: "The ladder ends; the craft compounds. This tier takes moves you already own and pushes each to its professional edge: softmax to many classes, filters to images, eigen-axes to PCA, dot products to meaning, L1 to sparsity, schedules to convergence.\n\nThere is no new noun here — numpy is still the whole language. What is new is the expectation: compose scaling, logistic regression, cross-validation and metrics into one pipeline, then defend every choice in it.\n\nThe bar to leave: given a raw dataset, you can run the full loop — split, scale, train, tune, grade — and no step in it is a library call.",
  },
]

export const PROBLEMS_ULTRON: UltronProblem[] = [
  // ══ STAGE 0 — The Substrate ══
  {
    id: 1, stage: 0, title: "First Array", pattern: "array-literal", skill: "declare data as an ndarray",
    statement: "Create a 2×3 NumPy array holding the readings [[2, 4, 6], [8, 10, 12]] and assign it to a. Then assign its row count to rows and column count to cols. All ML data — features, labels, weights — lives in objects like this one.",
    examples: [
      { input: "[[2, 4, 6], [8, 10, 12]]", output: "shape (2, 3)", explain: "2 rows of 3 readings each" },
    ],
    why: "Every model you will ever build consumes arrays and produces arrays: a dataset is a matrix of shape (n_samples, n_features), labels are a vector of length n_samples, weights are arrays too. np.array is the entry ticket — and shape is the first thing you check when a model crashes, because 90% of ML bugs are shape bugs.",
    starterCode: "import numpy as np\n\nsensor = [[2, 4, 6], [8, 10, 12]]\n\na = None      # build the ndarray from `sensor`\nrows = None   # number of rows\ncols = None   # number of columns",
    hints: [
      "np.array(sensor) turns the nested list into an ndarray.",
      "An array carries its shape in a.shape — a tuple like (2, 3).",
      "rows and cols are just a.shape[0] and a.shape[1].",
    ],
    solution: "import numpy as np\n\nsensor = [[2, 4, 6], [8, 10, 12]]\n\na = np.array(sensor)\nrows, cols = a.shape[0], a.shape[1]",
    walkthrough: "np.array eats a nested list and returns an ndarray — one object that holds the data, its shape, and its dtype. a.shape is (2, 3): rows first, columns second, always. This order is the convention for datasets everywhere: axis 0 walks down the rows (samples), axis 1 walks across the columns (features). Next problem: changing that shape without touching the data.",
    testCode: "assert a is not None and isinstance(a, np.ndarray)\nassert list(a.shape) == [2, 3], a.shape\nassert a[1, 2] == 12 and a[0, 0] == 2\nassert rows == 2 and cols == 3\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "The Shape Question", pattern: "reshape", skill: "reshape regroups, never copies meaning",
    diagram: `12 readings, one order — three shapes, same order

   (12,)    ●●●●●●●●●●●●
   (3,4)    ●●●● │ ●●●● │ ●●●●
   (12,1)   ●
            ●
            ⋮         reshape regroups — it never reorders`,
    statement: "You receive 12 hourly temperature readings as the 1-D array temps (already defined). Produce: week = temps reshaped into 3 rows of 4 (each row is one 4-hour block), and col = temps as a column vector of shape (12, 1). Same 12 numbers, two different shapes.",
    examples: [
      { input: "temps = [10 11 12 13 14 15 16 17 18 19 20 21]", output: "week shape (3, 4); col shape (12, 1)", explain: "regrouped, not reordered" },
    ],
    why: "reshape is the most-used array move in ML. Libraries are strict: many functions demand a (n,) vector, others a (n, 1) column, others a (n_samples, n_features) matrix — and they fail loudly instead of guessing. reshape regroups the same values into a new grid; the element order is preserved. Knowing that reshape never reorders (only regroups) is what makes it safe.",
    starterCode: "import numpy as np\n\ntemps = np.array([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])\n\nweek = None  # shape (3, 4): 3 blocks of 4 readings\ncol = None   # shape (12, 1): a column vector",
    hints: [
      "temps.reshape(3, 4) regroups 12 values into 3 rows of 4.",
      "reshape(12, 1) stacks the values vertically — note the 1.",
      "The product of the new shape must equal the old size: 3×4 = 12.",
    ],
    solution: "import numpy as np\n\ntemps = np.array([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])\n\nweek = temps.reshape(3, 4)\ncol = temps.reshape(12, 1)",
    walkthrough: "One call, one guarantee: reshape regroups in row-major order — the first row of week is the first 4 readings, left to right. (12,) → (3, 4) → (12, 1) are the same data wearing different grids. Why (12, 1) matters: when you later multiply features by weights, a column vector broadcasts against matrices the way a flat vector does not. Shape bugs will be your daily bread — reach for .shape before print, always.",
    testCode: "assert week.shape == (3, 4) and col.shape == (12, 1)\nassert np.array_equal(week.ravel(), temps) and np.array_equal(col.ravel(), temps)\nassert week[2, 3] == 21 and col[11, 0] == 21\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Center the Readings", pattern: "broadcasting", skill: "one axis stretches against another",
    statement: "The (3, 4) array block holds 3 sensors × 4 readings. Subtract each sensor's own mean from that sensor's readings, producing centered — every row ends up with mean 0. Do it with broadcasting in one expression, no loops.",
    examples: [
      { input: "row [2, 4, 6, 8] (mean 5)", output: "row [-3, -1, 1, 3]", explain: "each row loses its own mean" },
    ],
    why: "Broadcasting is NumPy's superpower: operations between mismatched shapes stretch the smaller one across the bigger one under fixed rules. Centering columns/rows is the canonical use — it is literally the first step of PCA and of feature standardization. The alternative (a Python loop over rows) is 100× slower and misses the point: the arithmetic is per-element, so write it per-element.",
    starterCode: "import numpy as np\n\nblock = np.array([[2., 4., 6., 8.],\n                  [1., 1., 1., 1.],\n                  [10., 20., 30., 40.]])\n\ncentered = None  # (3, 4), each row mean 0",
    hints: [
      "block.mean(axis=1) collapses each row to its mean — shape (3,).",
      "To subtract a (3,) from a (3, 4) you need it as (3, 1): keepdims=True or reshape.",
      "block - block.mean(axis=1, keepdims=True) subtracts per row.",
    ],
    solution: "import numpy as np\n\nblock = np.array([[2., 4., 6., 8.],\n                  [1., 1., 1., 1.],\n                  [10., 20., 30., 40.]])\n\ncentered = block - block.mean(axis=1, keepdims=True)",
    walkthrough: "The rules of broadcasting: shapes align on the right; a dimension of size 1 stretches to match; missing dimensions are treated as 1. The row means have shape (3, 1), so each mean is stretched across all 4 columns and subtracted from its own row only. keepdims=True is the honest way to say 'I want a column of row-means'. You will reuse this exact expression to standardize features in Stage 2 — where unscaled features quietly destroy gradient descent.",
    testCode: "assert centered.shape == (3, 4)\nassert np.allclose(centered.sum(axis=1), [0, 0, 0], atol=1e-12)\nassert np.allclose(centered[0], [-3, -1, 1, 3])\nassert np.allclose(block.sum(axis=1) / 4 - centered.mean(axis=1), block.sum(axis=1) / 4)\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Kill the Loop", pattern: "vectorization", skill: "collapse an axis, not a for-loop",
    statement: "scores is (4, 5): 4 students × 5 tests. Compute per-student totals (length 4) and the class-wide average (one number) — with axis-based reductions, no Python loops. Assign totals and avg.",
    examples: [
      { input: "row [10, 20, 30, 40, 50]", output: "total 150", explain: "axis=1 walks across columns" },
    ],
    why: "The instinct from ordinary Python is to loop. In ML, loops die here: datasets have millions of rows and every interpreted-loop iteration is wasted. Reductions like sum, mean, max take an axis argument — axis=0 collapses rows (down the columns), axis=1 collapses columns (across each row). Reading shapes out loud — '4 by 5, sum over axis 1 gives shape 4' — is the skill.",
    starterCode: "import numpy as np\n\nscores = np.array([[10., 20., 30., 40., 50.],\n                   [11., 12., 13., 14., 15.],\n                   [ 5.,  5.,  5.,  5.,  5.],\n                   [90., 80., 70., 60., 50.]])\n\ntotals = None  # per-student total, shape (4,)\navg = None     # class-wide average, one number",
    hints: [
      "np.sum(scores, axis=1) collapses each row into one number.",
      "axis=0 would collapse down the columns — direction matters.",
      "The class average is the mean of everything: scores.mean() with no axis.",
    ],
    solution: "import numpy as np\n\nscores = np.array([[10., 20., 30., 40., 50.],\n                   [11., 12., 13., 14., 15.],\n                   [ 5.,  5.,  5.,  5.,  5.],\n                   [90., 80., 70., 60., 50.]])\n\ntotals = scores.sum(axis=1)\navg = scores.mean()",
    walkthrough: "axis is the dimension that gets consumed: sum over axis=1 eats the 5 columns and leaves shape (4,); over axis=0 eats the 4 rows and leaves (5,). No axis means collapse everything to a scalar. Every loss you will ever compute is exactly this move — 'sum the per-example errors over axis 0, then mean' — so the direction must become reflex. Vectorization is not a style preference; it is the difference between a model that trains in seconds and one that trains in hours.",
    testCode: "assert totals.shape == (4,)\nassert np.allclose(totals, [150, 65, 25, 350])\nassert np.isscalar(avg) or avg.ndim == 0\nassert np.isclose(avg, scores.sum() / 20)\nassert np.isclose(avg, 590 / 4 / 5)\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "The Yes/No Filter", pattern: "boolean-mask", skill: "ask a question of every element",
    statement: "temps holds 12 readings. Build hot = the boolean array marking readings ≥ 18, and hot_values = only the readings that are hot, in order. Boolean masks are how ML filters data, selects misclassified examples, and builds train/test splits.",
    examples: [
      { input: "temps = [10, 18, 19, 3]", output: "hot = [F, T, T, F]; hot_values = [18, 19]", explain: "the comparison IS the mask" },
    ],
    why: "temps >= 18 evaluates the comparison for every element at once and returns an array of True/False — a mask. Feeding a mask back into the array with [] keeps only the True positions. This closes the vectorized toolkit: comparison → mask → select. In ML you will mask losses (ignore padding), split data, and pull out wrong predictions — all with this one move.",
    starterCode: "import numpy as np\n\ntemps = np.array([10, 18, 19, 3, 17, 21, 18, 4, 25, 16, 30, 2])\n\nhot = None        # boolean array, same shape as temps\nhot_values = None # the readings where hot is True, in order",
    hints: [
      "temps >= 18 returns an array of True/False — assign that to hot.",
      "Boolean arrays index: temps[hot] keeps True positions.",
      "Check hot.dtype is bool — that's how you know you built a mask.",
    ],
    solution: "import numpy as np\n\ntemps = np.array([10, 18, 19, 3, 17, 21, 18, 4, 25, 16, 30, 2])\n\nhot = temps >= 18\nhot_values = temps[hot]",
    walkthrough: "Three lines of pure intent: compare, keep the mask, apply it. Two habits worth forming now. First, the mask has the same shape as the data — if shapes mismatch, you are about to select nonsense. Second, combining masks uses & and | with parentheses — (a > 1) & (b < 2) — because Python's plain and/or would try to collapse whole arrays to one truth value. Stage 3 will use masks to count misclassifications; Stage 4 uses them for splits.",
    testCode: "assert hot.dtype == np.bool_\nassert hot.shape == (12,)\nassert list(hot) == [False, True, True, False, False, True, True, False, True, False, True, False]\nassert np.array_equal(hot_values, [18, 19, 21, 18, 25, 30])\nprint('All tests passed!')"
  },

  // ══ STAGE 1 — The Line ══
  {
    id: 6, stage: 1, title: "Predict With a Line", pattern: "hypothesis", skill: "a model is a formula with knobs",
    statement: "x is a batch of inputs. A linear model with slope w and intercept b predicts y_hat = w·x + b. With w = 3, b = 2, compute preds for all of x — vectorized, no loops. This one line IS the entire model; everything after it just picks better w and b.",
    examples: [
      { input: "x = [1, 2, 3], w = 3, b = 2", output: "preds = [5, 8, 11]", explain: "3·1+2, 3·2+2, 3·3+2" },
    ],
    why: "Strip away the mystique: a linear model is one formula with two adjustable numbers. 'Training' will mean choosing w and b using data — nothing more. The formula is vectorized: x is a batch, so preds is a batch, one prediction per row, computed in a single expression. Every model in this ladder keeps this shape — hypothesis first, then a way to score it, then a way to improve it.",
    starterCode: "import numpy as np\n\nx = np.array([1., 2., 3., 4.])\nw, b = 3.0, 2.0\n\npreds = None  # model output for every x, shape (4,)",
    hints: [
      "The formula is literally the math: w * x + b.",
      "NumPy applies it elementwise — one prediction per input.",
      "Check preds.shape equals x.shape.",
    ],
    solution: "import numpy as np\n\nx = np.array([1., 2., 3., 4.])\nw, b = 3.0, 2.0\n\npreds = w * x + b",
    walkthrough: "w * x + b evaluated on an array is the whole forward pass of linear regression. w encodes 'how much does the output move per unit input', b encodes 'where does the line sit'. Hold on to the vocabulary: w and b are parameters, the formula is the hypothesis, preds is the inference. The data in the DEPS world was generated as y = 3x + 2 + tiny noise — so somewhere in parameter space there is an almost-perfect (w, b). Finding it is Stage 1's remaining work.",
    testCode: "assert preds.shape == (4,)\nassert np.allclose(preds, [5., 8., 11., 14.])\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "The Error Number", pattern: "mse-loss", skill: "boil all error into one number",
    statement: "Given truths y and predictions preds, implement mse(y, preds) = mean of squared differences. Evaluate it on the two candidate models in the starter: model A (w=3, b=2) and model B (w=2, b=1). Assign mse_a and mse_b. The smaller number is the better model — that comparison is what 'learning' automates.",
    examples: [
      { input: "y = [3, 4], preds = [2, 2]", output: "mse = (1 + 4) / 2 = 2.5", explain: "square each gap, then average" },
    ],
    why: "A loss function compresses every mistake into one number you can minimize. Squaring does three jobs at once: kills the sign, punishes big misses harder, and — the hidden gift — is smooth, so it has a gradient everywhere. MSE is the default regression loss precisely because of that smoothness. Choosing what to square, sum, and average is the first design decision of every ML system.",
    starterCode: "import numpy as np\n\nx, y = line_world()\n\ndef mse(y_true, y_pred):\n    ...\n\nmse_a = mse(y, 3.0 * x + 2.0)   # the true recipe\ndummy_w, dummy_b = 2.0, 1.0\nmse_b = mse(y, dummy_w * x + dummy_b)  # a wrong model",
    hints: [
      "The gaps are y_true - y_pred; square them elementwise: (y_true - y_pred) ** 2.",
      "Average the squares with .mean() — one number.",
      "mse should return a float; test both models through the same function.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\n\ndef mse(y_true, y_pred):\n    return float(np.mean((y_true - y_pred) ** 2))\n\nmse_a = mse(y, 3.0 * x + 2.0)\ndummy_w, dummy_b = 2.0, 1.0\nmse_b = mse(y, dummy_w * x + dummy_b)",
    walkthrough: "Read the pipeline in order: hypothesis (w·x+b) → residuals (y − ŷ) → squares → mean. One scalar exits. The world's data is y = 3x + 2 + noise, so mse_a will be tiny (just the noise) and mse_b large — the loss ranking agrees with intuition, and that agreement is the point: once error is a number, 'better model' has a definition, and Stage 1's remaining problems build the machine that minimizes it. Note the float() wrapper — losses should be plain numbers, not 0-d arrays that confuse later code.",
    testCode: "assert np.isclose(mse_a, float(np.mean((y - (3.0 * x + 2.0)) ** 2)))\nassert np.isclose(mse_b, float(np.mean((y - (2.0 * x + 1.0)) ** 2)))\nassert mse_a < 0.05, f\"model A should be near the noise floor, got {mse_a}\"\nassert mse_b > 1.0, f\"model B should be much worse, got {mse_b}\"\nassert mse_a < mse_b\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Feel the Slope", pattern: "analytic-gradient", skill: "differentiate the error",
    statement: "For one data point (x₀, y₀) with prediction ŷ = w·x₀ + b and loss (ŷ − y₀)², derive dL/dw and dL/db by hand, then implement grad_w(x0, y0, w, b) and grad_b(x0, y0, w, b). Check them against a numeric slope (the (L(w+h) − L(w−h)) / 2h probe) inside the tests — your calculus must agree with the probe to 6 decimals.",
    examples: [
      { input: "x0=2, y0=10, w=3, b=2 → ŷ=8, err=−2", output: "dL/dw = 2·(−2)·2 = −8; dL/db = −4", explain: "chain rule: 2·err·∂ŷ/∂param" },
    ],
    why: "The gradient is the compass of all of ML: it points in the direction that increases loss, so stepping against it decreases loss. For squared loss the derivation is two lines of chain rule — ∂L/∂w = 2·(ŷ−y)·x, ∂L/∂b = 2·(ŷ−y) — and every model in this ladder, up to the neural network in Stage 8, will hand you gradients through exactly this pattern: local derivative × upstream derivative. The numeric probe (evaluating L slightly left and right) is the universal sanity check for any gradient you ever derive.",
    starterCode: "import numpy as np\n\ndef grad_w(x0, y0, w, b):\n    ...  # d/dw of (w*x0 + b - y0)**2\n\ndef grad_b(x0, y0, w, b):\n    ...  # d/db of (w*x0 + b - y0)**2",
    hints: [
      "Let err = w*x0 + b - y0. The loss is err².",
      "d(err²)/derr = 2·err; err changes with w at rate x0 and with b at rate 1.",
      "So grad_w = 2·err·x0 and grad_b = 2·err — then verify numerically.",
    ],
    solution: "import numpy as np\n\ndef grad_w(x0, y0, w, b):\n    err = w * x0 + b - y0\n    return 2.0 * err * x0\n\ndef grad_b(x0, y0, w, b):\n    err = w * x0 + b - y0\n    return 2.0 * err",
    walkthrough: "The chain rule in ML clothing: loss → error → parameter. The error term 2·(ŷ−y) appears in both gradients; the parameters differ only in how fast the error responds to them (x₀ for w, 1 for b). That 'response rate' is the local derivative the chain rule multiplies by. The numeric probe in the tests — nudging w by ±0.0001 and re-measuring loss — is your permanent safety net: whenever a hand-derived gradient is wrong, the probe catches it before training silently fails. Stage 8 leans on this exact habit at 100× scale.",
    testCode: "for x0, y0, w, b in [(2.0, 10.0, 3.0, 2.0), (1.5, 7.0, 0.5, 1.0), (-2.0, 4.0, 3.0, 2.0)]:\n    h = 1e-6\n    L = lambda ww, bb: (ww * x0 + bb - y0) ** 2\n    num_w = (L(w + h, b) - L(w - h, b)) / (2 * h)\n    num_b = (L(w, b + h) - L(w, b - h)) / (2 * h)\n    assert abs(grad_w(x0, y0, w, b) - num_w) < 1e-5, (x0, y0, w, b)\n    assert abs(grad_b(x0, y0, w, b) - num_b) < 1e-5, (x0, y0, w, b)\nassert grad_w(2.0, 10.0, 3.0, 2.0) == -8.0\nassert grad_b(2.0, 10.0, 3.0, 2.0) == -4.0\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "The Descent Step", pattern: "gradient-descent", skill: "step against the slope, repeatedly",
    diagram: `        loss(w)
          ▲      ●   ← slope says: w is too big
          │       ╲
          │        ╲   step = η × slope
          │         ○
          │          ╲
          │           ●  ← closer
          └──────────────────▶ w
             η too big → overshoot · η too small → crawl`,
    statement: "Implement full-batch gradient descent on line_world: start at w=0, b=0, take 200 steps with learning rate 0.02, each step updating both parameters against the mean-squared-error gradient (use the per-point gradients, averaged). Record the loss after every step in losses. The model learns the data's recipe (3x+2) from nothing but the gradient.",
    examples: [
      { input: "start w=0 b=0, loss≈38", output: "after 200 steps: w≈3, b≈2, loss≈noise floor", explain: "opposite of the gradient is downhill" },
    ],
    why: "This is the training loop that powers everything from linear regression to GPTs: compute predictions, compute loss, compute gradients, subtract a fraction of the gradient, repeat. The learning rate scales the step: too small crawls, too large explodes (Stage 2's first lesson). Watch losses fall as you run — that falling curve is the visual signature of learning, and you built it from 4 lines of arithmetic.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nn = len(x)\nw, b = 0.0, 0.0\nlr = 0.02\nlosses = []\n\nfor step in range(200):\n    ...  # predict, compute mean gradients over all points, update w and b\n    pass\n    losses.append(float(np.mean((w * x + b - y) ** 2)))",
    hints: [
      "Per-point gradients: gw_i = 2·err_i·x_i, gb_i = 2·err_i with err = w·x + b − y.",
      "Mean them over the batch: gw = (2/n)·np.sum(err * x), gb = (2/n)·np.sum(err).",
      "Update: w -= lr * gw; b -= lr * gb — against the gradient.",
      "Append the loss AFTER updating, then watch the curve fall.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nn = len(x)\nw, b = 0.0, 0.0\nlr = 0.02\nlosses = []\n\nfor step in range(200):\n    err = w * x + b - y\n    gw = (2.0 / n) * np.sum(err * x)\n    gb = (2.0 / n) * np.sum(err)\n    w -= lr * gw\n    b -= lr * gb\n    losses.append(float(np.mean((w * x + b - y) ** 2)))",
    walkthrough: "The loop is the whole of training: err → averaged gradients → step → record. Vectorized gradients (err * x summed in one expression) make each step cost one pass over the data. Starting from w=0, b=0, the first gradients point steeply uphill, so the first steps are big; as the line approaches 3x+2 the errors shrink, the gradients shrink, and the steps soften automatically — squared loss self-anneals. The tests assert w and b landed near (3, 2) and that the loss fell by orders of magnitude. You have now trained a model. Everything later is this loop with fancier gradients.",
    testCode: "assert len(losses) == 200\nassert losses[-1] < losses[0] / 100, (losses[0], losses[-1])\nassert abs(w - 3.0) < 0.15 and abs(b - 2.0) < 0.3, (w, b)\nassert all(losses[i+1] <= losses[i] + 1e-9 for i in range(199)), \"loss must never rise\"\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Solve It Exactly", pattern: "closed-form", skill: "one move instead of many steps",
    statement: "Gradient descent crawled to (w, b) in 200 steps. Linear algebra gets there in one: build the design matrix Xb = column of ones ⊕ column of x (shape (n, 2)), then solve the normal equation w_vec = (XᵀX)⁻¹ Xᵀy with np.linalg.solve (build the 2×2 system, don't invert). Compare: w_vec[0] ≈ b, w_vec[1] ≈ w, and both ≈ (3, 2).",
    examples: [
      { input: "Xb: [1, x] per row", output: "w_vec solves Xb @ w_vec ≈ y exactly", explain: "least squares has an exact answer" },
    ],
    why: "Gradient descent is an iterative approximation; least squares has a closed-form solution — set every gradient to zero and solve the resulting linear system. np.linalg.solve(A, rhs) solves A·w = rhs without ever forming an explicit inverse (numerically kinder than inv). Two profound lessons: (1) when a closed form exists, it is exact and instant; (2) most of ML — logistic nets, trees, everything nonlinear — has NO closed form, which is why Stage 1 taught you the iterative path first. The two methods agreeing to 4 decimals is the proof they both work.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nn = len(x)\n\nones = np.ones(n)\nXb = None            # shape (n, 2): ones in column 0, x in column 1\nw_vec = None         # solve (XbᵀXb) @ w_vec = Xbᵀy\n\nb_closed, w_closed = w_vec[0], w_vec[1]",
    hints: [
      "np.column_stack([ones, x]) builds the (n, 2) design matrix.",
      "Normal equations: A = Xbᵀ @ Xb (2×2), rhs = Xbᵀ @ y (2,).",
      "np.linalg.solve(A, rhs) returns w_vec directly — no inv().",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nn = len(x)\n\nones = np.ones(n)\nXb = np.column_stack([ones, x])\nw_vec = np.linalg.solve(Xb.T @ Xb, Xb.T @ y)\n\nb_closed, w_closed = w_vec[0], w_vec[1]",
    walkthrough: "Xb @ w_vec produces every prediction as one matmul — the matrix form of w·x+b. Setting the gradient of MSE to zero yields XbᵀXb·w = Xbᵀy, and solve() returns the exact minimizer. Compare with Problem 9: same optimum, found by iteration vs found by algebra. A3's lesson in full: the naive path (descent) taught you what the loss surface looks like; the clever path (closed form) exploits its shape. Remember the cost contrast too — descent touches the data every step; the closed form pays once. When a model has this structure, use it; when it doesn't (everything from Stage 3 on), descent is the only road.",
    testCode: "assert Xb.shape == (n, 2)\nassert np.allclose(Xb[:, 0], 1.0) and np.allclose(Xb[:, 1], x)\nassert abs(w_closed - 3.0) < 0.2 and abs(b_closed - 2.0) < 0.4, (w_closed, b_closed)\n# cross-method agreement: closed form must sit at or below 200 GD steps\nw_gd, b_gd = 0.0, 0.0\nfor _ in range(200):\n    err = w_gd * x + b_gd - y\n    w_gd -= 0.02 * (2.0 / n) * np.sum(err * x)\n    b_gd -= 0.02 * (2.0 / n) * np.sum(err)\nmse_closed = float(np.mean((Xb @ w_vec - y) ** 2))\nmse_gd = float(np.mean((w_gd * x + b_gd - y) ** 2))\nassert mse_closed <= mse_gd + 1e-9, (mse_closed, mse_gd)\nassert np.allclose(Xb @ w_vec, 3.0 * x + 2.0, atol=0.35)\nprint('All tests passed!')"
  },

  // ══ STAGE 2 — The Descent ══
  {
    id: 11, stage: 2, title: "Learning Rate Lab", pattern: "learning-rate", skill: "tune the step size",
    statement: "Implement run_gd(lr) that trains the line_world problem for 100 steps from w=b=0 (full-batch MSE, same gradient as Problem 9) and returns the final loss. Produce losses_small (lr=0.0005), losses_right (lr=0.05), losses_big (lr=0.9). One crawls, one converges, one explodes — you will watch all three.",
    examples: [
      { input: "lr = 0.0005", output: "final loss still large", explain: "steps too timid to travel" },
      { input: "lr = 0.9", output: "final loss enormous (or nan)", explain: "each step overshoots past the valley" },
    ],
    why: "The learning rate is the single most consequential knob in deep learning. Too small: training is real but unbearably slow. Too large: each step jumps over the valley and lands higher than it started — loss oscillates, then diverges, sometimes to nan. There is no universal right answer; there is only 'watch the loss curve and adjust'. Building the intuition that the SAME algorithm can crawl, converge, or explode purely by scaling one number is the point of this lab.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nn = len(x)\n\ndef run_gd(lr, steps=100):\n    w, b = 0.0, 0.0\n    for _ in range(steps):\n        ...  # same update as Problem 9\n        pass\n    return float(np.mean((w * x + b - y) ** 2))\n\nlosses_small = None  # run_gd(0.0005)\nlosses_right = None  # run_gd(0.05)\nlosses_big = None    # run_gd(0.9)",
    hints: [
      "Copy the update from Problem 9 into run_gd; only lr changes.",
      "err = w*x + b - y; gw = (2/n)*sum(err*x); gb = (2/n)*sum(err).",
      "Call run_gd three times, once per learning rate.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nn = len(x)\n\ndef run_gd(lr, steps=100):\n    w, b = 0.0, 0.0\n    for _ in range(steps):\n        err = w * x + b - y\n        gw = (2.0 / n) * np.sum(err * x)\n        gb = (2.0 / n) * np.sum(err)\n        w -= lr * gw\n        b -= lr * gb\n    return float(np.mean((w * x + b - y) ** 2))\n\nlosses_small = run_gd(0.0005)\nlosses_right = run_gd(0.05)\nlosses_big = run_gd(0.9)",
    walkthrough: "Three runs, one algorithm, three fates — the entire story of hyperparameter tuning in one function. lr=0.0005 takes honest but microscopic steps: real progress, nowhere near done. lr=0.05 lands in the sweet spot for this loss surface. lr=0.9 overshoots: the line swings across the valley each step, error compounds, loss explodes. Note what this means practically — when training 'randomly fails', the first suspect is always the learning rate, and the second is unscaled data (next problem). The divergence is not a bug in your code; it is arithmetic honestly reporting that the steps are too big.",
    testCode: "assert np.isscalar(losses_small) or np.array(losses_small).ndim == 0\nassert losses_right < 0.1, f\"lr=0.05 should converge, got {losses_right}\"\nassert losses_small > losses_right * 5, f\"lr=0.0005 should still be far away, got {losses_small}\"\nassert losses_big > 100.0, f\"lr=0.9 should explode, got {losses_big}\"\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 2, title: "Level the Field", pattern: "feature-scaling", skill: "standardize before you step",
    statement: "beds is 1–4 (bedrooms), age is 1–50 (house age, pure noise for price). Fitting price = w1·beds + w2·age + b by GD: the features live on wildly different scales, so their gradients disagree about the learning rate. Implement zscore(v) = (v − mean) / std, build scaled features, and run 400 steps of GD at lr=0.1 on the scaled problem. Report final loss as loss_scaled — the tests run the identical loop on raw features and watch it go nowhere.",
    examples: [
      { input: "v = [1, 2, 3]", output: "z = [-1.22, 0, 1.22]", explain: "mean 0, std 1 — every feature the same yardstick" },
    ],
    why: "Gradient descent takes one step size for all parameters. If sqft is in the thousands and bedrooms in the units, the sqft gradient dwarfs the bedrooms gradient: any lr that lets sqft converge makes bedrooms crawl, and any lr that moves bedrooms explodes sqft. Standardizing every feature to mean 0, std 1 levels the field so one lr serves all. This is why 'scale your features' is the first line of every ML checklist — and why the scaler's statistics must come from TRAINING data only (Problem 25's trap).",
    starterCode: "import numpy as np\n\nbeds, age, price = house_world()\n\ndef zscore(v):\n    ...  # (v - mean) / std\n    pass\n\nbeds_z = zscore(beds.astype(float))\nage_z = zscore(age.astype(float))\ny_z = zscore(price.astype(float))   # target scaled too: same lr logic\n\nXb = np.column_stack([np.ones(len(beds)), beds_z, age_z])\nw = np.zeros(3)\nlr = 0.1\nfor _ in range(400):\n    err = Xb @ w - y_z\n    grad = (2.0 / len(y_z)) * (Xb.T @ err)\n    w = w - lr * grad\n\nloss_scaled = float(np.mean((Xb @ w - y_z) ** 2))",
    hints: [
      "zscore: return (v - v.mean()) / v.std().",
      "The provided loop already trains on the scaled features — just fill zscore.",
      " loss_scaled is already computed; the test compares it with the unscaled run.",
    ],
    solution: "import numpy as np\n\nbeds, age, price = house_world()\n\ndef zscore(v):\n    return (v - v.mean()) / v.std()\n\nbeds_z = zscore(beds.astype(float))\nage_z = zscore(age.astype(float))\ny_z = zscore(price.astype(float))\n\nXb = np.column_stack([np.ones(len(beds)), beds_z, age_z])\nw = np.zeros(3)\nlr = 0.1\nfor _ in range(400):\n    err = Xb @ w - y_z\n    grad = (2.0 / len(y_z)) * (Xb.T @ err)\n    w = w - lr * grad\n\nloss_scaled = float(np.mean((Xb @ w - y_z) ** 2))",
    walkthrough: "z-score answers one question: 'how many standard deviations from typical?' — so bedrooms=3 and sqft=1800 become comparable numbers. Watch the mechanics in the loop: with scaled features, XbᵀXb is well-conditioned (diagonal-ish), so one lr=0.1 works for every weight simultaneously. The tests run the IDENTICAL loop on raw features at a legal lr and show it stuck; that contrast is the entire argument. Carry forward: scale for gradient methods; trees (Stage 6) won't care — splits don't step.",
    testCode: "assert np.isclose(beds_z.mean(), 0) and np.isclose(age_z.std(), 1.0)\n# identical loop on RAW features at a lr that doesn't explode\nXraw = np.column_stack([np.ones(len(beds)), beds.astype(float), age.astype(float)])\nw_raw = np.zeros(3)\nfor _ in range(400):\n    err = Xraw @ w_raw - price.astype(float)\n    grad = (2.0 / len(price)) * (Xraw.T @ err)\n    w_raw = w_raw - 1e-7 * grad   # biggest safe lr for raw data\nloss_raw = float(np.mean((Xraw @ w_raw - price.astype(float)) ** 2))\nassert loss_scaled < 0.15, f\"scaled run should fit well, got {loss_scaled}\"\nassert loss_raw > loss_scaled * 3, f\"raw run at its safe lr should lag badly, got {loss_raw}\"\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "One Batch at a Time", pattern: "mini-batch", skill: "trade exactness for speed",
    statement: "Full-batch GD reads all 24 points for every step. Mini-batch GD splits the data into batches of 8 and takes one update per batch — 3 updates per epoch. Implement the inner loop over fixed (non-shuffled) batches: after 30 epochs, report loss_mb. The update math inside a batch is identical, just on a slice.",
    examples: [
      { input: "24 points, batch 8", output: "3 gradient steps per epoch", explain: "cheaper steps, noisier direction" },
    ],
    why: "Real datasets have millions of rows; computing an exact full-batch gradient for every step is unaffordable. Mini-batches make each step cheap and slightly wrong — the noise averages out over many steps, and the extra steps are a bargain. This is the loop every deep-learning framework runs: for each epoch, for each batch, step. We keep the batch order fixed here so your results are deterministic; real frameworks shuffle (with a seed) so batches don't see the same order every epoch.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nn = len(x)\nw, b = 0.0, 0.0\nlr = 0.05\nbatch = 8\n\nfor epoch in range(30):\n    for start in range(0, n, batch):\n        xb = x[start:start + batch]\n        yb = y[start:start + batch]\n        ...  # one GD step on the slice only\n        pass\n\nloss_mb = float(np.mean((w * x + b - y) ** 2))",
    hints: [
      "The slice IS a small dataset: err = w*xb + b - yb.",
      "Mean over the slice: m = len(xb); gw = (2/m) * np.sum(err * xb).",
      "Update w and b inside the inner loop; nothing changes per epoch.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nn = len(x)\nw, b = 0.0, 0.0\nlr = 0.05\nbatch = 8\n\nfor epoch in range(30):\n    for start in range(0, n, batch):\n        xb = x[start:start + batch]\n        yb = y[start:start + batch]\n        m = len(xb)\n        err = w * xb + b - yb\n        gw = (2.0 / m) * np.sum(err * xb)\n        gb = (2.0 / m) * np.sum(err)\n        w -= lr * gw\n        b -= lr * gb\n\nloss_mb = float(np.mean((w * x + b - y) ** 2))",
    walkthrough: "The two loops are the epoch structure of all of modern ML. Inside, the mathematics is unchanged — same gradient, same update, just on 8 points instead of 24. The step direction is noisier (8 points is a rougher estimate of the true slope), but you take 3 steps per epoch instead of 1, and the noise averages away over 90 steps. When loss plateaus in real training, practitioners reach for: more epochs, more data, or an optimizer that remembers (next problem). Note what made this deterministic: fixed batch order, no shuffle, fixed init.",
    testCode: "assert loss_mb < 0.2, f\"mini-batch should converge, got {loss_mb}\"\nassert abs(w - 3.0) < 0.35 and abs(b - 2.0) < 0.6, (w, b)\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Remember the Push", pattern: "momentum", skill: "average recent gradients",
    diagram: `   plain:    ●···●···●···●         zig-zags across the ravine
   momentum: ●→●→●→●→●             v carries the floor direction

     v = β·v − η·slope
     w ← w + v        ravine walls cancel · floor speed adds up`,
    statement: "Plain GD crawls along valley_world's shallow direction: the optimal slope is w = 30, but x barely moves, so the loss surface is a long flat canyon — legal steps barely change w. Add momentum: v = beta * v - lr * grad; w += v. Implement gd_momentum(beta, steps=150, lr=0.4) returning the final loss. Run beta=0 (plain) and beta=0.9; momentum must land far lower — pushes along the canyon add up, oscillations cancel.",
    examples: [
      { input: "beta = 0", output: "w crawls toward 30, loss still high after 150 steps", explain: "no memory, tiny steps along the flat" },
      { input: "beta = 0.9", output: "w reaches 30, loss at the noise floor", explain: "consistent pushes accumulate ×10" },
    ],
    why: "Momentum is the first 'optimizer with memory'. The velocity v accumulates a running average of recent gradients: components that flip every step (zigzag across the canyon) cancel each other; components that consistently point downhill (along the canyon) reinforce. The result is faster convergence on elongated loss surfaces — which real ones always are. Adam, the default optimizer of deep learning (Stage 8), is built on exactly this idea plus per-knob scaling.",
    starterCode: "import numpy as np\n\nx, y = valley_world()   # data whose loss surface has a narrow canyon\nn = len(x)\n\ndef gd_momentum(beta, steps=150, lr=0.4):\n    w, b = 0.0, 0.0\n    vw, vb = 0.0, 0.0\n    for _ in range(steps):\n        err = w * x + b - y\n        gw = (2.0 / n) * np.sum(err * x)\n        gb = (2.0 / n) * np.sum(err)\n        ...  # velocity update, then parameter update\n        pass\n    return float(np.mean((w * x + b - y) ** 2))\n\nloss_plain = None    # gd_momentum(0.0)\nloss_mom = None      # gd_momentum(0.9)",
    hints: [
      "Velocity: vw = beta * vw - lr * gw (note: minus, the push is against the gradient).",
      "Then move: w = w + vw.",
      "beta=0 makes vw = -lr*grad — exactly plain GD. One formula covers both.",
    ],
    solution: "import numpy as np\n\nx, y = valley_world()\nn = len(x)\n\ndef gd_momentum(beta, steps=150, lr=0.4):\n    w, b = 0.0, 0.0\n    vw, vb = 0.0, 0.0\n    for _ in range(steps):\n        err = w * x + b - y\n        gw = (2.0 / n) * np.sum(err * x)\n        gb = (2.0 / n) * np.sum(err)\n        vw = beta * vw - lr * gw\n        vb = beta * vb - lr * gb\n        w = w + vw\n        b = b + vb\n    return float(np.mean((w * x + b - y) ** 2))\n\nloss_plain = gd_momentum(0.0)\nloss_mom = gd_momentum(0.9)",
    walkthrough: "One line of memory turns a zigzagger into a glider. With beta=0, vw = -lr·g — plain GD. With beta=0.9, each new push is 10% the last velocity plus the fresh gradient: oscillating components (the canyon walls) alternate sign and die out; consistent components (the canyon floor) accumulate up to 10× the plain step. The physics picture is a heavy ball rolling with friction. This 'average recent gradients' move is half of Adam — when you meet the real optimizers, you will recognize the machinery.",
    testCode: "assert loss_plain > loss_mom, (loss_plain, loss_mom)\nassert loss_plain > 0.3, f\"plain GD should still be crawling, got {loss_plain}\"\nassert loss_mom < 0.05, f\"momentum should nearly converge, got {loss_mom}\"\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "The Held-Out Judge", pattern: "train-val-split", skill: "stop when the judge frowns",
    statement: "Fit the line on the first 18 points of line_world; keep the last 6 as validation (never trained on). For every step of 200, record train loss and val loss. Report best_w, best_b — the parameters at the step where val loss was LOWEST — and val_at_best. Training loss only ever falls; the val curve is the honest one.",
    examples: [
      { input: "train 18 pts, watch 6 held out", output: "best step ≈ when val bottoms out", explain: "early stopping by evidence" },
    ],
    why: "The training loss is a student grading their own homework — it only ever improves. The validation set is the mock exam: same world, unseen questions. The gap between the two curves is the first face of generalization (Stage 4 goes deep). Recording the parameters at the val minimum — early stopping — is the cheapest regularizer in existence: no math, just a checkpoint. From now on, every experiment in this ladder is judged on held-out data, not training data.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nx_tr, y_tr = x[:18], y[:18]\nx_va, y_va = x[18:], y[18:]\nn = len(x_tr)\nw, b = 0.0, 0.0\nlr = 0.02\n\nbest_val = float(\"inf\")\nbest_w, best_b, best_step = 0.0, 0.0, 0\nval_at_best = None\n\nfor step in range(200):\n    ...  # one full-batch GD step on TRAIN only\n    tr = float(np.mean((w * x_tr + b - y_tr) ** 2))\n    va = float(np.mean((w * x_va + b - y_va) ** 2))\n    if va < best_val:  # checkpoint the judge's favorite\n        best_val, best_w, best_b, best_step = va, w, b, step\n        pass\n\nval_at_best = best_val",
    hints: [
      "The GD step uses x_tr, y_tr only — the val set is never in a gradient.",
      "After each step, compute va on x_va, y_va (no update from it).",
      "The if-va-less-than-best block should copy w and b into best_w, best_b.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nx_tr, y_tr = x[:18], y[:18]\nx_va, y_va = x[18:], y[18:]\nn = len(x_tr)\nw, b = 0.0, 0.0\nlr = 0.02\n\nbest_val = float(\"inf\")\nbest_w, best_b, best_step = 0.0, 0.0, 0\nval_at_best = None\n\nfor step in range(200):\n    err = w * x_tr + b - y_tr\n    gw = (2.0 / n) * np.sum(err * x_tr)\n    gb = (2.0 / n) * np.sum(err)\n    w -= lr * gw\n    b -= lr * gb\n    tr = float(np.mean((w * x_tr + b - y_tr) ** 2))\n    va = float(np.mean((w * x_va + b - y_va) ** 2))\n    if va < best_val:\n        best_val, best_w, best_b, best_step = va, w, b, step\n\nval_at_best = best_val",
    walkthrough: "The val set never touches a gradient — it only ever grades. Two curves result: train loss (falls forever) and val loss (falls, flattens, and for noisier models would rise again — the overfitting signature Stage 4 magnifies with polynomials). Snapshotting (w, b) at the val minimum is early stopping: keep the model the judge liked best, not the one with the lowest homework score. For a 2-parameter line, val barely rises after convergence — but for the 9-degree polynomial of Problem 22 and the nets of Stage 8, this exact checkpoint is the difference between a model that works and one that memorized.",
    testCode: "assert val_at_best is not None and best_val == val_at_best\nassert best_step < 200 and abs(best_w - 3.0) < 0.3 and abs(best_b - 2.0) < 0.5, (best_w, best_b)\n# the held-out judge must agree the model is good: val loss near the noise floor\nassert val_at_best < 0.2, val_at_best\nprint('All tests passed!')"
  },

  // ══ STAGE 3 — The Bend ══
  {
    id: 16, stage: 3, title: "The Squash", pattern: "sigmoid", skill: "any number into (0, 1)",
    statement: "Implement sigmoid(z) = 1 / (1 + e^−z), numerically safe for very large |z| (subtract-in-exponent or branch on sign — never let e^1000 overflow). Verify: sigmoid(0) = 0.5, sigmoid(±1000) lands at 0 or 1 without warnings, sigmoid(−z) + sigmoid(z) = 1. This function turns any score into a probability.",
    examples: [
      { input: "z = 0", output: "0.5", explain: "perfectly undecided" },
      { input: "z = 4", output: "≈ 0.982", explain: "strongly yes" },
      { input: "z = −4", output: "≈ 0.018", explain: "strongly no" },
    ],
    why: "Classification needs probabilities, but linear models emit unbounded scores. The sigmoid is the bridge: it squashes (−∞, +∞) into (0, 1) monotonically — bigger score, higher probability, order preserved. The numerical trap is real: np.exp(1000) overflows to inf. Production sigmoids branch on sign (compute e^|z| in the stable side) or use scipy's expit. You will reuse this exact function inside the neural net of Stage 7 — a neuron is literally a linear model followed by a sigmoid.",
    starterCode: "import numpy as np\n\ndef sigmoid(z):\n    ...  # numerically stable\n    pass",
    hints: [
      "Naive: 1 / (1 + np.exp(-z)) — overflows for very negative z.",
      "Stable trick: for z >= 0 use 1/(1+exp(−z)); for z < 0 use exp(z)/(1+exp(z)).",
      "np.where can pick per element — but compute BOTH branches safely first.",
    ],
    solution: "import numpy as np\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out",
    walkthrough: "Two properties make the sigmoid the bridge between scores and probability: monotonicity (order of scores = order of probabilities) and the identity σ(−z) = 1 − σ(z) (the tests check it — it means one logit serves both classes). The stability branch looks fussy but is a professional reflex: for z = −800, exp(−z) is inf and the naive formula returns 0/inf = 0 after a warning; the branch returns exactly the right value with no warning. Stage 7's forward pass and Stage 8's backprop reuse this function verbatim.",
    testCode: "z = np.array([-1000., -4., 0., 4., 1000.])\ns = sigmoid(z)\nassert np.all(np.isfinite(s))\nassert np.isclose(s[2], 0.5)\nassert abs(s[1] - 0.017986209962091559) < 1e-9\nassert np.allclose(s + sigmoid(-z), 1.0)\nassert np.all(np.diff(s) > 0), \"monotonic\"\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 3, title: "Score a Probability", pattern: "bce-loss", skill: "surprise is the unit of error",
    statement: "Implement bce(y, p): the binary cross-entropy −mean(y·log(p) + (1−y)·log(1−p)), with probabilities clipped into [1e−12, 1−1e−12] first (log of 0 is −inf). Evaluate on spam_world: loss_good for the model's scores, loss_bad for (1 − scores) — confidently wrong must hurt far more.",
    examples: [
      { input: "y=1, p=0.99", output: "loss ≈ 0.01", explain: "confidently right ≈ free" },
      { input: "y=1, p=0.01", output: "loss ≈ 4.6", explain: "confidently wrong costs −log(0.01)" },
    ],
    why: "Cross-entropy is the pricing system for probability: you pay −log(p) when the truth is 1 and you said p. Say 0.99 and you're right — you pay 0.01. Say 0.01 — you pay 4.6. The logarithm makes confident mistakes astronomically expensive while small hesitations cost almost nothing, which is exactly the incentive a classifier should have. Clipping the input is the numerical twin of sigmoid stability: p is never exactly 0 or 1 in floating point, but e^−1000 rounds to 0.0 and log(0) destroys the loss.",
    starterCode: "import numpy as np\n\nscores, y = spam_world()\n\ndef bce(y, p):\n    ...  # clip, then −mean(y·log p + (1−y)·log(1−p))\n    pass\n\nloss_good = bce(y, scores)\nloss_bad = bce(y, 1.0 - scores)",
    hints: [
      "p = np.clip(p, 1e-12, 1 - 1e-12) before any log.",
      "The formula is literal: -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)).",
      "y is 0/1, so y·log p selects the right term per example.",
    ],
    solution: "import numpy as np\n\nscores, y = spam_world()\n\ndef bce(y, p):\n    p = np.clip(p, 1e-12, 1.0 - 1e-12)\n    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))\n\nloss_good = bce(y, scores)\nloss_bad = bce(y, 1.0 - scores)",
    walkthrough: "BCE = average surprise, measured in nats. Two habits to keep forever. First, the clip: p lives in floating point, and a score like e^−800 rounds to 0.0; log(0) = −inf poisons the mean — the clip bounds the surprise instead of crashing. Second, the (1−y) trick: instead of an if per example, the algebra selects the correct term — y·log p vanishes for y=0, (1−y)·log(1−p) vanishes for y=1. One expression, both cases. The tests demand loss_bad > 5 × loss_good: a confidently-wrong model must be visibly punished — that asymmetry is what BCE is for.",
    testCode: "assert np.isfinite(loss_good) and np.isfinite(loss_bad)\nassert loss_good < 0.6, f\"good scores should be cheap, got {loss_good}\"\nassert loss_bad > 5 * loss_good, (loss_good, loss_bad)\n# the clip must save us from log(0)\nassert bce(np.array([1.0]), np.array([0.0])) > 0 and np.isfinite(bce(np.array([1.0]), np.array([0.0])))\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 3, title: "Descend a Different Loss", pattern: "logistic-gd", skill: "same loop, new gradient",
    statement: "Logistic regression: p = sigmoid(Xb @ w) where Xb carries a bias column. Train it on exam_world with 800 full-batch steps at lr=0.5, minimizing BCE — the gradient is Xbᵀ @ (p − y) / n (given; deriving it is Stage 8's joy). Report acc = fraction of training points with (p > 0.5) == y. A line, bent into a boundary.",
    examples: [
      { input: "p = [0.9, 0.2, 0.6], y = [1, 0, 0]", output: "preds [1, 0, 1], acc 2/3", explain: "0.5 is the decision line" },
    ],
    why: "Notice what did NOT change from Stage 1: the training loop. Predict → loss → gradient → step — only the hypothesis (sigmoid squashes the linear score) and the gradient (BCE's instead of MSE's) are new. This is the deepest pattern in the ladder: learning is one loop; models are plug-in hypotheses and gradients. The decision rule p > 0.5 is the 45° contour where the sigmoid crosses 0.5, i.e. where Xb @ w = 0 — a line in feature space, bent by the squash.",
    starterCode: "import numpy as np\n\nX, y = exam_world()\nXb = np.column_stack([np.ones(len(X)), X])\nn, d = Xb.shape\nw = np.zeros(d)\nlr = 0.5\n\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nfor _ in range(800):\n    ...  # p = sigmoid(Xb @ w); grad = Xbᵀ(p − y)/n; w -= lr·grad\n    pass\n\nacc = None  # fraction where (p > 0.5) == y on the final p",
    hints: [
      "Inside the loop: p = sigmoid(Xb @ w).",
      "grad = (Xb.T @ (p - y)) / n — the given gradient of BCE.",
      "After training, recompute p, then preds = (p > 0.5).",
      "acc = float(np.mean(preds == y)).",
    ],
    solution: "import numpy as np\n\nX, y = exam_world()\nXb = np.column_stack([np.ones(len(X)), X])\nn, d = Xb.shape\nw = np.zeros(d)\nlr = 0.5\n\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nfor _ in range(800):\n    p = sigmoid(Xb @ w)\n    grad = (Xb.T @ (p - y)) / n\n    w -= lr * grad\n\np = sigmoid(Xb @ w)\nacc = float(np.mean((p > 0.5).astype(float) == y))",
    walkthrough: "The exam world's two features (hours studied, hours slept) separate pass/fail well enough that a straight boundary achieves high accuracy — the training here pushes BCE down until the boundary settles between the classes. Three carry-forwards. First, gradient shape discipline: Xb is (n, d), (p − y) is (n,), so Xbᵀ @ (p−y) is (d,) — matching w; shape errors are where all backprop bugs live. Second, threshold 0.5 is a choice, not a law — Problem 19 moves it. Third, Stage 8 derives the gradient you just trusted, and the numeric probe will confirm it.",
    testCode: "assert acc is not None and acc >= 11/12, f\"exam world is separable — got acc={acc}\"\n# boundary sanity: weights finite, and predictions split the world\nassert np.all(np.isfinite(w))\np = sigmoid(Xb @ w)\npreds = (p > 0.5).astype(float)\nassert np.mean(preds == y) == acc\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "Slide the Threshold", pattern: "threshold-tradeoff", skill: "buy recall with precision",
    diagram: `   scores:  ● · ● · ○ │ ○ · ○ · ●        │ = cutoff t
                       │
              slide t  ◀━━━━━▶  and watch the trade flip
     t high:  few alarms · misses fraud    (precision ↑ recall ↓)
     t low:   catches fraud · false alarms (precision ↓ recall ↑)
     the model outputs probabilities — YOU pick the operating point`,
    statement: "spam_world gives model scores and true labels (1 = spam). At threshold t, predict spam when score ≥ t. Implement counts(t) returning (tp, fp, fn, tn) and report them at t=0.5, then precision_03 / recall_03 at t=0.3 and precision_07 / recall_07 at t=0.7. Watch the trade: lower the bar, catch more spam, sound more false alarms.",
    examples: [
      { input: "t = 0.3 (loose)", output: "recall rises, precision falls", explain: "more flagged, more falsely flagged" },
      { input: "t = 0.7 (strict)", output: "precision rises, recall falls", explain: "fewer flagged, more missed spam" },
    ],
    why: "The threshold is where a probability becomes a decision, and moving it reallocates two error types you can never shrink together. Spam: a false positive (real mail in the junk folder) is worse than a false negative (spam in the inbox) — bias strict. Cancer screening: a miss is far worse — bias loose. There is no universal threshold; there is only the cost ratio of the two mistakes, which is a business decision encoded as one number. Precision and recall are how you SEE the trade; Stage 9 formalizes it with ROC.",
    starterCode: "import numpy as np\n\nscores, y = spam_world()\n\ndef counts(t):\n    ...  # predict spam when score >= t; return tp, fp, fn, tn\n    pass\n\ntp5, fp5, fn5, tn5 = counts(0.5)\n\ndef precision_recall(t):\n    tp, fp, fn, tn = counts(t)\n    precision = tp / (tp + fp) if (tp + fp) else 0.0\n    recall = tp / (tp + fn) if (tp + fn) else 0.0\n    return precision, recall\n\nprecision_03, recall_03 = precision_recall(0.3)\nprecision_07, recall_07 = precision_recall(0.7)",
    hints: [
      "preds = (scores >= t).astype(int).",
      "tp: pred 1 & truth 1; fp: pred 1 & truth 0; fn: pred 0 & truth 1; tn: pred 0 & truth 0.",
      "Masks make each count one expression: int(np.sum(preds & (y == 1))) etc.",
    ],
    solution: "import numpy as np\n\nscores, y = spam_world()\n\ndef counts(t):\n    preds = (scores >= t).astype(int)\n    tp = int(np.sum((preds == 1) & (y == 1)))\n    fp = int(np.sum((preds == 1) & (y == 0)))\n    fn = int(np.sum((preds == 0) & (y == 1)))\n    tn = int(np.sum((preds == 0) & (y == 0)))\n    return tp, fp, fn, tn\n\ntp5, fp5, fn5, tn5 = counts(0.5)\n\ndef precision_recall(t):\n    tp, fp, fn, tn = counts(t)\n    precision = tp / (tp + fp) if (tp + fp) else 0.0\n    recall = tp / (tp + fn) if (tp + fn) else 0.0\n    return precision, recall\n\nprecision_03, recall_03 = precision_recall(0.3)\nprecision_07, recall_07 = precision_recall(0.7)",
    walkthrough: "Four counts, one truth table: predicted-vs-actual. Precision asks 'of what I flagged, how much was real?' — purity of the alarm. Recall asks 'of what was real, how much did I catch?' — coverage of the net. Lowering t moves items from fn to tp AND from tn to fp simultaneously: recall up, precision down; the trade is structural, not a bug. The spam world's scores are deliberately imperfect so all four counts are nonzero at 0.5 — a perfect model would make this lesson invisible.",
    testCode: "assert tp5 + fp5 + fn5 + tn5 == len(y)\nassert tp5 >= 0 and fp5 >= 0 and fn5 >= 0 and tn5 >= 0\nassert recall_03 >= recall_07, (recall_03, recall_07)\nassert precision_07 >= precision_03, (precision_03, precision_07)\n# at a very loose threshold, recall must be perfect and precision drops\np00, r00 = precision_recall(0.0)\nassert r00 == 1.0 and p00 < 1.0\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "The 95% Mirage", pattern: "imbalance", skill: "distrust accuracy on tilted data",
    statement: "fraud_world: 200 transactions, only 10 fraudulent. fit_majority predicts 'not fraud' for everything (no learning at all). Report acc_majority (accuracy of that lazy model), and recall_fraud of the lazy model. Then implement balanced_error = mean of the two class errors (missed-fraud rate and false-fraud rate) — the honest score when classes tilt.",
    examples: [
      { input: "195 legit, 5 fraud, predict all legit", output: "accuracy 97.5%, recall 0%", explain: "impressive number, useless model" },
    ],
    why: "Imbalanced data is the default in the wild: fraud, defects, rare diseases, churn. Accuracy hides inside it — a model that always says 'no' scores 95% while catching zero frauds. The lazy model here is a baseline: any real model must beat it where it matters (recall on the rare class), not on the headline accuracy. Balanced error prices the two classes equally, refusing to let the majority hide the minority. Every '97% accurate!' claim you ever read deserves this test.",
    starterCode: "import numpy as np\n\nXf, yf = fraud_world()   # 200 rows; yf=1 marks the 10 frauds\n\npreds = np.zeros(len(yf))  # the lazy majority model\n\nacc_majority = None\nrecall_fraud = None\n\nerr_1 = None  # fraction of frauds missed\nerr_0 = None  # fraction of legit flagged\nbalanced_error = None",
    hints: [
      "acc_majority = np.mean(preds == yf) — it will look impressive.",
      "recall_fraud: of the frauds (yf==1), how many did the model catch?",
      "err_1 = 1 − recall_fraud; err_0 = fraction of yf==0 predicted 1.",
      "balanced_error = (err_1 + err_0) / 2.",
    ],
    solution: "import numpy as np\n\nXf, yf = fraud_world()\n\npreds = np.zeros(len(yf))\n\nacc_majority = float(np.mean(preds == yf))\nrecall_fraud = float(np.mean(preds[yf == 1] == 1))\n\nerr_1 = float(np.mean(preds[yf == 1] != 1))\nerr_0 = float(np.mean(preds[yf == 0] != 0))\nbalanced_error = (err_1 + err_0) / 2.0",
    walkthrough: "The lazy model scores 95% accuracy and 0% recall — it has learned the class ratio, not the fraud pattern. Every metric choice is a stance: accuracy lets the 190 legit rows outvote the 10 frauds; recall looks ONLY at the frauds; balanced error forces both classes to contribute half the score, so 'never flag anything' scores a mediocre 0.5, not a heroic 0.95. In practice: stratify your splits, pick metrics before training, and treat any accuracy claim without the class ratios as marketing.",
    testCode: "assert np.isclose(acc_majority, 0.95)\nassert recall_fraud == 0.0\nassert err_1 == 1.0 and err_0 == 0.0\nassert np.isclose(balanced_error, 0.5)\nprint('All tests passed!')"
  },

  // ══ STAGE 4 — The Judge ══
  {
    id: 21, stage: 4, title: "Grade on Unseen Data", pattern: "holdout", skill: "the exam is not the homework",
    statement: "Split line_world: first 12 points train, last 12 test. Fit the line by closed form on TRAIN only, then report train_mse and test_mse. They will be close — same world, honest model — but test_mse is the only number a stranger would believe. From here on, every claim in this ladder is graded on held-out data.",
    examples: [
      { input: "train on 12, test on 12 (never seen)", output: "train_mse ≈ test_mse ≈ noise floor", explain: "honest model, honest gap" },
    ],
    why: "The training loss is computed by the very data that chose the parameters — it is a homework grade, systematically optimistic. The test set answers a different question: 'how wrong will this be on data it has never influenced?' For a 2-parameter line on a linear world the gap is small; for the 9-degree polynomial of the next problem it is catastrophic. The discipline being installed: fit on train, report on test, never let the two touch.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nx_tr, y_tr = x[:12], y[:12]\nx_te, y_te = x[12:], y[12:]\n\nones = np.ones(len(x_tr))\nXb = np.column_stack([ones, x_tr])\nw_vec = None   # closed-form fit on TRAIN only\n\ntrain_mse = None\ntest_mse = None",
    hints: [
      "Fit exactly like Problem 10, but with x_tr/y_tr only.",
      "Predict with the SAME w_vec on both splits: Xb @ w_vec.",
      "test_mse uses x_te — build its own design matrix, predict, mse.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nx_tr, y_tr = x[:12], y[:12]\nx_te, y_te = x[12:], y[12:]\n\nXb_tr = np.column_stack([np.ones(len(x_tr)), x_tr])\nw_vec = np.linalg.solve(Xb_tr.T @ Xb_tr, Xb_tr.T @ y_tr)\n\ntrain_mse = float(np.mean((Xb_tr @ w_vec - y_tr) ** 2))\nXb_te = np.column_stack([np.ones(len(x_te)), x_te])\ntest_mse = float(np.mean((Xb_te @ w_vec - y_te) ** 2))",
    walkthrough: "Same weights, two grades. The train grade benefits from a conspiracy: those 12 points voted for w_vec, so their residuals are nudged toward zero. The test grade has no such conspiracy — it estimates the loss on FUTURE data from the same world. When the model is honest (2 parameters, linear world), the two grades agree — and that agreement is the certificate of a well-posed model. When they disagree, the gap itself is the diagnosis: the next problem makes the disagreement scream.",
    testCode: "assert train_mse < 0.2 and test_mse < 0.2, (train_mse, test_mse)\nassert test_mse > 0.7 * train_mse, (train_mse, test_mse)\nassert test_mse < 5.0 * train_mse + 1e-9, (train_mse, test_mse)\n# the fit must not have seen the test rows\nXb_te = np.column_stack([np.ones(len(x_te)), x_te])\nassert np.allclose(Xb_te @ w_vec, w_vec[1] * x_te + w_vec[0])\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 4, title: "Buy Fit, Pay Generalization", pattern: "overfitting", skill: "more capacity, less truth",
    diagram: `   degree 1  ─────────      too simple: misses the bend (bias)
   degree 3  ⌒⌒⌒            follows the true curve (sweet spot)
   degree 9  ∿∿∿∿∿∿∿        threads every noisy point (variance)

     train error ↓ always  ·  test error ↓ … then ↑`,
    statement: "quad_world: 9 training points from a curve plus noise, 5 test points from the same recipe. Fit polynomials of degree 1, 3, and 9 (np.vander(x, d+1) builds the design matrix; np.linalg.lstsq handles the rank-deficient degree-9 case). Report train_mses and test_mses as dicts keyed 1, 3, 9. Watch: training error falls with degree; test error falls, then explodes.",
    examples: [
      { input: "degree 1", output: "big train error, mediocre test error", explain: "underfit: the model is too stiff" },
      { input: "degree 9 on 9 points", output: "train error ≈ 0, test error huge", explain: "the polynomial threads the noise exactly" },
    ],
    why: "Capacity is the model's freedom to wiggle. A degree-9 polynomial through 9 points has one coefficient per point — enough freedom to pass through every noisy reading exactly (interpolation), which is memorization, not learning. The train curve and the test curve split apart exactly where memorization begins: this gap IS overfitting, watched live. The cure is not always a smaller model — sometimes it's a penalty (next problem) or more data — but you must first SEE the two curves fork.",
    starterCode: "import numpy as np\n\nx_tr, y_tr, x_te, y_te = quad_world()\n\ntrain_mses = {}\ntest_mses = {}\nfor d in [1, 3, 9]:\n    V_tr = np.vander(x_tr, d + 1)   # columns: x^d ... x^1, x^0\n    V_te = np.vander(x_te, d + 1)\n    coef = None   # least-squares fit of V_tr -> y_tr\n    train_mses[d] = None\n    test_mses[d] = None",
    hints: [
      "coef, *_ = np.linalg.lstsq(V_tr, y_tr, rcond=None) — returns the fit.",
      "train_mses[d] = mse of V_tr @ coef vs y_tr.",
      "Same coef, graded on V_te @ coef vs y_te.",
    ],
    solution: "import numpy as np\n\nx_tr, y_tr, x_te, y_te = quad_world()\n\ntrain_mses = {}\ntest_mses = {}\nfor d in [1, 3, 9]:\n    V_tr = np.vander(x_tr, d + 1)\n    V_te = np.vander(x_te, d + 1)\n    coef, *_ = np.linalg.lstsq(V_tr, y_tr, rcond=None)\n    train_mses[d] = float(np.mean((V_tr @ coef - y_tr) ** 2))\n    test_mses[d] = float(np.mean((V_te @ coef - y_te) ** 2))",
    walkthrough: "Three fits, one world. Degree 1 is too stiff: it misses the curve, so both errors stay high — underfitting. Degree 3 matches the true recipe: both errors near the noise floor — the sweet spot. Degree 9 threads every noisy training point exactly (train error ≈ 0) but between those points it swings wildly, so test error explodes — overfitting, witnessed. The U-shape of test error vs capacity is the most reproduced curve in ML; every model family, from trees to transformers, has a knob that traces it. Next problem: instead of shrinking the model, tax the wiggles.",
    testCode: "assert set(train_mses) == {1, 3, 9} and set(test_mses) == {1, 3, 9}\nassert train_mses[9] < train_mses[1] and train_mses[9] < train_mses[3]\nassert train_mses[9] < 0.05, f\"degree 9 should nearly interpolate, got {train_mses[9]}\"\nassert test_mses[9] > 4 * test_mses[3], (test_mses[1], test_mses[3], test_mses[9])\nassert test_mses[3] < test_mses[1] * 1.2, (test_mses[3], test_mses[1])\nassert test_mses[3] < 0.3\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 4, title: "Tax the Wiggles", pattern: "l2-ridge", skill: "penalize size, not count",
    statement: "Ridge regression on the degree-9 problem: minimize ‖V·w − y‖² + λ·‖w_no_bias‖². The penalty changes the normal equations to (VᵀV + λ·P)·w = Vᵀy where P is the identity with P[0,0] = 0 (never tax the intercept). With λ = 0.5, fit ridge_coef on the 9 training points; report ridge_test_mse and the weight norm before vs after. Same 9 points, same degree — different behavior.",
    examples: [
      { input: "λ = 0, degree 9", output: "huge weights, wild test predictions", explain: "the memorizing solution" },
      { input: "λ = 0.5", output: "weights shrunk, test predictions tame", explain: "no free wiggle" },
    ],
    why: "L2 regularization adds a price tag proportional to each weight's size. A degree-9 polynomial memorizes noise by growing enormous cancelling coefficients (+900 on one term, −890 on the next); the tax makes that payroll unaffordable, so the fit settles for smaller weights and smoother shapes — and generalizes. Note what is taxed: size, not the number of terms (that would be L1's job, producing sparsity). Ridge has a closed form — it is linear regression with a firmed-up matrix — which is why it ships in every ML library as one argument.",
    starterCode: "import numpy as np\n\nx_tr, y_tr, x_te, y_te = quad_world()\nV_tr = np.vander(x_tr, 10)\nV_te = np.vander(x_te, 10)\nlam = 0.5\n\nplain_coef, *_ = np.linalg.lstsq(V_tr, y_tr, rcond=None)\n\nP = np.eye(10); P[0, 0] = 0.0      # do not tax the intercept\nridge_coef = None                   # solve (VᵀV + λP) w = Vᵀy\n\nnorm_plain = None                   # ‖plain_coef‖\nnorm_ridge = None                   # ‖ridge_coef‖\nridge_test_mse = None",
    hints: [
      "A = V_tr.T @ V_tr + lam * P; rhs = V_tr.T @ y_tr.",
      "ridge_coef = np.linalg.solve(A, rhs).",
      "Norms: np.linalg.norm(coef). Test mse as in Problem 22.",
    ],
    solution: "import numpy as np\n\nx_tr, y_tr, x_te, y_te = quad_world()\nV_tr = np.vander(x_tr, 10)\nV_te = np.vander(x_te, 10)\nlam = 0.5\n\nplain_coef, *_ = np.linalg.lstsq(V_tr, y_tr, rcond=None)\n\nP = np.eye(10); P[0, 0] = 0.0\nA = V_tr.T @ V_tr + lam * P\nrhs = V_tr.T @ y_tr\nridge_coef = np.linalg.solve(A, rhs)\n\nnorm_plain = float(np.linalg.norm(plain_coef))\nnorm_ridge = float(np.linalg.norm(ridge_coef))\nridge_test_mse = float(np.mean((V_te @ ridge_coef - y_te) ** 2))",
    walkthrough: "One matrix addition turns memorization into moderation. The λP term adds λ to every diagonal entry except the intercept's — so any solution that leans on huge weights must now PAY for them, and the solver prefers smaller weights unless the data genuinely demands otherwise. The tax rebalances bias and variance: slightly worse on train, dramatically better on test. Two forever-lessons: (1) regularization is a dial (λ) you tune on validation data, never on test; (2) 'weights near zero' is the fingerprint of a healthy ridge — if ridge changes nothing, your model wasn't overfitting.",
    testCode: "assert norm_ridge < norm_plain, (norm_plain, norm_ridge)\nplain_test = float(np.mean((V_te @ plain_coef - y_te) ** 2))\nassert ridge_test_mse < plain_test, (ridge_test_mse, plain_test)\nassert ridge_test_mse < 0.5, ridge_test_mse\nassert np.isfinite(ridge_coef).all()\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "Judge Four Ways", pattern: "cross-validation", skill: "average the judge's moods",
    statement: "A single 12/12 split is one opinion. k-fold CV with k=4 on line_world (24 points): fold i (6 points each, in order) is held out; the model fits on the other 18 and grades the fold. Report fold_losses (length 4, in fold order) and cv_mean. One number per fold — the variance across folds is itself a measurement of how much your estimate depends on luck of the split.",
    examples: [
      { input: "24 points, k=4", output: "4 fold losses + their mean", explain: "every point is a test point exactly once" },
    ],
    why: "One split can flatter or slander a model by luck — a few easy test rows and the grade curves. k-fold cross-validation rotates the held-out set so every point serves as test exactly once, and averages the grades: less luck, more truth. It costs k fits, which is why you do it for model SELECTION (choose λ, choose depth, choose features) and then refit on all data. The spread across folds is not noise to ignore — high variance between folds means the model's quality depends heavily on which data it sees.",
    starterCode: "import numpy as np\n\nx, y = line_world()\nn = len(x)\nk = 4\nfold_losses = []\n\nfor i in range(k):\n    ...  # fold i = slice [i*6 : (i+1)*6] held out; fit on the rest; append fold mse\n    pass\n\ncv_mean = None",
    hints: [
      "Use index arrays: idx = np.arange(n); test_idx = idx[i*6:(i+1)*6].",
      "train_idx = everything else: np.concatenate([idx[:i*6], idx[(i+1)*6:]]).",
      "Closed-form fit on the train indices, mse on the fold, append.",
    ],
    solution: "import numpy as np\n\nx, y = line_world()\nn = len(x)\nk = 4\nfold_losses = []\nidx = np.arange(n)\n\nfor i in range(k):\n    te = idx[i * 6:(i + 1) * 6]\n    tr = np.concatenate([idx[:i * 6], idx[(i + 1) * 6:]])\n    Xb_tr = np.column_stack([np.ones(len(tr)), x[tr]])\n    w_vec = np.linalg.solve(Xb_tr.T @ Xb_tr, Xb_tr.T @ y[tr])\n    Xb_te = np.column_stack([np.ones(len(te)), x[te]])\n    fold_losses.append(float(np.mean((Xb_te @ w_vec - y[te]) ** 2)))\n\ncv_mean = float(np.mean(fold_losses))",
    walkthrough: "Rotation is the trick: each of the 4 folds takes one turn as examiner while the other 18 points teach. Four grades instead of one — their mean is steadier, and their spread tells you how split-sensitive the model is. Every leaderboard, every Kaggle score, every '5-fold CV accuracy' you will ever read is this loop. One step upstream of rigor: k-fold is still judged WITHIN one dataset; the final honesty check is a truly untouched test set held out before ANY of this began.",
    testCode: "assert len(fold_losses) == 4\nassert all(l > 0 for l in fold_losses)\nassert np.isclose(cv_mean, np.mean(fold_losses))\nassert cv_mean < 0.5, cv_mean\nassert max(fold_losses) < 5 * min(fold_losses), fold_losses\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "The Leaked Exam", pattern: "leakage", skill: "keep the judge blind",
    statement: "quad_world again, linear model (deliberately wrong-shaped). Honest pipeline: fit on the 9 train points, grade the 5 test points. Leaky pipeline: the test rows accidentally got duplicated into the training set (a joined table, a re-run notebook). Report honest_mse and leaky_mse — the leaky grade flatters the model because the exam questions were in the textbook.",
    examples: [
      { input: "honest: test rows never seen", output: "test_mse ≈ model bias, big", explain: "the true grade" },
      { input: "leaky: test rows also in train", output: "test_mse noticeably smaller", explain: "the fit bent toward the exam" },
    ],
    why: "Leakage is the most expensive silent bug in applied ML: any information from the test world touching the training pipeline — duplicate rows, future timestamps, target-derived features, scalers fit on everything — buys test-set performance that will not exist in production. The model gets BETTER at the exam without getting better at the world. Here the leak is blatant (test rows in train), which makes the flattery measurable; in production it hides in one line of pandas. The defense is procedural: freeze the test set first, touch it once, at the end.",
    starterCode: "import numpy as np\n\nx_tr, y_tr, x_te, y_te = quad_world()\n\n# honest\nV_tr = np.vander(x_tr, 2)\nw_honest = np.linalg.solve(V_tr.T @ V_tr, V_tr.T @ y_tr)\nV_te = np.vander(x_te, 2)\nhonest_mse = float(np.mean((V_te @ w_honest - y_te) ** 2))\n\n# leaky: test rows duplicated into training\nx_leak = np.concatenate([x_tr, x_te, x_te])\ny_leak = np.concatenate([y_tr, y_te, y_te])\n\nV_leak = np.vander(x_leak, 2)\nw_leaky = None\nleaky_mse = None",
    hints: [
      "Fit w_leaky exactly like w_honest, but on V_leak / y_leak.",
      "Grade with the SAME V_te and y_te as the honest pipeline.",
      "The leaky weights bent toward the exam rows — compare the two mses.",
    ],
    solution: "import numpy as np\n\nx_tr, y_tr, x_te, y_te = quad_world()\n\nV_tr = np.vander(x_tr, 2)\nw_honest = np.linalg.solve(V_tr.T @ V_tr, V_tr.T @ y_tr)\nV_te = np.vander(x_te, 2)\nhonest_mse = float(np.mean((V_te @ w_honest - y_te) ** 2))\n\nx_leak = np.concatenate([x_tr, x_te, x_te])\ny_leak = np.concatenate([y_tr, y_te, y_te])\n\nV_leak = np.vander(x_leak, 2)\nw_leaky = np.linalg.solve(V_leak.T @ V_leak, V_leak.T @ y_leak)\nleaky_mse = float(np.mean((V_te @ w_leaky - y_te) ** 2))",
    walkthrough: "The leaky fit saw the exam questions twice each, so the line tilted to please those rows — the test grade improved while the model got WORSE at the world (its training residuals on the honest rows got worse). That inversion — better score, worse model — is the fingerprint of leakage everywhere: impossibly good validation scores that evaporate in production. The quadratic world + linear model is deliberate: with a perfectly-specified model the leak would be invisible, because there'd be no bias for the leaked rows to correct. Real leaks are subtler — but the defense is always the same wall: test data enters exactly one computation, the final grade.",
    testCode: "assert leaky_mse < honest_mse, (honest_mse, leaky_mse)\nassert honest_mse > 0.03, honest_mse\n# the leaky weights genuinely moved toward the exam\nassert not np.allclose(w_honest, w_leaky)\nprint('All tests passed!')"
  },

  // ══ STAGE 5 — Neighbors & Clusters ══
  {
    id: 26, stage: 5, title: "The Nearest Point", pattern: "distance", skill: "closeness is a length",
    statement: "points is (8, 2); query q is one location. Compute dists = Euclidean distance from q to every point (one vectorized expression), nearest = the index of the closest, nearest_d = that distance. kNN, k-means, and embeddings all stand on this one move.",
    examples: [
      { input: "q = [0, 0], point [3, 4]", output: "distance 5", explain: "√(3² + 4²) — Pythagoras" },
    ],
    why: "Represent data as vectors and 'similar' becomes 'nearby'. The Euclidean distance √Σ(xᵢ−qᵢ)² is the workhorse, and NumPy computes it for ALL points at once: subtract (broadcast), square, sum along axis 1, sqrt. No loop, one expression, shape (n,). Argmin turns distances into a decision. This is the entire computational core of nearest-neighbor search, clustering, and retrieval systems.",
    starterCode: "import numpy as np\n\npoints = np.array([[0., 0.], [3., 4.], [1., 1.], [6., 8.],\n                   [2., 2.], [5., 0.], [0., 3.], [7., 7.]])\nq = np.array([0.8, 1.7])\n\ndists = None     # shape (8,)\nnearest = None   # index of the closest point\nnearest_d = None # its distance",
    hints: [
      "points - q broadcasts q across all 8 rows.",
      "Square, sum over axis=1, np.sqrt — in that order.",
      "np.argmin(dists) gives the index; dists[nearest] the distance.",
    ],
    solution: "import numpy as np\n\npoints = np.array([[0., 0.], [3., 4.], [1., 1.], [6., 8.],\n                   [2., 2.], [5., 0.], [0., 3.], [7., 7.]])\nq = np.array([0.8, 1.7])\n\ndists = np.sqrt(np.sum((points - q) ** 2, axis=1))\nnearest = int(np.argmin(dists))\nnearest_d = float(dists[nearest])",
    walkthrough: "Read the expression as a pipeline: (points − q) shifts the world so q sits at the origin; ** 2 makes every displacement positive; sum(axis=1) collapses each row to one number — the squared distance; sqrt restores Pythagoras. Argmin closes the deal. Notice the (n, 2) − (2,) broadcast from Problem 3 doing real work. One performance note you'll meet in production: squared distances order identically to true distances, so systems often skip the sqrt entirely.",
    testCode: "assert dists.shape == (8,)\nassert np.isclose(dists[1], np.sqrt(10.13)) and np.isclose(dists[3], np.sqrt(66.73))\nassert np.isclose(dists[2], np.sqrt(0.53), atol=1e-12)\nassert np.allclose(dists, np.sqrt(((points - q) ** 2).sum(axis=1)))\nassert nearest == 2, nearest\nassert np.isclose(nearest_d, np.sqrt(0.53))\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 5, title: "Let the Neighbors Vote", pattern: "knn", skill: "the crowd answers",
    statement: "points now carry labels: labels[i] ∈ {0, 1} (0 = benign, 1 = alert). Implement knn_predict(q, k): find the k nearest points, return the majority label (tie → 0, the calmer verdict). Report pred_1 for k=1, pred_3 for k=3, pred_5 for k=5 at the query q given. Watch the verdict change as the crowd grows — small k listens to individuals, large k listens to the neighborhood.",
    examples: [
      { input: "3 nearest labels [1, 1, 0]", output: "majority → 1", explain: "two votes beat one" },
      { input: "5 nearest labels [1, 1, 0, 0, 0]", output: "majority → 0", explain: "k matters — a lot" },
    ],
    why: "kNN is the purest 'model as data' algorithm: no training at all, the dataset IS the model, and prediction is a geometry lookup plus a vote. The k knob is the bias-variance trade in one integer: k=1 memorizes (every noise point draws its own border), huge k blurs (everything becomes the global majority). Choosing k by cross-validation (Stage 4's judge) is the standard practice — and the reason kNN appears in every interview.",
    starterCode: "import numpy as np\n\npoints = np.array([[0., 0.], [3., 4.], [1., 1.], [6., 8.],\n                   [2., 2.], [5., 0.], [0., 3.], [7., 7.]])\nlabels = np.array([0, 0, 1, 1, 1, 0, 0, 1])\nq = np.array([1.2, 1.8])\n\ndef knn_predict(q, k):\n    ...  # distances → k nearest indices → majority label (tie → 0)\n    pass\n\npred_1 = None\npred_3 = None\npred_5 = None",
    hints: [
      "Reuse Problem 26's distance expression inside the function.",
      "np.argsort(dists)[:k] gives the k nearest indices (ties by position).",
      "votes = labels[idx]; return 1 if votes.sum() * 2 > k else 0 — the tie rule falls out.",
    ],
    solution: "import numpy as np\n\npoints = np.array([[0., 0.], [3., 4.], [1., 1.], [6., 8.],\n                   [2., 2.], [5., 0.], [0., 3.], [7., 7.]])\nlabels = np.array([0, 0, 1, 1, 1, 0, 0, 1])\nq = np.array([1.2, 1.8])\n\ndef knn_predict(q, k):\n    dists = np.sqrt(np.sum((points - q) ** 2, axis=1))\n    idx = np.argsort(dists)[:k]\n    votes = labels[idx]\n    return 1 if int(votes.sum()) * 2 > k else 0\n\npred_1 = knn_predict(q, 1)\npred_3 = knn_predict(q, 3)\npred_5 = knn_predict(q, 5)",
    walkthrough: "Four moves composed: distance (26) → argsort → slice → vote. The tie rule 'sum·2 > k' is worth a stare: for k=3, two 1-votes give 4 > 3 → 1; for k=4, two 1-votes give 4 = 4 → falls to 0, the calmer verdict. The three predictions differ here because the query sits near a label border — exactly where k matters most in practice. Two production notes: kNN shifts all work to prediction time (no training), and it is EXQUISITELY sensitive to feature scale — the next problem makes that visceral.",
    testCode: "dists = np.sqrt(np.sum((points - q) ** 2, axis=1))\nidx1 = np.argsort(dists)[:1]\nidx3 = np.argsort(dists)[:3]\nidx5 = np.argsort(dists)[:5]\nassert pred_1 == int(labels[idx1][0])\nassert pred_3 == (1 if int(labels[idx3].sum()) * 2 > 3 else 0)\nassert pred_5 == (1 if int(labels[idx5].sum()) * 2 > 5 else 0)\nassert pred_1 == 1 and pred_5 == 0, (pred_1, pred_5)\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 5, title: "Distance Is Dishonest", pattern: "scale-sensitivity", skill: "make the ruler fair",
    diagram: `   raw:   beds (1–4)  ·  age (5–40)     d = √(Δbeds² + Δage²)
          Δage = 30 shouts, Δbeds = 3 whispers → age IS the metric

   z-score: every column → mean 0 · std 1 → honest meters`,
    statement: "customers: (spend_in_rupees, visits) — spend in the thousands, visits in the single digits. A query customer sits between a 'high-spend, few visits' neighbor and a 'low-spend, many visits' one. Compute nearest_raw (kNN k=1 on raw features) and nearest_scaled (k=1 after z-scoring each feature across the 8 rows). They differ — the rupee axis was silently swallowing the visit axis.",
    examples: [
      { input: "raw distance", output: "spend difference of 3000 dwarfs visit difference of 4", explain: "one feature rules the ruler" },
      { input: "z-scored distance", output: "both features count, per-feature spread normalized", explain: "the honest ruler" },
    ],
    why: "Every distance-based method (kNN, k-means, retrieval, kernels) inherits the UNITS of the features. A feature measured in thousands moves the ruler a thousand times more than one measured in ones — the big-scale feature decides every 'nearest' vote and the others are decoration. Z-scoring each feature (subtract its mean, divide its std — Problem 12's move, now per column) gives every axis equal say. Rule: no distance without scaling, ever. (Trees don't care — splits are per-feature comparisons — which is part of why they're so useful on messy data.)",
    starterCode: "import numpy as np\n\ncustomers = np.array([[5200., 3.], [6100., 2.], [4800., 9.], [7200., 1.],\n                      [5500., 7.], [6800., 4.], [4900., 8.], [7500., 2.]])\nq = np.array([5900.0, 8.0])\n\ndef nearest(X, query):\n    ...  # index of the closest row\n    pass\n\nnearest_raw = None      # on customers as-is\nnearest_scaled = None   # on z-scored customers AND z-scored q",
    hints: [
      "Scale per column: (X - X.mean(axis=0)) / X.std(axis=0) — keepdims not needed, broadcasting stretches (2,) across rows.",
      "The query must be scaled with the SAME column means/stds.",
      "nearest is Problem 26's argmin expression, wrapped in a function.",
    ],
    solution: "import numpy as np\n\ncustomers = np.array([[5200., 3.], [6100., 2.], [4800., 9.], [7200., 1.],\n                      [5500., 7.], [6800., 4.], [4900., 8.], [7500., 2.]])\nq = np.array([5900.0, 8.0])\n\ndef nearest(X, query):\n    return int(np.argmin(np.sqrt(np.sum((X - query) ** 2, axis=1))))\n\nnearest_raw = nearest(customers, q)\nmu, sd = customers.mean(axis=0), customers.std(axis=0)\nZ = (customers - mu) / sd\nqz = (q - mu) / sd\nnearest_scaled = nearest(Z, qz)",
    walkthrough: "The raw ruler only reads the rupee column: every candidate differs by thousands of rupees and single visits, so visits never break a tie. Z-scoring divides each column by its own spread — now one standard-deviation of spend counts exactly as one standard-deviation of visits, and the honest nearest neighbor surfaces. The test verifies the two verdicts differ and that the scaled verdict is the row that is genuinely similar in BOTH axes. Carry-forward: scale inside cross-validation using train statistics only (Problem 49 wires this) — scaling with test statistics is the leak of Problem 25 in disguise.",
    testCode: "assert nearest_raw != nearest_scaled, (nearest_raw, nearest_scaled)\nassert nearest_raw == 1, nearest_raw\nassert nearest_scaled == 4, nearest_scaled\n# verify the scaled winner is closest under z-metric\nmu, sd = customers.mean(axis=0), customers.std(axis=0)\nZ = (customers - mu) / sd\nqz = (q - mu) / sd\nD = np.sqrt(((Z - qz) ** 2).sum(axis=1))\nassert int(np.argmin(D)) == nearest_scaled\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 5, title: "Guess, Then Refine", pattern: "kmeans-step", skill: "alternate assign and average",
    statement: "cluster_world: 6 points in two obvious groups, and two initial centroids c0 = [0, 5], c1 = [10, 5] (deliberately bad — both sit between groups). Perform exactly ONE Lloyd iteration: assign each point to the nearer centroid (0 or 1), then move each centroid to the mean of its assigned points. Return labels (length 6) and new_c0, new_c1. Guessing badly is fine — refinement fixes it.",
    examples: [
      { input: "point [0,0] vs c0=[0,5], c1=[10,5]", output: "label 0 (distance 5 vs √125)", explain: "assign by nearer, nothing mystical" },
      { input: "after assignment", output: "each centroid = mean of its members", explain: "the 'refine' half" },
    ],
    why: "k-means is the canonical unsupervised algorithm, and its whole engine is a two-line alternation: ASSIGN each point to the nearest centroid (a geometry move — Problem 26), UPDATE each centroid to the mean of its members (an averaging move — Problem 4). Each half fixes the other's mistakes. One iteration from terrible starting points already sharpens the picture; iterating to stillness is the next problem. Notice there are no labels anywhere — the structure is DISCOVERED from geometry alone.",
    starterCode: "import numpy as np\n\nP = cluster_world()          # (6, 2)\nc = np.array([[0.0, 5.0], [10.0, 5.0]])\n\nlabels = None       # nearer-centroid index per point: 0 or 1\nnew_c = None        # shape (2, 2): row k = mean of points labeled k\n\nnew_c0, new_c1 = new_c[0], new_c[1]",
    hints: [
      "Distances to both centroids: np.sum((P - c[0])**2, axis=1) vs c[1] — squared is fine for comparing.",
      "labels = np.argmin(D, axis=1) with D shaped (6, 2).",
      "new_c[k] = P[labels == k].mean(axis=0) — the Problem 4 collapse.",
    ],
    solution: "import numpy as np\n\nP = cluster_world()\nc = np.array([[0.0, 5.0], [10.0, 5.0]])\n\nD = np.stack([np.sum((P - c[k]) ** 2, axis=1) for k in range(2)], axis=1)\nlabels = np.argmin(D, axis=1)\nnew_c = np.stack([P[labels == k].mean(axis=0) for k in range(2)], axis=0)\n\nnew_c0, new_c1 = new_c[0], new_c[1]",
    walkthrough: "One Lloyd iteration, two halves. ASSIGN: build the (6, 2) squared-distance matrix (one column per centroid) and argmin down each row — every point pledges to its nearer centroid. UPDATE: each centroid becomes the mean of its pledge-holders, which drags it INTO its group. The starting centroids sat uselessly between the groups; after one pass they sit inside the groups they captured. Convergence theory in one sentence: each half can only decrease the total within-cluster distance, so the loop must settle — the next problem watches it settle.",
    testCode: "assert list(labels) == [0, 0, 0, 1, 1, 1], labels\nassert np.allclose(new_c0, [1/3, 1/3]), new_c0\nassert np.allclose(new_c1, [31/3, 31/3]), new_c1\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "Until Nothing Moves", pattern: "kmeans-converge", skill: "iterate to stillness",
    statement: "Run full k-means on cluster_world from the same bad start: loop assign→update until the labels stop changing (cap 50 iterations). Report final_labels, final_centroids, inertia = the total squared distance of every point to its assigned centroid, iters_used. Then confirm the payoff: inertia_final < inertia_initial (measured with the ORIGINAL bad centroids).",
    examples: [
      { input: "iteration 1", output: "centroids move into the groups", explain: "big improvement" },
      { input: "iteration 2", output: "assignments unchanged → stop", explain: "converged" },
    ],
    why: "The alternation is a fixed point search: assignment can only lower the total distance given centroids, update can only lower it given assignments — so inertia falls monotonically and, with finitely many labelings, must eventually stop. Watching it converge in 2–3 iterations from a terrible start is the algorithm's whole charm. The caveats are real though: the fixed point depends on initialization (different starts, different clusters), which is why production k-means runs many restarts and keeps the lowest inertia — and why 'k' itself is a choice you defend with the elbow or a business metric.",
    starterCode: "import numpy as np\n\nP = cluster_world()\nc = np.array([[0.0, 5.0], [10.0, 5.0]])\n\ninitial_inertia = None  # total squared distance to the STARTING centroids\nfinal_labels = None\nfinal_centroids = None\ninertia = None\niters_used = None",
    hints: [
      "Each iteration: labels = argmin over the 2 centroid columns; then recompute centroids.",
      "Stop when today's labels equal yesterday's — compare arrays with np.array_equal.",
      "inertia = sum over points of squared distance to their OWN centroid: np.sum(D[np.arange(6), labels]) with D the squared-distance matrix.",
    ],
    solution: "import numpy as np\n\nP = cluster_world()\nc = np.array([[0.0, 5.0], [10.0, 5.0]])\n\ndef sq_dists(centroids):\n    return np.stack([np.sum((P - centroids[k]) ** 2, axis=1) for k in range(2)], axis=1)\n\ninitial_inertia = float(np.sum(sq_dists(c)[np.arange(len(P)), np.argmin(sq_dists(c), axis=1)]))\n\nlabels = None\nfor it in range(50):\n    D = sq_dists(c)\n    new_labels = np.argmin(D, axis=1)\n    if labels is not None and np.array_equal(new_labels, labels):\n        iters_used = it\n        break\n    labels = new_labels\n    c = np.stack([P[labels == k].mean(axis=0) for k in range(2)], axis=0)\n\nfinal_labels = labels\nfinal_centroids = c\nD = sq_dists(c)\ninertia = float(np.sum(D[np.arange(len(P)), labels]))",
    walkthrough: "The loop is the algorithm: assign, update, ask 'did anything move?'. Convergence here takes a handful of iterations because the world has two obvious groups; the monotone inertia guarantee is why stopping is safe. The final inertia versus the initial one is the value story: the same points, the same k, but centroids that EARNED their positions. Two professional habits: run several restarts (initialization luck is real) and always report inertia alongside k so the elbow has numbers to plot. Unsupervised learning has no accuracy — inertia, spread, and usefulness are its judges.",
    testCode: "assert list(final_labels) == [0, 0, 0, 1, 1, 1], final_labels\nassert np.allclose(final_centroids[0], [1/3, 1/3])\nassert np.allclose(final_centroids[1], [31/3, 31/3])\nassert iters_used is not None and iters_used <= 50\nassert inertia < initial_inertia, (initial_inertia, inertia)\nassert inertia < 17.0, inertia\nprint('All tests passed!')"
  },

  // ══ STAGE 6 — The Tree ══
  {
    id: 31, stage: 6, title: "One Question", pattern: "split", skill: "cut the rows by a test",
    diagram: `     x: 1..8    t: 0 0 1 0 1 1 1 1      gini(parent) = 30/64
   split at 4.5:
   ├── x ≤ 4.5   t: 0 0 1 0     gini = 3/8
   └── x >  4.5  t: 1 1 1 1     gini = 0  ← pure
        gain = 30/64 − 3/16      the question that cleans the most`,
    statement: "tree_world: one feature x (8 rows) and a label t (0 = fail, 1 = pass). Split the rows at threshold t_split = 4.5: x < 4.5 goes left, the rest right. Report n_left, ones_left (label-1 count on the left), n_right, ones_right. A decision tree is nothing but questions like this, stacked.",
    examples: [
      { input: "x = [1, 2, 3, 4 | 5, 6, 7, 8]", output: "left 4 rows, right 4 rows", explain: "the question carves the table in two" },
    ],
    why: "Every path from the root of a decision tree to a leaf is a conjunction of questions like 'is feature ≤ 4.5?'. The split itself is a boolean mask (Problem 5) applied to rows — the ML twist is that we will soon SCORE the split by how much it purifies the labels. Counting the label mix on each side is the bookkeeping every split scorer needs; do it cleanly once and every later tree problem reuses it.",
    starterCode: "import numpy as np\n\nx, t = tree_world()\nt_split = 4.5\n\nleft = None    # boolean mask: x < t_split\nn_left = None\nones_left = None   # count of label 1 among left rows\nn_right = None\nones_right = None",
    hints: [
      "left = x < t_split — a boolean mask, exactly Problem 5's move.",
      "n_left = int(left.sum()); the right side is ~left (invert the mask).",
      "ones_left = int(t[left].sum()) — mask, then collapse.",
    ],
    solution: "import numpy as np\n\nx, t = tree_world()\nt_split = 4.5\n\nleft = x < t_split\nn_left = int(left.sum())\nones_left = int(t[left].sum())\nn_right = int((~left).sum())\nones_right = int(t[~left].sum())",
    walkthrough: "The mask carves, the sums count. Note the left contains labels [0, 0, 1, 0] and the right [1, 1, 1, 1] — the right side came out perfectly pure, the left still mixed. That asymmetry is the seed of the whole algorithm: we will want questions that purify BOTH sides, and the next two problems invent the score that measures exactly that. Also note x is a single feature — trees ask about one feature at a time, which is why they ignore feature scale entirely (no z-score needed).",
    testCode: "assert n_left == 4 and n_right == 4\nassert ones_left == 1 and ones_right == 4\nassert n_left + n_right == len(x)\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 6, title: "Score the Mix", pattern: "impurity", skill: "measure how blended a set is",
    statement: "Implement gini(v) = 1 − Σ p_k² and entropy(v) = −Σ p_k·log2(p_k) over the label vector v (p_k = fraction with label k; treat 0·log 0 as 0). Check: a pure vector scores 0 on both, the 50/50 vector scores 0.5 and 1.0, and the mix [0,0,1,0] scores gini 0.375. These two formulas are how a tree judges every candidate split.",
    examples: [
      { input: "v = [0, 0, 1, 1]", output: "gini = 0.5, entropy = 1.0", explain: "maximum confusion for two classes" },
      { input: "v = [1, 1, 1, 1]", output: "gini = 0, entropy = 0", explain: "pure — nothing to learn here" },
    ],
    why: "A split is only as good as the purity it buys, so we need a number for 'mixedness'. Gini: probability two random draws disagree. Entropy: average surprise of a label. Both are 0 for pure sets, both peak at 50/50, and they almost always rank splits identically — gini is cheaper (no log), so it's CART's default and this ladder's choice. The zero-count edge case (a class absent from a node) is the classic crash: log2(0) = −inf, and the fix is to only sum over classes that actually appear.",
    starterCode: "import numpy as np\n\ndef gini(v):\n    ...  # 1 - sum of p_k^2 over the classes PRESENT\n    pass\n\ndef entropy(v):\n    ...  # -sum of p_k * log2(p_k) over the classes PRESENT\n    pass",
    hints: [
      "counts = np.bincount(v); p = counts[counts > 0] / counts.sum().",
      "gini = 1 - np.sum(p ** 2).",
      "entropy = -np.sum(p * np.log2(p)) — the counts>0 filter saves you from log2(0).",
    ],
    solution: "import numpy as np\n\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\ndef entropy(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(-np.sum(p * np.log2(p)))",
    walkthrough: "Both scores read the class histogram and nothing else — size doesn't matter, only the mix. Verify the anchors: pure → 0; 50/50 → maximum (0.5 gini, 1.0 bit of entropy); 75/25 → in between, and notice entropy penalizes mild impurity more harshly than gini does (0.811 vs 0.375) — they diverge in degree, never in direction. The classes-present filter is not a technicality: trees meet empty classes constantly, and the unguarded log is a rite-of-passage crash. Next: weight these scores by side size to score a whole split.",
    testCode: "assert np.isclose(gini(np.array([0, 0, 1, 1])), 0.5)\nassert np.isclose(entropy(np.array([0, 0, 1, 1])), 1.0)\nassert gini(np.array([1, 1, 1, 1])) == 0.0 and entropy(np.array([1, 1, 1, 1])) == 0.0\nassert gini(np.array([0, 0, 1])) == 1 - ((2 / 3) ** 2 + (1 / 3) ** 2)\nassert np.isclose(entropy(np.array([0, 0, 1, 0])), -(0.75 * np.log2(0.75) + 0.25 * np.log2(0.25)))\nassert gini(np.array([0, 0, 1, 0])) == 0.375\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 6, title: "The Best Question", pattern: "best-split", skill: "search thresholds for purity",
    statement: "Scan every candidate threshold of tree_world's x — the midpoints between consecutive sorted values (7 of them). For each, compute the weighted gini: (n_left·gini_left + n_right·gini_right) / n_total. Report all weighted scores in a list weighted (threshold order), best_t (the winner), and gain = gini_parent − best_weighted. The tree's entire intelligence is this search.",
    examples: [
      { input: "parent gini = 0.469", output: "best weighted ≈ 0.188 at t = 4.5", explain: "gain ≈ 0.28 — the best question found" },
    ],
    why: "Growing a tree is brute force, honestly won: try every feature, every threshold (midpoints between observed values), score each by weighted child impurity, keep the best. No gradient, no cleverness — just a disciplined search, which is why trees handle mixed feature types and scales natively. The weighting by side size is the honest part: a split that purifies 1 row while leaving 7 rows mixed is a bad trade, and the average sees that. Gain = impurity removed — the currency trees pay leaves with.",
    starterCode: "import numpy as np\n\nx, t = tree_world()\nn = len(x)\n\n# your gini from Problem 32:\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\nuniq = np.unique(x)\ncandidates = (uniq[:-1] + uniq[1:]) / 2.0   # midpoints\n\nweighted = []   # one score per candidate, in order\nfor c in candidates:\n    ...  # left mask, both sides' gini, size-weighted average\n    pass\n\nbest_t = None\ngain = None",
    hints: [
      "Reuse gini(v) from Problem 32 — it takes a label vector.",
      "left = x <= c is equivalent to x < next value — either boundary works on midpoints.",
      "weighted.append((left.sum() * gini(t[left]) + (~left).sum() * gini(t[~left])) / n).",
      "best_t = candidates[np.argmin(weighted)]; gain = gini(t) − min(weighted).",
    ],
    solution: "import numpy as np\n\nx, t = tree_world()\nn = len(x)\n\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\nuniq = np.unique(x)\ncandidates = (uniq[:-1] + uniq[1:]) / 2.0\n\nweighted = []\nfor c in candidates:\n    left = x <= c\n    score = (left.sum() * gini(t[left]) + (~left).sum() * gini(t[~left])) / n\n    weighted.append(float(score))\n\nweighted = np.array(weighted)\nbest_t = float(candidates[int(np.argmin(weighted))])\ngain = float(gini(t) - weighted.min())",
    walkthrough: "The loop IS the tree's brain: for each question, carve, score both sides, size-weight, record. Seven candidates, one winner — t = 4.5, which leaves the noisy mix on the left and a perfectly pure run of 1-labels on the right. The parent's impurity (0.469) minus the best weighted child impurity (0.188) is the gain — the answer to 'was this question worth asking?'. Real trees run this search at every node on every feature, recursively, stopping when gain starves or depth caps — the next problem grows exactly one such level.",
    testCode: "assert len(weighted) == 7\nassert np.isclose(best_t, 4.5), best_t\nassert np.isclose(gini(t), 30 / 64)\nassert np.isclose(min(weighted), 3 / 16, atol=1e-9)\nassert np.isclose(gain, 30 / 64 - 3 / 16, atol=1e-9)\nassert gain > 0\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 6, title: "Grow a Stump", pattern: "decision-stump", skill: "compose questions into answers",
    statement: "Build a decision stump: split tree_world at the best threshold (Problem 33's machinery), make each leaf predict its side's majority label, then implement predict(xs) for new rows. Report stump_train_acc (on all 8 training rows) and preds_te for x_te = [2.5, 3.0, 4.5]. One noisy training row will be misclassified — the tree outvoted it. That is learning, not memorizing.",
    examples: [
      { input: "left leaf sees labels [0,0,1]", output: "leaf predicts 0", explain: "majority rules" },
      { input: "x = 5.0 → right side", output: "prediction 1", explain: "follow the question, read the leaf" },
    ],
    why: "A stump — one split, two leaves — is the smallest useful tree, and it already exhibits everything: search (33), purity (32), and majority voting at the leaves. Its train accuracy of 7/8 is the honest kind: the single noisy row (x=4, labeled 0 amid 1s) gets outvoted by its neighbors, which is exactly what you want when labels have noise. Deep trees chase that row and memorize it; stumps forgive it. Random forests (next problem) are nothing but many stumps/deep-trees voting — built from this exact skeleton.",
    starterCode: "import numpy as np\n\nx, t = tree_world()\n\n# your gini from Problem 32:\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\n# 1. find the best split (reuse Problem 33's search)\n# 2. leaf values: majority label per side\n# 3. predict(xs): for each xs, walk the one question\n\ndef predict(xs, thr, left_leaf, right_leaf):\n    ...\n    pass\n\nstump_train_acc = None\nx_te = np.array([2.5, 3.0, 4.5])\npreds_te = None",
    hints: [
      "left_label = 1 if t[left].sum() * 2 > left.sum() else 0 — the majority, tie → 0.",
      "predict: np.where(xs <= thr, left_leaf, right_leaf) — vectorized walk.",
      "stump_train_acc = np.mean(predict(x) == t).",
    ],
    solution: "import numpy as np\n\nx, t = tree_world()\nn = len(x)\n\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\nuniq = np.unique(x)\ncandidates = (uniq[:-1] + uniq[1:]) / 2.0\nweighted = []\nfor c in candidates:\n    left = x <= c\n    weighted.append((left.sum() * gini(t[left]) + (~left).sum() * gini(t[~left])) / n)\nweighted = np.array(weighted)\nthr = float(candidates[int(np.argmin(weighted))])\n\nleft = x <= thr\nleft_leaf = 1 if t[left].sum() * 2 > left.sum() else 0\nright_leaf = 1 if t[~left].sum() * 2 > (~left).sum() else 0\n\ndef predict(xs, thr, left_leaf, right_leaf):\n    return np.where(xs <= thr, left_leaf, right_leaf)\n\nstump_train_acc = float(np.mean(predict(x, thr, left_leaf, right_leaf) == t))\nx_te = np.array([2.5, 3.0, 5.0])\npreds_te = predict(x_te, thr, left_leaf, right_leaf)",
    walkthrough: "The best question (t ≤ 2.5) plus two majority-leaves is a complete classifier: three numbers fully describe it. Trace the miss: x=4 lands right of 2.5, the right leaf says 1, the truth is 0 — one vote lost to noise, and the stump shrugs. This tolerance is the deep difference between trees that AVERAGE (forgiving) and models that INTERPOLATE (memorizing). When you meet random forests: N bootstrapped samples, a stump or deep tree on each, majority vote — Problem 35 is exactly that, and every piece of it is already in your hands.",
    testCode: "assert np.isclose(stump_train_acc, 7 / 8), stump_train_acc\nassert list(preds_te) == [0, 0, 1], preds_te\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 6, title: "The Forest Votes", pattern: "bagging", skill: "many weak judges, one verdict",
    statement: "Bagging: fit a stump on each of three bootstrap resamples (row indices given — sampling WITH replacement, so some rows repeat and others vanish). Predict all 8 training rows with each stump, then take the majority vote per row (tie → 0). Report forest_preds, the per-stump accuracies accs (list of 3), and forest_acc. Individual stumps stumble on different rows; the vote cancels the stumbles.",
    examples: [
      { input: "stump votes on a row: [1, 0, 1]", output: "forest says 1", explain: "majority of three" },
      { input: "stump votes: [0, 1, 0] (with tie rule)", output: "forest says 0", explain: "ties resolve calm" },
    ],
    why: "A single stump is rigid; a committee of stumps trained on different resamples is flexible AND stable — this is bagging, the idea inside random forests. Each bootstrap hides different rows (out-of-bag) and duplicates others, so each stump overfits DIFFERENT noise; the majority vote cancels the idiosyncrasies while preserving the signal. The deep result: averaging many high-variance, low-bias learners reduces variance without adding bias. Random forests add one twist (random feature subsets per split) — the bootstrap-plus-vote skeleton you build here is 90% of it.",
    starterCode: "import numpy as np\n\nx, t = tree_world()\n\n# your gini from Problem 32:\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\nbootstraps = [\n    np.array([0, 1, 2, 3, 4, 5, 6, 7]),\n    np.array([1, 1, 2, 3, 4, 5, 5, 7]),\n    np.array([0, 2, 2, 3, 5, 6, 7, 7]),\n]\n\ndef fit_stump(xb, tb):\n    ...  # best threshold + two majority leaves (Problems 33-34)\n    pass\n\nstump_preds = []   # each stump's prediction of ALL 8 training rows\naccs = []\nforest_preds = None\nforest_acc = None",
    hints: [
      "fit_stump: same search as Problem 33 on xb/tb, then two majority leaves; return a predict function or (thr, ll, rl).",
      "Per stump: preds = np.where(x <= thr, ll, rl); accs.append(np.mean(preds == t)).",
      "Stack the three prediction arrays (3, 8) and take np.mean(axis=0) — majority = mean > 0.5, tie → 0.",
    ],
    solution: "import numpy as np\n\nx, t = tree_world()\n\ndef gini(v):\n    counts = np.bincount(v)\n    p = counts[counts > 0] / counts.sum()\n    return float(1.0 - np.sum(p ** 2))\n\nbootstraps = [\n    np.array([0, 1, 2, 3, 4, 5, 6, 7]),\n    np.array([1, 1, 2, 3, 4, 5, 5, 7]),\n    np.array([0, 2, 2, 3, 5, 6, 7, 7]),\n]\n\ndef fit_stump(xb, tb):\n    uniq = np.unique(xb)\n    cands = (uniq[:-1] + uniq[1:]) / 2.0\n    best_score, best_thr = float(\"inf\"), float(cands[0])\n    for c in cands:\n        L = xb <= c\n        s = (L.sum() * gini(tb[L]) + (~L).sum() * gini(tb[~L])) / len(xb)\n        if s < best_score:\n            best_score, best_thr = s, float(c)\n    L = xb <= best_thr\n    ll = 1 if tb[L].sum() * 2 > L.sum() else 0\n    rl = 1 if tb[~L].sum() * 2 > (~L).sum() else 0\n    return best_thr, ll, rl\n\nstump_preds = []\naccs = []\nfor b in bootstraps:\n    thr, ll, rl = fit_stump(x[b], t[b])\n    preds = np.where(x <= thr, ll, rl)\n    stump_preds.append(preds)\n    accs.append(float(np.mean(preds == t)))\n\nvotes = np.mean(np.stack(stump_preds, axis=0), axis=0)\nforest_preds = (votes > 0.5).astype(int)\nforest_acc = float(np.mean(forest_preds == t))",
    walkthrough: "Three stumps, three views of the same 8 rows. Bootstrap 2 never sees row 0 and sees row 1 twice; bootstrap 3 doubles rows 2 and 7 — each stump learns a slightly different truth, and their disagreements land on DIFFERENT rows. The vote (mean of the stacked predictions > 0.5) cancels those idiosyncrasies. Watch the accuracies: the forest matches or beats the typical stump, never because any single stump got smarter — because their errors decorrelated. That is the entire secret of ensembles, from random forests to gradient boosting cabinets.",
    testCode: "assert len(accs) == 3 and len(stump_preds) == 3\nassert all(0.0 <= a <= 1.0 for a in accs)\nvotes = np.mean(np.stack(stump_preds, axis=0), axis=0)\nassert np.array_equal(forest_preds, (votes > 0.5).astype(int))\nassert np.isclose(forest_acc, np.mean(forest_preds == t))\nassert forest_acc >= min(accs), (accs, forest_acc)\nassert forest_acc >= 7 / 8, forest_acc\nprint('All tests passed!')"
  },

  // ══ STAGE 7 — The Network ══
  {
    id: 36, stage: 7, title: "The Neuron Is the Line", pattern: "neuron", skill: "one weight vector, one squash",
    statement: "A single neuron with weights w = [2.0, 1.0], bias b = 0.2 receives x = [0.5, −1.0]. Compute z = w·x + b, then a = sigmoid(z) (reuse the stable sigmoid). Assign z and a. Compare with Problem 16-18: a neuron IS logistic regression on one sample — nothing new was added except a name.",
    examples: [
      { input: "w·x = 2·0.5 + 1·(−1) = 0", output: "z = 0 + 0.2 = 0.2", explain: "dot product plus bias" },
      { input: "a = sigmoid(0.2)", output: "≈ 0.55", explain: "slightly excited" },
    ],
    why: "This problem is a bridge, deliberately: the 'neuron' of neural networks is the logistic unit you already trained in Stage 3 — a dot product, a bias, a squash. Networks earn their power not from fancier neurons but from STACKING and BENDING (nonlinear activations between layers). Recognizing the old friend inside the new notation is the whole point: when you later read 'fully connected layer', translate it to 'a batch of these dots at once' — which is one matrix multiply.",
    starterCode: "import numpy as np\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nw = np.array([2.0, 1.0])\nb = 0.2\nx = np.array([0.5, -1.0])\n\nz = None\na = None",
    hints: [
      "The dot product: z = float(np.dot(w, x) + b).",
      "a = sigmoid(np.array([z]))[0] — or make sigmoid accept scalars via np.atleast_1d.",
      "Check 0 < a < 1 — it's a probability.",
    ],
    solution: "import numpy as np\n\ndef sigmoid(z):\n    z = np.atleast_1d(np.asarray(z, dtype=float))\n    out = np.empty_like(z)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nw = np.array([2.0, 1.0])\nb = 0.2\nx = np.array([0.5, -1.0])\n\nz = float(np.dot(w, x) + b)\na = float(sigmoid(z)[0])",
    walkthrough: "z is the same linear score from Stage 1; a is the same probability from Stage 3. The neuron adds zero new math — and that IS the lesson. The dot product is also a shape contract: w has one weight per feature of x, and if those lengths disagree, NumPy refuses — that refusal will save you repeatedly inside networks. The remaining mystery is why stacking such simple units produces something as capable as a network: the next problem builds the stack, and the one after shows the ingredient that makes the stack matter.",
    testCode: "assert np.isclose(z, 0.2)\nassert 0 < a < 1\nassert np.isclose(a, 1.0 / (1.0 + np.exp(-0.2)))\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 7, title: "The Hidden Layer", pattern: "forward-pass", skill: "two matmuls, one bend",
    diagram: `   X(4,2) ─▶[ X@W1 + b1 ]─▶ H = tanh(·)(4,4) ─▶[ H@W2 + b2 ]─▶ ŷ(4,1)
               4 bends side by side              one bend to close
   shapes: (4,2)@(2,4) = (4,4)   ·   (4,4)@(4,1) = (4,1)`,
    statement: "Using net_world (the four XOR corners, X of shape (4, 2)) and net_init (frozen weights W1 (2,4), b1 (4,), W2 (4,1), b2 (1,)): compute H = tanh(X @ W1 + b1) and out = H @ W2 + b2. Assign H and out. Shapes to verify: (4,2) → (4,4) → (4,1). This two-matmul pattern is the entire forward pass of every deep network — deeper just means more of them.",
    examples: [
      { input: "X row [0, 0]", output: "H row = tanh(b1) (4 values)", explain: "the bias IS the pre-activation here" },
      { input: "H (4,4) @ W2 (4,1)", output: "out (4,1)", explain: "the column collapses to one score per row" },
    ],
    why: "The forward pass in full: multiply inputs by weights (X @ W1), add biases, squash with a NONLINEARITY (tanh here), repeat, and read out. Two details carry all the magic. First, matmuls batch the neurons: (4,2) @ (2,4) computes 4 neurons' dot products for 4 samples simultaneously. Second, tanh between the matmuls is what stops the network from collapsing into one big linear map — the next problem proves that claim. Every architecture you have heard of is this skeleton with different squashes and wiring.",
    starterCode: "import numpy as np\n\nX, y4 = net_world()\nW1, b1, W2, b2 = net_init()\n\nH = None    # hidden activations, shape (4, 4)\nout = None  # output scores, shape (4, 1)",
    hints: [
      "H = np.tanh(X @ W1 + b1) — broadcasting stretches b1 down the rows.",
      "out = H @ W2 + b2 — (4,4) @ (4,1) → (4,1).",
      "Print the shapes before anything else; they are the contract.",
    ],
    solution: "import numpy as np\n\nX, y4 = net_world()\nW1, b1, W2, b2 = net_init()\n\nH = np.tanh(X @ W1 + b1)\nout = H @ W2 + b2",
    walkthrough: "Read the data flow: each of the 4 hidden units is a neuron (Problem 36) evaluated on all 4 corners at once; tanh bends each one into (−1, 1); the second matmul mixes the four bent signals into one score. Two habits: check shapes at every step ((4,2)@(2,4)→(4,4)→(4,1)), and notice the bias vector broadcasts down the rows — b1 belongs to the NEURONS, not the samples. The output here is a raw score; whether you squash it to a probability (sigmoid) or compare it to a label directly depends on the loss you pick — Stage 8 trains exactly this stack by pushing blame backwards through these same two matmuls.",
    testCode: "assert H.shape == (4, 4) and out.shape == (4, 1)\nassert np.all(H > -1) and np.all(H < 1)\n# recompute row 0 the slow way: explicit per-neuron dot products\nrow = X[0]\nslow = np.tanh(np.array([row @ W1[:, j] + b1[j] for j in range(4)]))\nassert np.allclose(H[0], slow)\nassert np.isclose(out[2, 0], H[2] @ W2[:, 0] + b2[0])\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 7, title: "Why the Bend Matters", pattern: "nonlinearity", skill: "linear stacks collapse",
    statement: "net_init is special: every column of W1 sums to zero, so the diagonal corners of the XOR square ([0,0] and [1,1], both labeled 0) produce IDENTICAL hidden activations — and so do [0,1] and [1,0]. Verify: h00 == h11 and h01 == h10 in H, and therefore out[0] == out[3] and out[1] == out[2], even though y4[0] ≠ y4[1]. Assign same_diag (bool) and same_off (bool). The net is structurally blind — no output layer can fix inputs it cannot distinguish.",
    examples: [
      { input: "[0,0] and [1,1]", output: "identical hidden row", explain: "W1 columns sum to 0 → x and x+[1,1] shift equally" },
      { input: "out[0] vs out[3]", output: "equal scores, opposite labels", explain: "the network CANNOT fit XOR from this init" },
    ],
    why: "Here is the theorem hiding inside the exercise: two stacked LINEAR layers (delete the tanh) multiply into one linear layer — W2·(W1·x) = (W2·W1)·x — so a 'deep' linear network is exactly as powerful as a shallow one. Nonlinearity is what prevents the collapse: tanh between the matmuls creates new, previously unreachable functions. And the flip side, witnessed here: even WITH the nonlinearity, a symmetric init can make two different inputs land on the same hidden representation — identical activations cannot split into different outputs. Training (Stage 8) breaks the symmetry because the errors on the two corners differ; nothing else will.",
    starterCode: "import numpy as np\n\nX, y4 = net_world()\nW1, b1, W2, b2 = net_init()\n\nH = np.tanh(X @ W1 + b1)\nout = H @ W2 + b2\n\nsame_diag = None   # H[0] ≈ H[3] (corners [0,0] and [1,1])\nsame_off = None    # H[1] ≈ H[2] (corners [0,1] and [1,0])",
    hints: [
      "same_diag = bool(np.allclose(H[0], H[3])).",
      "Then check the consequences: np.isclose(out[0, 0], out[3, 0]).",
      "Ask yourself: can ANY function of H separate inputs it maps to the same point?",
    ],
    solution: "import numpy as np\n\nX, y4 = net_world()\nW1, b1, W2, b2 = net_init()\n\nH = np.tanh(X @ W1 + b1)\nout = H @ W2 + b2\n\nsame_diag = bool(np.allclose(H[0], H[3]))\nsame_off = bool(np.allclose(H[1], H[2]))",
    walkthrough: "Two facts, one conclusion. Fact 1 (the collapse): stack two linear maps and you get one — depth without nonlinearity is theater. Fact 2 (the blindness): this init's W1 has zero-column-sums, so adding [1,1] to an input shifts every pre-activation equally and tanh... maps the pairs to identical rows — the four corners collapse into TWO points of view, but XOR needs the four corners in two classes that cross the diagonals. Impossible from here. The test asserts the blindness; Stage 8's training will assert its cure. Together they answer the interview question 'why do neural networks need nonlinear activations?' with a demonstration instead of a slogan.",
    testCode: "assert same_diag is True and same_off is True\nassert np.allclose(H[0], H[3]) and np.allclose(H[1], H[2])\nassert np.isclose(out[0, 0], out[3, 0]) and np.isclose(out[1, 0], out[2, 0])\nassert y4[0] != y4[1]\n# and the collapse fact: linear stacks multiply into one map\nM = W2.T @ W1.T\nassert M.shape == (1, 2)\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 7, title: "Scores to Odds", pattern: "softmax", skill: "one vector, many probabilities",
    statement: "Implement softmax(Z) row-wise: exponentiate, divide by the row sum — with the stability trick of subtracting each row's max first (exp of huge numbers overflows). Verify: rows sum to 1, softmax(Z + 1000) == softmax(Z), and argmax is preserved. Softmax is how networks answer 'which of K classes?' — the sigmoid's big sibling.",
    examples: [
      { input: "z = [2, 1, 0]", output: "≈ [0.665, 0.245, 0.090]", explain: "e² dominates, all rows sum to 1" },
      { input: "z + 1000", output: "same probabilities", explain: "only differences between scores matter" },
    ],
    why: "Binary problems got the sigmoid; K-class problems get softmax — it converts K raw scores into a probability distribution that sums to 1, weighted exponentially (eᶻⁱ/Σeᶻʲ). The stability trick is mandatory in real life: softmax(z) is invariant to adding a constant, so subtracting the row max changes nothing mathematically but prevents e^1000 = inf. The exponential weighting is the semantic content: it amplifies the leader and suppresses the tail, turning 'somewhat higher score' into 'much higher probability'.",
    starterCode: "import numpy as np\n\ndef softmax(Z):\n    ...  # stable, row-wise\n    pass\n\nZ = np.array([[2.0, 1.0, 0.0, -1.0],\n              [0.0, 0.0, 0.0, 0.0],\n              [-2.0, 3.0, 1.0, 0.5]])",
    hints: [
      "Shift first: Zs = Z - Z.max(axis=1, keepdims=True) — Problem 3's broadcasting again.",
      "E = np.exp(Zs); return E / E.sum(axis=1, keepdims=True).",
      "The shift is mathematically free: e^(z−m)/Σe^(z−m) = e^z/Σe^z.",
    ],
    solution: "import numpy as np\n\nZ = np.array([[2.0, 1.0, 0.0, -1.0],\n              [0.0, 0.0, 0.0, 0.0],\n              [-2.0, 3.0, 1.0, 0.5]])\n\ndef softmax(Z):\n    Zs = Z - Z.max(axis=1, keepdims=True)\n    E = np.exp(Zs)\n    return E / E.sum(axis=1, keepdims=True)",
    walkthrough: "Subtract → exponentiate → normalize: three lines, one distribution per row. The shift trick reuses Problem 3's keepdims broadcasting, and it is worth understanding WHY it's free: the max appears in every term of numerator and denominator, e^−m factors out and cancels. Test three invariants, not one example: rows sum to 1 (it's a distribution), shift invariance (only differences matter — this is also why log-softmax exists in real frameworks), argmax preserved (the decision doesn't change). Stage 8's Problem 44 derives softmax's famously clean gradient — the cleanest in all of deep learning.",
    testCode: "P = softmax(Z)\nassert P.shape == Z.shape\nassert np.allclose(P.sum(axis=1), 1.0)\nassert np.allclose(softmax(Z + 1000.0), P)\nassert np.allclose(P[0], np.exp([2, 1, 0, -1]) / np.exp([2, 1, 0, -1]).sum())\nassert list(np.argmax(P, axis=1)) == [0, 0, 1]  # argmax preserved (row 1 is uniform)\nassert np.all(P > 0)\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 7, title: "Price the Truth", pattern: "cross-entropy-k", skill: "−log of the right answer",
    statement: "Given probabilities P (rows sum to 1) and integer labels y, implement ce_loss(P, y) = −mean(log P[i, y[i]]). Evaluate on softmax(Z) with y = [0, 2, 1] and on a deliberately wrong confidence: ce_wrong for the row-0 distribution graded as if the truth were class 2 (its LEAST likely class). Confidently wrong must cost dearly.",
    examples: [
      { input: "p_true = 1.0", output: "loss = −log(1) = 0", explain: "certainty in the truth is free" },
      { input: "p_true = 0.01", output: "loss = −log(0.01) ≈ 4.6", explain: "confidently wrong, expensive" },
    ],
    why: "Multi-class cross-entropy is BCE's generalization, and simpler: the model spreads probability over K classes, the truth names one, and you pay −log of the probability that fell on the truth. No (1−y) term needed — the other classes' probability is implicitly penalized because it didn't land on the answer. The log keeps the scale multiplicative-honest: halving the correct probability adds a constant, regardless of class count. Clip exactly as in Problem 17 — log(0) is still −inf, floating point still rounds tiny exponentials to 0.0.",
    starterCode: "import numpy as np\n\nZ = np.array([[2.0, 1.0, 0.0, -1.0],\n              [0.0, 0.0, 0.0, 0.0],\n              [-2.0, 3.0, 1.0, 0.5]])\ny = np.array([0, 2, 1])\n\ndef softmax(Z):\n    Zs = Z - Z.max(axis=1, keepdims=True)\n    E = np.exp(Zs)\n    return E / E.sum(axis=1, keepdims=True)\n\ndef ce_loss(P, y):\n    ...  # clip + fancy-index + log + mean\n    pass\n\nloss = None      # ce_loss(softmax(Z), y)\nce_wrong = None  # row 0 graded as if truth were class 2",
    hints: [
      "Fancy indexing picks the truth column per row: P[np.arange(len(y)), y].",
      "loss = float(-np.mean(np.log(clip(P[np.arange(len(y)), y])))).",
      "ce_wrong: same formula but y replaced by [2] — grade row 0 against class 2.",
    ],
    solution: "import numpy as np\n\nZ = np.array([[2.0, 1.0, 0.0, -1.0],\n              [0.0, 0.0, 0.0, 0.0],\n              [-2.0, 3.0, 1.0, 0.5]])\ny = np.array([0, 2, 1])\n\ndef softmax(Z):\n    Zs = Z - Z.max(axis=1, keepdims=True)\n    E = np.exp(Zs)\n    return E / E.sum(axis=1, keepdims=True)\n\ndef ce_loss(P, y):\n    picked = np.clip(P[np.arange(len(y)), y], 1e-12, 1.0)\n    return float(-np.mean(np.log(picked)))\n\nloss = ce_loss(softmax(Z), y)\nce_wrong = ce_loss(softmax(Z), np.array([2, 2, 2]))",
    walkthrough: "P[np.arange(n), y] is the fancy-indexing idiom for 'the probability each row gave its own truth' — memorize it; it appears in every framework's loss. The clip is Problem 17's lesson, re-earned in the K-class setting. Read the numbers: loss is small (the model's confident rows are right), ce_wrong is huge (row 0 gave class 2 almost nothing, and −log of almost-nothing is enormous). That asymmetry — cheap when right, explosive when confidently wrong — is the gradient signal that will drive Stage 8's training. BCE for two classes, CE for K: same soul, one formula shorter.",
    testCode: "P = softmax(Z)\nassert np.isclose(loss, -np.mean(np.log([P[0, 0], P[1, 2], P[2, 1]])))\nassert loss < 1.5, loss\nassert ce_wrong > 2.0, ce_wrong\nassert ce_wrong > loss\nassert np.isclose(ce_wrong, -np.mean(np.log([P[0, 2], P[1, 2], P[2, 2]])))\nprint('All tests passed!')"
  },

  // ══ STAGE 8 — Backprop ══
  {
    id: 41, stage: 8, title: "The Chain, By Hand", pattern: "chain-rule", skill: "blame flows backwards",
    diagram: `   z ──▶ a = tanh(z) ──▶ L
   ▲          │
   └──────────┴── dL/dz = dL/da × da/dz

   backprop = walk the arrows backwards, multiplying the
   local factor of each arrow along the way`,
    statement: "A two-parameter scalar net: h = tanh(wa·x), out = wb·h, loss L = (out − y)². Derive dL/dwb = 2(out−y)·h and dL/dwa = 2(out−y)·wb·(1−h²)·x. Implement grad_wb(x, y, wa, wb) and grad_wa(x, y, wa, wb). The tests probe each parameter numerically (nudge ±1e-6, re-measure L) — your chain rule must match to 6 decimals.",
    examples: [
      { input: "out = wb·tanh(wa·x)", output: "dL/dwb = 2(out−y)·tanh(wa·x)", explain: "blame the output weight directly" },
      { input: "dL/dwa", output: "= 2(out−y)·wb·(1−h²)·x", explain: "blame flows: loss → out → h → wa" },
    ],
    why: "Backpropagation is the chain rule, organized. Read dL/dwa backwards: the error signal 2(out−y) comes from the loss; multiplying by wb asks 'how much did out respond to h?'; multiplying by (1−h²) asks 'how much did h respond to its input?' (tanh's derivative); multiplying by x asks 'how much did the input respond to wa?'. Four local questions, multiplied in sequence — no global calculus needed. Every backprop implementation ever written, including PyTorch's, evaluates exactly such chains; the numeric probe is the habit that keeps them honest.",
    starterCode: "import numpy as np\n\ndef grad_wb(x, y, wa, wb):\n    ...  # forward pass first, then the derivative\n    pass\n\ndef grad_wa(x, y, wa, wb):\n    ...\n    pass",
    hints: [
      "Forward: h = np.tanh(wa * x); out = wb * h; err = out - y.",
      "dL/dwb = 2 * err * h — wb touches out directly.",
      "dL/dwa = 2 * err * wb * (1 - h**2) * x — through the tanh.",
    ],
    solution: "import numpy as np\n\ndef grad_wb(x, y, wa, wb):\n    h = np.tanh(wa * x)\n    err = wb * h - y\n    return 2.0 * err * h\n\ndef grad_wa(x, y, wa, wb):\n    h = np.tanh(wa * x)\n    err = wb * h - y\n    return 2.0 * err * wb * (1.0 - h ** 2) * x",
    walkthrough: "Compare the two gradients: they share the error signal 2·err; they differ in the response-rate multipliers (wb touches the output directly; wa reaches it through tanh). The (1−h²) factor is tanh's slope AT THE CURRENT ACTIVATION — when h saturates near ±1, the slope vanishes and blame stops flowing (the vanishing gradient, met for real when nets go deep). Verify the probe habit: the test perturbs each parameter, re-measures L, and demands agreement with your algebra — run this check after EVERY hand derivation for the rest of your career.",
    testCode: "cases = [(0.7, 1.0, 0.9, -0.4), (-1.2, 0.5, 2.0, 0.3), (2.0, -1.0, -0.6, 1.1)]\nfor x0, y0, wa0, wb0 in cases:\n    h = 1e-6\n    L = lambda a, b: (b * np.tanh(a * x0) - y0) ** 2\n    assert abs(grad_wb(x0, y0, wa0, wb0) - (L(wa0, wb0 + h) - L(wa0, wb0 - h)) / (2 * h)) < 1e-6\n    assert abs(grad_wa(x0, y0, wa0, wb0) - (L(wa0 + h, wb0) - L(wa0 - h, wb0)) / (2 * h)) < 1e-6\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 8, title: "Blame Every Knob", pattern: "backprop-vector", skill: "every gradient at once",
    statement: "Full backward pass for the (4,2)→(4,4)→(4,1) net on the XOR corners with MSE loss. Implement backward(X, y, W1, b1, W2, b2) returning (dW1, db1, dW2, db2): delta2 = 2·(out − y)/n; dW2 = Hᵀ@delta2; db2 = delta2.sum(0); delta1 = (delta2 @ W2.T)·(1 − H²); dW1 = Xᵀ@delta1; db1 = delta1.sum(0). The tests verify ALL 17 parameters against numeric gradients.",
    examples: [
      { input: "delta2 (4,1) = output blame", output: "dW2 = Hᵀ @ delta2 — reuse the forward's H", explain: "each weight's blame = upstream error × its input" },
      { input: "delta1 = (delta2 @ W2ᵀ) ⊙ (1 − H²)", output: "blame pushed through W2, then bent by tanh'", explain: "the chain rule as two matrix ops" },
    ],
    why: "This is the algorithm that trains every neural network on Earth, in its entirety. Two patterns to internalize. Shape rhythm: delta always has the activation's shape; a weight's gradient is always (its input)ᵀ @ (its output blame) — dW = inᵀ·delta. The bend: pushing delta backwards through tanh multiplies by (1 − H²), the derivative evaluated at the FORWARD activations (which is why the forward pass saves them). Get these two rhythms right and any architecture — convolutions, attention — becomes bookkeeping.",
    starterCode: "import numpy as np\n\nX, y4 = net_world()\nW1, b1, W2, b2 = net_init()\nn = len(X)\n\ndef forward(X, W1, b1, W2, b2):\n    H = np.tanh(X @ W1 + b1)\n    return H, H @ W2 + b2\n\ndef backward(X, y, W1, b1, W2, b2):\n    ...  # forward, then the two deltas, then four gradients\n    pass",
    hints: [
      "y is shape (4,) — reshape to (4,1) before subtracting out.",
      "delta2 = 2.0 * (out - y.reshape(-1, 1)) / n.",
      "delta1 = (delta2 @ W2.T) * (1 - H ** 2).",
      "dW1 = X.T @ delta1; db1 = delta1.sum(axis=0); dW2 = H.T @ delta2; db2 = delta2.sum(axis=0).",
    ],
    solution: "import numpy as np\n\nX, y4 = net_world()\nW1, b1, W2, b2 = net_init()\nn = len(X)\n\ndef forward(X, W1, b1, W2, b2):\n    H = np.tanh(X @ W1 + b1)\n    return H, H @ W2 + b2\n\ndef backward(X, y, W1, b1, W2, b2):\n    H, out = forward(X, W1, b1, W2, b2)\n    delta2 = 2.0 * (out - y.reshape(-1, 1)) / n\n    dW2 = H.T @ delta2\n    db2 = delta2.sum(axis=0)\n    delta1 = (delta2 @ W2.T) * (1.0 - H ** 2)\n    dW1 = X.T @ delta1\n    db1 = delta1.sum(axis=0)\n    return dW1, db1, dW2, db2",
    walkthrough: "Run the shapes left to right: delta2 (4,1) → dW2 = (4,4)ᵀ@(4,1) = (4,1) ✓ → delta1 = (4,1)@(1,4)⊙(4,4) = (4,4) ✓ → dW1 = (4,2)ᵀ@(4,4) = (2,4) ✓. Every gradient is two matrix ops. The ⊙(1−H²) is the tanh bending blame — evaluated at forward values, the reason forward saves what backward needs. The numeric check in the tests perturbs each of the 17 parameters and re-measures L: agreement to 7 decimals is the certificate that your algebra, your shapes, AND your factors of 1/n are all right at once.",
    testCode: "dW1, db1, dW2, db2 = backward(X, y4, W1, b1, W2, b2)\nassert dW1.shape == (2, 4) and db1.shape == (4,)\nassert dW2.shape == (4, 1) and db2.shape == (1,)\nh = 1e-6\ndef L_of(W1_, b1_, W2_, b2_):\n    _, out = forward(X, W1_, b1_, W2_, b2_)\n    return float(np.mean((out - y4.reshape(-1, 1)) ** 2))\nfor i in range(2):\n    for j in range(4):\n        Wp = W1.copy(); Wp[i, j] += h\n        Wm = W1.copy(); Wm[i, j] -= h\n        num = (L_of(Wp, b1, W2, b2) - L_of(Wm, b1, W2, b2)) / (2 * h)\n        assert abs(dW1[i, j] - num) < 1e-7, (i, j, dW1[i, j], num)\nfor j in range(4):\n    bp = b1.copy(); bp[j] += h\n    bm = b1.copy(); bm[j] -= h\n    num = (L_of(W1, bp, W2, b2) - L_of(W1, bm, W2, b2)) / (2 * h)\n    assert abs(db1[j] - num) < 1e-7, (j, db1[j], num)\nfor i in range(4):\n    Wp = W2.copy(); Wp[i, 0] += h\n    Wm = W2.copy(); Wm[i, 0] -= h\n    num = (L_of(W1, b1, Wp, b2) - L_of(W1, b1, Wm, b2)) / (2 * h)\n    assert abs(dW2[i, 0] - num) < 1e-7, (i, dW2[i, 0], num)\nnum = (L_of(W1, b1, W2, b2 + h) - L_of(W1, b1, W2, b2 - h)) / (2 * h)\nassert abs(db2[0] - num) < 1e-7\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 8, title: "Train the Net", pattern: "training-loop", skill: "the loop, end to end",
    statement: "Assemble the full training loop on the XOR corners: forward (P37) → MSE loss → backward (P42) → step, for 2000 full-batch steps at lr = 0.1, starting from net_init. Report final_loss and net_acc = fraction of corners predicted correctly (pred = out > 0.5). The blind network of Problem 38 breaks its own symmetry and learns XOR — watch it happen from 4 lines of loop.",
    examples: [
      { input: "step 0", output: "loss ≈ 0.3, acc 0.5", explain: "the symmetric, blind start" },
      { input: "step 2000", output: "loss < 0.02, acc 1.0", explain: "symmetry broken, corners separated" },
    ],
    why: "This is the payoff of the entire ladder's second half: the same loop as Problems 9 and 18 — predict, blame, step — now driving a nonlinear network through a problem a line provably cannot solve (Problem 50 will prove it). Nothing was added: no framework, no magic, just the chain rule vectorized. The symmetry breaking is worth watching: Problem 38's init maps diagonal corners to identical activations, but their ERRORS differ (labels 0 vs 1), so the gradients push W1's rows apart — the blindness cures itself, one step at a time.",
    starterCode: "import numpy as np\n\nX, y4 = net_world()\nn = len(X)\nW1, b1, W2, b2 = net_init()\nlr = 0.1\n\ndef forward(X, W1, b1, W2, b2):\n    H = np.tanh(X @ W1 + b1)\n    return H, H @ W2 + b2\n\nfor step in range(2000):\n    ...  # forward, MSE, backward, step all four parameters\n    pass\n\n_, out = forward(X, W1, b1, W2, b2)\nfinal_loss = float(np.mean((out - y4.reshape(-1, 1)) ** 2))\nnet_acc = float(np.mean((out[:, 0] > 0.5).astype(float) == y4))",
    hints: [
      "Inside the loop: H, out = forward(...); delta2 = 2*(out - y.reshape(-1,1))/n; delta1 = (delta2 @ W2.T)*(1 - H**2).",
      "Update all four: W1 -= lr * X.T @ delta1; b1 -= lr * delta1.sum(0); W2 -= lr * H.T @ delta2; b2 -= lr * delta2.sum(0).",
      "Or call backward() and step with its four gradients — same thing.",
    ],
    solution: "import numpy as np\n\nX, y4 = net_world()\nn = len(X)\nW1, b1, W2, b2 = net_init()\nlr = 0.1\n\ndef forward(X, W1, b1, W2, b2):\n    H = np.tanh(X @ W1 + b1)\n    return H, H @ W2 + b2\n\nfor step in range(2000):\n    H, out = forward(X, W1, b1, W2, b2)\n    delta2 = 2.0 * (out - y4.reshape(-1, 1)) / n\n    dW2 = H.T @ delta2\n    db2 = delta2.sum(axis=0)\n    delta1 = (delta2 @ W2.T) * (1.0 - H ** 2)\n    dW1 = X.T @ delta1\n    db1 = delta1.sum(axis=0)\n    W1 -= lr * dW1\n    b1 -= lr * db1\n    W2 -= lr * dW2\n    b2 -= lr * db2\n\n_, out = forward(X, W1, b1, W2, b2)\nfinal_loss = float(np.mean((out - y4.reshape(-1, 1)) ** 2))\nnet_acc = float(np.mean((out[:, 0] > 0.5).astype(float) == y4))",
    walkthrough: "Two matmuls forward, two matmuls of blame backward, four updates — 2000 times. The loss curve tells the story: a flat plateau while the symmetry holds (the net sees two corners, not four), then a dive as W1's rows separate and the hidden representations split, then convergence to near-zero error with every corner on the right side of 0.5. You have now built, by hand, with no framework, the same machinery that trains GPT — scaled down by nine orders of magnitude but identical in kind.",
    testCode: "assert final_loss < 0.02, final_loss\nassert net_acc == 1.0, net_acc\nassert np.all(np.isfinite(W1)) and np.all(np.isfinite(W2))\n# symmetry is truly broken: diagonal corners no longer identical\nH, _ = forward(X, W1, b1, W2, b2)\nassert not np.allclose(H[0], H[3])\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 8, title: "The Clean Gradient", pattern: "softmax-grad", skill: "prediction minus truth",
    statement: "Softmax + cross-entropy has the most elegant gradient in deep learning: dL/dZ = (P − onehot(y)) / n — literally prediction minus truth. Implement ce_grad(Z, y) returning this (P = softmax(Z), onehot built with fancy indexing). The tests verify every entry against numeric gradients of the CE loss. When a gradient is this clean, memorize it — you will re-derive it in every interview.",
    examples: [
      { input: "P row [0.7, 0.2, 0.1], truth 0", output: "row grad ∝ [−0.3, +0.2, +0.1]", explain: "winning class pushed up, losers pushed down" },
      { input: "perfect prediction", output: "P == onehot → gradient ≈ 0", explain: "nothing to fix" },
    ],
    why: "Deriving it: L = −log P[y], P = softmax(Z); the exponential's derivative cancels the normalization's chain — everything telescopes to P − onehot. Two consequences worth savoring. First, the gradient's entries sum to zero per row: probability mass is pushed from wrong classes to the right one, never created or destroyed. Second, the gradient is bounded (entries in [−1, 1]) — no exploding signals here, which is part of why softmax+CE trains so much more stably than MSE on the same network. This subtraction form is the logit-level loss that every modern classifier uses.",
    starterCode: "import numpy as np\n\nZ = np.array([[2.0, 1.0, 0.0, -1.0],\n              [0.5, 0.2, 1.5, -0.3],\n              [-2.0, 3.0, 1.0, 0.5]])\ny = np.array([0, 2, 1])\nn = len(y)\n\ndef softmax(Z):\n    Zs = Z - Z.max(axis=1, keepdims=True)\n    E = np.exp(Zs)\n    return E / E.sum(axis=1, keepdims=True)\n\ndef ce_grad(Z, y):\n    ...  # (P - onehot) / n\n    pass",
    hints: [
      "Onehot: Y = np.zeros_like(Z); Y[np.arange(n), y] = 1.0.",
      "Return (softmax(Z) - Y) / n.",
      "Sanity: each row of the gradient sums to 0.",
    ],
    solution: "import numpy as np\n\nZ = np.array([[2.0, 1.0, 0.0, -1.0],\n              [0.5, 0.2, 1.5, -0.3],\n              [-2.0, 3.0, 1.0, 0.5]])\ny = np.array([0, 2, 1])\nn = len(y)\n\ndef softmax(Z):\n    Zs = Z - Z.max(axis=1, keepdims=True)\n    E = np.exp(Zs)\n    return E / E.sum(axis=1, keepdims=True)\n\ndef ce_grad(Z, y):\n    Y = np.zeros_like(Z)\n    Y[np.arange(n), y] = 1.0\n    return (softmax(Z) - Y) / n",
    walkthrough: "P − onehot: positive entries where softmax put probability the truth didn't claim (push those logits DOWN), negative where the truth deserved more (push UP), divided by n for the mean. The test's numeric probe confirms each of the 12 entries — and the probe works because CE is a smooth function of every logit (softmax couples them all). One habit to take to real frameworks: you never compute softmax then log separately there — log-softmax fuses them for numerical safety, same math, no log(0).",
    testCode: "G = ce_grad(Z, y)\nassert G.shape == Z.shape\nassert np.allclose(G.sum(axis=1), 0.0, atol=1e-12)\nh = 1e-6\ndef ce(Z_):\n    P = softmax(Z_)\n    return float(-np.mean(np.log(P[np.arange(n), y])))\nfor i in range(3):\n    for j in range(4):\n        Zp = Z.copy(); Zp[i, j] += h\n        Zm = Z.copy(); Zm[i, j] -= h\n        num = (ce(Zp) - ce(Zm)) / (2 * h)\n        assert abs(G[i, j] - num) < 1e-8, (i, j, G[i, j], num)\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 8, title: "Adam, Assembled", pattern: "adaptive-opt", skill: "a step per knob",
    statement: "Assemble Adam (no bias correction) on the exam_world logistic problem: per-parameter m = β1·m + (1−β1)·g (momentum), v = β2·v + (1−β2)·g² (per-knob gradient scale), w −= lr·m / (√v + ε). Train 150 steps with lr=0.05, β1=0.9, β2=0.999, ε=1e-8; report loss_adam. The tests run plain GD (lr=0.5, 150 steps) for comparison — same problem, same steps, and Adam must win.",
    examples: [
      { input: "plain GD", output: "one shared step size for every weight", explain: "the bias column and feature columns share a fate" },
      { input: "Adam", output: "each weight gets its own effective step", explain: "v divides by each knob's own gradient history" },
    ],
    why: "Adam = momentum (Problem 14: average the gradient) + per-parameter scaling (divide by each knob's own gradient magnitude) + both running averages. The v term is the new idea: weights that see large gradients consistently get their steps shrunk; weights with tiny, quiet gradients get their steps AMPLIFIED — so a badly scaled problem (Problem 12's disease) stops mattering. This is why Adam is the default optimizer nearly everywhere: it converges acceptably almost without tuning. You now know what those three numbers (β1, β2, ε) in every training script actually do.",
    starterCode: "import numpy as np\n\nX, y = exam_world()\nXb = np.column_stack([np.ones(len(X)), X])\nn, d = Xb.shape\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nw = np.zeros(d)\nm = np.zeros(d)\nv = np.zeros(d)\nlr, b1, b2, eps = 0.05, 0.9, 0.999, 1e-8\n\nfor step in range(150):\n    ...  # p, grad, then m, v, and the Adam step\n    pass\n\nloss_adam = float(-np.mean(y * np.log(sigmoid(Xb @ w)) + (1 - y) * np.log(1 - sigmoid(Xb @ w))))",
    hints: [
      "g = (Xb.T @ (sigmoid(Xb @ w) - y)) / n — Problem 18's gradient.",
      "m = b1 * m + (1 - b1) * g;  v = b2 * v + (1 - b2) * g ** 2.",
      "w -= lr * m / (np.sqrt(v) + eps).",
    ],
    solution: "import numpy as np\n\nX, y = exam_world()\nXb = np.column_stack([np.ones(len(X)), X])\nn, d = Xb.shape\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nw = np.zeros(d)\nm = np.zeros(d)\nv = np.zeros(d)\nlr, b1, b2, eps = 0.05, 0.9, 0.999, 1e-8\n\nfor step in range(150):\n    p = sigmoid(Xb @ w)\n    g = (Xb.T @ (p - y)) / n\n    m = b1 * m + (1 - b1) * g\n    v = b2 * v + (1 - b2) * g ** 2\n    w -= lr * m / (np.sqrt(v) + eps)\n\nloss_adam = float(-np.mean(y * np.log(sigmoid(Xb @ w) + 1e-12) + (1 - y) * np.log(1 - sigmoid(Xb @ w) + 1e-12)))",
    walkthrough: "Three running averages, one division. m smooths the direction (momentum's gift); v measures each knob's typical gradient SIZE, and dividing by √v normalizes every parameter's effective step to roughly lr — a built-in, per-knob version of Problem 12's feature scaling, except it adapts as training progresses. Watch the fairness: the bias and every feature column converge at comparable rates without any manual scaling. When your next framework run prints 'Adam, lr=3e-4, betas=(0.9, 0.999)', you are reading this exact loop.",
    testCode: "# plain GD, same problem, same steps\nw_gd = np.zeros(d)\nfor _ in range(150):\n    p = sigmoid(Xb @ w_gd)\n    w_gd -= 0.5 * (Xb.T @ (p - y)) / n\np_gd = sigmoid(Xb @ w_gd)\nloss_gd = float(-np.mean(y * np.log(p_gd + 1e-12) + (1 - y) * np.log(1 - p_gd + 1e-12)))\nassert np.isfinite(loss_adam)\nassert loss_adam < loss_gd, (loss_adam, loss_gd)\nassert loss_adam < 0.25, loss_adam\nprint('All tests passed!')"
  },

  // ══ STAGE 9 — The Craft ══
  {
    id: 46, stage: 9, title: "The Four Fates", pattern: "confusion-grid", skill: "count every outcome",
    diagram: `                  actual
                yes      no
    pred yes    TP   ·   FP        two ways to be right
    pred no     FN   ·   TN        two ways to be wrong — not equal sins
    accuracy hides which sin · precision and recall name them`,
    statement: "From spam_world at threshold 0.5, build the confusion grid: grid = [[tn, fp], [fn, tp]] as literal integers. Every classification metric you will ever use — precision, recall, specificity, F1, MCC — is arithmetic on these four numbers. Count them by mask, then hardcode-free verify against Problem 19's counts().",
    examples: [
      { input: "spam caught (tp)", output: "true positive column", explain: "the grid is the model's autobiography" },
      { input: "ham jailed (fp)", output: "false positive — the costly embarrassment", explain: "every cell has a different business cost" },
    ],
    why: "Two rows (predicted spam / predicted ham) × two columns (actually spam / actually ham): four cells, four different stories. The diagonal (tn, tp) is credit; the off-diagonal (fp, fn) is cost — and they are NOT interchangeable (jailing real customers vs letting spam through). Metrics choose which cell to care about; business requirements choose which metric. Building the grid from masks — not from memory — is the skill, because under imbalance and threshold changes the cells move in ways intuition alone mispredicts.",
    starterCode: "import numpy as np\n\nscores, y = spam_world()\nt = 0.5\npreds = (scores >= t).astype(int)\n\ngrid = None  # [[tn, fp], [fn, tp]] — literal integers from masks",
    hints: [
      "tn: preds == 0 AND y == 0; fp: preds == 1 AND y == 0.",
      "fn: preds == 0 AND y == 1; tp: preds == 1 AND y == 1.",
      "int(np.sum(...)) each cell; arrange [[tn, fp], [fn, tp]].",
    ],
    solution: "import numpy as np\n\nscores, y = spam_world()\nt = 0.5\npreds = (scores >= t).astype(int)\n\ntn = int(np.sum((preds == 0) & (y == 0)))\nfp = int(np.sum((preds == 1) & (y == 0)))\nfn = int(np.sum((preds == 0) & (y == 1)))\ntp = int(np.sum((preds == 1) & (y == 1)))\ngrid = [[tn, fp], [fn, tp]]",
    walkthrough: "Four masks, four counts, one grid. Read it like a story: the model flags 5 emails as spam; 3 really were (tp), 2 weren't (fp — someone's password reset email, gone to the junk folder). It clears 7; 5 were genuinely ham (tn), 2 were spam that slipped through (fn). The grid at threshold 0.5 is one frame of a movie — Problem 48 will sweep the threshold and watch all four cells trade places. Note the consistency check: the four cells must sum to n — always assert it; a grid that doesn't sum up means a mask lied.",
    testCode: "assert grid == [[5, 2], [1, 4]], grid\nassert grid[0][0] + grid[0][1] + grid[1][0] + grid[1][1] == len(y)\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 9, title: "Name the Trade", pattern: "precision-recall-f1", skill: "three numbers, one story",
    statement: "From Problem 46's grid (recompute it — the grid is cheap), implement precision(), recall(), and f1() as functions of the grid, and report p05, r05, f05 at threshold 0.5. Then report the same three at threshold 0.7 as p07, r07, f07. Watch precision climb and recall fall as the bar rises — F1, their harmonic mean, dips under imbalance between them.",
    examples: [
      { input: "tp=3, fp=2, fn=2", output: "precision 0.6, recall 0.6, F1 0.6", explain: "balanced here — they only agree by coincidence" },
      { input: "precision 1.0, recall 0.1", output: "F1 ≈ 0.18, not the average 0.55", explain: "harmonic mean punishes imbalance" },
    ],
    why: "Precision = tp/(tp+fp): of everything flagged, how much was real — the cost of false alarms. Recall = tp/(tp+fn): of everything real, how much was caught — the cost of misses. They trade against each other (Problem 19), and quoting one alone is how models lie. F1 combines them with the HARMONIC mean, which has the exact property a trade metric needs: it sags toward the smaller value, so 1.0/0.1 scores 0.18, not a flattering 0.55 average. High F1 requires being good at BOTH — that is its entire job.",
    starterCode: "import numpy as np\n\nscores, y = spam_world()\n\ndef grid_at(t):\n    preds = (scores >= t).astype(int)\n    tn = int(np.sum((preds == 0) & (y == 0)))\n    fp = int(np.sum((preds == 1) & (y == 0)))\n    fn = int(np.sum((preds == 0) & (y == 1)))\n    tp = int(np.sum((preds == 1) & (y == 1)))\n    return [[tn, fp], [fn, tp]]\n\ndef prf(grid):\n    ...  # precision, recall, f1 from the grid — guard divisions by zero\n    pass\n\np05, r05, f05 = None, None, None\np07, r07, f07 = None, None, None",
    hints: [
      "precision = tp / (tp + fp) if tp + fp else 0.0; recall = tp / (tp + fn) if tp + fn else 0.0.",
      "f1 = 2·p·r / (p + r) if p + r else 0.0.",
      "grid_at(0.5) and grid_at(0.7) feed prf.",
    ],
    solution: "import numpy as np\n\nscores, y = spam_world()\n\ndef grid_at(t):\n    preds = (scores >= t).astype(int)\n    tn = int(np.sum((preds == 0) & (y == 0)))\n    fp = int(np.sum((preds == 1) & (y == 0)))\n    fn = int(np.sum((preds == 0) & (y == 1)))\n    tp = int(np.sum((preds == 1) & (y == 1)))\n    return [[tn, fp], [fn, tp]]\n\ndef prf(grid):\n    tn, fp = grid[0]\n    fn, tp = grid[1]\n    precision = tp / (tp + fp) if (tp + fp) else 0.0\n    recall = tp / (tp + fn) if (tp + fn) else 0.0\n    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0\n    return precision, recall, f1\n\np05, r05, f05 = prf(grid_at(0.5))\np07, r07, f07 = prf(grid_at(0.7))",
    walkthrough: "Three functions of four counts — every classification metric in the wild reduces to this grid arithmetic. The 0.7 threshold jails fewer innocents (precision up from 0.6 to 0.75) at the price of missing more spam (recall down from 0.6 to 0.5 here... verify in the tests). The division guards are not decoration: at a strict enough threshold tp+fp hits zero and naive code divides by zero — exactly when a careful practitioner reports 'no predictions at this threshold' instead of crashing. When someone quotes a single metric, ask for the grid; when they quote F1, remember it forgives nothing.",
    testCode: "assert np.isclose(p05, 2 / 3) and np.isclose(r05, 4 / 5) and np.isclose(f05, 8 / 11)\nassert p07 > p05, (p05, p07)\nassert r07 < r05, (r05, r07)\nassert all(0 <= v <= 1 for v in [p05, r05, f05, p07, r07, f07])\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 9, title: "Trace the Trade", pattern: "roc-sweep", skill: "every threshold at once",
    statement: "Sweep thresholds from 1.1 down to −0.1 in steps of 0.1 (13 thresholds). At each, compute fpr = fp/(fp+tn) and tpr = tp/(tp+fn) from spam_world; collect points as a list of (fpr, tpr) tuples in threshold order. Report roc (the 13 points). The curve's shape — not any single threshold — is the model's true quality, independent of where the business later sets the bar.",
    examples: [
      { input: "t = 1.1 (flag nothing)", output: "(fpr, tpr) = (0, 0)", explain: "no alarms, no catches" },
      { input: "t = −0.1 (flag everything)", output: "(1, 1)", explain: "everyone flagged, everyone caught" },
    ],
    why: "One threshold gives one operating point — one trade between jailing innocents and missing spam. Sweeping ALL thresholds traces the full menu of trades: the ROC curve. A useless model (random scores) traces the diagonal; a perfect model hugs the top-left (all catches, no false alarms); real models live between, and the AREA under the curve (AUC) summarizes the position — 0.5 is a coin flip, 1.0 is clairvoyance. The business then picks a POINT on this curve; the model's job is to push the whole curve toward the corner.",
    starterCode: "import numpy as np\n\nscores, y = spam_world()\nn_pos = int(np.sum(y == 1))\nn_neg = int(np.sum(y == 0))\n\nroc = []   # list of (fpr, tpr) tuples, thresholds 1.1 → -0.1\nfor t in np.arange(1.1, -0.11, -0.1):\n    ...  # counts at t, then fpr, tpr\n    pass",
    hints: [
      "Reuse the mask counts: preds = (scores >= t).astype(int).",
      "fpr = fp / n_neg; tpr = tp / n_pos — denominators are constants (cleaner, no zero-division).",
      "roc.append((float(fpr), float(tpr))) — keep threshold order.",
    ],
    solution: "import numpy as np\n\nscores, y = spam_world()\nn_pos = int(np.sum(y == 1))\nn_neg = int(np.sum(y == 0))\n\nroc = []\nfor t in np.arange(1.1, -0.11, -0.1):\n    preds = (scores >= t).astype(int)\n    tp = int(np.sum((preds == 1) & (y == 1)))\n    fp = int(np.sum((preds == 1) & (y == 0)))\n    roc.append((float(fp / n_neg), float(tp / n_pos)))",
    walkthrough: "As the bar falls from 1.1 to −0.1, each positive crosses into 'flagged' exactly once — tpr climbs in the order the positives are scored — and each negative crossing pushes fpr up. A model that ranks spam above ham climbs tpr FASTER than fpr: the curve bows above the diagonal (asserted in the tests). This is why ROC/AUC ignores the threshold entirely and evaluates the RANKING — which is also its blind spot: under extreme imbalance, a model can rank well while being useless at any practical threshold, which is why precision-recall curves exist as the companion plot. Two curves, two questions: 'is the ranking good?' (ROC) and 'is any operating point usable?' (PR).",
    testCode: "assert len(roc) == 13\nassert roc[0] == (0.0, 0.0) and roc[-1] == (1.0, 1.0)\nfprs = [p[0] for p in roc]\ntprs = [p[1] for p in roc]\nassert all(tprs[i+1] >= tprs[i] - 1e-12 for i in range(12)), tprs\nassert all(fprs[i+1] >= fprs[i] - 1e-12 for i in range(12)), fprs\nassert all(t >= f - 1e-9 for f, t in roc), \"curve should bow above the diagonal\"\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 9, title: "Select by the Judge", pattern: "cv-selection", skill: "choose models cross-validated",
    statement: "fraud_world, 4-fold CV, the honest pipeline: per fold, z-score features using TRAIN-fold statistics only, train the logistic (400 steps, lr=0.5, Problem 18's gradient), and grade the fold with balanced_error (Problem 20's metric — accuracy is Problem 20's mirage). Report be_majority (the lazy all-legit baseline's mean balanced error) and be_model (the logistic's). The model must beat the baseline where it counts.",
    examples: [
      { input: "majority model, any fold", output: "balanced error = 0.5", explain: "misses every fraud, alarms nobody — mediocre by construction" },
      { input: "trained logistic, per fold", output: "balanced error well under 0.5", explain: "it actually reads the features" },
    ],
    why: "This problem composes the whole Stage-4/9 toolkit into the loop practitioners actually run: scale honestly (no leakage — train stats only), train inside the fold, grade with a metric that respects imbalance, average across folds, and compare against a BASELINE rather than zero. Every model-selection decision you will ever make — which features, which λ, which architecture — should pass through exactly this gauntlet. The baseline comparison is the step everyone skips: beating the naive majority on balanced error is the minimum bar for 'the model learned something'.",
    starterCode: "import numpy as np\n\nXf, yf = fraud_world()\nn, d = Xf.shape\nk = 4\nidx = np.arange(n)\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\ndef balanced_error(y_true, preds):\n    err1 = np.mean(preds[y_true == 1] != 1) if np.any(y_true == 1) else 0.0\n    err0 = np.mean(preds[y_true == 0] != 0) if np.any(y_true == 0) else 0.0\n    return float((err1 + err0) / 2.0)\n\nfold_be_model = []\nfor i in range(k):\n    te = idx[i * (n // k):(i + 1) * (n // k)]\n    tr = np.concatenate([idx[:i * (n // k)], idx[(i + 1) * (n // k):]])\n    ...  # scale with TRAIN stats, train logistic on the fold's train rows,\n         # predict the fold, append balanced_error\n    pass\n\nbe_majority = None   # mean over folds for the all-legit model\nbe_model = None      # mean over folds for the logistic",
    hints: [
      "mu, sd = Xf[tr].mean(axis=0), Xf[tr].std(axis=0) — train fold ONLY (Problem 25's wall).",
      "Train on (Xf[tr] - mu) / sd with a bias column; 400 steps, lr=0.5, gradient Xbᵀ(p−y)/n_tr.",
      "Predict the TEST fold scaled with the SAME mu, sd — never refit on test.",
      "be_majority: the all-zeros model's balanced error is 0.5 every fold — average is 0.5.",
    ],
    solution: "import numpy as np\n\nXf, yf = fraud_world()\nn, d = Xf.shape\nk = 4\nidx = np.arange(n)\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\ndef balanced_error(y_true, preds):\n    err1 = np.mean(preds[y_true == 1] != 1) if np.any(y_true == 1) else 0.0\n    err0 = np.mean(preds[y_true == 0] != 0) if np.any(y_true == 0) else 0.0\n    return float((err1 + err0) / 2.0)\n\nfold_be_model = []\nfor i in range(k):\n    te = idx[i * (n // k):(i + 1) * (n // k)]\n    tr = np.concatenate([idx[:i * (n // k)], idx[(i + 1) * (n // k):]])\n    mu, sd = Xf[tr].mean(axis=0), Xf[tr].std(axis=0)\n    Xtr = (Xf[tr] - mu) / sd\n    Xte = (Xf[te] - mu) / sd\n    Xb_tr = np.column_stack([np.ones(len(tr)), Xtr])\n    Xb_te = np.column_stack([np.ones(len(te)), Xte])\n    w = np.zeros(Xb_tr.shape[1])\n    for _ in range(400):\n        p = sigmoid(Xb_tr @ w)\n        w -= 0.5 * (Xb_tr.T @ (p - yf[tr])) / len(tr)\n    preds = (sigmoid(Xb_te @ w) > 0.5).astype(int)\n    fold_be_model.append(balanced_error(yf[te], preds))\n\nbe_majority = 0.5\nbe_model = float(np.mean(fold_be_model))",
    walkthrough: "The full ceremony, assembled from problems you have already solved: scaling (12) held honest (25), the logistic loop (18), the metric that resists imbalance (20), the rotation (24), the baseline (20 again). Notice what the score means: 0.5 is 'learned nothing beyond the class ratio'; below that, the model genuinely reads features. Production order of operations distilled: freeze a test set first if you can afford one, CV on the rest for every decision, and report the baseline next to the model so the improvement has a denominator.",
    testCode: "assert np.isclose(be_majority, 0.5)\nassert be_model < 0.3, be_model\nassert len(fold_be_model) == 4\nassert np.isclose(be_model, np.mean(fold_be_model))\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 9, title: "Earn the Complexity", pattern: "model-comparison", skill: "the simplest model that wins",
    diagram: `        ○ ●          one straight line can never part these
        ● ○          every line cuts 3-1 → stuck at 50%

   a bent space can:   X → W1 → tanh → W2   →   100%
   capacity buys the bend the data demands`,
    statement: "The finale, on net_world (XOR): train the logistic exactly as in Problem 18 (800 steps, lr=0.5, from w = zeros) and report acc_line. Train the 2→4→1 net exactly as in Problem 43 and report acc_net. The line is stuck at a saddle — its gradient is EXACTLY zero at this init on this data — while the network's nonlinearity breaks the tie. Report both; let the data choose the model.",
    examples: [
      { input: "logistic on XOR", output: "accuracy exactly 0.5 — the gradient is identically zero at the origin", explain: "p = 0.5 everywhere; symmetry cancels every gradient term" },
      { input: "the 2→4→1 net", output: "accuracy 1.0", explain: "tanh bends; XOR becomes separable" },
    ],
    why: "The two models face the same four points and the verdict is structural, not statistical: XOR is not linearly separable — no line, however placed, can put [0,1],[1,0] on one side and [0,0],[1,1] on the other. Worse, from the zero init the logistic's gradient is EXACTLY zero (the corner errors cancel in symmetric pairs), so training does not even begin — a saddle point, witnessed. The network escapes because tanh + hidden units create decision regions a line cannot. The craft lesson rides on top: use the simplest model that fits — but no simpler, and KNOW which is which.",
    starterCode: "import numpy as np\n\nX, y4 = net_world()\nn = len(X)\n\ndef forward(X, W1, b1, W2, b2):\n    H = np.tanh(X @ W1 + b1)\n    return H, H @ W2 + b2\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\n# the line\nXb = np.column_stack([np.ones(n), X])\nw = np.zeros(3)\nfor _ in range(800):\n    ...  # Problem 18's loop\n    pass\nacc_line = None\n\n# the net: Problem 43's loop, 2000 steps, lr=0.1, net_init weights\nW1, b1, W2, b2 = net_init()\nfor _ in range(2000):\n    ...\n    pass\nacc_net = None",
    hints: [
      "Line: p = sigmoid(Xb @ w); w -= 0.5 * (Xb.T @ (p - y4)) / n; preds = (p > 0.5).",
      "Watch the line's weights after 800 steps — they never left zero. Why? (Problem 38's symmetry.)",
      "Net: copy Problem 43's loop verbatim; pred = out[:, 0] > 0.5.",
    ],
    solution: "import numpy as np\n\nX, y4 = net_world()\nn = len(X)\n\ndef forward(X, W1, b1, W2, b2):\n    H = np.tanh(X @ W1 + b1)\n    return H, H @ W2 + b2\n\ndef sigmoid(z):\n    out = np.empty_like(z, dtype=float)\n    pos = z >= 0\n    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n    ez = np.exp(z[~pos])\n    out[~pos] = ez / (1.0 + ez)\n    return out\n\nXb = np.column_stack([np.ones(n), X])\nw = np.zeros(3)\nfor _ in range(800):\n    p = sigmoid(Xb @ w)\n    w -= 0.5 * (Xb.T @ (p - y4)) / n\np = sigmoid(Xb @ w)\nacc_line = float(np.mean((p > 0.5).astype(float) == y4))\n\nW1, b1, W2, b2 = net_init()\nfor _ in range(2000):\n    H = np.tanh(X @ W1 + b1)\n    out = H @ W2 + b2\n    delta2 = 2.0 * (out - y4.reshape(-1, 1)) / n\n    dW2 = H.T @ delta2\n    db2 = delta2.sum(axis=0)\n    delta1 = (delta2 @ W2.T) * (1.0 - H ** 2)\n    dW1 = X.T @ delta1\n    db1 = delta1.sum(axis=0)\n    W1 -= 0.1 * dW1\n    b1 -= 0.1 * db1\n    W2 -= 0.1 * dW2\n    b2 -= 0.1 * db2\n\n_, out = forward(X, W1, b1, W2, b2)\nacc_net = float(np.mean((out[:, 0] > 0.5).astype(float) == y4))",
    walkthrough: "Run it and watch the line refuse to move: at w = 0 every corner gets p = 0.5, and the gradient terms cancel pairwise — (0,0) and (1,1) pull opposite ways, as do (0,1) and (1,0) — so 800 steps multiply zero. The saddle is not bad luck; it is the data's symmetry speaking through the loss. The net breaks the symmetry because its hidden layer maps the four corners to four DIFFERENT points (Problem 38's blindness was the init's fault, and the asymmetric errors fix it). End of the ladder, and the pattern is now yours: write the hypothesis, price the errors, differentiate, descend — and always ask whether the model you're paying for is the one the problem needs.",
    testCode: "assert acc_line == 0.5, acc_line\nassert acc_net == 1.0, acc_net\nassert acc_net > acc_line\nprint('All tests passed!')"
  },
  // ══ STAGE 10 — The Deep ══
  {
    id: 51, stage: 10, title: "One Model, Many Classes", pattern: "softmax-regression", skill: "extend the bend to k classes",
    diagram: `   x ● ──▶[ Xb @ W ]──▶ z = (z0, z1, z2) ──▶ softmax ──▶ (p0, p1, p2)

      three classes share one softmax row
      each row of P sums to 1  ·  argmax P = predicted class`,
    statement: "softmax_world gives 15 points in 2-D from three classes (y is 0, 1 or 2). Build a 3-class softmax classifier: add a bias column to X, one-hot Y with np.eye(3)[y], and train W (shape (3, 3)) for 400 steps at lr = 0.5 with the gradient Xb.T @ (P - Y) / n. Report initial_ce (cross-entropy at W = 0), final_ce, final_acc, and the trained W.",
    examples: [
      { input: "Z = Xb @ W, P = softmax(Z)", output: "rows of P sum to 1; argmax = prediction", explain: "one matrix product replaces three separate logistic models" },
    ],
    why: "Binary classification was the warm-up — the world has many labels. Softmax regression is logistic regression with more columns: each class gets a score, the scores compete through one softmax, and cross-entropy measures them together. The gradient stays beautifully simple — prediction minus truth — which is why the last layer of every deep network is exactly this move.",
    starterCode: "import numpy as np\n\nX, y = softmax_world()\nn, d = X.shape\n\nXb = None  # add a bias column of ones -> shape (15, 3)\nY = None   # one-hot rows: np.eye(3)[y]\nW = None   # zeros, shape (3, 3)\n\ninitial_ce = None  # cross-entropy at W = 0\n\n# train: 400 steps, lr = 0.5, G = Xb.T @ (P - Y) / n\n\nfinal_ce = None\nfinal_acc = None",
    hints: [
      "Stable softmax: subtract the row max before exp — Z = Z - Z.max(axis=1, keepdims=True).",
      "Cross-entropy with one-hot Y: -np.log(P[np.arange(n), y]).mean().",
      "The whole update is four lines: score, softmax, gradient Xb.T @ (P - Y) / n, step.",
    ],
    solution: "import numpy as np\n\nX, y = softmax_world()\nn, d = X.shape\n\nXb = np.column_stack([X, np.ones(n)])\nY = np.eye(3)[y]\nW = np.zeros((d + 1, 3))\n\ndef softmax_ce(W):\n    Z = Xb @ W\n    Z = Z - Z.max(axis=1, keepdims=True)\n    P = np.exp(Z)\n    P /= P.sum(axis=1, keepdims=True)\n    return -np.log(P[np.arange(n), y]).mean(), P\n\ninitial_ce, _ = softmax_ce(W)\nfor step in range(400):\n    _, P = softmax_ce(W)\n    W -= 0.5 * (Xb.T @ (P - Y) / n)\n\nfinal_ce, P = softmax_ce(W)\nfinal_acc = (P.argmax(axis=1) == y).mean()\nprint(initial_ce, final_ce, final_acc)",
    walkthrough: "With W = 0 every score is 0, so the softmax is uniform: P = 1/3 per class and cross-entropy is -ln(1/3) = ln(3) ≈ 1.0986 — the know-nothing baseline every training run starts from. Each step: score every point against every class (one matrix product), softmax the rows into probability distributions, and the gradient Xb.T @ (P - Y) / n says 'move each column of W away from the wrong classes, toward the true one'. After 400 steps the three clusters separate perfectly and the loss has collapsed from 1.0986 to under 0.01. Notice what you did NOT do: train three separate logistic models. The softmax makes the classes compete, and one gradient updates all of them together.",
    testCode: "assert round(initial_ce, 4) == 1.0986, initial_ce\nassert final_ce < 0.05, final_ce\nassert final_acc == 1.0, final_acc\nassert W.shape == (3, 3), W.shape\nZ = np.column_stack([X, np.ones(len(X))]) @ W\nP = np.exp(Z - Z.max(axis=1, keepdims=True))\nP /= P.sum(axis=1, keepdims=True)\nassert np.abs(P.sum(axis=1) - 1).max() < 1e-9\nprint('All tests passed!')"
  },
  {
    id: 52, stage: 10, title: "The Sliding Filter", pattern: "convolution", skill: "filters see locally",
    diagram: `   kernel k            image (6x6)              conv (4x4)
   1  0 -1            10 11 12 │ 2 3 4         -6 27  27 -6
   1  0 -1   ▶        10 11 12 │ 2 3 4    ▶    -6 27  27 -6
   1  0 -1            10 11 12 │ 2 3 4         -6 27  27 -6
                      ────edge────             fires at the edge

   response = left column − right column, summed over 3 rows`,
    statement: "pixel_world returns a 6x6 image with a vertical edge: bright columns 0-2, dark columns 3-5. Slide the vertical-edge kernel k = [[1,0,-1],[1,0,-1],[1,0,-1]] over it (deep-learning convention: no flip) and collect (img[i:i+3, j:j+3] * k).sum() into conv, shape (4, 4). Then take stride 2 with conv[::2, ::2] as stride2, and max-pool conv in 2x2 windows into pool, shape (2, 2).",
    examples: [
      { input: "kernel over columns 10,11,12 | 2,3,4", output: "left col − right col, summed over 3 rows", explain: "the edge fires where bright meets dark" },
    ],
    why: "A convolution is the array skill from stage 0 aimed at structure: a small kernel slides across the image and responds to one local pattern — an edge, a corner, a texture. Everything a convolutional network sees is stacks of this one move. Max-pooling then keeps the strongest response in each window, buying translation tolerance for free.",
    starterCode: "import numpy as np\n\nimg = pixel_world()\nk = np.array([[1.0, 0.0, -1.0],\n              [1.0, 0.0, -1.0],\n              [1.0, 0.0, -1.0]])\n\nconv = None    # (4, 4): slide k over every 3x3 window\nstride2 = None # conv[::2, ::2]\npool = None    # (2, 2): max of each 2x2 block of conv",
    hints: [
      "Valid positions: i in range(4), j in range(4) — the window img[i:i+3, j:j+3].",
      "The response is elementwise multiply then sum: (window * k).sum().",
      "Max-pool: pool[i, j] = conv[2*i:2*i+2, 2*j:2*j+2].max().",
    ],
    solution: "import numpy as np\n\nimg = pixel_world()\nk = np.array([[1.0, 0.0, -1.0],\n              [1.0, 0.0, -1.0],\n              [1.0, 0.0, -1.0]])\n\nH, W = img.shape\nconv = np.zeros((H - 2, W - 2))\nfor i in range(H - 2):\n    for j in range(W - 2):\n        conv[i, j] = (img[i:i+3, j:j+3] * k).sum()\n\nstride2 = conv[::2, ::2]\n\npool = np.zeros((2, 2))\nfor i in range(2):\n    for j in range(2):\n        pool[i, j] = conv[2*i:2*i+2, 2*j:2*j+2].max()\nprint(conv, stride2, pool)",
    walkthrough: "The kernel answers one question at every window: how much brighter is the left column than the right? Columns 0-2 are bright (10, 11, 12) and columns 3-5 dark (2, 3, 4), so left minus right per row is -2, -1, 0, +9, +9, -2 across the four window positions — the response pattern [-6, 27, 27, -6] repeats for every row because the edge is vertical. Stride 2 then samples every other response, and max-pooling keeps the strongest activation in each quadrant — the 27s, discarding the -6s. A real convnet does exactly this thousands of times, except it LEARNS the kernel values from data instead of you handing them over. The loop you wrote is the forward pass of the most profitable architecture in deep learning.",
    testCode: "expected = np.array([[-6.0, 27.0, 27.0, -6.0],\n                     [-6.0, 27.0, 27.0, -6.0],\n                     [-6.0, 27.0, 27.0, -6.0],\n                     [-6.0, 27.0, 27.0, -6.0]])\nassert np.array_equal(conv, expected), conv\nassert np.array_equal(stride2, expected[::2, ::2])\nassert np.array_equal(pool, np.array([[27.0, 27.0], [27.0, 27.0]])), pool\nprint('All tests passed!')"
  },
  {
    id: 53, stage: 10, title: "The Axis That Matters", pattern: "pca", skill: "eigenvectors find the spine",
    diagram: `      y                         ●
      │                   ●            ●     eigenvectors of C:
      │              ●                    ●    λ1 = 7.92  → pc1 ≈ ±(0.707, 0.707)
      │          ●          ●   ●          λ2 = 0.007  → the noise floor
      │      ●                            keep pc1: 99.9% of the variance
      └─────────────────────────── x`,
    statement: "cloud_world returns 11 points lying almost on the diagonal y = x. Center the data, build the covariance matrix C = Xc.T @ Xc / (n - 1), and diagonalize with np.linalg.eigh. Take the eigenvector of the LARGEST eigenvalue as pc1, project the centered points onto it, and report lam1, lam2, evr = lam1 / C.trace(), proj, and recon_mse — the mean squared error of rebuilding Xc from the projection alone.",
    examples: [
      { input: "eigen-decompose the covariance", output: "pc1 ≈ ±(0.707, 0.707)", explain: "the diagonal IS the data; the perpendicular is noise" },
    ],
    why: "PCA is the geometry behind dimensionality reduction: the covariance matrix's eigenvectors are the axes along which the data actually varies, sorted by eigenvalue. Keep the top one and you can rebuild almost the whole dataset from a single number per point. The same eigen-machinery powers whitening, initialization schemes, and the spectral tricks hiding all over modern ML.",
    starterCode: "import numpy as np\n\nP = cloud_world()\n\nXc = None          # center each column\nC = None           # covariance: Xc.T @ Xc / (n - 1)\nvals, vecs = None, None  # np.linalg.eigh(C)\n\npc1 = None         # eigenvector of the LARGEST eigenvalue\nproj = None        # centered points projected onto pc1\nlam1 = None\nlam2 = None\nevr = None         # lam1 / C.trace()\nrecon_mse = None   # rebuild from proj alone: np.outer(proj, pc1)",
    hints: [
      "eigh returns eigenvalues ascending — the principal axis is the last column, or argsort descending and take index 0.",
      "The eigenvector's sign is arbitrary; directions, not arrows.",
      "Reconstruction: Xc ≈ proj @ pc1.T when pc1 is a unit vector — that is np.outer(proj, pc1).",
    ],
    solution: "import numpy as np\n\nP = cloud_world()\n\nXc = P - P.mean(axis=0)\nC = Xc.T @ Xc / (len(P) - 1)\nvals, vecs = np.linalg.eigh(C)\norder = np.argsort(vals)[::-1]\nlam1, lam2 = vals[order[0]], vals[order[1]]\npc1 = vecs[:, order[0]]\nproj = Xc @ pc1\n\nevr = lam1 / C.trace()\nrecon = np.outer(proj, pc1)\nrecon_mse = ((Xc - recon) ** 2).mean()\nprint(pc1, lam1, lam2, evr, recon_mse)",
    walkthrough: "eigh returns eigenvalues ascending, so the principal axis is the last column — or, safer, argsort descending and take index 0. The eigenvector comes out as ±(0.707, 0.707); the sign is arbitrary because eigenvectors are directions, not arrows, which is why the tests compare absolute values. Projecting the centered points onto that single axis and rebuilding loses almost nothing: the reconstruction error (~0.003) is a rounding error next to the raw variance (~3.6), and the explained-variance ratio reads 99.9%. One number per point now carries the whole dataset — that is what 'the data was really 1-dimensional' means, measured instead of assumed.",
    testCode: "assert abs(abs(pc1[0]) - 0.7071) < 0.01 and abs(abs(pc1[1]) - 0.7071) < 0.01, pc1\nassert abs(abs(pc1[0]) - abs(pc1[1])) < 0.01, pc1\nassert evr > 0.99, evr\nassert lam2 < 0.05, lam2\nassert abs(proj.var(ddof=1) - lam1) < 1e-6\nassert recon_mse < 0.02, recon_mse\nprint('All tests passed!')"
  },
  {
    id: 54, stage: 10, title: "Meaning Is Geometry", pattern: "embeddings", skill: "directions carry relationships",
    diagram: `             royalty ↑
               │    ● king        ● queen
               │
               │    ● man         ● woman
               │
   ────────────┼─────────────────  gender →
   fruit corner:  ● apple  ● banana   (far side of the space)

   king − man + woman  =  a parallelogram  →  lands on queen`,
    statement: "vocab_world gives six words and a 4-dimensional embedding each, built so royalty lives in one dimension and gender in another. Normalize the rows (E divided by its row norms) into En, form the cosine similarity matrix S = En @ En.T, then test the famous arithmetic: target = En[king] - En[man] + En[woman]. Rank all words by cosine similarity to target and report analogy_best. Also report apple_order — the words ranked by similarity to apple, excluding apple itself.",
    examples: [
      { input: "king - man + woman", output: "queen", explain: "the royal direction is consistent across the table" },
    ],
    why: "Word embeddings turned language into linear algebra: each word is a vector, similarity is a dot product, analogy is a parallelogram. This is the conceptual heart of every modern language model — attention, retrieval, and image-text search are all versions of 'which vectors point the same way'. One small table makes the geometry visible without a GPU.",
    starterCode: "import numpy as np\n\nwords, E = vocab_world()\n\nEn = None           # normalize each row of E to unit length\nS = None            # cosine similarity matrix: En @ En.T\nidx = {w: i for i, w in enumerate(words)}\n\ntarget = None       # En[king] - En[man] + En[woman]\nsims = None         # similarity of every word to target\nanalogy_best = None # highest-similarity word\napple_order = None  # words ranked by similarity to apple, apple removed",
    hints: [
      "Row norms: np.linalg.norm(E, axis=1, keepdims=True).",
      "After normalization, dot products ARE cosine similarities: En @ En.T.",
      "Rank with np.argsort(-sims) — descending without reversing.",
    ],
    solution: "import numpy as np\n\nwords, E = vocab_world()\nEn = E / np.linalg.norm(E, axis=1, keepdims=True)\nS = En @ En.T\nidx = {w: i for i, w in enumerate(words)}\n\ntarget = En[idx['king']] - En[idx['man']] + En[idx['woman']]\nsims = En @ target\nanalogy_best = words[int(np.argmax(sims))]\n\napple_sims = En @ En[idx['apple']]\napple_order = [words[i] for i in np.argsort(-apple_sims) if words[i] != 'apple']\nprint(analogy_best, apple_order)",
    walkthrough: "Normalizing rows turns dot products into cosine similarity — pure direction, magnitude ignored. The similarity matrix comes out symmetric with a unit diagonal: a free self-check of your normalization. The magic line is target = king - man + woman: subtracting man removes the male direction, adding woman adds the female one, and what remains is a royal-plus-female vector — queen, at similarity 1.0, because this toy table laid the royal direction into its coordinates. Real embedding tables learn the same structure from raw word statistics alone. And note apple's neighborhood: banana first (both point into the fruit corner), royalty nowhere in sight. Nearest-neighbor search over vectors is half of what semantic search means.",
    testCode: "assert analogy_best == 'queen', analogy_best\nassert sims[idx['queen']] > sims[idx['man']]\nassert S[0, 1] > S[0, 4]\nassert apple_order[0] == 'banana', apple_order\nassert np.allclose(S, S.T) and np.allclose(np.diag(S), 1.0)\nprint('All tests passed!')"
  },
  {
    id: 55, stage: 10, title: "Delete the Dead Features", pattern: "lasso", skill: "L1 zeros what does not help",
    diagram: `   pull from data          push from L1:  0.3 · sign(w)
        ↓↓ strong                 ↓ constant, absolute
   w0 ●──────────────────▶  +0.35   survives
   w1 ●──────────────────▶  -0.35   survives
   w2 ●──▶  0.00   ← pinned: noise can't out-pull the corner
   w3 ●─▶   0.00
   w4 ●▶    0.00`,
    statement: "sparse_world returns 16 rows and 5 features — but only the first two actually drive the target; the last three are pure noise. Standardize X and y, then minimize mean squared error plus 0.3 * sum(|w|) by subgradient descent: 1000 steps at lr = 0.05, with gradient Xs.T @ (Xs @ w - ys) / n + 0.3 * np.sign(w). Report w and mse. Watch what the L1 penalty does to the noise weights.",
    examples: [
      { input: "MSE + 0.3 * L1", output: "w[0] ≈ 0.35, w[1] ≈ -0.35, noise weights ≈ 0", explain: "the penalty deletes, it does not just shrink" },
    ],
    why: "Ridge (L2) shrinks weights toward zero but never reaches it. The L1 penalty has a corner at exactly zero, and corners pin weights there: LASSO performs feature selection as a side effect of training. When you hear 'the model uses 40 of 5000 features', this corner is why — and you just built it from one call to np.sign.",
    starterCode: "import numpy as np\n\nX, y = sparse_world()\n\nXs = None  # standardize columns\nys = None  # standardize the target\nw = np.zeros(5)\n\nfor step in range(1000):\n    pass  # grad = Xs.T @ (Xs @ w - ys) / n + 0.3 * np.sign(w); w -= 0.05 * grad\n\nmse = None",
    hints: [
      "Standardize exactly like stage 2: (X - mean) / std per column, same for y.",
      "np.sign(w) is +1, -1, or 0 — the subgradient of |w|.",
      "The L1 force is the same absolute size on every weight; the data's pull decides who survives.",
    ],
    solution: "import numpy as np\n\nX, y = sparse_world()\nXs = (X - X.mean(axis=0)) / X.std(axis=0)\nys = (y - y.mean()) / y.std()\nw = np.zeros(5)\nfor step in range(1000):\n    grad = Xs.T @ (Xs @ w - ys) / len(ys) + 0.3 * np.sign(w)\n    w -= 0.05 * grad\nmse = ((Xs @ w - ys) ** 2).mean()\nprint(w, mse)",
    walkthrough: "Start from zeros and watch the first steps: the two informative features pull their weights hard (the data insists on them), while the three noise columns pull weakly — they correlate with the target at about zero by construction. Then the L1 term does its quiet work: 0.3 * sign(w) pushes EVERY weight toward zero with the same absolute force, and for the noise weights that constant push wins — they stall at about ±0.01, effectively deleted. The informative weights survive because the gradient from the data outweighs the penalty. End state: w ≈ [0.35, -0.35, ~0, ~0, ~0] with MSE ≈ 0.07 — the model kept exactly the two real features and built a sparse, readable rule. Same descent loop as stage 1; one sign() changed its character.",
    testCode: "assert (np.abs(w[2:]) < 0.02).all(), w\nassert abs(w[0]) > 0.3 and abs(w[1]) > 0.3, w\nassert round(w[0], 2) == 0.35 and round(w[1], 2) == -0.35, w\nassert mse < 0.15, mse\nprint('All tests passed!')"
  },
  {
    id: 56, stage: 10, title: "Three Kinds of Wrong", pattern: "bias-variance", skill: "decompose the error",
    diagram: `   true f ~ sin  ·  200 noisy samples of 10 points each

   deg 1:  ─────────      bias² big   · variance tiny
   deg 3:  ⌒⌒⌒⌒⌒         bias tiny   · variance medium   ← the trade
   deg 9:  ∿∿∿∿∿∿∿∿       bias zero   · variance DETONATES

   err = bias² + variance + noise    (holds to 1e-8)`,
    statement: "sine_world gives the true curve f = sin(2*pi*x) on a 50-point grid. Draw 200 training sets of 10 points each with RandomState(7): xt = rs.rand(10), yt = sin(2*pi*xt) + rs.randn(10) * 0.3. Fit polynomials of degree 1, 3, and 9 to each set (np.polyfit / np.polyval) and evaluate all 200 fits on the grid. For each degree report bias_sq = mean over grid of (mean prediction - f_true)^2, var = mean of the prediction variance across trials, and err = mean((predictions - f_true)^2) + sigma^2 — the expected error on a fresh noisy point.",
    examples: [
      { input: "degree 1 vs 3 vs 9", output: "bias falls, variance explodes", explain: "err = bias^2 + variance + noise, measured" },
    ],
    why: "Every model's expected error on new data splits into exactly three parts: bias (systematically wrong), variance (fragile to the training draw), and irreducible noise. You have SEEN the trade-off in the polynomial zoo — now you measure it 200 times and watch the identity hold to floating-point precision. Degree 9 with 10 points turns noise into curvature: bias near zero, variance astronomical.",
    starterCode: "import numpy as np\n\ngrid, f_true = sine_world()\nsigma = 0.3\nrs = np.random.RandomState(7)\ntrials = 200\n\ndef decompose(deg):\n    preds = np.zeros((trials, len(grid)))\n    for t in range(trials):\n        xt = None\n        yt = None\n        coefs = None\n        preds[t] = None\n    bias_sq = None\n    var = None\n    err = None\n    return bias_sq, var, err\n\nb1, v1, e1 = decompose(1)\nb3, v3, e3 = decompose(3)\nb9, v9, e9 = decompose(9)",
    hints: [
      "Draw each training set in the same rs order: rs.rand(10) first, then rs.randn(10) — every call advances the stream.",
      "bias_sq: ((preds.mean(axis=0) - f_true) ** 2).mean(). var: preds.var(axis=0).mean().",
      "err adds the noise floor: ((preds - f_true) ** 2).mean() + sigma ** 2.",
    ],
    solution: "import numpy as np\n\ngrid, f_true = sine_world()\nsigma = 0.3\nrs = np.random.RandomState(7)\ntrials = 200\n\ndef decompose(deg):\n    preds = np.zeros((trials, len(grid)))\n    for t in range(trials):\n        xt = rs.rand(10)\n        yt = np.sin(2 * np.pi * xt) + rs.randn(10) * sigma\n        coefs = np.polyfit(xt, yt, deg)\n        preds[t] = np.polyval(coefs, grid)\n    bias_sq = ((preds.mean(axis=0) - f_true) ** 2).mean()\n    var = preds.var(axis=0).mean()\n    err = ((preds - f_true) ** 2).mean() + sigma ** 2\n    return bias_sq, var, err\n\nb1, v1, e1 = decompose(1)\nb3, v3, e3 = decompose(3)\nb9, v9, e9 = decompose(9)\nprint(b1, v1, e1, b3, v3, e3, e9)",
    walkthrough: "Degree 1: the line cannot bend, so it is wrong the same way every time — bias² ≈ 0.21 dominates its total error ≈ 0.39. Degree 3: flexible enough to hug the true curve (bias² collapses to 0.007) but each of the 200 noisy training sets bends it differently — variance triples to 0.30. Total error barely moved: you traded bias for variance, roughly break-even. Degree 9: ten coefficients, ten points — the polynomial threads every noisy observation, bias ≈ 0, and variance detonates (errors beyond 10^10 on some fits; a single near-vertical swing between adjacent points does it). The identity err = bias² + variance + noise holds for every degree to 1e-8 — that is not an approximation, it is algebra. This is why more model is not better model: capacity converts to variance the moment data runs out.",
    testCode: "assert abs(b1 + v1 + sigma ** 2 - e1) < 1e-8\nassert abs(b3 + v3 + sigma ** 2 - e3) < 1e-8\nassert b3 < b1 and v3 > v1\nassert e9 > 100 and np.isfinite(e9)\nprint('All tests passed!')"
  },
  {
    id: 57, stage: 10, title: "Cool Down to Land", pattern: "lr-schedule", skill: "anneal the step, kill the jitter",
    diagram: `   loss
    ▲    constant 1.0:  ⎺⎺⎺⎺⎺  overshoots forever → ~222
    │   ╱
    │  ╱  cosine 1.0:   ───▶ anneal ───▶ 0.06  lands
    │ ╱   step 1.0:     ───▶ halve every 30 ─▶ 0.08
    └───────────────────────────────▶ epochs (120)
          hot early  ·  cold late`,
    statement: "valley_world is a steep, narrow valley. Run mini-batch SGD (batches of 4, RandomState(7), one rs.permutation per epoch) for 120 epochs from w = b = 0 with THREE schedules from the same lr0 = 1.0: constant; cosine, lr = 1.0 * (1 + cos(pi * e / 119)) / 2 at epoch e; and step, lr halved every 30 epochs. Report loss_const, loss_cos, loss_step — the final full-batch MSE of each.",
    examples: [
      { input: "same lr0 = 1.0, same 120 epochs", output: "constant ~222; cosine ~0.06; step ~0.08", explain: "big steps explore, small steps settle" },
    ],
    why: "A fixed learning rate forces a terrible bargain: small enough to be stable means slow, big enough to be fast means the late-stage jitter never settles. Schedules break the bargain — start bold, anneal to fine steps. Cosine decay is the default in modern deep learning for exactly the effect you are about to measure: the same aggressive rate that blows up under constant stepping converges once it cools.",
    starterCode: "import numpy as np\n\nx, yv = valley_world()\nrs = np.random.RandomState(7)\nepochs = 120\n\ndef sgd(mode):\n    w, b = 0.0, 0.0\n    for e in range(epochs):\n        lr = 1.0\n        if mode == 'cos':\n            pass  # lr = 1.0 * (1 + cos(pi * e / (epochs - 1))) / 2\n        if mode == 'step':\n            pass  # lr = 1.0 * 0.5 ** (e // 30)\n        order = rs.permutation(len(x))\n        for k in range(0, len(x), 4):\n            idx = order[k:k + 4]\n            r = w * x[idx] + b - yv[idx]\n            pass  # step w and b\n    return ((w * x + b - yv) ** 2).mean()\n\nloss_const = None\nloss_cos = None\nloss_step = None",
    hints: [
      "Set lr from the mode BEFORE drawing the permutation — the schedule never touches the random stream.",
      "Cosine: lr = 1.0 * (1 + np.cos(np.pi * e / (epochs - 1))) / 2 — full speed at e = 0, near zero at the end.",
      "Mini-batch update, batches of 4: w -= lr * (2 * r * x[idx]).mean(); b -= lr * (2 * r).mean().",
    ],
    solution: "import numpy as np\n\nx, yv = valley_world()\nrs = np.random.RandomState(7)\nepochs = 120\n\ndef sgd(mode):\n    w, b = 0.0, 0.0\n    for e in range(epochs):\n        lr = 1.0\n        if mode == 'cos':\n            lr = 1.0 * (1 + np.cos(np.pi * e / (epochs - 1))) / 2\n        if mode == 'step':\n            lr = 1.0 * 0.5 ** (e // 30)\n        order = rs.permutation(len(x))\n        for k in range(0, len(x), 4):\n            idx = order[k:k + 4]\n            r = w * x[idx] + b - yv[idx]\n            w -= lr * (2 * r * x[idx]).mean()\n            b -= lr * (2 * r).mean()\n    return ((w * x + b - yv) ** 2).mean()\n\nloss_const = sgd('const')\nloss_cos = sgd('cos')\nloss_step = sgd('step')\nprint(loss_const, loss_cos, loss_step)",
    walkthrough: "Three runs, identical data, identical starting rate 1.0 — wildly different endings. Constant 1.0 never settles: each mini-batch's slope is a wild overestimate of the valley's, the step overshoots the floor, and the loss ends near 220 — worse than predicting the mean. Step decay (halve every 30 epochs) lands at ≈ 0.08; cosine glides from full speed to nearly zero and lands at ≈ 0.06 — over 3000x better than constant, same budget, same lr0. Look at the cosine curve: early epochs run at big rates (crossing the valley fast) and the final epochs at tiny rates (settling into the bottom without kicking up dust). That asymmetry — explore hot, finish cold — is why every modern training recipe decays the rate.",
    testCode: "assert loss_const > 10, loss_const\nassert loss_cos < 0.2, loss_cos\nassert loss_step < 0.2, loss_step\nassert loss_const > 100 * loss_cos\nprint('All tests passed!')"
  },
  {
    id: 58, stage: 10, title: "Standardize, Then Learn", pattern: "batch-norm", skill: "tame the scales inside the net",
    diagram: `   raw columns            xhat = (X−μ)/(σ+ε)       out = γ·xhat + β
   income ●── 52000    →   mean 0 · std 1    →    mean β · std γ
   age     ●── 34      →   same shape         →    learned back
   score   ●· 0.12     →                      →
   σ spread 57,000x  ───▶  one scale  ───▶  what the net wants`,
    statement: "batch_world returns 8 rows whose columns span wildly different scales (currency, years, fractions). Batch-normalize: xhat = (X - mu) / (sd + 1e-8), then out = gamma * xhat + beta with gamma = [1, 2, 0.5] and beta = [0, -1, 3]. Report mu, sd, xhat, out, and spread = sd[0] / sd[2].",
    examples: [
      { input: "out = gamma * xhat + beta", output: "column means ≈ beta, column stds ≈ gamma", explain: "z-score first; gamma and beta restore what the model needs" },
    ],
    why: "You standardized features by hand in stage 2 to help gradient descent. Batch norm does the same thing INSIDE the network — per layer, per batch — and then adds gamma and beta so the network can un-standardize whatever it needs. It is a large part of why deep nets train at depth at all: no layer ever receives inputs whose scale runs away with the gradients.",
    starterCode: "import numpy as np\n\nX = batch_world()\n\nmu = None\nsd = None\nxhat = None  # (X - mu) / (sd + 1e-8)\ngamma = np.array([1.0, 2.0, 0.5])\nbeta = np.array([0.0, -1.0, 3.0])\nout = None\nspread = None  # sd[0] / sd[2]",
    hints: [
      "mu = X.mean(axis=0), sd = X.std(axis=0) — the batch statistics.",
      "The +1e-8 guards against dividing by a zero-std column; it is invisible otherwise.",
      "gamma and beta broadcast across rows: out = gamma * xhat + beta.",
    ],
    solution: "import numpy as np\n\nX = batch_world()\nmu = X.mean(axis=0)\nsd = X.std(axis=0)\nxhat = (X - mu) / (sd + 1e-8)\ngamma = np.array([1.0, 2.0, 0.5])\nbeta = np.array([0.0, -1.0, 3.0])\nout = gamma * xhat + beta\nspread = sd[0] / sd[2]\nprint(spread, xhat.mean(axis=0), out.mean(axis=0), out.std(axis=0))",
    walkthrough: "The raw columns are obscene together: income's std is roughly 57,000x the score's. Fed straight into a dot product, income IS the model. After normalization every column has mean 0 and std 1 — the exact move you have used since stage 2 — with a tiny +1e-8 guarding zero-variance columns. Then gamma and beta re-open the door: the output columns have means exactly beta and stds exactly gamma. The network normalized for stability, then learned back the offsets and scales it wants. Notice the division of labor: the normalization is fixed math, gamma and beta are learned parameters. That two-step — force a standard shape, then learn the deviation from it — recurs all over deep learning.",
    testCode: "assert (np.abs(xhat.mean(axis=0)) < 1e-9).all()\nassert np.abs(out.mean(axis=0) - beta).max() < 1e-6\nassert np.abs(out.std(axis=0) - gamma).max() < 1e-3\nassert spread > 100, spread\nprint('All tests passed!')"
  },
  {
    id: 59, stage: 10, title: "Grade the Ranking", pattern: "auc", skill: "the curve under the cutoffs",
    diagram: `   TPR
    1 ┤              ⎺⎺⎺⎺●
      │         ●●●●●
      │      ●●
      │    ● │
      │   ●  │  auc = 0.9143
      │  ●   │  (area under the sweep)
    0 ┤ ●    │
      └──────┴───────────────── FPR
          0.286  ← cutoff 0.5 is ONE point on this curve`,
    statement: "spam_world returns 12 model scores and true labels. Sweep thresholds over [1.01] followed by the scores sorted high to low; at each threshold record (fpr, tpr) into roc, an (n, 2) array whose first point is (0, 0) and last is (1, 1). Compute auc = np.trapz(tpr, fpr). Also report tpr_half and fpr_half — the rates at the single cutoff 0.5.",
    examples: [
      { input: "thresholds: every score", output: "13 ROC points; auc ≈ 0.914", explain: "one cutoff = one point; the curve is the whole model" },
    ],
    why: "Threshold metrics — accuracy, precision, recall — describe one operating point, and you learned in stage 3 how much a bad cutoff can hide. The ROC curve grades the RANKING: can the model put spam above ham at every cutoff? AUC, the area under it, reads as 'the probability a random spam scores above a random ham'. It is the standard headline metric for scored models in industry for exactly that reason.",
    starterCode: "import numpy as np\n\nscores, y = spam_world()\n\nthresholds = None  # [1.01] + scores sorted high to low\nroc = None         # (n, 2): rows of (fpr, tpr)\nfpr = None\ntpr = None\nauc = None\ntpr_half = None    # TPR at the single cutoff 0.5\nfpr_half = None",
    hints: [
      "thresholds = np.concatenate([[1.01], np.sort(scores)[::-1]]) — start above every score.",
      "Per threshold: pred = scores >= t, then tp, fp, fn, tn by combining pred with y.",
      "fpr = fp / (fp + tn), tpr = tp / (tp + fn); area: np.trapz(tpr, fpr).",
    ],
    solution: "import numpy as np\n\nscores, y = spam_world()\nthresholds = np.concatenate([[1.01], np.sort(scores)[::-1]])\nroc = []\nfor t in thresholds:\n    pred = scores >= t\n    tp = ((pred == 1) & (y == 1)).sum()\n    fp = ((pred == 1) & (y == 0)).sum()\n    fn = ((pred == 0) & (y == 1)).sum()\n    tn = ((pred == 0) & (y == 0)).sum()\n    roc.append((fp / (fp + tn), tp / (tp + fn)))\nroc = np.array(roc)\nfpr, tpr = roc[:, 0], roc[:, 1]\nauc = np.trapz(tpr, fpr)\ntpr_half = ((scores >= 0.5) & (y == 1)).sum() / (y == 1).sum()\nfpr_half = ((scores >= 0.5) & (y == 0)).sum() / (y == 0).sum()\nprint(auc, tpr_half, fpr_half)",
    walkthrough: "Sweep the threshold from above 1.0 down through every score. At first everything is predicted ham — the point (0, 0). As the threshold passes each score, one more email flips to spam: if it was spam, TPR rises (a free win); if ham, FPR rises (a cost). The curve's shape IS the model's skill — hug the top-left corner and every early gain is free. This model's AUC = 0.9143: pick a random spam and a random ham, and 91% of the time the spam scores higher. Now compare the single cutoff 0.5: TPR 0.8, FPR 0.286 — a legitimate operating point that says nothing about the eleven other cutoffs you did not choose. The curve grades the model; the cutoff is a business decision. And np.trapz integrates the staircase exactly — no approximation needed.",
    testCode: "assert roc[0, 0] == 0.0 and roc[0, 1] == 0.0\nassert roc[-1, 0] == 1.0 and roc[-1, 1] == 1.0\nassert (np.diff(fpr) >= -1e-12).all()\nassert round(auc, 4) == 0.9143, auc\nassert tpr_half == 0.8 and abs(fpr_half - 2 / 7) < 1e-12\nprint('All tests passed!')"
  },
  {
    id: 60, stage: 10, title: "The Whole Loop", pattern: "grid-search", skill: "split, scale, train, tune, grade",
    diagram: `   raw cases ─▶ split 4 folds ─▶ scale (train stats!) ─▶ logistic
                        │                                   ▲
                        ▼                                   │
      grid: (0.1,5)  (0.1,200)  (0.5,5)  (0.5,200) ── cv ───┘
                        │
      best: lr 0.5 · 200 steps ─▶ retrain all ─▶ tp 20 · fp 1`,
    statement: "case_world is this week's case file: 200 transactions, 20 fraudulent, with three weak signals (high amount, night hours, new device). Build the full pipeline: 4-fold CV (contiguous folds of 50 by index) over the grid [(0.1, 5), (0.1, 200), (0.5, 5), (0.5, 200)] of (lr, steps) for your own logistic regression — standardize INSIDE each fold on train statistics only. Pick the best combo by mean fold accuracy, retrain on all 200, and report best, worst_cv, and the confusion counts tp, fp, fn plus recall and precision at threshold 0.5.",
    examples: [
      { input: "4 hyperparameter combos x 4 folds", output: "best: lr 0.5, 200 steps, cv 0.99", explain: "the lazy all-ham baseline scores 0.90; the pipeline beats it and catches all 20" },
    ],
    why: "This is the loop every applied ML project runs — split, scale on train stats, train, tune by cross-validation, retrain, grade — except every piece of it is code you wrote from math. No pipeline helper, no LogisticRegression: the grid search is honest because the model is yours. And the grid does real work here: 5-step models are undertrained and the 200-step models separate them.",
    starterCode: "import numpy as np\n\nX, y = case_world()\nn = len(y)\nidx = np.arange(n)\n\ndef sigmoid(z):\n    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))\n\ndef fit_logistic(Xtr, ytr, lr, steps):\n    pass  # standardize on train stats; gradient descent; return w, b, mu, sd\n\ngrid = [(0.1, 5), (0.1, 200), (0.5, 5), (0.5, 200)]\nresults = []\nfor lr, steps in grid:\n    pass  # 4 folds: te = idx[k*50:(k+1)*50]; tr = np.setdiff1d(idx, te)\n\nbest = None\nworst_cv = None\nw, b, mu, sd = fit_logistic(X, y, best['lr'], best['steps'])\np = sigmoid(((X - mu) / sd) @ w + b)\npred = (p >= 0.5).astype(float)\ntp = int(((pred == 1) & (y == 1)).sum())\nfp = int(((pred == 1) & (y == 0)).sum())\nfn = int(((pred == 0) & (y == 1)).sum())\nrecall = None\nprecision = None",
    hints: [
      "fit_logistic mirrors stage 3: mu/sd from Xtr only, Xs = (Xtr - mu) / sd, gradient descent steps, return w, b, mu, sd.",
      "Fold k: te = idx[k*50:(k+1)*50], tr = np.setdiff1d(idx, te) — scale with train stats, apply to the test fold.",
      "best = max(results, key=lambda r: r['cv']); retrain on the FULL data with the winning combo.",
    ],
    solution: "import numpy as np\n\nX, y = case_world()\nn = len(y)\nidx = np.arange(n)\n\ndef sigmoid(z):\n    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))\n\ndef fit_logistic(Xtr, ytr, lr, steps):\n    mu = Xtr.mean(axis=0)\n    sd = Xtr.std(axis=0)\n    sd = np.where(sd == 0, 1.0, sd)\n    Xs = (Xtr - mu) / sd\n    w = np.zeros(Xs.shape[1])\n    b = 0.0\n    for s in range(steps):\n        p = sigmoid(Xs @ w + b)\n        w -= lr * (Xs.T @ (p - ytr) / len(ytr))\n        b -= lr * (p - ytr).mean()\n    return w, b, mu, sd\n\ngrid = [(0.1, 5), (0.1, 200), (0.5, 5), (0.5, 200)]\nresults = []\nfor lr, steps in grid:\n    fold_acc = []\n    for k in range(4):\n        te = idx[k * 50:(k + 1) * 50]\n        tr = np.setdiff1d(idx, te)\n        w, b, mu, sd = fit_logistic(X[tr], y[tr], lr, steps)\n        p = sigmoid(((X[te] - mu) / sd) @ w + b)\n        fold_acc.append(float(((p >= 0.5).astype(float) == y[te]).mean()))\n    results.append({'lr': lr, 'steps': steps, 'cv': float(np.mean(fold_acc))})\n\nbest = max(results, key=lambda r: r['cv'])\nworst_cv = min(r['cv'] for r in results)\nw, b, mu, sd = fit_logistic(X, y, best['lr'], best['steps'])\np = sigmoid(((X - mu) / sd) @ w + b)\npred = (p >= 0.5).astype(float)\ntp = int(((pred == 1) & (y == 1)).sum())\nfp = int(((pred == 1) & (y == 0)).sum())\nfn = int(((pred == 0) & (y == 1)).sum())\nrecall = tp / (tp + fn)\nprecision = tp / (tp + fp) if tp + fp > 0 else 0.0\nprint(best, worst_cv, tp, fp, fn, recall, precision)",
    walkthrough: "Read the grid before trusting the winner: the two 5-step combos plateau at cv ≈ 0.98 — undertrained, they fire on too much (fp = 4 on the full data) because the weights have not yet settled into the amount/hour/device consensus. The 200-step models reach cv 0.99, and the grid hands the win to lr = 0.5: same data, same model, and the extra accuracy bought purely by training longer and stepping bolder. Retrained on all 200 with the winning combo, the final model catches all 20 frauds with a single false alarm — precision 0.952, recall 1.0 — against the all-ham baseline's 0.90 accuracy and zero frauds caught. That contrast is the entire craft in one paragraph: accuracy hid the failure; the pipeline, graded honestly, did not. Every function in this file — sigmoid, gradient, fold split, grid — is one you built earlier on this ladder.",
    testCode: "assert best['steps'] == 200 and best['lr'] == 0.5, best\nassert best['cv'] > 0.9, best\nassert worst_cv < best['cv']\nassert tp == 20 and fn == 0, (tp, fp, fn)\nassert fp == 1, fp\nassert recall == 1.0 and precision > 0.9\nprint('All tests passed!')"
  },
]

