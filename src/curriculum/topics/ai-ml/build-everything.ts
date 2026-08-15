// Source-mapped curriculum from Build Everything — 37 Projects from First
// Principles (Sribatsha Dash, 2026), followed by Deriva-authored production and
// modern engineering extensions. Every project is a build contract, not a page
// of links: five explicit moves make the learning order and handoff visible.

import {
  BuildEverythingProjectSchema,
  type BuildEverythingProject,
  type BuildEverythingImplementation,
  type BuildEverythingTier,
} from "../../schema/build-everything"
import { implementationForBuildEverythingProject } from "./build-everything-implementations"
import { buildEverythingExtensions } from "./build-everything-extensions"
import { buildEverythingModern } from "./build-everything-modern"

type ProjectDraft = Omit<BuildEverythingProject, "steps">

function project(draft: ProjectDraft): BuildEverythingProject {
  return BuildEverythingProjectSchema.parse({
    ...draft,
    steps: [
      {
        id: `${draft.id}-derive`, number: 1, kind: "derive", title: "Derive the idea",
        prompt: draft.theory, deliverable: "Write the mechanism in one sentence.",
      },
      {
        id: `${draft.id}-build`, number: 2, kind: "build", title: "Build the smallest version",
        prompt: draft.build, deliverable: "Type the smallest runnable implementation.",
      },
      {
        id: `${draft.id}-verify`, number: 3, kind: "verify", title: "Verify the invariant",
        prompt: draft.verify, deliverable: "Record the expected output and one edge case.",
      },
      {
        id: `${draft.id}-break`, number: 4, kind: "break", title: "Break one assumption",
        prompt: draft.experiment, deliverable: "Change one variable and explain the result.",
      },
      {
        id: `${draft.id}-ship`, number: 5, kind: "ship", title: "Package the artifact",
        prompt: draft.artifact, deliverable: "Save the code, output, and a short failure note.",
      },
    ],
  })
}

const p = (
  tier: BuildEverythingTier,
  order: number,
  code: string,
  id: string,
  title: string,
  lines: number,
  durationMinutes: number,
  coolFactor: string,
  sourcePage: number,
  sourceReuse: string,
  dependencies: string[],
  thinkingMove: string,
  theory: string,
  build: string,
  verify: string,
  experiment: string,
  artifact: string,
  externalDependencies: string[] = [],
  implementation?: BuildEverythingImplementation,
) => project({
  tier, order, code, id, title, lines, durationMinutes, coolFactor, sourcePage,
  sourceReuse, dependencies, thinkingMove, theory, build, verify, experiment,
  artifact, externalDependencies, implementation,
})

