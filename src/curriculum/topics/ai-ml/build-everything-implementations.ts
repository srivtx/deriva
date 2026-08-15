// Executable contracts for every Build Everything project.
//
// The browser lab deliberately uses dependency-free Python kernels. A project
// such as Triton, PyTorch, or HuggingFace is represented by the smallest
// mechanism that can run deterministically in Pyodide; the real-library bridge
// is a later artifact, not a reason to make the learning surface a link list.

import type {
  BuildEverythingImplementation,
  BuildEverythingProject,
} from "../../schema/build-everything"

interface TestDraft {
  name: string
  call: string
  expect: unknown
  invariant: string
}

interface ImplementationDraft {
  entryPoint: string
  problemStatement: string
  requiredApi: string
  starter: string
  solution: string
  visibleTests: TestDraft[]
  hiddenTests: TestDraft[]
  behavior: string[]
  constraints?: string[]
}

const commonConstraints = [
  "Use only the Python standard library.",
  "Return deterministic values so every run can be compared with the contract.",
  "Do not mutate caller-owned inputs.",
]

const s = (draft: ImplementationDraft): ImplementationDraft => ({
  ...draft,
  constraints: draft.constraints ?? commonConstraints,
})

const specs: Record<string, ImplementationDraft> = {
  A2: s({
    entryPoint: "gradient_descent_2d",
    problemStatement: "Extend the one-variable optimizer to a two-dimensional surface f(x,y)=x²+y². Return every point so convergence can be inspected axis by axis.",
    requiredApi: "def gradient_descent_2d(x, y, learning_rate, steps):\n    return [[step, x, y, loss], ...]",
    starter: "def gradient_descent_2d(x, y, learning_rate, steps):\n    # The gradient is [2*x, 2*y]. Keep the whole path observable.\n    pass\n",
    solution: "def gradient_descent_2d(x, y, learning_rate, steps):\n    history = [[0, x, y, x ** 2 + y ** 2]]\n    for step in range(1, steps + 1):\n        x -= learning_rate * 2 * x\n        y -= learning_rate * 2 * y\n        history.append([step, x, y, x ** 2 + y ** 2])\n    return history\n",
    behavior: ["record the starting point before updating", "update both coordinates using their partial derivatives", "record the joint loss after every update"],
    visibleTests: [
      { name: "one 2D update", call: "gradient_descent_2d(1.0, 2.0, 0.25, 1)", expect: [[0, 1.0, 2.0, 5.0], [1, 0.5, 1.0, 1.25]], invariant: "both axes must move under the same gradient rule" },
      { name: "origin is stable", call: "gradient_descent_2d(0.0, 0.0, 0.5, 2)", expect: [[0, 0.0, 0.0, 0.0], [1, 0.0, 0.0, 0.0], [2, 0.0, 0.0, 0.0]], invariant: "the minimum must remain fixed" },
    ],
    hiddenTests: [
      { name: "negative coordinates", call: "gradient_descent_2d(-2.0, 1.0, 0.25, 1)", expect: [[0, -2.0, 1.0, 5.0], [1, -1.0, 0.5, 1.25]], invariant: "the vector rule must not depend on a quadrant" },
      { name: "history length", call: "len(gradient_descent_2d(5.0, 1.0, 0.1, 3))", expect: 4, invariant: "every requested step belongs in the trace" },
    ],
  }),
  A3: s({
    entryPoint: "neuron_forward",
    problemStatement: "Implement a single neuron from first principles: weighted sum, bias, then ReLU. Make the scalar output explicit before adding training.",
    requiredApi: "def neuron_forward(weights, inputs, bias):\n    return activation(weighted_sum)",
    starter: "def neuron_forward(weights, inputs, bias):\n    # Compute w dot x + b, then apply ReLU.\n    pass\n",
    solution: "def neuron_forward(weights, inputs, bias):\n    score = sum(w * x for w, x in zip(weights, inputs)) + bias\n    return max(0, score)\n",
    behavior: ["pair each weight with one input", "add the bias before activation", "ReLU clamps a negative score to zero"],
    visibleTests: [
      { name: "positive score", call: "neuron_forward([1, 2], [3, 4], -3)", expect: 8, invariant: "the forward pass is a weighted sum plus bias" },
      { name: "negative score", call: "neuron_forward([1, -2], [1, 1], 0)", expect: 0, invariant: "ReLU must suppress negative evidence" },
    ],
    hiddenTests: [
      { name: "zero input", call: "neuron_forward([4, 5], [0, 0], 2)", expect: 2, invariant: "bias still contributes when inputs are zero" },
      { name: "empty neuron", call: "neuron_forward([], [], -1)", expect: 0, invariant: "an empty weighted sum still has a valid ReLU output" },
    ],
  }),
  A4: s({
    entryPoint: "train_neuron",
    problemStatement: "Train one scalar weight to match a target using the same gradient-descent loop. Return the loss path instead of hiding the learning process.",
    requiredApi: "def train_neuron(weight, target, learning_rate, steps):\n    return [[step, weight, loss], ...]",
    starter: "def train_neuron(weight, target, learning_rate, steps):\n    # Loss is (weight - target) ** 2.\n    pass\n",
    solution: "def train_neuron(weight, target, learning_rate, steps):\n    history = [[0, weight, (weight - target) ** 2]]\n    for step in range(1, steps + 1):\n        weight -= learning_rate * 2 * (weight - target)\n        history.append([step, weight, (weight - target) ** 2])\n    return history\n",
    behavior: ["compute squared error against the target", "move the weight down the loss gradient", "record the weight and loss at every step"],
    visibleTests: [
      { name: "learn toward one", call: "train_neuron(0.0, 1.0, 0.25, 2)", expect: [[0, 0.0, 1.0], [1, 0.5, 0.25], [2, 0.75, 0.0625]], invariant: "the loss should fall while the weight approaches the target" },
      { name: "already correct", call: "train_neuron(1.0, 1.0, 0.5, 1)", expect: [[0, 1.0, 0.0], [1, 1.0, 0.0]], invariant: "an optimum needs no corrective update" },
    ],
    hiddenTests: [
      { name: "learn from above", call: "train_neuron(2.0, 1.0, 0.25, 1)", expect: [[0, 2.0, 1.0], [1, 1.5, 0.25]], invariant: "the same update must work from either side" },
      { name: "history length", call: "len(train_neuron(0.0, 2.0, 0.1, 4))", expect: 5, invariant: "training evidence must include every update" },
    ],
  }),
  B1: s({
    entryPoint: "finite_difference_gradient",
    problemStatement: "Replace hand-derived differentiation with a numerical gradient check for f(x)=x². This is the smallest useful test for an autodiff engine.",
    requiredApi: "def finite_difference_gradient(x, epsilon):\n    return estimated_gradient",
    starter: "def finite_difference_gradient(x, epsilon):\n    # Central difference: (f(x+e) - f(x-e)) / (2*e).\n    pass\n",
    solution: "def finite_difference_gradient(x, epsilon):\n    plus = (x + epsilon) ** 2\n    minus = (x - epsilon) ** 2\n    return round((plus - minus) / (2 * epsilon), 6)\n",
    behavior: ["evaluate the function on both sides of x", "divide the symmetric difference by 2*epsilon", "round only the reported diagnostic"],
    visibleTests: [
      { name: "gradient at three", call: "finite_difference_gradient(3.0, 0.001)", expect: 6.0, invariant: "the estimate should agree with the analytic derivative 2*x" },
      { name: "gradient at zero", call: "finite_difference_gradient(0.0, 0.1)", expect: 0.0, invariant: "the minimum has a zero slope" },
    ],
    hiddenTests: [
      { name: "negative point", call: "finite_difference_gradient(-2.0, 0.01)", expect: -4.0, invariant: "the sign of the slope matters" },
      { name: "small epsilon", call: "finite_difference_gradient(1.0, 0.0001)", expect: 2.0, invariant: "the check should remain stable for a smaller probe" },
    ],
  }),
  B2: s({
    entryPoint: "predict_digit",
    problemStatement: "Build the deterministic decision at the end of a tiny MLP: choose the largest logit, with first-index tie breaking.",
    requiredApi: "def predict_digit(logits):\n    return class_index",
    starter: "def predict_digit(logits):\n    # Return the index of the largest score; ties keep the first index.\n    pass\n",
    solution: "def predict_digit(logits):\n    best = 0\n    for index, value in enumerate(logits):\n        if value > logits[best]:\n            best = index\n    return best\n",
    behavior: ["scan every class score", "return the index rather than the score", "keep the earliest class on a tie"],
    visibleTests: [
      { name: "highest class", call: "predict_digit([0.1, 0.7, 0.2])", expect: 1, invariant: "prediction is the argmax class" },
      { name: "tie breaks left", call: "predict_digit([0.5, 0.5])", expect: 0, invariant: "ties must be deterministic" },
    ],
    hiddenTests: [
      { name: "negative logits", call: "predict_digit([-2, -1, -3])", expect: 1, invariant: "argmax works even when every score is negative" },
      { name: "single class", call: "predict_digit([4])", expect: 0, invariant: "the smallest output layer still has a valid class" },
    ],
  }),
  C1: s({
    entryPoint: "bigram_counts",
    problemStatement: "Count what token follows each token. This is the complete sufficient statistic for a tiny bigram language model before probabilities or sampling.",
    requiredApi: "def bigram_counts(tokens):\n    return {token: {next_token: count}}",
    starter: "def bigram_counts(tokens):\n    # Count adjacent token pairs in order.\n    pass\n",
    solution: "def bigram_counts(tokens):\n    counts = {}\n    for current, following in zip(tokens, tokens[1:]):\n        counts.setdefault(current, {})\n        counts[current][following] = counts[current].get(following, 0) + 1\n    return counts\n",
    behavior: ["look only at adjacent pairs", "create a row for each source token", "increment repeated transitions"],
    visibleTests: [
      { name: "two transitions", call: "bigram_counts(['a', 'b', 'a'])", expect: { a: { b: 1 }, b: { a: 1 } }, invariant: "the model learns local next-token evidence" },
      { name: "repeated pair", call: "bigram_counts(['a', 'b', 'a', 'b'])", expect: { a: { b: 2 }, b: { a: 1 } }, invariant: "counts preserve frequency, not just presence" },
    ],
    hiddenTests: [
      { name: "single token", call: "bigram_counts(['only'])", expect: {}, invariant: "there is no transition without a following token" },
      { name: "three tokens", call: "bigram_counts(['a', 'a', 'a'])", expect: { a: { a: 2 } }, invariant: "self-transitions are valid language evidence" },
    ],
  }),
  C2: s({
    entryPoint: "causal_attention",
    problemStatement: "Implement the causal information flow of one attention head as a prefix average: each position can read itself and the past, never the future.",
    requiredApi: "def causal_attention(values):\n    return [prefix_average, ...]",
    starter: "def causal_attention(values):\n    # Position i may use values[:i+1].\n    pass\n",
    solution: "def causal_attention(values):\n    out = []\n    for index in range(len(values)):\n        out.append(sum(values[:index + 1]) / (index + 1))\n    return out\n",
    behavior: ["include the current position in its receptive field", "exclude every future position", "normalize each prefix by its length"],
    visibleTests: [
      { name: "causal prefix", call: "causal_attention([1.0, 3.0])", expect: [1.0, 2.0], invariant: "the second position can see the first and itself" },
      { name: "constant sequence", call: "causal_attention([2.0, 2.0, 2.0])", expect: [2.0, 2.0, 2.0], invariant: "averaging equal values preserves the signal" },
    ],
    hiddenTests: [
      { name: "future cannot leak", call: "causal_attention([0.0, 10.0, 0.0])", expect: [0.0, 5.0, 10 / 3], invariant: "position one must not read the third value" },
      { name: "empty sequence", call: "causal_attention([])", expect: [], invariant: "empty context is a valid boundary" },
    ],
  }),
  C3: s({
    entryPoint: "split_heads",
    problemStatement: "Make multi-head attention's shape contract explicit by splitting one representation into equal-width head vectors.",
    requiredApi: "def split_heads(vector, head_count):\n    return [head, ...]",
    starter: "def split_heads(vector, head_count):\n    # Every head must receive the same number of features.\n    pass\n",
    solution: "def split_heads(vector, head_count):\n    width = len(vector) // head_count\n    return [vector[i * width:(i + 1) * width] for i in range(head_count)]\n",
    behavior: ["divide the model width evenly", "preserve feature order", "return one list per head"],
    visibleTests: [
      { name: "two heads", call: "split_heads([1, 2, 3, 4], 2)", expect: [[1, 2], [3, 4]], invariant: "concatenating heads restores the model vector" },
      { name: "four scalar heads", call: "split_heads([1, 2, 3, 4], 4)", expect: [[1], [2], [3], [4]], invariant: "head width can shrink to one feature" },
    ],
    hiddenTests: [
      { name: "single head", call: "split_heads([5, 6], 1)", expect: [[5, 6]], invariant: "one head is the identity shape" },
      { name: "empty vector", call: "split_heads([], 2)", expect: [[], []], invariant: "shape logic remains total for empty features" },
    ],
  }),
  C4: s({
    entryPoint: "transformer_residual",
    problemStatement: "Build the shape-preserving residual path of a transformer block before adding attention and normalization.",
    requiredApi: "def transformer_residual(x, update):\n    return x_plus_update",
    starter: "def transformer_residual(x, update):\n    # Add the block update to the residual stream element by element.\n    pass\n",
    solution: "def transformer_residual(x, update):\n    return [left + right for left, right in zip(x, update)]\n",
    behavior: ["pair corresponding representation features", "add the update to the residual stream", "preserve vector width"],
    visibleTests: [
      { name: "residual add", call: "transformer_residual([1, 2], [3, 4])", expect: [4, 6], invariant: "the residual carries the old signal forward" },
      { name: "zero update", call: "transformer_residual([5, -1], [0, 0])", expect: [5, -1], invariant: "a zero block update is an identity" },
    ],
    hiddenTests: [
      { name: "negative update", call: "transformer_residual([2, 2], [-1, -3])", expect: [1, -1], invariant: "updates may correct the representation in either direction" },
      { name: "empty vector", call: "transformer_residual([], [])", expect: [], invariant: "the operation is defined at the empty boundary" },
    ],
  }),
  D1: s({
    entryPoint: "relu_kernel",
    problemStatement: "Write the elementwise ReLU kernel as a pure block operation: load values, clamp them, and return a new buffer.",
    requiredApi: "def relu_kernel(values):\n    return output_values",
    starter: "def relu_kernel(values):\n    # This is the CPU reference for the GPU kernel.\n    pass\n",
    solution: "def relu_kernel(values):\n    return [max(0, value) for value in values]\n",
    behavior: ["visit every input value once", "clamp negative values to zero", "leave positive values unchanged"],
    visibleTests: [
      { name: "mixed block", call: "relu_kernel([-2, 0, 3])", expect: [0, 0, 3], invariant: "kernel output matches the ReLU contract" },
      { name: "positive block", call: "relu_kernel([1, 2])", expect: [1, 2], invariant: "positive values pass through" },
    ],
    hiddenTests: [
      { name: "empty block", call: "relu_kernel([])", expect: [], invariant: "tail handling includes zero-length input" },
      { name: "negative block", call: "relu_kernel([-1, -5])", expect: [0, 0], invariant: "all negative lanes become zero" },
    ],
  }),
  D2: s({
    entryPoint: "stable_softmax",
    problemStatement: "Implement numerically stable softmax by shifting each row by its maximum before exponentiating.",
    requiredApi: "def stable_softmax(values):\n    return probabilities",
    starter: "def stable_softmax(values):\n    # Subtract max(values) before importing exp.\n    pass\n",
    solution: "import math\n\ndef stable_softmax(values):\n    if not values:\n        return []\n    peak = max(values)\n    exps = [math.exp(value - peak) for value in values]\n    total = sum(exps)\n    return [round(value / total, 6) for value in exps]\n",
    behavior: ["shift by the row maximum", "normalize exponentials by their sum", "return probabilities that sum to one"],
    visibleTests: [
      { name: "equal logits", call: "stable_softmax([0.0, 0.0])", expect: [0.5, 0.5], invariant: "equal evidence produces equal probability" },
      { name: "single logit", call: "stable_softmax([10.0])", expect: [1.0], invariant: "one class always receives all probability" },
    ],
    hiddenTests: [
      { name: "dominant logit", call: "stable_softmax([0.0, 1.0])", expect: [0.268941, 0.731059], invariant: "relative differences, not absolute scale, drive the result" },
      { name: "empty row", call: "stable_softmax([])", expect: [], invariant: "empty rows do not trigger a max failure" },
    ],
  }),
  E1: s({
    entryPoint: "model_manifest",
    problemStatement: "Before loading weights, make the model contract inspectable: source, dtype, context, and parameter count belong in a manifest.",
    requiredApi: "def model_manifest(name, dtype, context, parameters):\n    return manifest",
    starter: "def model_manifest(name, dtype, context, parameters):\n    # Return a stable manifest for a pretrained model.\n    pass\n",
    solution: "def model_manifest(name, dtype, context, parameters):\n    return {'name': name, 'dtype': dtype, 'context': context, 'parameters': parameters}\n",
    behavior: ["preserve the model identifier", "record numerical dtype and context limit", "make parameter count explicit"],
    visibleTests: [
      { name: "manifest fields", call: "model_manifest('tiny', 'fp32', 128, 1000)", expect: { name: "tiny", dtype: "fp32", context: 128, parameters: 1000 }, invariant: "loading is reproducible only when metadata is explicit" },
      { name: "small model", call: "model_manifest('toy', 'int8', 8, 12)", expect: { name: "toy", dtype: "int8", context: 8, parameters: 12 }, invariant: "the manifest supports quantized toy models too" },
    ],
    hiddenTests: [
      { name: "long context", call: "model_manifest('long', 'bf16', 2048, 5000000)['context']", expect: 2048, invariant: "context is a serving constraint, not a comment" },
      { name: "name preserved", call: "model_manifest('a/b', 'fp32', 1, 0)['name']", expect: "a/b", invariant: "source identity must not be silently rewritten" },
    ],
  }),
  E2: s({
    entryPoint: "greedy_generate",
    problemStatement: "Build a deterministic bounded decoder: append the highest-probability next token from a transition table for exactly N steps.",
    requiredApi: "def greedy_generate(tokens, transitions, steps):\n    return generated_tokens",
    starter: "def greedy_generate(tokens, transitions, steps):\n    # transitions maps a token to its most likely next token.\n    pass\n",
    solution: "def greedy_generate(tokens, transitions, steps):\n    output = list(tokens)\n    for _ in range(steps):\n        next_token = transitions.get(output[-1])\n        if next_token is None:\n            break\n        output.append(next_token)\n    return output\n",
    behavior: ["copy the prompt before appending", "follow one transition per step", "stop safely when no transition exists"],
    visibleTests: [
      { name: "two generated tokens", call: "greedy_generate(['a'], {'a': 'b', 'b': 'c'}, 2)", expect: ["a", "b", "c"], invariant: "generation is bounded and reproducible" },
      { name: "missing transition", call: "greedy_generate(['x'], {}, 3)", expect: ["x"], invariant: "unknown context must not crash generation" },
    ],
    hiddenTests: [
      { name: "zero steps", call: "greedy_generate(['a'], {'a': 'b'}, 0)", expect: ["a"], invariant: "a zero budget preserves the prompt" },
      { name: "longer chain", call: "len(greedy_generate(['a'], {'a': 'b', 'b': 'c', 'c': 'd'}, 3))", expect: 4, invariant: "the output length records the decoding budget" },
    ],
  }),
  E3: s({
    entryPoint: "cosine_similarity",
    problemStatement: "Turn sentence vectors into a comparable signal with cosine similarity, including the zero-vector boundary.",
    requiredApi: "def cosine_similarity(left, right):\n    return similarity",
    starter: "import math\n\ndef cosine_similarity(left, right):\n    # Dot product divided by both vector norms.\n    pass\n",
    solution: "import math\n\ndef cosine_similarity(left, right):\n    dot = sum(a * b for a, b in zip(left, right))\n    left_norm = math.sqrt(sum(a * a for a in left))\n    right_norm = math.sqrt(sum(b * b for b in right))\n    if left_norm == 0 or right_norm == 0:\n        return 0.0\n    return round(dot / (left_norm * right_norm), 6)\n",
    behavior: ["compute dot product and both norms", "return one for identical direction", "return zero when either vector has no direction"],
    visibleTests: [
      { name: "same direction", call: "cosine_similarity([1, 0], [1, 0])", expect: 1.0, invariant: "identical meaning vectors align perfectly" },
      { name: "orthogonal", call: "cosine_similarity([1, 0], [0, 1])", expect: 0.0, invariant: "unrelated axes have no cosine overlap" },
    ],
    hiddenTests: [
      { name: "opposite", call: "cosine_similarity([1, 0], [-1, 0])", expect: -1.0, invariant: "direction can disagree, not only match" },
      { name: "zero vector", call: "cosine_similarity([0, 0], [1, 0])", expect: 0.0, invariant: "missing representation must be handled explicitly" },
    ],
  }),
  F1: s({
    entryPoint: "tokenize",
    problemStatement: "Make raw text batchable by defining a deterministic lowercase whitespace tokenizer before adding a learned vocabulary.",
    requiredApi: "def tokenize(text):\n    return token_list",
    starter: "def tokenize(text):\n    # Normalize case and split on any whitespace.\n    pass\n",
    solution: "def tokenize(text):\n    return text.lower().split()\n",
    behavior: ["normalize case", "split on runs of whitespace", "return tokens in input order"],
    visibleTests: [
      { name: "normalize text", call: "tokenize('Hello  WORLD')", expect: ["hello", "world"], invariant: "the same text should produce the same token sequence" },
      { name: "empty text", call: "tokenize('   ')", expect: [], invariant: "empty documents create no training tokens" },
    ],
    hiddenTests: [
      { name: "punctuation stays", call: "tokenize('Hi, there!')", expect: ["hi,", "there!"], invariant: "tokenization policy must be explicit before it is optimized" },
      { name: "newline", call: "tokenize('a\\nb')", expect: ["a", "b"], invariant: "batch boundaries can include newlines" },
    ],
  }),
  F2: s({
    entryPoint: "top_k_similar",
    problemStatement: "Build the first vector index as an exact inner-product scan that returns stable document IDs.",
    requiredApi: "def top_k_similar(query, vectors, k):\n    return [document_id, ...]",
    starter: "def top_k_similar(query, vectors, k):\n    # Score every vector by dot product, then take top-k.\n    pass\n",
    solution: "def top_k_similar(query, vectors, k):\n    scored = []\n    for document_id, vector in vectors.items():\n        scored.append((sum(a * b for a, b in zip(query, vector)), document_id))\n    scored.sort(key=lambda pair: (-pair[0], pair[1]))\n    return [document_id for _, document_id in scored[:k]]\n",
    behavior: ["score every document with inner product", "sort highest score first", "return IDs rather than copying vectors"],
    visibleTests: [
      { name: "top two", call: "top_k_similar([1, 0], {'a': [1, 0], 'b': [0, 1], 'c': [0.5, 0]}, 2)", expect: ["a", "c"], invariant: "nearest neighbors should be ranked by similarity" },
      { name: "top one", call: "top_k_similar([0, 1], {'a': [1, 0], 'b': [0, 1]}, 1)", expect: ["b"], invariant: "k controls the returned candidate set" },
    ],
    hiddenTests: [
      { name: "empty index", call: "top_k_similar([1, 0], {}, 3)", expect: [], invariant: "an index with no vectors returns no evidence" },
      { name: "tie by id", call: "top_k_similar([1, 0], {'b': [1, 0], 'a': [1, 0]}, 2)", expect: ["a", "b"], invariant: "ties need a stable deterministic order" },
    ],
  }),
  F3: s({
    entryPoint: "dispatch_tool",
    problemStatement: "Close the tool loop safely with a typed dispatcher for two bounded tools. Unknown tools become structured errors, never arbitrary code execution.",
    requiredApi: "def dispatch_tool(name, args):\n    return result_or_error",
    starter: "def dispatch_tool(name, args):\n    # Support add(a,b) and multiply(a,b); reject every other name.\n    pass\n",
    solution: "def dispatch_tool(name, args):\n    if name not in ('add', 'multiply'):\n        return {'error': 'unknown-tool'}\n    if not isinstance(args, dict) or 'a' not in args or 'b' not in args:\n        return {'error': 'invalid-arguments'}\n    if name == 'add':\n        return args['a'] + args['b']\n    return args['a'] * args['b']\n",
    behavior: ["allow only named tools", "validate required arguments", "return structured errors for invalid calls"],
    visibleTests: [
      { name: "add tool", call: "dispatch_tool('add', {'a': 15, 'b': 37})", expect: 52, invariant: "a valid tool call returns the tool result" },
      { name: "multiply tool", call: "dispatch_tool('multiply', {'a': 3, 'b': 4})", expect: 12, invariant: "dispatch selects the requested operation" },
    ],
    hiddenTests: [
      { name: "unknown tool", call: "dispatch_tool('shell', {'a': 1, 'b': 2})", expect: { error: "unknown-tool" }, invariant: "untrusted names never become executable code" },
      { name: "bad arguments", call: "dispatch_tool('add', {'a': 1})", expect: { error: "invalid-arguments" }, invariant: "tool schemas reject malformed arguments" },
    ],
  }),
  F4: s({
    entryPoint: "patchify",
    problemStatement: "Convert an image matrix into an ordered sequence of flattened patches so pixels can enter a transformer as tokens.",
    requiredApi: "def patchify(image, patch_size):\n    return flattened_patches",
    starter: "def patchify(image, patch_size):\n    # Split a square image into row-major square patches.\n    pass\n",
    solution: "def patchify(image, patch_size):\n    height = len(image)\n    patches = []\n    for row in range(0, height, patch_size):\n        for col in range(0, len(image[0]), patch_size):\n            patch = []\n            for inner_row in range(row, row + patch_size):\n                patch.extend(image[inner_row][col:col + patch_size])\n            patches.append(patch)\n    return patches\n",
    behavior: ["walk patches in row-major order", "flatten each square patch", "preserve every pixel exactly once"],
    visibleTests: [
      { name: "one-pixel patches", call: "patchify([[1, 2], [3, 4]], 1)", expect: [[1], [2], [3], [4]], invariant: "each pixel can become one token" },
      { name: "one patch", call: "patchify([[1, 2], [3, 4]], 2)", expect: [[1, 2, 3, 4]], invariant: "patch size controls sequence length" },
    ],
    hiddenTests: [
      { name: "four patches", call: "len(patchify([[1, 2], [3, 4]], 1))", expect: 4, invariant: "geometry determines token count" },
      { name: "single pixel", call: "patchify([[9]], 1)", expect: [[9]], invariant: "the smallest image still has a valid patch" },
    ],
  }),
  M1: s({
    entryPoint: "backward_product",
    problemStatement: "Build the scalar backward rule for z=a*b. Return both local responsibilities so a tiny autograd engine can accumulate them later.",
    requiredApi: "def backward_product(a, b):\n    return {'da': ..., 'db': ...}",
    starter: "def backward_product(a, b):\n    # dz/da = b and dz/db = a for z=a*b.\n    pass\n",
    solution: "def backward_product(a, b):\n    return {'da': b, 'db': a}\n",
    behavior: ["assign the other operand as each local derivative", "return named gradients", "keep the rule independent of global state"],
    visibleTests: [
      { name: "product gradients", call: "backward_product(3, 4)", expect: { da: 4, db: 3 }, invariant: "the product rule must point responsibility to the other input" },
      { name: "zero operand", call: "backward_product(0, 5)", expect: { da: 5, db: 0 }, invariant: "zero values do not erase the derivative of the other edge" },
    ],
    hiddenTests: [
      { name: "negative operand", call: "backward_product(-2, 3)", expect: { da: 3, db: -2 }, invariant: "sign must flow through the graph" },
      { name: "keys stable", call: "sorted(backward_product(1, 2).keys())", expect: ["da", "db"], invariant: "downstream accumulation needs a stable gradient contract" },
    ],
  }),
  M2: s({
    entryPoint: "nanogpt_generate",
    problemStatement: "Compose the tiny language-model pieces into a bounded decoder that follows a learned transition table and exposes its generated sequence.",
    requiredApi: "def nanogpt_generate(tokens, transitions, steps):\n    return generated_tokens",
    starter: "def nanogpt_generate(tokens, transitions, steps):\n    # A dependency-free decoder kernel for a tiny causal model.\n    pass\n",
    solution: "def nanogpt_generate(tokens, transitions, steps):\n    output = list(tokens)\n    for _ in range(steps):\n        choices = transitions.get(output[-1], [])\n        if not choices:\n            break\n        output.append(sorted(choices, key=lambda pair: (-pair[1], pair[0]))[0][0])\n    return output\n",
    behavior: ["read the last generated token", "choose the highest-count transition", "stop when context has no outgoing edge"],
    visibleTests: [
      { name: "highest transition", call: "nanogpt_generate(['a'], {'a': [['b', 2], ['c', 1]], 'b': [['d', 1]]}, 2)", expect: ["a", "b", "d"], invariant: "the decoder chooses the strongest learned local transition" },
      { name: "no outgoing edge", call: "nanogpt_generate(['x'], {}, 2)", expect: ["x"], invariant: "generation remains bounded when the model is uncertain" },
    ],
    hiddenTests: [
      { name: "tie by token", call: "nanogpt_generate(['a'], {'a': [['c', 1], ['b', 1]]}, 1)", expect: ["a", "b"], invariant: "sampling policy must be reproducible under a tie" },
      { name: "zero budget", call: "nanogpt_generate(['a'], {'a': [['b', 1]]}, 0)", expect: ["a"], invariant: "a zero generation budget leaves the prompt unchanged" },
    ],
  }),
  M3: s({
    entryPoint: "flash_prefix_average",
    problemStatement: "Express the memory-saving idea behind FlashAttention as a tiled causal reduction: compute each output from a bounded trailing window without materializing a score matrix.",
    requiredApi: "def flash_prefix_average(values, tile):\n    return outputs",
    starter: "def flash_prefix_average(values, tile):\n    # Compute each causal output from at most tile recent values.\n    pass\n",
    solution: "def flash_prefix_average(values, tile):\n    out = []\n    for index in range(len(values)):\n        start = max(0, index + 1 - tile)\n        window = values[start:index + 1]\n        out.append(sum(window) / len(window))\n    return out\n",
    behavior: ["never read future positions", "bound the active window by tile", "emit one output per input"],
    visibleTests: [
      { name: "tile two", call: "flash_prefix_average([1.0, 3.0, 5.0], 2)", expect: [1.0, 2.0, 4.0], invariant: "a bounded tile still preserves local causal context" },
      { name: "tile one", call: "flash_prefix_average([2.0, 4.0], 1)", expect: [2.0, 4.0], invariant: "a one-token tile is the identity" },
    ],
    hiddenTests: [
      { name: "large tile", call: "flash_prefix_average([1.0, 3.0, 5.0], 10)", expect: [1.0, 2.0, 3.0], invariant: "a tile larger than context becomes full causal attention" },
      { name: "empty input", call: "flash_prefix_average([], 2)", expect: [], invariant: "no score matrix is needed for an empty sequence" },
    ],
  }),
  M4: s({
    entryPoint: "append_kv",
    problemStatement: "Make incremental generation explicit with a key/value cache that appends one new position without recomputing the prefix.",
    requiredApi: "def append_kv(cache, key, value):\n    return new_cache",
    starter: "def append_kv(cache, key, value):\n    # Return a new cache; do not mutate the caller's lists.\n    pass\n",
    solution: "def append_kv(cache, key, value):\n    return {'keys': cache.get('keys', []) + [key], 'values': cache.get('values', []) + [value]}\n",
    behavior: ["preserve existing keys and values", "append the new pair at the end", "return an independent cache object"],
    visibleTests: [
      { name: "append first", call: "append_kv({'keys': [], 'values': []}, 'k1', 'v1')", expect: { keys: ["k1"], values: ["v1"] }, invariant: "the first generated token creates cache state" },
      { name: "append second", call: "append_kv({'keys': ['k1'], 'values': ['v1']}, 'k2', 'v2')", expect: { keys: ["k1", "k2"], values: ["v1", "v2"] }, invariant: "past context must remain available" },
    ],
    hiddenTests: [
      { name: "missing lists", call: "append_kv({}, 1, 2)", expect: { keys: [1], values: [2] }, invariant: "a fresh cache has a defined empty state" },
      { name: "length", call: "len(append_kv({'keys': [1], 'values': [2]}, 3, 4)['keys'])", expect: 2, invariant: "cache length grows one position per token" },
    ],
  }),
  M5: s({
    entryPoint: "lora_scalar_update",
    problemStatement: "Capture LoRA's low-rank update in the smallest possible form: a frozen base scalar plus a trainable product of two adapter scalars.",
    requiredApi: "def lora_scalar_update(base, left, right):\n    return adapted_weight",
    starter: "def lora_scalar_update(base, left, right):\n    # W' = W + B*A in scalar form.\n    pass\n",
    solution: "def lora_scalar_update(base, left, right):\n    return base + left * right\n",
    behavior: ["leave the base value as the prior", "compute the adapter product", "add the low-rank update"],
    visibleTests: [
      { name: "positive adapter", call: "lora_scalar_update(10, 2, 3)", expect: 16, invariant: "the adapter changes behavior without rewriting the base" },
      { name: "zero adapter", call: "lora_scalar_update(10, 0, 3)", expect: 10, invariant: "zero trainable update preserves the pretrained value" },
    ],
    hiddenTests: [
      { name: "negative adapter", call: "lora_scalar_update(10, -2, 3)", expect: 4, invariant: "adaptation can move a weight in either direction" },
      { name: "base unchanged concept", call: "lora_scalar_update(-1, 2, 2)", expect: 3, invariant: "the formula remains linear around any base" },
    ],
  }),
  M6: s({
    entryPoint: "retrieve_docs",
    problemStatement: "Build a tiny retrieval-augmented step: rank documents by query-term overlap and return only the IDs that will become grounded context.",
    requiredApi: "def retrieve_docs(query, docs, k):\n    return [document_id, ...]",
    starter: "def retrieve_docs(query, docs, k):\n    # docs maps IDs to text; score by distinct query-term overlap.\n    pass\n",
    solution: "def retrieve_docs(query, docs, k):\n    terms = set(query.lower().split())\n    scored = []\n    for document_id, text in docs.items():\n        words = set(text.lower().split())\n        scored.append((len(terms & words), document_id))\n    scored.sort(key=lambda pair: (-pair[0], pair[1]))\n    return [document_id for score, document_id in scored[:k] if score > 0]\n",
    behavior: ["normalize query and document terms", "score overlap before generation", "return provenance IDs in stable rank order"],
    visibleTests: [
      { name: "retrieve relevant", call: "retrieve_docs('cats sleep', {'a': 'cats sleep here', 'b': 'dogs run'}, 1)", expect: ["a"], invariant: "generation should see retrieved evidence, not the whole corpus" },
      { name: "rank overlap", call: "retrieve_docs('cats sleep', {'a': 'cats', 'b': 'cats sleep'}, 2)", expect: ["b", "a"], invariant: "more evidence wins the ranking" },
    ],
    hiddenTests: [
      { name: "no evidence", call: "retrieve_docs('birds', {'a': 'cats'}, 2)", expect: [], invariant: "unsupported questions have no grounded context" },
      { name: "tie by id", call: "retrieve_docs('cats', {'b': 'cats', 'a': 'cats'}, 2)", expect: ["a", "b"], invariant: "retrieval order must be reproducible" },
    ],
  }),
  M7: s({
    entryPoint: "average_gradients",
    problemStatement: "Implement the reduction at the heart of distributed data-parallel training: average one gradient vector from every worker.",
    requiredApi: "def average_gradients(gradients):\n    return averaged_vector",
    starter: "def average_gradients(gradients):\n    # gradients is a non-empty list of equal-width vectors.\n    pass\n",
    solution: "def average_gradients(gradients):\n    if not gradients:\n        return []\n    width = len(gradients[0])\n    return [sum(worker[index] for worker in gradients) / len(gradients) for index in range(width)]\n",
    behavior: ["reduce corresponding coordinates", "divide by worker count", "preserve vector width"],
    visibleTests: [
      { name: "two workers", call: "average_gradients([[1.0, 3.0], [3.0, 5.0]])", expect: [2.0, 4.0], invariant: "synchronized workers apply the same average update" },
      { name: "one worker", call: "average_gradients([[2.0, -1.0]])", expect: [2.0, -1.0], invariant: "one worker is the identity reduction" },
    ],
    hiddenTests: [
      { name: "canceling workers", call: "average_gradients([[1.0], [-1.0]])", expect: [0.0], invariant: "opposing evidence should cancel" },
      { name: "empty workers", call: "average_gradients([])", expect: [], invariant: "the reduction has a defined empty boundary" },
    ],
  }),
  M8: s({
    entryPoint: "route_token",
    problemStatement: "Build the routing decision of a mixture-of-experts layer: send a token to the expert whose center is closest, with stable tie breaking.",
    requiredApi: "def route_token(value, experts):\n    return expert_name",
    starter: "def route_token(value, experts):\n    # experts maps names to scalar centers.\n    pass\n",
    solution: "def route_token(value, experts):\n    return min(experts, key=lambda name: (abs(value - experts[name]), name))\n",
    behavior: ["score distance to every expert center", "choose the nearest expert", "break ties by expert name"],
    visibleTests: [
      { name: "near left expert", call: "route_token(1.0, {'left': 0.0, 'right': 10.0})", expect: "left", invariant: "routing should specialize by input value" },
      { name: "near right expert", call: "route_token(9.0, {'left': 0.0, 'right': 10.0})", expect: "right", invariant: "different tokens can use different capacity" },
    ],
    hiddenTests: [
      { name: "tie by name", call: "route_token(5.0, {'b': 0.0, 'a': 10.0})", expect: "a", invariant: "tie behavior must be deterministic" },
      { name: "single expert", call: "route_token(99.0, {'only': 0.0})", expect: "only", invariant: "one expert is a valid sparse layer" },
    ],
  }),
  S1: s({
    entryPoint: "handle_request",
    problemStatement: "Define the smallest production inference boundary: validate model version, compute a score, and return structured errors instead of crashing.",
    requiredApi: "def handle_request(request, model):\n    return response",
    starter: "def handle_request(request, model):\n    # Validate version before touching the model.\n    pass\n",
    solution: "def handle_request(request, model):\n    if request.get('version') != model.get('version'):\n        return {'ok': False, 'error': 'version-mismatch'}\n    if 'value' not in request:\n        return {'ok': False, 'error': 'missing-value'}\n    return {'ok': True, 'score': request['value'] * model['weight']}\n",
    behavior: ["reject incompatible model versions", "validate the required input", "return a typed success or failure"],
    visibleTests: [
      { name: "valid request", call: "handle_request({'version': 'v1', 'value': 3}, {'version': 'v1', 'weight': 2})", expect: { ok: true, score: 6 }, invariant: "the service contract returns a predictable response" },
      { name: "version guard", call: "handle_request({'version': 'v2', 'value': 3}, {'version': 'v1', 'weight': 2})", expect: { ok: false, error: 'version-mismatch' }, invariant: "serving the wrong model is a correctness failure" },
    ],
    hiddenTests: [
      { name: "missing value", call: "handle_request({'version': 'v1'}, {'version': 'v1', 'weight': 2})", expect: { ok: false, error: 'missing-value' }, invariant: "bad requests become structured errors" },
      { name: "negative input", call: "handle_request({'version': 'v1', 'value': -1}, {'version': 'v1', 'weight': 2})", expect: { ok: true, score: -2 }, invariant: "valid numeric input is not silently discarded" },
    ],
  }),
  S2: s({
    entryPoint: "complete_prefix",
    problemStatement: "Build the editor-facing completion contract: return bounded snippets that begin with the user's prefix, in deterministic order.",
    requiredApi: "def complete_prefix(prefix, snippets, limit):\n    return completions",
    starter: "def complete_prefix(prefix, snippets, limit):\n    # Filter by prefix, preserve order, and cap the result.\n    pass\n",
    solution: "def complete_prefix(prefix, snippets, limit):\n    return [snippet for snippet in snippets if snippet.startswith(prefix)][:limit]\n",
    behavior: ["match only the requested prefix", "preserve candidate order", "never exceed the limit"],
    visibleTests: [
      { name: "two matches", call: "complete_prefix('pri', ['print()', 'private', 'append()'], 2)", expect: ['print()', 'private'], invariant: "the editor receives relevant candidates" },
      { name: "no match", call: "complete_prefix('xyz', ['print()'], 3)", expect: [], invariant: "an empty completion set is valid" },
    ],
    hiddenTests: [
      { name: "limit zero", call: "complete_prefix('a', ['a', 'ab'], 0)", expect: [], invariant: "serving limits are enforced at the boundary" },
      { name: "exact prefix", call: "complete_prefix('a', ['a', 'ab'], 5)", expect: ['a', 'ab'], invariant: "the prefix itself is a valid completion" },
    ],
  }),
  S3: s({
    entryPoint: "answer_with_citations",
    problemStatement: "Serve a tiny document chat response that is grounded in the first matching document and abstains when no evidence exists.",
    requiredApi: "def answer_with_citations(query, docs):\n    return {'answer': ..., 'citations': [...]} ",
    starter: "def answer_with_citations(query, docs):\n    # Return an answer only when a document contains a query term.\n    pass\n",
    solution: "def answer_with_citations(query, docs):\n    terms = set(query.lower().split())\n    for document_id, text in docs.items():\n        if terms & set(text.lower().split()):\n            return {'answer': text, 'citations': [document_id]}\n    return {'answer': \"I don't know.\", 'citations': []}\n",
    behavior: ["search the supplied evidence", "bind the answer to its source ID", "abstain when context is absent"],
    visibleTests: [
      { name: "grounded answer", call: "answer_with_citations('cats', {'doc-1': 'Cats sleep often.'})", expect: { answer: 'Cats sleep often.', citations: ['doc-1'] }, invariant: "every answer must carry provenance" },
      { name: "abstain", call: "answer_with_citations('birds', {'doc-1': 'Cats sleep often.'})", expect: { answer: "I don't know.", citations: [] }, invariant: "unsupported questions must not hallucinate" },
    ],
    hiddenTests: [
      { name: "first source", call: "answer_with_citations('cats', {'a': 'cats one', 'b': 'cats two'})['citations']", expect: ['a'], invariant: "source selection must be deterministic" },
      { name: "case insensitive", call: "answer_with_citations('CATS', {'a': 'cats one'})['citations']", expect: ['a'], invariant: "retrieval normalization is part of the service contract" },
    ],
  }),
  S4: s({
    entryPoint: "choose_tool",
    problemStatement: "Make an agent's next action explicit: choose a named tool only when its name appears in the goal, otherwise stop safely.",
    requiredApi: "def choose_tool(goal, tools):\n    return tool_name_or_stop",
    starter: "def choose_tool(goal, tools):\n    # tools is a list of allowed tool names.\n    pass\n",
    solution: "def choose_tool(goal, tools):\n    lowered = goal.lower()\n    for tool in tools:\n        if tool.lower() in lowered:\n            return tool\n    return 'stop'\n",
    behavior: ["inspect the goal against allowed tools", "return one typed tool name", "stop when no safe action is identified"],
    visibleTests: [
      { name: "choose read", call: "choose_tool('please read the file', ['read', 'write'])", expect: 'read', invariant: "an agent action must come from the tool schema" },
      { name: "safe stop", call: "choose_tool('say hello', ['read', 'write'])", expect: 'stop', invariant: "uncertain plans should terminate rather than invent a tool" },
    ],
    hiddenTests: [
      { name: "case insensitive", call: "choose_tool('WRITE the file', ['read', 'write'])", expect: 'write', invariant: "tool selection should not depend on casing" },
      { name: "empty tools", call: "choose_tool('read file', [])", expect: 'stop', invariant: "an empty capability set is safe" },
    ],
  }),
  S5: s({
    entryPoint: "describe_image",
    problemStatement: "Build a toy vision-language bridge: summarize patch brightness into a deterministic coarse description before language generation.",
    requiredApi: "def describe_image(patch_means):\n    return 'dark' | 'mixed' | 'bright'",
    starter: "def describe_image(patch_means):\n    # Means are normalized between 0 and 1.\n    pass\n",
    solution: "def describe_image(patch_means):\n    if not patch_means:\n        return 'dark'\n    average = sum(patch_means) / len(patch_means)\n    if average < 0.33:\n        return 'dark'\n    if average > 0.66:\n        return 'bright'\n    return 'mixed'\n",
    behavior: ["aggregate patch-level evidence", "use explicit brightness thresholds", "return a stable language-level label"],
    visibleTests: [
      { name: "bright image", call: "describe_image([0.9, 0.8])", expect: 'bright', invariant: "high visual evidence maps to a bright description" },
      { name: "dark image", call: "describe_image([0.1, 0.2])", expect: 'dark', invariant: "low visual evidence maps to a dark description" },
    ],
    hiddenTests: [
      { name: "mixed image", call: "describe_image([0.2, 0.8])", expect: 'mixed', invariant: "aggregation exposes ambiguity instead of overclaiming" },
      { name: "empty image", call: "describe_image([])", expect: 'dark', invariant: "missing visual input has a defined conservative label" },
    ],
  }),
  S6: s({
    entryPoint: "make_checkpoint",
    problemStatement: "Make a distributed trainer restartable by packaging step and weights into a serializable checkpoint without sharing mutable lists.",
    requiredApi: "def make_checkpoint(weights, step):\n    return {'step': ..., 'weights': [...]} ",
    starter: "def make_checkpoint(weights, step):\n    # Copy the weights so later training cannot rewrite the artifact.\n    pass\n",
    solution: "def make_checkpoint(weights, step):\n    return {'step': step, 'weights': list(weights)}\n",
    behavior: ["record the training step", "copy every weight", "return a restartable plain-data object"],
    visibleTests: [
      { name: "checkpoint", call: "make_checkpoint([1.0, 2.0], 7)", expect: { step: 7, weights: [1.0, 2.0] }, invariant: "a restart needs both progress and parameters" },
      { name: "empty weights", call: "make_checkpoint([], 0)", expect: { step: 0, weights: [] }, invariant: "checkpoint format is defined before model scale" },
    ],
    hiddenTests: [
      { name: "step preserved", call: "make_checkpoint([3], 42)['step']", expect: 42, invariant: "resume position cannot be inferred from weights" },
      { name: "weight count", call: "len(make_checkpoint([1, 2, 3], 1)['weights'])", expect: 3, invariant: "every parameter belongs in the artifact" },
    ],
  }),
  S7: s({
    entryPoint: "choose_preferred",
    problemStatement: "Implement the safety edge of preference optimization: select the first candidate that contains none of the banned terms, or abstain.",
    requiredApi: "def choose_preferred(candidates, banned_terms):\n    return candidate_or_none",
    starter: "def choose_preferred(candidates, banned_terms):\n    # Reject any candidate containing a banned term.\n    pass\n",
    solution: "def choose_preferred(candidates, banned_terms):\n    for candidate in candidates:\n        lowered = candidate.lower()\n        if not any(term.lower() in lowered for term in banned_terms):\n            return candidate\n    return None\n",
    behavior: ["inspect candidates in order", "reject candidates containing unsafe terms", "return None when every candidate fails"],
    visibleTests: [
      { name: "choose safe", call: "choose_preferred(['unsafe answer', 'safe answer'], ['unsafe'])", expect: 'safe answer', invariant: "preference selection must respect the safety constraint" },
      { name: "first safe", call: "choose_preferred(['good', 'better'], ['bad'])", expect: 'good', invariant: "stable ordering makes preference evaluation reproducible" },
    ],
    hiddenTests: [
      { name: "all rejected", call: "choose_preferred(['bad one', 'bad two'], ['bad'])", expect: null, invariant: "a safety filter must be able to abstain" },
      { name: "case insensitive", call: "choose_preferred(['BAD answer', 'ok'], ['bad'])", expect: 'ok', invariant: "policy checks should not be bypassed by casing" },
    ],
  }),
  CAP1: s({
    entryPoint: "relative_advantages",
    problemStatement: "Implement the verifiable core of grouped policy optimization: subtract the group mean reward so updates express relative advantage.",
    requiredApi: "def relative_advantages(rewards):\n    return centered_rewards",
    starter: "def relative_advantages(rewards):\n    # Center rewards by their group mean.\n    pass\n",
    solution: "def relative_advantages(rewards):\n    if not rewards:\n        return []\n    mean = sum(rewards) / len(rewards)\n    return [round(reward - mean, 6) for reward in rewards]\n",
    behavior: ["compute one group mean", "subtract it from every reward", "return zero-sum relative evidence"],
    visibleTests: [
      { name: "two rewards", call: "relative_advantages([1.0, 3.0])", expect: [-1.0, 1.0], invariant: "the better sample receives positive relative advantage" },
      { name: "equal rewards", call: "relative_advantages([2.0, 2.0])", expect: [0.0, 0.0], invariant: "no sample wins when evidence is tied" },
    ],
    hiddenTests: [
      { name: "three rewards", call: "relative_advantages([0.0, 1.0, 2.0])", expect: [-1.0, 0.0, 1.0], invariant: "centering scales to a larger group" },
      { name: "empty group", call: "relative_advantages([])", expect: [], invariant: "a missing rollout group has no update" },
    ],
  }),
  CAP2: s({
    entryPoint: "sparse_attention",
    problemStatement: "Test a sparse-attention hypothesis with a fair baseline: each position averages only the most recent window tokens.",
    requiredApi: "def sparse_attention(values, window):\n    return outputs",
    starter: "def sparse_attention(values, window):\n    # Use a causal trailing window of at most `window` values.\n    pass\n",
    solution: "def sparse_attention(values, window):\n    out = []\n    for index in range(len(values)):\n        start = max(0, index + 1 - window)\n        segment = values[start:index + 1]\n        out.append(sum(segment) / len(segment))\n    return out\n",
    behavior: ["preserve causality", "bound each receptive field", "return one comparable output per position"],
    visibleTests: [
      { name: "window two", call: "sparse_attention([1.0, 3.0, 5.0], 2)", expect: [1.0, 2.0, 4.0], invariant: "sparsity changes context width, not output length" },
      { name: "window one", call: "sparse_attention([1.0, 3.0], 1)", expect: [1.0, 3.0], invariant: "the smallest sparse window is local identity" },
    ],
    hiddenTests: [
      { name: "full window", call: "sparse_attention([1.0, 3.0, 5.0], 3)", expect: [1.0, 2.0, 3.0], invariant: "the dense baseline is one configuration of the same contract" },
      { name: "empty sequence", call: "sparse_attention([], 2)", expect: [], invariant: "research kernels need explicit empty behavior" },
    ],
  }),
  CAP3: s({
    entryPoint: "pipeline_summary",
    problemStatement: "Integrate the frontier subsystems into one inspectable routing summary: count tokens, record expert capacity, and show deterministic token assignments.",
    requiredApi: "def pipeline_summary(tokens, expert_count):\n    return {'tokens': ..., 'experts': ..., 'routed': [...]} ",
    starter: "def pipeline_summary(tokens, expert_count):\n    # This is the smallest end-to-end integration artifact.\n    pass\n",
    solution: "def pipeline_summary(tokens, expert_count):\n    return {'tokens': len(tokens), 'experts': expert_count, 'routed': [token % expert_count for token in tokens]}\n",
    behavior: ["count the input token stream", "record the configured expert count", "route each token deterministically"],
    visibleTests: [
      { name: "route three", call: "pipeline_summary([0, 1, 2], 2)", expect: { tokens: 3, experts: 2, routed: [0, 1, 0] }, invariant: "the integrated artifact exposes every subsystem boundary" },
      { name: "one expert", call: "pipeline_summary([4, 5], 1)", expect: { tokens: 2, experts: 1, routed: [0, 0] }, invariant: "the dense single-expert baseline remains valid" },
    ],
    hiddenTests: [
      { name: "empty stream", call: "pipeline_summary([], 2)", expect: { tokens: 0, experts: 2, routed: [] }, invariant: "empty input must not invent work" },
      { name: "route count", call: "len(pipeline_summary([1, 2, 3, 4], 3)['routed'])", expect: 4, invariant: "every token receives exactly one route" },
    ],
  }),
  X1: s({
    entryPoint: "validate_rows",
    problemStatement: "Build the dataset gate that accepts only rows with a stable ID, required values, and no reserved evaluation ID. Every rejection must remain visible.",
    requiredApi: "def validate_rows(rows, required_fields, reserved_ids=None):\n    return {'accepted': [...], 'rejected': [...]} ",
    starter: "def validate_rows(rows, required_fields, reserved_ids=None):\n    # Return accepted IDs and one stable reason for every rejected row.\n    pass\n",
    solution: "def validate_rows(rows, required_fields, reserved_ids=None):\n    accepted = []\n    rejected = []\n    reserved = set(reserved_ids or [])\n    for row in rows:\n        if not isinstance(row, dict):\n            rejected.append({'id': None, 'reason': 'malformed'})\n            continue\n        row_id = row.get('id')\n        if not isinstance(row_id, str) or not row_id.strip():\n            rejected.append({'id': row_id, 'reason': 'missing-id'})\n            continue\n        missing = next((field for field in required_fields if row.get(field) in (None, '')), None)\n        if missing is not None:\n            rejected.append({'id': row_id, 'reason': 'missing-' + missing})\n        elif row_id in reserved:\n            rejected.append({'id': row_id, 'reason': 'reserved'})\n        else:\n            accepted.append(row_id)\n    return {'accepted': accepted, 'rejected': rejected}\n",
    behavior: ["reject non-dictionary rows", "require a non-empty stable id", "reject missing fields and reserved evaluation ids with one reason"],
    visibleTests: [
      { name: "accept valid row", call: "validate_rows([{'id': 'a', 'text': 'hi', 'label': 'bug'}], ['text', 'label'])", expect: { accepted: ['a'], rejected: [] }, invariant: "a valid row crosses the gate with its identity preserved" },
      { name: "explain missing field", call: "validate_rows([{'id': 'b', 'text': 'hi'}], ['text', 'label'])", expect: { accepted: [], rejected: [{ id: 'b', reason: 'missing-label' }] }, invariant: "bad data is rejected with a stable reason" },
    ],
    hiddenTests: [
      { name: "reserved id", call: "validate_rows([{'id': 'eval-1', 'text': 'x', 'label': 'bug'}], ['text', 'label'], ['eval-1'])", expect: { accepted: [], rejected: [{ id: 'eval-1', reason: 'reserved' }] }, invariant: "holdout identity cannot leak into training" },
      { name: "malformed row", call: "validate_rows([None], ['text'])", expect: { accepted: [], rejected: [{ id: null, reason: 'malformed' }] }, invariant: "malformed input remains observable" },
    ],
  }),
  X2: s({
    entryPoint: "reproducibility_key",
    problemStatement: "Create a stable experiment identity from seed, dataset IDs, and configuration so a result can be reconstructed later.",
    requiredApi: "def reproducibility_key(config, dataset_ids, seed):\n    return key_string",
    starter: "def reproducibility_key(config, dataset_ids, seed):\n    # Do not depend on dictionary insertion order.\n    pass\n",
    solution: "def reproducibility_key(config, dataset_ids, seed):\n    config_part = ';'.join(str(key) + '=' + str(config[key]) for key in sorted(config))\n    data_part = ','.join(sorted(dataset_ids))\n    return 'seed=' + str(seed) + '|data=' + data_part + '|config=' + config_part\n",
    behavior: ["include the seed", "sort dataset IDs and config keys", "change the key when one cause changes"],
    visibleTests: [
      { name: "stable ordering", call: "reproducibility_key({'lr': 0.1, 'width': 4}, ['b', 'a'], 7)", expect: 'seed=7|data=a,b|config=lr=0.1;width=4', invariant: "equivalent evidence has one identity" },
      { name: "cause included", call: "reproducibility_key({'lr': 0.2}, ['a'], 7)", expect: 'seed=7|data=a|config=lr=0.2', invariant: "one changed hyperparameter creates a new run" },
    ],
    hiddenTests: [
      { name: "seed changes", call: "reproducibility_key({}, [], 8)", expect: 'seed=8|data=|config=', invariant: "randomness is part of the evidence" },
      { name: "inputs untouched", call: "(lambda c: [reproducibility_key(c, ['a'], 1), c])({'z': 2, 'a': 1})", expect: ['seed=1|data=a|config=a=1;z=2', { z: 2, a: 1 }], invariant: "manifest creation cannot mutate caller configuration" },
    ],
  }),
  X3: s({
    entryPoint: "classification_report",
    problemStatement: "Report more than accuracy: compute precision, recall, F1, and confusion counts for a binary classifier.",
    requiredApi: "def classification_report(y_true, y_pred, positive=1):\n    return {'accuracy': ..., 'precision': ..., 'recall': ..., 'f1': ..., 'confusion': ...}",
    starter: "def classification_report(y_true, y_pred, positive=1):\n    # Keep the confusion counts visible before calculating ratios.\n    pass\n",
    solution: "def classification_report(y_true, y_pred, positive=1):\n    tp = sum(1 for truth, pred in zip(y_true, y_pred) if truth == positive and pred == positive)\n    tn = sum(1 for truth, pred in zip(y_true, y_pred) if truth != positive and pred != positive)\n    fp = sum(1 for truth, pred in zip(y_true, y_pred) if truth != positive and pred == positive)\n    fn = sum(1 for truth, pred in zip(y_true, y_pred) if truth == positive and pred != positive)\n    total = len(y_true)\n    precision = tp / (tp + fp) if tp + fp else 0.0\n    recall = tp / (tp + fn) if tp + fn else 0.0\n    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0\n    return {'accuracy': round((tp + tn) / total, 6) if total else 0.0, 'precision': round(precision, 6), 'recall': round(recall, 6), 'f1': round(f1, 6), 'confusion': {'tp': tp, 'tn': tn, 'fp': fp, 'fn': fn}}\n",
    behavior: ["count true and false positives and negatives", "guard zero denominators", "return rounded ratios with the confusion matrix"],
    visibleTests: [
      { name: "balanced report", call: "classification_report([1, 1, 0, 0], [1, 0, 1, 0])", expect: { accuracy: 0.5, precision: 0.5, recall: 0.5, f1: 0.5, confusion: { tp: 1, tn: 1, fp: 1, fn: 1 } }, invariant: "the headline score agrees with its underlying counts" },
      { name: "perfect report", call: "classification_report([1, 0], [1, 0])", expect: { accuracy: 1.0, precision: 1.0, recall: 1.0, f1: 1.0, confusion: { tp: 1, tn: 1, fp: 0, fn: 0 } }, invariant: "a perfect classifier is explicit rather than implied" },
    ],
    hiddenTests: [
      { name: "no positive predictions", call: "classification_report([1, 0], [0, 0])['precision']", expect: 0.0, invariant: "undefined precision must have a safe value" },
      { name: "custom positive class", call: "classification_report(['spam', 'ham'], ['spam', 'spam'], 'spam')['recall']", expect: 1.0, invariant: "the report must not assume labels are numeric" },
    ],
  }),
  X4: s({
    entryPoint: "point_in_time_join",
    problemStatement: "Join each request with the latest feature event at or before its timestamp. Never use information from the future.",
    requiredApi: "def point_in_time_join(events, requests):\n    return [{'id': ..., 'value': ...}, ...]",
    starter: "def point_in_time_join(events, requests):\n    # Events contain entity, time, and value; requests contain id, entity, time.\n    pass\n",
    solution: "def point_in_time_join(events, requests):\n    output = []\n    for request in requests:\n        candidates = [event for event in events if event['entity'] == request['entity'] and event['time'] <= request['time']]\n        latest = max(candidates, key=lambda event: event['time']) if candidates else None\n        output.append({'id': request['id'], 'value': latest['value'] if latest else None})\n    return output\n",
    behavior: ["match the same entity", "discard future events", "select the latest eligible event or None"],
    visibleTests: [
      { name: "latest value", call: "point_in_time_join([{'entity': 'u', 'time': 1, 'value': 10}, {'entity': 'u', 'time': 3, 'value': 30}], [{'id': 'q', 'entity': 'u', 'time': 4}])", expect: [{ id: 'q', value: 30 }], invariant: "the feature reflects the latest known state" },
      { name: "no future leak", call: "point_in_time_join([{'entity': 'u', 'time': 5, 'value': 50}], [{'id': 'q', 'entity': 'u', 'time': 4}])", expect: [{ id: 'q', value: null }], invariant: "future information cannot enter a historical row" },
    ],
    hiddenTests: [
      { name: "equal timestamp", call: "point_in_time_join([{'entity': 'u', 'time': 2, 'value': 20}], [{'id': 'q', 'entity': 'u', 'time': 2}])", expect: [{ id: 'q', value: 20 }], invariant: "an event at prediction time is available" },
      { name: "entity isolation", call: "point_in_time_join([{'entity': 'v', 'time': 1, 'value': 9}], [{'id': 'q', 'entity': 'u', 'time': 4}])", expect: [{ id: 'q', value: null }], invariant: "one entity cannot borrow another entity's history" },
    ],
  }),
  X5: s({
    entryPoint: "drift_report",
    problemStatement: "Compare a reference and current numeric stream with fixed bins, exposing both proportions and the largest distribution gap.",
    requiredApi: "def drift_report(reference, current, bins):\n    return {'reference': [...], 'current': [...], 'max_gap': ...}",
    starter: "def drift_report(reference, current, bins):\n    # Treat integers in [0, bins) as categorical bins.\n    pass\n",
    solution: "def drift_report(reference, current, bins):\n    def proportions(values):\n        counts = [0] * bins\n        for value in values:\n            index = min(max(int(value), 0), bins - 1)\n            counts[index] += 1\n        total = len(values)\n        return [round(count / total, 6) for count in counts] if total else [0.0] * bins\n    before = proportions(reference)\n    after = proportions(current)\n    return {'reference': before, 'current': after, 'max_gap': round(max((abs(a - b) for a, b in zip(before, after)), default=0.0), 6)}\n",
    behavior: ["place values into fixed bins", "normalize each stream independently", "report the maximum absolute proportion gap"],
    visibleTests: [
      { name: "known shift", call: "drift_report([0, 0, 1, 1], [0, 1, 1, 2], 3)", expect: { reference: [0.5, 0.5, 0.0], current: [0.25, 0.5, 0.25], max_gap: 0.25 }, invariant: "the report makes a distribution change measurable" },
      { name: "no shift", call: "drift_report([0, 1], [0, 1], 2)", expect: { reference: [0.5, 0.5], current: [0.5, 0.5], max_gap: 0.0 }, invariant: "identical evidence has no alert signal" },
    ],
    hiddenTests: [
      { name: "empty current", call: "drift_report([0, 1], [], 2)['current']", expect: [0.0, 0.0], invariant: "missing traffic is explicit" },
      { name: "clamp tail", call: "drift_report([9], [9], 2)['reference']", expect: [0.0, 1.0], invariant: "out-of-range values cannot create an invisible bin" },
    ],
  }),
  X6: s({
    entryPoint: "canary_decision",
    problemStatement: "Decide whether a canary model should promote, hold, or roll back using quality, error rate, and latency guardrails.",
    requiredApi: "def canary_decision(stable, canary, min_improvement, max_latency_increase):\n    return 'promote' | 'hold' | 'rollback'",
    starter: "def canary_decision(stable, canary, min_improvement, max_latency_increase):\n    # Stable and canary contain quality, error_rate, and latency_ms.\n    pass\n",
    solution: "def canary_decision(stable, canary, min_improvement, max_latency_increase):\n    if canary['error_rate'] > stable['error_rate'] or canary['latency_ms'] - stable['latency_ms'] > max_latency_increase:\n        return 'rollback'\n    if canary['quality'] - stable['quality'] >= min_improvement:\n        return 'promote'\n    return 'hold'\n",
    behavior: ["rollback unsafe or slower candidates", "promote only when quality clears the practical lift", "hold inconclusive candidates"],
    visibleTests: [
      { name: "promote", call: "canary_decision({'quality': 0.8, 'error_rate': 0.02, 'latency_ms': 100}, {'quality': 0.85, 'error_rate': 0.02, 'latency_ms': 105}, 0.03, 10)", expect: 'promote', invariant: "quality evidence can earn a rollout" },
      { name: "rollback latency", call: "canary_decision({'quality': 0.8, 'error_rate': 0.02, 'latency_ms': 100}, {'quality': 0.9, 'error_rate': 0.02, 'latency_ms': 130}, 0.03, 10)", expect: 'rollback', invariant: "a quality win cannot bypass a latency guardrail" },
    ],
    hiddenTests: [
      { name: "hold", call: "canary_decision({'quality': 0.8, 'error_rate': 0.02, 'latency_ms': 100}, {'quality': 0.81, 'error_rate': 0.02, 'latency_ms': 105}, 0.03, 10)", expect: 'hold', invariant: "uncertain evidence does not promote by default" },
      { name: "rollback errors", call: "canary_decision({'quality': 0.8, 'error_rate': 0.02, 'latency_ms': 100}, {'quality': 0.9, 'error_rate': 0.03, 'latency_ms': 100}, 0.03, 10)", expect: 'rollback', invariant: "error regressions are release blockers" },
    ],
  }),
  X7: s({
    entryPoint: "summarize_spans",
    problemStatement: "Turn request spans into a compact observability snapshot: count work, failures, p95 latency, tokens, and cost.",
    requiredApi: "def summarize_spans(spans):\n    return {'count': ..., 'error_count': ..., 'p95_ms': ..., 'total_tokens': ..., 'total_cost': ...}",
    starter: "def summarize_spans(spans):\n    # Each span has latency_ms, error, tokens, and cost.\n    pass\n",
    solution: "def summarize_spans(spans):\n    if not spans:\n        return {'count': 0, 'error_count': 0, 'p95_ms': 0, 'total_tokens': 0, 'total_cost': 0.0}\n    latencies = sorted(span['latency_ms'] for span in spans)\n    index = max(0, int(len(latencies) * 0.95 + 0.999999) - 1)\n    return {'count': len(spans), 'error_count': sum(1 for span in spans if span.get('error')), 'p95_ms': latencies[index], 'total_tokens': sum(span.get('tokens', 0) for span in spans), 'total_cost': round(sum(span.get('cost', 0.0) for span in spans), 6)}\n",
    behavior: ["count every span", "keep failed spans in the snapshot", "aggregate deterministic latency, token, and cost signals"],
    visibleTests: [
      { name: "healthy request", call: "summarize_spans([{'latency_ms': 10, 'error': False, 'tokens': 4, 'cost': 0.1}, {'latency_ms': 20, 'error': False, 'tokens': 6, 'cost': 0.2}])", expect: { count: 2, error_count: 0, p95_ms: 20, total_tokens: 10, total_cost: 0.3 }, invariant: "the trace answers what the request cost" },
      { name: "failed span", call: "summarize_spans([{'latency_ms': 10, 'error': True, 'tokens': 0, 'cost': 0.0}])", expect: { count: 1, error_count: 1, p95_ms: 10, total_tokens: 0, total_cost: 0.0 }, invariant: "failures remain observable" },
    ],
    hiddenTests: [
      { name: "empty", call: "summarize_spans([])", expect: { count: 0, error_count: 0, p95_ms: 0, total_tokens: 0, total_cost: 0.0 }, invariant: "no traffic has a defined snapshot" },
      { name: "p95 tail", call: "summarize_spans([{'latency_ms': 1, 'error': False}, {'latency_ms': 2, 'error': False}, {'latency_ms': 100, 'error': False}])['p95_ms']", expect: 100, invariant: "tail latency cannot be hidden by an average" },
    ],
  }),
  X8: s({
    entryPoint: "retrieval_metrics",
    problemStatement: "Evaluate retrieval separately from generation with recall@k and reciprocal rank for one query.",
    requiredApi: "def retrieval_metrics(relevant, retrieved, k):\n    return {'recall_at_k': ..., 'mrr': ...}",
    starter: "def retrieval_metrics(relevant, retrieved, k):\n    # Ignore duplicate retrieved IDs and preserve first rank.\n    pass\n",
    solution: "def retrieval_metrics(relevant, retrieved, k):\n    relevant_set = set(relevant)\n    top = []\n    for item in retrieved[:k]:\n        if item not in top:\n            top.append(item)\n    hits = sum(1 for item in top if item in relevant_set)\n    first_rank = next((index + 1 for index, item in enumerate(retrieved) if item in relevant_set), None)\n    return {'recall_at_k': round(hits / len(relevant_set), 6) if relevant_set else 0.0, 'mrr': round(1 / first_rank, 6) if first_rank else 0.0}\n",
    behavior: ["measure hits only in the top k", "deduplicate top results", "use the first relevant rank for MRR"],
    visibleTests: [
      { name: "good retrieval", call: "retrieval_metrics(['a', 'b'], ['b', 'x', 'a'], 3)", expect: { recall_at_k: 1.0, mrr: 1.0 }, invariant: "retrieval evidence is measurable before generation" },
      { name: "partial retrieval", call: "retrieval_metrics(['a', 'b'], ['x', 'a'], 1)", expect: { recall_at_k: 0.0, mrr: 0.5 }, invariant: "recall@k and rank answer different questions" },
    ],
    hiddenTests: [
      { name: "empty relevant", call: "retrieval_metrics([], ['a'], 1)", expect: { recall_at_k: 0.0, mrr: 0.0 }, invariant: "no labeled evidence cannot yield a false win" },
      { name: "duplicate hit", call: "retrieval_metrics(['a', 'b'], ['a', 'a', 'x'], 3)['recall_at_k']", expect: 0.5, invariant: "duplicates cannot inflate recall" },
    ],
  }),
  X9: s({
    entryPoint: "policy_gate",
    problemStatement: "Protect a tool boundary by rejecting instruction overrides, unknown tools, and oversized requests with structured reasons.",
    requiredApi: "def policy_gate(text, requested_tool, max_chars):\n    return {'allowed': ..., 'reason': ...}",
    starter: "def policy_gate(text, requested_tool, max_chars):\n    # The allowlist is intentionally tiny and explicit.\n    pass\n",
    solution: "def policy_gate(text, requested_tool, max_chars):\n    lowered = text.lower()\n    if len(text) > max_chars:\n        return {'allowed': False, 'reason': 'too-large'}\n    if requested_tool not in {'search', 'calculator'}:\n        return {'allowed': False, 'reason': 'unknown-tool'}\n    if 'ignore previous' in lowered or 'system prompt' in lowered or 'developer message' in lowered:\n        return {'allowed': False, 'reason': 'prompt-injection'}\n    return {'allowed': True, 'reason': 'ok'}\n",
    behavior: ["enforce a bounded tool allowlist", "reject common instruction-overrides", "return one structured policy reason"],
    visibleTests: [
      { name: "allow safe search", call: "policy_gate('find the release notes', 'search', 100)", expect: { allowed: true, reason: 'ok' }, invariant: "safe capability requests can proceed" },
      { name: "reject injection", call: "policy_gate('ignore previous instructions', 'search', 100)", expect: { allowed: false, reason: 'prompt-injection' }, invariant: "untrusted text cannot rewrite the policy" },
    ],
    hiddenTests: [
      { name: "unknown tool", call: "policy_gate('calculate', 'shell', 100)", expect: { allowed: false, reason: 'unknown-tool' }, invariant: "the model cannot invent capabilities" },
      { name: "size limit", call: "policy_gate('12345', 'search', 4)", expect: { allowed: false, reason: 'too-large' }, invariant: "bounded inputs protect downstream systems" },
    ],
  }),
  X10: s({
    entryPoint: "privacy_budget",
    problemStatement: "Keep a differential-privacy ledger: accept releases in order until their epsilon costs would overspend the declared budget.",
    requiredApi: "def privacy_budget(queries, epsilon_budget):\n    return {'accepted': [...], 'rejected': [...], 'remaining': ...}",
    starter: "def privacy_budget(queries, epsilon_budget):\n    # Each query is {'name': str, 'epsilon': number}.\n    pass\n",
    solution: "def privacy_budget(queries, epsilon_budget):\n    spent = 0.0\n    accepted = []\n    rejected = []\n    for query in queries:\n        if spent + query['epsilon'] <= epsilon_budget:\n            accepted.append(query['name'])\n            spent += query['epsilon']\n        else:\n            rejected.append(query['name'])\n    return {'accepted': accepted, 'rejected': rejected, 'remaining': round(epsilon_budget - spent, 6)}\n",
    behavior: ["track cumulative epsilon", "reject the query that would overspend", "return remaining budget"],
    visibleTests: [
      { name: "fits budget", call: "privacy_budget([{'name': 'mean', 'epsilon': 0.3}, {'name': 'count', 'epsilon': 0.4}], 1.0)", expect: { accepted: ['mean', 'count'], rejected: [], remaining: 0.3 }, invariant: "accepted releases leave an auditable remainder" },
      { name: "reject overspend", call: "privacy_budget([{'name': 'a', 'epsilon': 0.7}, {'name': 'b', 'epsilon': 0.5}], 1.0)", expect: { accepted: ['a'], rejected: ['b'], remaining: 0.3 }, invariant: "composition cannot cross the privacy barrier" },
    ],
    hiddenTests: [
      { name: "empty ledger", call: "privacy_budget([], 1.0)", expect: { accepted: [], rejected: [], remaining: 1.0 }, invariant: "no releases preserve the full budget" },
      { name: "exact budget", call: "privacy_budget([{'name': 'a', 'epsilon': 1.0}], 1.0)['remaining']", expect: 0.0, invariant: "exactly spending the budget is still bounded" },
    ],
  }),
  X11: s({
    entryPoint: "federated_average",
    problemStatement: "Aggregate client parameter vectors by sample count without moving raw examples to the server.",
    requiredApi: "def federated_average(models, weights):\n    return averaged_model",
    starter: "def federated_average(models, weights):\n    # Weight each coordinate by the client's sample count.\n    pass\n",
    solution: "def federated_average(models, weights):\n    if not models:\n        return []\n    total = sum(weights)\n    return [sum(model[index] * weight for model, weight in zip(models, weights)) / total for index in range(len(models[0]))]\n",
    behavior: ["combine each coordinate", "normalize by total client weight", "return an empty vector for no clients"],
    visibleTests: [
      { name: "weighted mean", call: "federated_average([[0.0, 1.0], [1.0, 3.0]], [1, 3])", expect: [0.75, 2.5], invariant: "more data contributes more update mass" },
      { name: "equal clients", call: "federated_average([[0.0], [2.0]], [1, 1])", expect: [1.0], invariant: "equal weights reduce to a mean" },
    ],
    hiddenTests: [
      { name: "empty", call: "federated_average([], [])", expect: [], invariant: "no clients produce no update" },
      { name: "three clients", call: "federated_average([[1.0], [2.0], [5.0]], [1, 1, 2])", expect: [3.25], invariant: "the aggregation scales beyond two replicas" },
    ],
  }),
  X12: s({
    entryPoint: "ab_test_summary",
    problemStatement: "Summarize a binary online experiment with a primary rate, practical lift, and a ship-or-hold decision.",
    requiredApi: "def ab_test_summary(control, treatment, min_lift):\n    return {'control_rate': ..., 'treatment_rate': ..., 'lift': ..., 'decision': ...}",
    starter: "def ab_test_summary(control, treatment, min_lift):\n    # Outcomes are 0/1. Ship only when treatment clears the practical lift.\n    pass\n",
    solution: "def ab_test_summary(control, treatment, min_lift):\n    control_rate = sum(control) / len(control) if control else 0.0\n    treatment_rate = sum(treatment) / len(treatment) if treatment else 0.0\n    lift = (treatment_rate - control_rate) / control_rate if control_rate else 0.0\n    decision = 'ship' if lift >= min_lift and treatment_rate >= control_rate else 'hold'\n    return {'control_rate': round(control_rate, 6), 'treatment_rate': round(treatment_rate, 6), 'lift': round(lift, 6), 'decision': decision}\n",
    behavior: ["compute both conversion rates", "normalize lift against control", "ship only when lift clears the threshold"],
    visibleTests: [
      { name: "ship", call: "ab_test_summary([1, 0, 1, 1], [1, 1, 1, 1], 0.1)", expect: { control_rate: 0.75, treatment_rate: 1.0, lift: 0.333333, decision: 'ship' }, invariant: "a practical improvement can earn rollout" },
      { name: "hold", call: "ab_test_summary([1, 1], [1, 1], 0.1)", expect: { control_rate: 1.0, treatment_rate: 1.0, lift: 0.0, decision: 'hold' }, invariant: "no improvement does not justify a change" },
    ],
    hiddenTests: [
      { name: "empty control", call: "ab_test_summary([], [1], 0.1)['decision']", expect: 'hold', invariant: "no baseline means no safe promotion" },
      { name: "regression", call: "ab_test_summary([1, 1], [1, 0], 0.0)['decision']", expect: 'hold', invariant: "a guardrail regression blocks shipping" },
    ],
  }),
  Y1: s({
    entryPoint: "validate_jsonrpc",
    problemStatement: "Validate the protocol envelope before routing a tool: JSON-RPC version, request ID, method, and capability must be explicit.",
    requiredApi: "def validate_jsonrpc(message, supported_version, methods):\n    return {'valid': ..., 'kind': ..., 'error': ...}",
    starter: "def validate_jsonrpc(message, supported_version, methods):\n    # Notifications may omit an id, but every message needs a method.\n    pass\n",
    solution: "def validate_jsonrpc(message, supported_version, methods):\n    if not isinstance(message, dict):\n        return {'valid': False, 'kind': 'invalid', 'error': 'not-object'}\n    if message.get('jsonrpc') != supported_version:\n        return {'valid': False, 'kind': 'invalid', 'error': 'unsupported-version'}\n    if not isinstance(message.get('method'), str):\n        return {'valid': False, 'kind': 'invalid', 'error': 'missing-method'}\n    if message['method'] not in methods:\n        return {'valid': False, 'kind': 'invalid', 'error': 'method-not-found'}\n    if 'id' in message and not isinstance(message['id'], (str, int)):\n        return {'valid': False, 'kind': 'invalid', 'error': 'invalid-id'}\n    return {'valid': True, 'kind': 'notification' if 'id' not in message else 'request', 'error': None}\n",
    behavior: ["require the negotiated JSON-RPC version", "allow notifications without IDs", "reject unknown methods before tool dispatch"],
    visibleTests: [
      { name: "valid request", call: "validate_jsonrpc({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}, '2.0', ['tools/list'])", expect: { valid: true, kind: 'request', error: null }, invariant: "a valid protocol envelope reaches the capability layer" },
      { name: "unknown method", call: "validate_jsonrpc({'jsonrpc': '2.0', 'id': 1, 'method': 'shell'}, '2.0', ['tools/list'])", expect: { valid: false, kind: 'invalid', error: 'method-not-found' }, invariant: "unknown protocol methods fail closed" },
    ],
    hiddenTests: [
      { name: "notification", call: "validate_jsonrpc({'jsonrpc': '2.0', 'method': 'ping'}, '2.0', ['ping'])['kind']", expect: 'notification', invariant: "notifications are distinct from requests" },
      { name: "bad version", call: "validate_jsonrpc({'jsonrpc': '1.0', 'id': 1, 'method': 'ping'}, '2.0', ['ping'])['error']", expect: 'unsupported-version', invariant: "protocol negotiation protects incompatible peers" },
    ],
  }),
  Y2: s({
    entryPoint: "authorize_tool_call",
    problemStatement: "Authorize a tool call with consent, an allowlist, and a replay-safe audit record before any side effect occurs.",
    requiredApi: "def authorize_tool_call(call, allowed_tools, sensitive_tools, consented, seen_ids):\n    return {'allowed': ..., 'reason': ..., 'audit': ...}",
    starter: "def authorize_tool_call(call, allowed_tools, sensitive_tools, consented, seen_ids):\n    # Calls have id and tool fields. Never log the raw arguments.\n    pass\n",
    solution: "def authorize_tool_call(call, allowed_tools, sensitive_tools, consented, seen_ids):\n    if call['id'] in seen_ids:\n        return {'allowed': False, 'reason': 'duplicate', 'audit': None}\n    if call['tool'] not in allowed_tools:\n        return {'allowed': False, 'reason': 'denied-tool', 'audit': None}\n    if call['tool'] in sensitive_tools and not consented:\n        return {'allowed': False, 'reason': 'consent-required', 'audit': None}\n    return {'allowed': True, 'reason': 'ok', 'audit': {'id': call['id'], 'tool': call['tool'], 'redacted': True}}\n",
    behavior: ["reject replayed call IDs", "enforce the tool allowlist", "require consent for sensitive tools and redact arguments"],
    visibleTests: [
      { name: "approved call", call: "authorize_tool_call({'id': '1', 'tool': 'search', 'args': {'q': 'x'}}, ['search'], ['delete'], False, [])", expect: { allowed: true, reason: 'ok', audit: { id: '1', tool: 'search', redacted: true } }, invariant: "approved calls carry a safe audit envelope" },
      { name: "consent gate", call: "authorize_tool_call({'id': '2', 'tool': 'delete'}, ['delete'], ['delete'], False, [])['reason']", expect: 'consent-required', invariant: "sensitive actions require human authority" },
    ],
    hiddenTests: [
      { name: "replay", call: "authorize_tool_call({'id': '1', 'tool': 'search'}, ['search'], [], True, ['1'])['reason']", expect: 'duplicate', invariant: "retries cannot duplicate side effects" },
      { name: "unknown tool", call: "authorize_tool_call({'id': '3', 'tool': 'shell'}, ['search'], [], True, [])['reason']", expect: 'denied-tool', invariant: "capability discovery does not grant capability" },
    ],
  }),
  Y3: s({
    entryPoint: "evaluate_agent_trace",
    problemStatement: "Grade an agent trajectory using tool order, step budget, tool outcomes, and final outcome instead of scoring only its last sentence.",
    requiredApi: "def evaluate_agent_trace(events, expected_tools, max_steps):\n    return {'success': ..., 'steps': ..., 'violations': [...]} ",
    starter: "def evaluate_agent_trace(events, expected_tools, max_steps):\n    # Tool events have kind, name, and ok; the final event has outcome/success.\n    pass\n",
    solution: "def evaluate_agent_trace(events, expected_tools, max_steps):\n    violations = []\n    tool_events = [event for event in events if event.get('kind') == 'tool']\n    if len(tool_events) > max_steps:\n        violations.append('step-budget')\n    for event in tool_events:\n        if event.get('name') not in expected_tools:\n            violations.append('unexpected-tool')\n        if not event.get('ok', False):\n            violations.append('tool-failed')\n    outcome = events[-1].get('success', False) if events else False\n    if not outcome:\n        violations.append('outcome-failed')\n    return {'success': not violations, 'steps': len(tool_events), 'violations': violations}\n",
    behavior: ["count tool steps", "record unsafe or failed actions", "require a successful final outcome"],
    visibleTests: [
      { name: "successful trace", call: "evaluate_agent_trace([{'kind': 'tool', 'name': 'search', 'ok': True}, {'kind': 'outcome', 'success': True}], ['search'], 3)", expect: { success: true, steps: 1, violations: [] }, invariant: "a trajectory earns success only when the path and outcome agree" },
      { name: "wrong tool", call: "evaluate_agent_trace([{'kind': 'tool', 'name': 'shell', 'ok': True}, {'kind': 'outcome', 'success': True}], ['search'], 3)", expect: { success: false, steps: 1, violations: ['unexpected-tool'] }, invariant: "a good final answer cannot erase an unsafe path" },
    ],
    hiddenTests: [
      { name: "step budget", call: "evaluate_agent_trace([{'kind': 'tool', 'name': 'search', 'ok': True}, {'kind': 'tool', 'name': 'search', 'ok': True}, {'kind': 'outcome', 'success': True}], ['search'], 1)['violations']", expect: ['step-budget'], invariant: "bounded autonomy is an evaluation criterion" },
      { name: "empty trace", call: "evaluate_agent_trace([], [], 1)", expect: { success: false, steps: 0, violations: ['outcome-failed'] }, invariant: "no trace cannot claim success" },
    ],
  }),
  Y4: s({
    entryPoint: "apply_workflow_events",
    problemStatement: "Make a long-running workflow restartable: apply events idempotently, checkpoint state, and reject impossible transitions.",
    requiredApi: "def apply_workflow_events(events):\n    return {'status': ..., 'effects': [...], 'applied': [...], 'errors': [...]} ",
    starter: "def apply_workflow_events(events):\n    # Event types: start, charge, complete. IDs make effects idempotent.\n    pass\n",
    solution: "def apply_workflow_events(events):\n    status = 'pending'\n    effects = []\n    applied = []\n    errors = []\n    for event in events:\n        event_id = event['id']\n        if event_id in applied:\n            continue\n        kind = event['type']\n        if kind == 'start' and status == 'pending':\n            status = 'running'\n        elif kind == 'charge' and status == 'running':\n            effects.append('charge:' + event_id)\n        elif kind == 'complete' and status == 'running':\n            status = 'completed'\n        else:\n            errors.append(kind + ':invalid-transition')\n            continue\n        applied.append(event_id)\n    return {'status': status, 'effects': effects, 'applied': applied, 'errors': errors}\n",
    behavior: ["apply only valid state transitions", "skip duplicate event IDs", "record effects and errors for recovery"],
    visibleTests: [
      { name: "resume safely", call: "apply_workflow_events([{'id': 's', 'type': 'start'}, {'id': 'c', 'type': 'charge'}, {'id': 'c', 'type': 'charge'}, {'id': 'd', 'type': 'complete'}])", expect: { status: 'completed', effects: ['charge:c'], applied: ['s', 'c', 'd'], errors: [] }, invariant: "replay does not duplicate a side effect" },
      { name: "invalid transition", call: "apply_workflow_events([{'id': 'd', 'type': 'complete'}])['errors']", expect: ['complete:invalid-transition'], invariant: "a workflow cannot skip its state contract" },
    ],
    hiddenTests: [
      { name: "duplicate start", call: "apply_workflow_events([{'id': 's', 'type': 'start'}, {'id': 's', 'type': 'start'}])['applied']", expect: ['s'], invariant: "event identity is the replay boundary" },
      { name: "unknown event", call: "apply_workflow_events([{'id': 'x', 'type': 'unknown'}])['errors']", expect: ['unknown:invalid-transition'], invariant: "unknown work cannot silently mutate state" },
    ],
  }),
  Y5: s({
    entryPoint: "validate_structured_output",
    problemStatement: "Validate untrusted model output against a small schema before application code consumes it.",
    requiredApi: "def validate_structured_output(payload, schema, allow_extra):\n    return {'valid': ..., 'errors': [...]} ",
    starter: "def validate_structured_output(payload, schema, allow_extra):\n    # Schema values are string, number, or enum:a|b.\n    pass\n",
    solution: "def validate_structured_output(payload, schema, allow_extra):\n    errors = []\n    for key, kind in schema.items():\n        if key not in payload:\n            errors.append(key + ':missing')\n            continue\n        value = payload[key]\n        if kind == 'string' and not isinstance(value, str):\n            errors.append(key + ':type')\n        elif kind == 'number' and (not isinstance(value, (int, float)) or isinstance(value, bool)):\n            errors.append(key + ':type')\n        elif kind.startswith('enum:') and value not in kind[5:].split('|'):\n            errors.append(key + ':enum')\n    if not allow_extra:\n        errors.extend(key + ':extra' for key in sorted(payload) if key not in schema)\n    return {'valid': not errors, 'errors': errors}\n",
    behavior: ["require declared fields", "check primitive and enum types", "apply an explicit unknown-key policy"],
    visibleTests: [
      { name: "valid payload", call: "validate_structured_output({'answer': 'yes', 'score': 2}, {'answer': 'string', 'score': 'number'}, False)", expect: { valid: true, errors: [] }, invariant: "typed output can cross the application boundary" },
      { name: "missing field", call: "validate_structured_output({'answer': 'yes'}, {'answer': 'string', 'score': 'number'}, False)", expect: { valid: false, errors: ['score:missing'] }, invariant: "missing evidence is a validation failure" },
    ],
    hiddenTests: [
      { name: "enum error", call: "validate_structured_output({'status': 'maybe'}, {'status': 'enum:ok|error'}, False)['errors']", expect: ['status:enum'], invariant: "free text cannot bypass a finite state machine" },
      { name: "extra rejected", call: "validate_structured_output({'answer': 'yes', 'debug': 'x'}, {'answer': 'string'}, False)['errors']", expect: ['debug:extra'], invariant: "unknown output must not become an accidental API" },
    ],
  }),
  Y6: s({
    entryPoint: "verify_capability",
    problemStatement: "Verify a narrow capability token for action, resource prefix, expiry, and nonce before sandbox access.",
    requiredApi: "def verify_capability(token, action, resource, now, used_nonces):\n    return {'allowed': ..., 'reason': ...}",
    starter: "def verify_capability(token, action, resource, now, used_nonces):\n    # Tokens contain action, prefix, expires, and nonce.\n    pass\n",
    solution: "def verify_capability(token, action, resource, now, used_nonces):\n    if token['nonce'] in used_nonces:\n        return {'allowed': False, 'reason': 'replayed'}\n    if now >= token['expires']:\n        return {'allowed': False, 'reason': 'expired'}\n    if token['action'] != action:\n        return {'allowed': False, 'reason': 'wrong-action'}\n    if not resource.startswith(token['prefix']):\n        return {'allowed': False, 'reason': 'outside-scope'}\n    return {'allowed': True, 'reason': 'ok'}\n",
    behavior: ["reject replayed or expired tokens", "match the exact action", "confine resources to the token prefix"],
    visibleTests: [
      { name: "in scope", call: "verify_capability({'action': 'read', 'prefix': '/docs/', 'expires': 10, 'nonce': 'n1'}, 'read', '/docs/a.txt', 3, [])", expect: { allowed: true, reason: 'ok' }, invariant: "a capability grants only its declared authority" },
      { name: "outside scope", call: "verify_capability({'action': 'read', 'prefix': '/docs/', 'expires': 10, 'nonce': 'n1'}, 'read', '/secrets/a', 3, [])['reason']", expect: 'outside-scope', invariant: "path boundaries are enforced by the token" },
    ],
    hiddenTests: [
      { name: "expired", call: "verify_capability({'action': 'read', 'prefix': '/', 'expires': 3, 'nonce': 'n1'}, 'read', '/a', 3, [])['reason']", expect: 'expired', invariant: "expiry is a hard boundary" },
      { name: "replay", call: "verify_capability({'action': 'read', 'prefix': '/', 'expires': 10, 'nonce': 'n1'}, 'read', '/a', 3, ['n1'])['reason']", expect: 'replayed', invariant: "one capability cannot authorize two effects" },
    ],
  }),
  Y7: s({
    entryPoint: "prefix_cache_plan",
    problemStatement: "Plan safe prefix-cache reuse by finding shared immutable token prefixes inside one policy scope.",
    requiredApi: "def prefix_cache_plan(requests, min_shared):\n    return {'hits': ..., 'misses': ..., 'saved_tokens': ...}",
    starter: "def prefix_cache_plan(requests, min_shared):\n    # Requests contain scope and token lists.\n    pass\n",
    solution: "def prefix_cache_plan(requests, min_shared):\n    seen = {}\n    hits = 0\n    misses = 0\n    saved = 0\n    for request in requests:\n        best = 0\n        for previous in seen.get(request['scope'], []):\n            shared = 0\n            for left, right in zip(previous, request['tokens']):\n                if left != right:\n                    break\n                shared += 1\n            best = max(best, shared)\n        if best >= min_shared:\n            hits += 1\n            saved += best\n        else:\n            misses += 1\n        seen.setdefault(request['scope'], []).append(request['tokens'])\n    return {'hits': hits, 'misses': misses, 'saved_tokens': saved}\n",
    behavior: ["compare exact token prefixes", "isolate cache entries by scope", "report saved tokens rather than vague hit rate"],
    visibleTests: [
      { name: "shared prefix", call: "prefix_cache_plan([{'scope': 'a', 'tokens': [1, 2, 3]}, {'scope': 'a', 'tokens': [1, 2, 4]}], 2)", expect: { hits: 1, misses: 1, saved_tokens: 2 }, invariant: "shared immutable context avoids repeated prefill" },
      { name: "scope isolation", call: "prefix_cache_plan([{'scope': 'a', 'tokens': [1, 2]}, {'scope': 'b', 'tokens': [1, 2]}], 2)", expect: { hits: 0, misses: 2, saved_tokens: 0 }, invariant: "one tenant cannot reuse another tenant's context" },
    ],
    hiddenTests: [
      { name: "below threshold", call: "prefix_cache_plan([{'scope': 'a', 'tokens': [1, 2]}, {'scope': 'a', 'tokens': [1, 3]}], 2)['hits']", expect: 0, invariant: "short overlap is not a cache hit" },
      { name: "longest prefix", call: "prefix_cache_plan([{'scope': 'a', 'tokens': [1, 2]}, {'scope': 'a', 'tokens': [1, 2, 3]}, {'scope': 'a', 'tokens': [1, 2, 4]}], 2)['saved_tokens']", expect: 4, invariant: "the planner finds the best reusable prefix" },
    ],
  }),
  Y8: s({
    entryPoint: "paged_kv_allocate",
    problemStatement: "Allocate fixed KV-cache pages for variable-length requests, free them safely, and expose capacity failures.",
    requiredApi: "def paged_kv_allocate(operations, block_size, capacity):\n    return {'maps': ..., 'free': ..., 'rejected': [...]} ",
    starter: "def paged_kv_allocate(operations, block_size, capacity):\n    # Operations are alloc/free events. Physical pages are integers.\n    pass\n",
    solution: "def paged_kv_allocate(operations, block_size, capacity):\n    free = list(range(capacity))\n    maps = {}\n    rejected = []\n    for operation in operations:\n        request_id = operation['id']\n        if operation['op'] == 'free':\n            for page in maps.pop(request_id, []):\n                if page not in free:\n                    free.append(page)\n            free.sort()\n            continue\n        needed = (operation['tokens'] + block_size - 1) // block_size\n        if needed > len(free):\n            rejected.append(request_id)\n        else:\n            maps[request_id] = free[:needed]\n            free = free[needed:]\n    return {'maps': maps, 'free': free, 'rejected': rejected}\n",
    behavior: ["round token counts up to fixed pages", "reuse freed pages", "reject allocations that exceed capacity"],
    visibleTests: [
      { name: "allocate pages", call: "paged_kv_allocate([{'op': 'alloc', 'id': 'a', 'tokens': 5}], 4, 3)", expect: { maps: { a: [0, 1] }, free: [2], rejected: [] }, invariant: "logical tokens map to explicit physical pages" },
      { name: "capacity failure", call: "paged_kv_allocate([{'op': 'alloc', 'id': 'a', 'tokens': 9}], 4, 2)['rejected']", expect: ['a'], invariant: "memory pressure becomes a controlled rejection" },
    ],
    hiddenTests: [
      { name: "reuse freed page", call: "paged_kv_allocate([{'op': 'alloc', 'id': 'a', 'tokens': 4}, {'op': 'free', 'id': 'a'}, {'op': 'alloc', 'id': 'b', 'tokens': 4}], 4, 1)['maps']", expect: { b: [0] }, invariant: "free lists prevent permanent fragmentation" },
      { name: "no alias", call: "paged_kv_allocate([{'op': 'alloc', 'id': 'a', 'tokens': 4}, {'op': 'alloc', 'id': 'b', 'tokens': 4}], 4, 2)['maps']", expect: { a: [0], b: [1] }, invariant: "live requests never share a physical page" },
    ],
  }),
  Y9: s({
    entryPoint: "speculative_accept",
    problemStatement: "Accept the longest prefix where a draft sequence agrees with the target model, then emit the target token at the first mismatch.",
    requiredApi: "def speculative_accept(draft, target):\n    return {'accepted': ..., 'emitted': ...}",
    starter: "def speculative_accept(draft, target):\n    # The target sequence is authoritative.\n    pass\n",
    solution: "def speculative_accept(draft, target):\n    accepted = 0\n    while accepted < len(draft) and accepted < len(target) and draft[accepted] == target[accepted]:\n        accepted += 1\n    emitted = target[accepted] if accepted < len(target) else None\n    return {'accepted': accepted, 'emitted': emitted}\n",
    behavior: ["compare from the first drafted token", "stop at the first mismatch", "emit the target continuation"],
    visibleTests: [
      { name: "full agreement", call: "speculative_accept([1, 2], [1, 2, 3])", expect: { accepted: 2, emitted: 3 }, invariant: "a correct draft skips target work" },
      { name: "first mismatch", call: "speculative_accept([9, 2], [1, 2, 3])", expect: { accepted: 0, emitted: 1 }, invariant: "the target remains authoritative" },
    ],
    hiddenTests: [
      { name: "late mismatch", call: "speculative_accept([1, 9, 3], [1, 2, 3])", expect: { accepted: 1, emitted: 2 }, invariant: "only the agreeing prefix is accepted" },
      { name: "empty draft", call: "speculative_accept([], [4])", expect: { accepted: 0, emitted: 4 }, invariant: "the fallback path handles no draft tokens" },
    ],
  }),
  Y10: s({
    entryPoint: "quantization_summary",
    problemStatement: "Calibrate a symmetric integer quantizer and report the reconstruction error before claiming a memory win.",
    requiredApi: "def quantization_summary(values, bits):\n    return {'scale': ..., 'quantized': [...], 'dequantized': [...], 'max_error': ...}",
    starter: "def quantization_summary(values, bits):\n    # Use symmetric levels from -(2^(bits-1)-1) to +(2^(bits-1)-1).\n    pass\n",
    solution: "def quantization_summary(values, bits):\n    levels = 2 ** (bits - 1) - 1\n    maximum = max((abs(value) for value in values), default=0.0)\n    scale = maximum / levels if maximum else 1.0\n    quantized = [max(-levels, min(levels, round(value / scale))) for value in values]\n    dequantized = [round(value * scale, 6) for value in quantized]\n    error = max((abs(original - restored) for original, restored in zip(values, dequantized)), default=0.0)\n    return {'scale': round(scale, 6), 'quantized': quantized, 'dequantized': dequantized, 'max_error': round(error, 6)}\n",
    behavior: ["calibrate from the observed range", "bound integer levels", "report reconstruction error"],
    visibleTests: [
      { name: "exact ternary", call: "quantization_summary([-1.0, 0.0, 1.0], 2)", expect: { scale: 1.0, quantized: [-1, 0, 1], dequantized: [-1.0, 0.0, 1.0], max_error: 0.0 }, invariant: "a simple calibration can be exact" },
      { name: "bounded levels", call: "quantization_summary([0.0, 2.0], 2)['quantized']", expect: [0, 1], invariant: "quantized values stay inside the declared bit budget" },
    ],
    hiddenTests: [
      { name: "all zero", call: "quantization_summary([0.0, 0.0], 8)", expect: { scale: 1.0, quantized: [0, 0], dequantized: [0.0, 0.0], max_error: 0.0 }, invariant: "a zero range has a defined scale" },
      { name: "outlier error", call: "quantization_summary([0.0, 0.5, 1.0], 2)['max_error']", expect: 0.5, invariant: "the error budget exposes low-bit distortion" },
    ],
  }),
  Y11: s({
    entryPoint: "compile_cache_key",
    problemStatement: "Create a stable graph-compiler cache key from operations and shapes, and flag dynamic dimensions that may recompile.",
    requiredApi: "def compile_cache_key(operations, shapes):\n    return {'key': ..., 'dynamic': ...}",
    starter: "def compile_cache_key(operations, shapes):\n    # A shape uses -1 to represent a dynamic dimension.\n    pass\n",
    solution: "def compile_cache_key(operations, shapes):\n    ops = ','.join(operations)\n    shape_text = ';'.join('x'.join(str(dim) for dim in shape) for shape in shapes)\n    dynamic = any(-1 in shape for shape in shapes)\n    return {'key': 'ops=' + ops + '|shapes=' + shape_text, 'dynamic': dynamic}\n",
    behavior: ["preserve operation order", "encode every input shape", "flag dynamic dimensions"],
    visibleTests: [
      { name: "stable graph", call: "compile_cache_key(['matmul', 'relu'], [(2, 4), (2,)])", expect: { key: 'ops=matmul,relu|shapes=2x4;2', dynamic: false }, invariant: "the same graph and shapes reuse compiled work" },
      { name: "dynamic shape", call: "compile_cache_key(['matmul'], [(-1, 4)])['dynamic']", expect: true, invariant: "dynamic dimensions change compilation policy" },
    ],
    hiddenTests: [
      { name: "operation changes", call: "compile_cache_key(['relu'], [(2,)])['key']", expect: 'ops=relu|shapes=2', invariant: "one graph operation creates a distinct artifact" },
      { name: "empty graph", call: "compile_cache_key([], [])", expect: { key: 'ops=|shapes=', dynamic: false }, invariant: "the cache contract is defined before optimization" },
    ],
  }),
  Y12: s({
    entryPoint: "verify_model_manifest",
    problemStatement: "Verify a model manifest's provenance, signer, digest status, and expiry before loading it into a service.",
    requiredApi: "def verify_model_manifest(manifest, approved_signers, required_fields, now):\n    return {'valid': ..., 'error': ...}",
    starter: "def verify_model_manifest(manifest, approved_signers, required_fields, now):\n    # The signature is represented by a deterministic boolean in this lab.\n    pass\n",
    solution: "def verify_model_manifest(manifest, approved_signers, required_fields, now):\n    for field in required_fields:\n        if not manifest.get(field):\n            return {'valid': False, 'error': 'missing-' + field}\n    if not manifest.get('signature_valid'):\n        return {'valid': False, 'error': 'invalid-signature'}\n    if manifest.get('signer') not in approved_signers:\n        return {'valid': False, 'error': 'unapproved-signer'}\n    if manifest.get('expires', 0) <= now:\n        return {'valid': False, 'error': 'expired'}\n    return {'valid': True, 'error': None}\n",
    behavior: ["require provenance fields", "verify signature and signer", "fail closed after expiry"],
    visibleTests: [
      { name: "trusted model", call: "verify_model_manifest({'digest': 'abc', 'source': 'hub', 'signer': 'team', 'signature_valid': True, 'expires': 10}, ['team'], ['digest', 'source'], 3)", expect: { valid: true, error: null }, invariant: "trusted provenance is a deployment prerequisite" },
      { name: "tampered model", call: "verify_model_manifest({'digest': 'abc', 'source': 'hub', 'signer': 'team', 'signature_valid': False, 'expires': 10}, ['team'], ['digest', 'source'], 3)['error']", expect: 'invalid-signature', invariant: "a digest without verification is not trustworthy" },
    ],
    hiddenTests: [
      { name: "missing provenance", call: "verify_model_manifest({'signer': 'team', 'signature_valid': True, 'expires': 10}, ['team'], ['digest', 'source'], 3)['error']", expect: 'missing-digest', invariant: "deployment needs a reconstructable source" },
      { name: "expired model", call: "verify_model_manifest({'digest': 'abc', 'source': 'hub', 'signer': 'team', 'signature_valid': True, 'expires': 3}, ['team'], ['digest', 'source'], 3)['error']", expect: 'expired', invariant: "old authorization cannot be reused forever" },
    ],
  }),
  Y13: s({
    entryPoint: "benchmark_report",
    problemStatement: "Summarize an inference workload with warmup exclusion, p95 latency, throughput, quality, and SLO verdicts.",
    requiredApi: "def benchmark_report(runs, quality_target, p95_limit_ms, throughput_target):\n    return {'runs': ..., 'p95_ms': ..., 'throughput': ..., 'quality_ok': ..., 'slo_ok': ...}",
    starter: "def benchmark_report(runs, quality_target, p95_limit_ms, throughput_target):\n    # A run has latency_ms, tokens, quality, and warmup.\n    pass\n",
    solution: "def benchmark_report(runs, quality_target, p95_limit_ms, throughput_target):\n    measured = [run for run in runs if not run.get('warmup', False)]\n    if not measured:\n        return {'runs': 0, 'p95_ms': 0, 'throughput': 0.0, 'quality_ok': False, 'slo_ok': False}\n    latencies = sorted(run['latency_ms'] for run in measured)\n    index = max(0, int(len(latencies) * 0.95 + 0.999999) - 1)\n    total_seconds = sum(latencies) / 1000\n    throughput = round(sum(run.get('tokens', 0) for run in measured) / total_seconds if total_seconds else 0.0, 6)\n    quality_ok = min(run.get('quality', 0.0) for run in measured) >= quality_target\n    p95 = latencies[index]\n    return {'runs': len(measured), 'p95_ms': p95, 'throughput': throughput, 'quality_ok': quality_ok, 'slo_ok': quality_ok and p95 <= p95_limit_ms and throughput >= throughput_target}\n",
    behavior: ["exclude warmup from measured runs", "compute p95 and token throughput", "require quality and performance SLOs together"],
    visibleTests: [
      { name: "passes SLO", call: "benchmark_report([{'latency_ms': 10, 'tokens': 10, 'quality': 1.0, 'warmup': True}, {'latency_ms': 20, 'tokens': 20, 'quality': 0.9, 'warmup': False}, {'latency_ms': 30, 'tokens': 30, 'quality': 0.9, 'warmup': False}], 0.8, 40, 900)", expect: { runs: 2, p95_ms: 30, throughput: 1000.0, quality_ok: true, slo_ok: true }, invariant: "quality and performance must pass together" },
      { name: "quality blocks", call: "benchmark_report([{'latency_ms': 10, 'tokens': 10, 'quality': 0.5, 'warmup': False}], 0.8, 20, 1)['slo_ok']", expect: false, invariant: "a faster but worse model is not a benchmark win" },
    ],
    hiddenTests: [
      { name: "warmup only", call: "benchmark_report([{'latency_ms': 1, 'tokens': 100, 'quality': 1.0, 'warmup': True}], 0.8, 20, 1)", expect: { runs: 0, p95_ms: 0, throughput: 0.0, quality_ok: false, slo_ok: false }, invariant: "warmup cannot manufacture throughput" },
      { name: "tail fails", call: "benchmark_report([{'latency_ms': 10, 'tokens': 10, 'quality': 1.0, 'warmup': False}, {'latency_ms': 100, 'tokens': 10, 'quality': 1.0, 'warmup': False}], 0.8, 50, 1)['slo_ok']", expect: false, invariant: "tail latency is a production constraint" },
    ],
  }),
  Y14: s({
    entryPoint: "stream_with_backpressure",
    problemStatement: "Simulate a bounded response stream: deliver chunks to a slow consumer, record drops, and stop cleanly on cancellation.",
    requiredApi: "def stream_with_backpressure(chunks, capacity, consume_per_tick, cancel_after=None):\n    return {'delivered': [...], 'dropped': [...], 'peak_buffer': ..., 'cancelled': ...}",
    starter: "def stream_with_backpressure(chunks, capacity, consume_per_tick, cancel_after=None):\n    # The producer offers one chunk per tick; the consumer drains a bounded amount.\n    pass\n",
    solution: "def stream_with_backpressure(chunks, capacity, consume_per_tick, cancel_after=None):\n    buffer = []\n    delivered = []\n    dropped = []\n    peak = 0\n    cancelled = False\n    for index, chunk in enumerate(chunks):\n        if cancel_after is not None and index >= cancel_after:\n            cancelled = True\n            dropped.extend({'chunk': item, 'reason': 'cancelled'} for item in chunks[index:])\n            break\n        if len(buffer) >= capacity:\n            dropped.append({'chunk': chunk, 'reason': 'backpressure'})\n        else:\n            buffer.append(chunk)\n            peak = max(peak, len(buffer))\n        for _ in range(consume_per_tick):\n            if buffer:\n                delivered.append(buffer.pop(0))\n    return {'delivered': delivered, 'dropped': dropped, 'peak_buffer': peak, 'cancelled': cancelled}\n",
    behavior: ["bound the in-flight buffer", "record every dropped chunk with a reason", "stop future delivery after cancellation"],
    visibleTests: [
      { name: "healthy stream", call: "stream_with_backpressure(['a', 'b'], 1, 1)", expect: { delivered: ['a', 'b'], dropped: [], peak_buffer: 1, cancelled: false }, invariant: "a consumer keeping up sees every chunk" },
      { name: "slow consumer", call: "stream_with_backpressure(['a', 'b', 'c'], 1, 0)", expect: { delivered: [], dropped: [{ chunk: 'b', reason: 'backpressure' }, { chunk: 'c', reason: 'backpressure' }], peak_buffer: 1, cancelled: false }, invariant: "bounded buffers turn overload into visible backpressure" },
    ],
    hiddenTests: [
      { name: "cancel", call: "stream_with_backpressure(['a', 'b', 'c'], 2, 1, 1)", expect: { delivered: ['a'], dropped: [{ chunk: 'b', reason: 'cancelled' }, { chunk: 'c', reason: 'cancelled' }], peak_buffer: 1, cancelled: true }, invariant: "cancellation prevents work after the user leaves" },
      { name: "empty", call: "stream_with_backpressure([], 1, 1)", expect: { delivered: [], dropped: [], peak_buffer: 0, cancelled: false }, invariant: "empty streams have a defined lifecycle" },
    ],
  }),
}

