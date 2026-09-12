// FOUNDRY — the AI production workshop.
// A standalone app (like Ghost / KYMA / CORONA) where every station is a
// real engine you operate to learn a production AI-engineering skill.
// Station metadata mirrors the games catalog shape so the home floor renders
// with the same grammar: one engine per station, many missions inside.

export type FoundryStation = {
  id: string
  index: string
  title: string
  verb: string
  description: string
  skill: string
  engine: string
  research: string
  missions: number
  href: string
  transferHref: string
  transferLabel: string
}

export const FOUNDRY = {
  id: "foundry",
  title: "Foundry",
  tagline: "The AI production workshop",
  intro:
    "Six stations, six real engines. You do not read about modern AI systems — you operate them: train the tokenizer, turn the sampling dials, read the attention arcs, run the serving floor, fix the retrieval bench, and guard the agent loop. Every station is the actual machinery, small enough to hold.",
}

export const FOUNDRIES: FoundryStation[] = [
  {
    id: "tokenizer",
    index: "01",
    title: "Token Bench",
    verb: "forge the vocabulary",
    description:
      "Train a real byte-pair encoding tokenizer on a corpus, watch merges appear one by one, then budget and price prompts by the token.",
    skill: "Tokenization · token budgets · token economics",
    engine: "BPE trainer + encoder",
    research: "Sennrich et al. 2016 — subword units; the GPT-2/GPT-4o tokenizer lineage",
    missions: 4,
    href: "/foundry/tokenizer",
    transferHref: "/ai-ml",
    transferLabel: "Transfer to the AI/ML track",
  },
  {
    id: "sampling",
    index: "02",
    title: "Sampling Deck",
    verb: "turn the dials",
    description:
      "A language model with its probabilities exposed. Temperature, top-k and nucleus truncation reshape the distribution in front of you — learn what each dial really does before you ever set one in production.",
    skill: "Decoding parameters · distribution shaping",
    engine: "n-gram LM + softmax + nucleus truncation",
    research: "Holtzman et al. 2020 — The Curious Case of Neural Text Degeneration",
    missions: 4,
    href: "/foundry/sampling",
    transferHref: "/ultron",
    transferLabel: "Drill decoding in Ultron",
  },
  {
    id: "attention",
    index: "03",
    title: "Attention Lens",
    verb: "read the arcs",
    description:
      "One attention head with the covers off: scaled dot products, softmax weights, positional mixing. Predict where attention lands, then fix a context bug the way you fix prompts.",
    skill: "Self-attention · positional encoding · context placement",
    engine: "Q·K/√d + softmax + sinusoidal positions",
    research: "Vaswani et al. 2017; Liu et al. — Lost in the Middle",
    missions: 3,
    href: "/foundry/attention",
    transferHref: "/ai-ml",
    transferLabel: "Transfer to the AI/ML track",
  },
  {
    id: "serving",
    index: "04",
    title: "Serving Floor",
    verb: "run the floor",
    description:
      "An inference server as a discrete-event simulation. Requests arrive, KV cache fills, batches form. Choose dtype, batching and paging — then keep the SLA when traffic doubles.",
    skill: "KV cache · quantization · continuous batching · PagedAttention",
    engine: "Discrete-event server simulator",
    research: "Kwon et al. 2023 — PagedAttention (vLLM); Yu et al. 2022 — Orca continuous batching",
    missions: 4,
    href: "/foundry/serving",
    transferHref: "/ai-ml/systems",
    transferLabel: "Study serving in AI/ML systems",
  },
  {
    id: "rag",
    index: "05",
    title: "Retrieval Bench",
    verb: "fix the retrieval",
    description:
      "A RAG pipeline that fails the way real ones fail: vocabulary mismatch, keyword stuffing, chunk boundaries cutting answers in half. Diagnose, then repair with chunking and query expansion.",
    skill: "BM25 · vector retrieval · chunking · hybrid strategies",
    engine: "BM25 + feature-hash embeddings + cosine",
    research: "Robertson & Zaragoza 2009 — BM25; Lewis et al. 2020 — RAG",
    missions: 3,
    href: "/foundry/rag",
    transferHref: "/ai-ml",
    transferLabel: "Take the RAG questions",
  },
  {
    id: "agents",
    index: "06",
    title: "Agent Loop",
    verb: "guard the loop",
    description:
      "A ReAct agent you can actually break: runaway retries, observation bloat blowing the context, prompt injection hiding in a file. Set the guardrails, run the loop, read the trace.",
    skill: "Agent loops · context engineering · guardrails",
    engine: "Deterministic ReAct executor with guards",
    research: "Yao et al. 2022 — ReAct; SWE-agent; OWASP LLM Top 10 (injection)",
    missions: 4,
    href: "/foundry/agents",
    transferHref: "/ghost",
    transferLabel: "Meet Ghost — a real on-device model",
  },
]

export const FOUNDRY_MISSION_XP = 50
export const FOUNDRY_STATION_BONUS = 100

export function foundryTotalMissions(): number {
  return FOUNDRIES.reduce((sum, station) => sum + station.missions, 0)
}