const sourceProjects: BuildEverythingProject[] = [
  p("atomic", 1, "A1", "a1-gradient-descent", "Gradient Descent: The Engine of All Learning", 15, 30, "Watch a number get smaller", 4, "Nothing", [], "descend the loss", "A gradient points uphill, so subtract it to minimize a loss.", "Minimize f(x)=x² from x=5 with a fixed learning rate.", "The loss must decrease and x must approach zero.", "Try a tiny rate, an oversized rate, and a second variable.", "A printed loss curve and a reusable gradient-descent loop.", [], {
    entryPoint: "gradient_descent",
    problemStatement: "Implement the smallest learning loop. For f(x)=x², start at any x, repeatedly move against the gradient, and return the complete loss history so another engineer can inspect every update.",
    requiredApi: `def gradient_descent(start, learning_rate, steps):
    return [[step, x, loss], ...]`,
    behavior: [
      "the returned history includes the starting point at step 0",
      "each update uses the gradient of f(x)=x², which is 2*x",
      "x moves against the gradient: x = x - learning_rate * 2*x",
      "loss is x² and is recorded after every update",
      "the input values are not mutated",
    ],
    constraints: [
      "return exactly steps + 1 rows",
      "each row is [step_number, x_value, loss_value]",
      "steps is a non-negative integer and learning_rate is a number",
    ],
    examples: [
      { id: "start", given: "gradient_descent(2.0, 0.25, 2)", result: "[[0, 2.0, 4.0], [1, 1.0, 1.0], [2, 0.5, 0.25]]" },
      { id: "zero", given: "gradient_descent(3.0, 0.1, 0)", result: "[[0, 3.0, 9.0]]" },
    ],
    designQuestion: {
      question: "Which direction should the update take when the gradient is positive?",
      options: [
        { label: "Subtract the gradient", value: "subtract" },
        { label: "Add the gradient", value: "add" },
        { label: "Ignore the gradient", value: "ignore" },
      ],
      correct: "subtract",
      explanation: "The gradient points uphill. Subtracting it moves x downhill and lowers the loss.",
    },
    starter: `def gradient_descent(start, learning_rate, steps):
    # Return [step, x, loss] for the starting point and every update.
    # f(x) = x ** 2, so its gradient is 2 * x.
    # Keep the history observable: it becomes the evidence for every later lab.
    pass
`,
    visibleTests: [
      { name: "two updates", call: "gradient_descent(2.0, 0.25, 2)", expect: [[0, 2.0, 4.0], [1, 1.0, 1.0], [2, 0.5, 0.25]], invariant: "the update must move downhill and record both the start and each new point" },
      { name: "zero steps", call: "gradient_descent(3.0, 0.1, 0)", expect: [[0, 3.0, 9.0]], invariant: "zero iterations still expose the initial loss" },
      { name: "zero start", call: "gradient_descent(0.0, 0.5, 2)", expect: [[0, 0.0, 0.0], [1, 0.0, 0.0], [2, 0.0, 0.0]], invariant: "the optimum is stable under further updates" },
    ],
    hiddenTests: [
      { name: "negative start", call: "gradient_descent(-2.0, 0.25, 2)", expect: [[0, -2.0, 4.0], [1, -1.0, 1.0], [2, -0.5, 0.25]], invariant: "the same rule must work on the other side of the minimum" },
      { name: "no learning", call: "gradient_descent(2.0, 0.0, 2)", expect: [[0, 2.0, 4.0], [1, 2.0, 4.0], [2, 2.0, 4.0]], invariant: "a zero learning rate makes the update an identity" },
      { name: "history length", call: "len(gradient_descent(5.0, 0.1, 4))", expect: 5, invariant: "every requested update must be represented in the artifact" },
    ],
    hints: [
      { level: 1, type: "question", text: "What value must the first history row contain before any update happens?" },
      { level: 2, type: "question", text: "If the gradient is 2*x, which operation moves in the downhill direction?" },
      { level: 3, type: "question", text: "After updating x, which value should be squared for this row's loss?" },
      { level: 4, type: "assertion", text: "Initialize history with [0, start, start**2], then loop steps times: x -= learning_rate * (2*x), append [step, x, x**2]." },
    ],
    solution: `def gradient_descent(start, learning_rate, steps):
    x = start
    history = [[0, x, x ** 2]]
    for step in range(1, steps + 1):
        gradient = 2 * x
        x = x - learning_rate * gradient
        history.append([step, x, x ** 2])
    return history
`,
    artifact: {
      title: "Gradient descent trace",
      fields: [
        { name: "update_rule", label: "Update rule" },
        { name: "convergence_signal", label: "Convergence signal" },
        { name: "failure_mode", label: "Failure mode you observed" },
      ],
      reflectionQuestion: "Why is returning the full history more useful than returning only the final x?",
    },
    exitGate: {
      question: "What is the most important reason to keep the loss history?",
      options: [
        { label: "It makes convergence inspectable", value: "inspect" },
        { label: "It makes Python run faster", value: "speed" },
        { label: "It removes the need for a learning rate", value: "remove" },
      ],
      correct: "inspect",
      explanation: "A final number can hide divergence or oscillation; the trace lets us inspect the learning process.",
    },
  }),
  p("atomic", 2, "A2", "a2-gradient-two-variables", "Gradient Descent on 2 Variables", 15, 45, "Watch a point move toward (0,0)", 20, "A1", ["a1-gradient-descent"], "track partial derivatives", "For several variables the gradient is a vector of partial derivatives.", "Minimize f(x,y)=x²+y² by updating both coordinates.", "Both coordinates and the function value must converge together.", "Use unequal starting points and learning rates; observe axis-wise motion.", "A two-parameter optimizer with a convergence report."),
  p("atomic", 3, "A3", "a3-single-neuron-forward", "Single Neuron Forward Pass", 20, 60, "See neuron([1,1,1]) produce 0.3", 21, "A2", ["a2-gradient-two-variables"], "compute a neuron", "A neuron is a weighted sum plus bias followed by a nonlinear activation.", "Implement relu(w·x+b) for a small input vector.", "Check shape, negative pre-activation, and a hand-computed forward value.", "Swap ReLU for sigmoid and vary one input at a time.", "A deterministic neuron forward-pass function."),
  p("atomic", 4, "A4", "a4-train-first-neuron", "Train Your First Neuron", 35, 60, "Watch a neuron learn to output 1.0", 6, "A1 (gradient descent)", ["a1-gradient-descent", "a3-single-neuron-forward"], "train by reducing loss", "Forward, loss, chain rule, and update form one complete learning loop.", "Train weights and bias so a ReLU neuron reaches a target without PyTorch.", "Loss must fall and the final prediction must approach the target.", "Change the target, learning rate, activation, and add a second neuron.", "A hand-trained neuron with its loss trace."),
  p("atomic", 5, "B1", "b1-pytorch-autograd", "Rewrite A4 in PyTorch", 20, 30, "Get the same loss with autograd", 22, "A4", ["a4-train-first-neuron"], "trust automatic differentiation", "Autograd records operations in a graph and applies the chain rule for you.", "Rewrite the hand-trained neuron with tensors, loss.backward(), and optimizer.step().", "The automated version should match the hand-derived direction and converge.", "Inspect gradients, remove zero_grad, and compare optimizers.", "A PyTorch training script with an inspected gradient."),
  p("atomic", 6, "B2", "b2-mlp-mnist", "MLP on MNIST", 50, 120, "Reach roughly 95% handwritten-digit accuracy", 24, "B1", ["b1-pytorch-autograd"], "stack learnable boundaries", "An MLP composes linear layers, ReLU, cross-entropy, and Adam.", "Train a small multilayer perceptron on 28×28 digit vectors.", "Check train/validation separation, loss trend, and per-class accuracy.", "Change width, depth, batch size, and optimizer settings one at a time.", "A model checkpoint plus an evaluation report."),
  p("atomic", 7, "C1", "c1-bigram-language-model", "Bigram Language Model: Your First Text Generator", 50, 120, "Generate Shakespeare-like text", 9, "A4 (training loop)", ["a4-train-first-neuron"], "predict the next token", "A bigram model learns a table of next-character scores and turns them into probabilities.", "Train a character-level next-token model and sample text from it.", "Loss should fall and generated text should preserve local character statistics.", "Change temperature, use greedy decoding, and compare character frequencies.", "A tiny language model and a reproducible generated sample."),
  p("atomic", 8, "C2", "c2-single-attention-head", "Single Attention Head", 40, 120, "Let the model see all previous characters", 26, "C1", ["c1-bigram-language-model"], "let tokens attend", "Queries ask what to find, keys describe what is present, and values carry information.", "Implement scaled dot-product causal self-attention for a tiny sequence.", "Future positions must receive zero attention and each row must normalize.", "Remove the causal mask, change sequence length, and inspect attention weights.", "A causal attention function with an attention-map snapshot."),
  p("atomic", 9, "C3", "c3-multi-head-attention", "Multi-Head Attention", 60, 120, "Let different heads learn different patterns", 27, "C2", ["c2-single-attention-head"], "specialize heads", "Several attention heads run in parallel over separate representation subspaces.", "Split dimensions into heads, apply attention, concatenate, and project.", "Head shapes must divide evenly and concatenation must restore model width.", "Vary the number of heads and compare per-head attention patterns.", "A multi-head attention module with head-level diagnostics."),
  p("atomic", 10, "C4", "c4-transformer-block", "Transformer Block", 80, 180, "Make real English words appear", 29, "C3", ["c3-multi-head-attention"], "stabilize transformations", "Residual paths, normalization, and a feed-forward network make attention trainable.", "Compose attention, LayerNorm, residual connections, and an FFN into one block.", "Residual shapes must match and a forward pass must remain finite.", "Remove a residual or normalization and observe instability or slower learning.", "A reusable transformer block with a shape and stability report."),
  p("atomic", 11, "D1", "d1-triton-relu-kernel", "Triton ReLU Kernel", 30, 60, "Write a GPU kernel that competes with torch", 32, "Nothing", [], "make parallel work explicit", "A GPU kernel maps blocks of data to thousands of parallel program instances.", "Implement elementwise ReLU with Triton load, compute, and store operations.", "Kernel output must match torch exactly across sizes and tails.", "Change block size and compare latency against the reference implementation.", "A correctness-tested custom ReLU kernel and benchmark."),
  p("atomic", 12, "D2", "d2-fused-softmax-kernel", "Fused Softmax Kernel", 80, 180, "Match torch.softmax while moving less memory", 33, "D1", ["d1-triton-relu-kernel"], "fuse memory passes", "Online softmax keeps a running maximum and normalizer instead of writing intermediates.", "Fuse max, exponentiation, sum, and normalization into one Triton kernel.", "Rows must sum to one and match torch within numerical tolerance.", "Vary row widths, precision, and block sizes; measure memory and latency.", "A fused softmax kernel with numerical and performance evidence."),
  p("atomic", 13, "E1", "e1-load-huggingface-model", "Load a HuggingFace Model", 15, 30, "Load a 1.5B-parameter prior", 35, "Nothing", [], "load a pretrained prior", "A model hub supplies weights and a tokenizer so training can focus on adaptation.", "Load a tokenizer and pretrained causal model, then inspect parameter and dtype metadata.", "Tokenization round-trips and model output shapes must be stable.", "Compare dtypes, device maps, and context lengths without changing the input.", "A model manifest recording source, tokenizer, dtype, and context limits."),
  p("atomic", 14, "E2", "e2-generate-text", "Generate Text", 25, 30, "Generate 50 coherent tokens", 36, "E1", ["e1-load-huggingface-model"], "control decoding randomness", "Greedy, temperature, and top-p decoding trade determinism for variety.", "Implement a bounded generation loop with selectable decoding policy.", "The same seed and policy must reproduce the same token sequence.", "Compare greedy, low-temperature, high-temperature, and top-p outputs.", "A decoding policy report with seeded samples."),
  p("atomic", 15, "E3", "e3-embed-a-sentence", "Embed a Sentence", 15, 30, "Turn text into a meaning-bearing vector", 38, "E1", ["e1-load-huggingface-model"], "represent meaning as vectors", "Embeddings place semantically similar sentences near one another in vector space.", "Encode sentences and compute cosine similarity between matched and distractor pairs.", "Vector dimension and normalization must be stable across repeated calls.", "Compare paraphrases, unrelated sentences, and pooling strategies.", "An embedding card with similarity examples and model version."),
  p("atomic", 16, "F1", "f1-download-tokenize-dataset", "Download + Tokenize a Dataset", 40, 60, "Save a tokenized corpus to disk", 39, "Nothing", [], "turn bytes into batches", "BPE merges frequent byte pairs so rare words remain representable as subwords.", "Download a permitted corpus, tokenize it, and write a compact binary dataset.", "Round-trip samples and token counts must match the manifest.", "Vary vocabulary size, sequence packing, and streaming batch size.", "A dataset manifest with tokenizer version, token count, and split hashes."),
  p("atomic", 17, "F2", "f2-build-vector-index", "Build a Vector Index", 30, 60, "Find the top three similar documents instantly", 40, "E3", ["e3-embed-a-sentence"], "search by similarity", "A vector index trades exhaustive scans for a data structure built for nearest neighbors.", "Embed a small document set and build an exact inner-product index.", "Top-k results must be stable, normalized, and tied to source document IDs.", "Change k, add distractors, and compare exact search with a brute-force check.", "A versioned vector index plus a retrieval-quality sample."),
  p("atomic", 18, "F3", "f3-function-calling", "Function Calling with a Model", 30, 60, "Make a model call calculate(15*37)", 42, "E2", ["e2-generate-text"], "close the tool loop", "Tool use is a loop: decide, call a bounded tool, observe, and decide again.", "Define JSON tool schemas, dispatch a calculation/search tool, and return observations.", "Invalid tool names and malformed arguments must become structured errors.", "Add a timeout, a second tool, and a maximum number of tool turns.", "A traced tool-call transcript with safe dispatch rules."),
  p("atomic", 19, "F4", "f4-image-patch-embedding", "Load an Image + Patch Embedding", 30, 60, "Turn a 224×224 image into 196 patch tokens", 43, "Nothing", [], "turn pixels into tokens", "A Vision Transformer treats fixed-size image patches as a sequence of tokens.", "Normalize an image, split it into patches, flatten, and project each patch.", "Patch count, dimension, and ordering must match the image geometry.", "Change patch size and inspect how sequence length and detail change.", "A patch manifest and visual tokenization report."),
  p("combination", 20, "M1", "m1-micrograd", "micrograd: Build Your Own Autograd", 80, 180, "Build the core of PyTorch in 80 lines", 45, "A1–A4", ["a1-gradient-descent", "a2-gradient-two-variables", "a3-single-neuron-forward", "a4-train-first-neuron"], "propagate responsibility", "A scalar Value can remember parents and local derivative rules, then replay them backward.", "Implement a scalar computation graph with add, multiply, power, and backward traversal.", "Finite differences must agree with accumulated gradients, including branches.", "Train a tiny neuron on the new engine and compare it to the hand-written version.", "A tested scalar autograd engine with a gradient graph."),
  p("combination", 21, "M2", "m2-nanogpt", "nanoGPT: Build a Real Language Model", 180, 240, "Generate coherent English stories", 13, "C1 (text model) + A4 (training loop)", ["c1-bigram-language-model", "a4-train-first-neuron"], "compose a causal model", "A modern decoder combines embeddings, causal GQA, RoPE, RMSNorm, SwiGLU, and weight tying.", "Build a tiny decoder-only transformer and train it on a short local corpus.", "Masks, shapes, loss, and seeded sampling must remain finite and reproducible.", "Remove one component at a time and record the quality or stability change.", "A tiny language-model checkpoint, sample, and failure report."),
  p("combination", 22, "M3", "m3-flashattention", "FlashAttention in Triton", 120, 240, "Reduce long-context attention memory", 47, "C2 + D2", ["c2-single-attention-head", "d2-fused-softmax-kernel"], "fuse attention safely", "FlashAttention tiles Q/K/V and computes softmax online without materializing the full score matrix.", "Implement a tiled attention kernel that fuses QKᵀ, softmax, and AV.", "The result must match naive attention within tolerance across sequence lengths.", "Compare memory, tile size, and latency against the naive implementation.", "A kernel benchmark and numerical-equivalence report."),
  p("combination", 23, "M4", "m4-kv-cache", "KV Cache + Fast Generation", 60, 120, "Make generation dramatically faster", 49, "E2", ["e2-generate-text"], "reuse past keys", "Caching prior keys and values turns repeated prefix work from quadratic into incremental work.", "Add a KV cache to a decoder and generate one token at a time.", "Cached and uncached logits must match for every generated position.", "Measure tokens per second at growing context lengths and inspect cache memory.", "A cache-aware generation trace and speedup report."),
  p("combination", 24, "M5", "m5-lora-finetuning", "LoRA Fine-Tuning", 80, 180, "Adapt a model with a tiny trainable footprint", 50, "E1 + B2", ["e1-load-huggingface-model", "b2-mlp-mnist"], "adapt without rewriting", "LoRA freezes base weights and learns a low-rank update W′=W+BA.", "Insert low-rank adapters, freeze the base model, and fine-tune on a small task set.", "Only adapter parameters should change and validation must be reproducible.", "Vary rank, adapter placement, and learning rate; compare quality versus trainable bytes.", "An adapter checkpoint, parameter budget, and before/after evaluation."),
  p("combination", 25, "M6", "m6-rag-pipeline", "RAG Pipeline", 100, 180, "Ask a question and get a grounded answer", 52, "E3 + F2 + E2", ["e3-embed-a-sentence", "f2-build-vector-index", "e2-generate-text"], "retrieve before generate", "Retrieval-augmented generation selects evidence first, then asks the model to answer from it.", "Embed documents, search top-k context, assemble a grounded prompt, and generate.", "Each answer must include retrieved IDs and refuse when context is absent.", "Change chunk size, k, and prompt wording; classify unsupported answers.", "A RAG trace containing query, evidence, answer, and groundedness checks."),
  p("combination", 26, "M7", "m7-ddp-training", "DDP Training", 100, 180, "Speed up training across two processes", 54, "B2", ["b2-mlp-mnist"], "average gradients safely", "DistributedDataParallel keeps model replicas while all-reducing gradients across workers.", "Split batches across workers, average gradients, and keep updates synchronized.", "Workers must converge to equivalent parameters under a fixed seed.", "Vary world size, batch partitioning, and communication timing.", "A distributed training trace with throughput and synchronization evidence."),
  p("combination", 27, "M8", "m8-moe-layer", "MoE Layer", 80, 180, "See experts specialize by token", 56, "B2 + C4", ["b2-mlp-mnist", "c4-transformer-block"], "route tokens to experts", "Mixture-of-Experts replaces one FFN with routed experts plus a load-balancing objective.", "Implement top-k routing, expert capacity, combine weights, and auxiliary balancing loss.", "Every token must route within capacity and outputs must preserve shape.", "Change expert count, top-k, and routing temperature; inspect load skew.", "An MoE routing report with expert utilization and quality."),
  p("system", 28, "S1", "s1-production-inference-server", "Production Inference Server", 300, 720, "Serve models at high throughput", 58, "M4 + M3", ["m4-kv-cache", "m3-flashattention"], "serve under constraints", "A production server combines batching, quantization, validation, scheduling, and observability.", "Build a bounded inference service with an API, continuous batching, and a model lifecycle.", "Requests must be isolated, timed, validated, and returned with structured errors.", "Inject slow, invalid, and concurrent requests; compare batch policies and quantization.", "A service contract, latency report, and rollback-ready server artifact."),
  p("system", 29, "S2", "s2-code-completion-model", "Code Completion Model", 400, 1440, "Deploy an autocomplete model", 60, "M2 + F1 + M7", ["m2-nanogpt", "f1-download-tokenize-dataset", "m7-ddp-training"], "train for a product contract", "A useful model is a data, architecture, evaluation, and deployment pipeline—not only a checkpoint.", "Tokenize code, pack contexts, train a decoder, quantize it, and expose completion requests.", "Held-out completion tests, latency, and safe truncation must all pass.", "Change context length, sampling policy, and quantization; inspect quality/latency tradeoffs.", "A completion model card, benchmark, and editor-facing API."),
  p("system", 30, "S3", "s3-chat-with-documents", "Chat with Your Documents", 300, 1440, "Build a private document chat system", 61, "M6 + M5 + S1", ["m6-rag-pipeline", "m5-lora-finetuning", "s1-production-inference-server"], "serve grounded context", "A document chat product needs chunking, indexing, retrieval, serving, and citation policy together.", "Upload documents, chunk and index them, retrieve context, and serve cited answers.", "Answer quality, source coverage, latency, and unsupported-question behavior must be measured.", "Change overlap, top-k, adapter behavior, and timeout policy; diagnose failures by stage.", "A document-chat system with a grounded evaluation set and SLO sheet."),
  p("system", 31, "S4", "s4-ai-coding-agent", "AI Coding Agent", 400, 2880, "Build an agent that reads, writes, and tests code", 63, "S3 + F3", ["s3-chat-with-documents", "f3-function-calling"], "close the tool loop safely", "An agent is a model-driven control loop constrained by typed tools, observations, and a sandbox.", "Implement JSON tool calls, a ReAct loop, file operations, test execution, and stop conditions.", "Tool schemas, path boundaries, turn budgets, and failure recovery must be explicit.", "Break tools, inject malformed plans, exceed budgets, and compare recovery policies.", "A traced coding-agent run with a sandbox and safety policy."),
  p("system", 32, "S5", "s5-vision-language-model", "Vision-Language Model", 350, 2880, "Make a language model describe images", 65, "M2 + F4", ["m2-nanogpt", "f4-image-patch-embedding"], "align two representations", "A VLM projects image patch tokens into the language model's representation space.", "Combine a frozen vision encoder, trainable projection, and language decoder.", "Image-token shapes, projection dimensions, and answer grounding must be checked.", "Change projection width, prompt format, and image resolution; inspect hallucinations.", "A vision-language model card with image-grounded examples and failures."),
  p("system", 33, "S6", "s6-distributed-trainer", "Distributed Trainer", 300, 720, "Train a larger model with sharded state", 67, "M7 + FSDP", ["m7-ddp-training"], "shard what cannot fit", "FSDP shards parameters, gradients, and optimizer state while checkpointing activations.", "Build a small sharded trainer with accumulation, checkpointing, and restart support.", "A resumed run must match an uninterrupted run within tolerance.", "Change shard size, accumulation, and checkpoint frequency; measure memory and throughput.", "A restartable distributed-training report.", ["FSDP/ZeRO-3 concepts"]),
  p("system", 34, "S7", "s7-aligned-chatbot", "Aligned Chatbot (SFT + DPO)", 250, 720, "Make a chatbot prefer better answers", 69, "M5 + DPO", ["m5-lora-finetuning"], "optimize for preferences", "SFT teaches instruction following; DPO shifts preference toward chosen answers without a reward model.", "Fine-tune adapters on demonstrations, then optimize chosen/rejected pairs with DPO.", "Preference loss, held-out comparisons, and refusal behavior must be visible.", "Vary preference margins, beta, and data quality; inspect regressions.", "An aligned checkpoint, preference report, and safety evaluation.", ["DPO concepts"]),
  p("frontier", 35, "CAP1", "cap1-reasoning-grpo", "Reasoning Model with GRPO", 500, 2160, "Train a model that checks its own answers", 71, "S7 + GRPO", ["s7-aligned-chatbot"], "learn from verifiable rewards", "GRPO samples groups of completions, verifies answers, and updates relative advantage without a value model.", "Build a small verifiable-reward loop with grouped sampling and policy updates.", "Rewards must be reproducible, answers verifiable, and policy updates bounded.", "Change group size, reward shaping, and verifier strictness; inspect reward hacking.", "A reasoning-training report with verifier and reward traces.", ["GRPO concepts"]),
  p("frontier", 36, "CAP2", "cap2-novel-attention", "Novel Attention + Paper", 400, 2160, "Turn a new attention idea into evidence", 73, "M3 + research", ["m3-flashattention"], "test a new hypothesis", "Research means defining a mechanism, predicting a tradeoff, measuring it, and writing what survived.", "Choose and implement a linear or sparse attention variant with a fair baseline.", "Numerical equivalence, speed, memory, and quality must be compared on fixed fixtures.", "Run ablations, falsify the hypothesis where possible, and write the limitations.", "A reproducible experiment package and a short technical paper." , ["research design"]),
  p("frontier", 37, "CAP3", "cap3-build-deepseek", "Build Your Own DeepSeek", 800, 5760, "Integrate MoE, MLA, DDP, and GRPO", 76, "All projects", ["a1-gradient-descent", "a2-gradient-two-variables", "a3-single-neuron-forward", "a4-train-first-neuron", "b1-pytorch-autograd", "b2-mlp-mnist", "c1-bigram-language-model", "c2-single-attention-head", "c3-multi-head-attention", "c4-transformer-block", "d1-triton-relu-kernel", "d2-fused-softmax-kernel", "e1-load-huggingface-model", "e2-generate-text", "e3-embed-a-sentence", "f1-download-tokenize-dataset", "f2-build-vector-index", "f3-function-calling", "f4-image-patch-embedding", "m1-micrograd", "m2-nanogpt", "m3-flashattention", "m4-kv-cache", "m5-lora-finetuning", "m6-rag-pipeline", "m7-ddp-training", "m8-moe-layer", "s1-production-inference-server", "s2-code-completion-model", "s3-chat-with-documents", "s4-ai-coding-agent", "s5-vision-language-model", "s6-distributed-trainer", "s7-aligned-chatbot", "cap1-reasoning-grpo", "cap2-novel-attention"], "integrate every subsystem", "A frontier model is an integration problem: efficient attention, sparse experts, distributed training, and verifiable reasoning must fit one contract.", "Assemble a small end-to-end replica with MLA-style latent KV, MoE routing, distributed updates, and GRPO-style verification.", "The system must train, generate, report memory/throughput, and survive one injected failure.", "Scale only after fixed-fixture correctness; compare each optimization against the previous artifact.", "A portfolio-grade system design review, benchmark, and rejected-tradeoff log."),
]