export function implementationForBuildEverythingProject(project: BuildEverythingProject): BuildEverythingImplementation {
  const draft = specs[project.code]
  if (!draft) throw new Error(`Missing executable contract for Build Everything project ${project.code}`)
  const first = draft.visibleTests[0]!
  return {
    entryPoint: draft.entryPoint,
    problemStatement: draft.problemStatement,
    requiredApi: draft.requiredApi,
    behavior: draft.behavior,
    constraints: draft.constraints ?? commonConstraints,
    examples: draft.visibleTests.slice(0, 2).map((test, index) => ({
      id: `${project.code.toLowerCase()}-example-${index + 1}`,
      given: test.call,
      result: JSON.stringify(test.expect),
    })),
    designQuestion: {
      question: `Before you implement ${draft.entryPoint}, which move makes the result inspectable?`,
      options: [
        { label: "Write the invariant first", value: "invariant" },
        { label: "Hide the intermediate state", value: "hide" },
        { label: "Optimize before measuring", value: "optimize" },
      ],
      correct: "invariant",
      explanation: `The contract for ${project.code} is the observable result and its invariant; only then can an optimization be trusted.`,
    },
    starter: draft.starter,
    visibleTests: draft.visibleTests,
    hiddenTests: draft.hiddenTests,
    hints: [
      { level: 1, type: "question", text: `What is the smallest input that makes ${draft.entryPoint} reveal its invariant?` },
      { level: 2, type: "question", text: "Which intermediate value should you name before compressing the implementation?" },
      { level: 3, type: "question", text: "What edge case would expose a solution that only matches the example?" },
      { level: 4, type: "assertion", text: `Implement the contract for ${draft.entryPoint} directly, keep the observable state, then compare every visible and hidden test before optimizing.` },
    ],
    solution: draft.solution,
    artifact: {
      title: `${project.code} implementation artifact`,
      fields: [
        { name: "invariant", label: "Invariant you preserved" },
        { name: "failure_mode", label: "Failure mode you broke" },
        { name: "handoff", label: "Handoff to the next project" },
      ],
      reflectionQuestion: `Why does ${draft.entryPoint} need an observable contract before the next optimization or composition?`,
    },
    exitGate: {
      question: "What makes this implementation ready to carry forward?",
      options: [
        { label: "Tests and invariant agree", value: "invariant" },
        { label: "It is the shortest code", value: "short" },
        { label: "It uses the newest library", value: "library" },
      ],
      correct: "invariant",
      explanation: `The artifact is ready when its observable behavior and invariant agree across normal and edge cases (${first.name}).`,
    },
  }
}