export const buildEverythingProjects: BuildEverythingProject[] = [
  ...sourceProjects,
  ...buildEverythingExtensions,
  ...buildEverythingModern,
]

for (const item of buildEverythingProjects) {
  if (!item.implementation) item.implementation = implementationForBuildEverythingProject(item)
  BuildEverythingProjectSchema.parse(item)
}

export const buildEverythingProjectById = new Map(buildEverythingProjects.map(project => [project.id, project]))
export const buildEverythingProjectByCode = new Map(buildEverythingProjects.map(project => [project.code, project]))

export const buildEverythingTiers: { id: BuildEverythingTier; label: string; description: string }[] = [
  { id: "atomic", label: "Tier 0 · Atomic skills", description: "The smallest mechanisms: optimize, represent, attend, tokenize, and measure." },
  { id: "combination", label: "Tier 1 · First combinations", description: "Join the mechanisms into autograd, language models, retrieval, and training systems." },
  { id: "system", label: "Tier 2 · Real systems", description: "Ship products with serving, agents, documents, vision, distribution, and alignment." },
  { id: "frontier", label: "Tier 3 · Frontier capstones", description: "Run verifiable reasoning, research a new mechanism, and integrate the full stack." },
  { id: "extension", label: "Deriva extensions · Trustworthy AI", description: "Close the production gaps: data contracts, evaluation, monitoring, safety, privacy, and controlled rollout." },
  { id: "modern", label: "Modern AI engineering", description: "Practice the interfaces and systems current teams ship: MCP, agents, structured output, efficient inference, compilers, supply chain, and streaming." },
]

export const buildEverythingFeaturedPath = ["A1", "A4", "C1", "M2"]

export function getBuildEverythingProject(id: string): BuildEverythingProject | undefined {
  return buildEverythingProjectById.get(id)
}
