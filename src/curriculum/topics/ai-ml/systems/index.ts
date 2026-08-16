// Systems Atelier scenario ladder (system-ai/systems-atelier-plan.md §Scenario
// ladder). Phase 1 ships the coupling pair: S1 monolith queueing, S2 the
// inference-service-calls-feature-API thought experiment. Parse-all at module
// scope via defineScenario — a broken scenario fails the build.

import { defineScenario, type SystemScenario } from "../../../schema/system-scenario"

const scenarios: SystemScenario[] = [
  defineScenario({
    id: "s1-ticket-search-monolith",
    number: 1,
    title: "Ticket Search Monolith",
    thinkingMove: "see queueing in a latency tail",
    pitch: "One process serves every search. When the ticket queue spikes, the p99 tail is the queue — and there is no queue data structure anywhere.",
    realSystem: "A single-process search service handling a support-ticket platform: every request is handled serially by one component before the next request can start.",
    loadShape: {
      seed: 41,
      baseRate: 200,
      burst: { at: 8, until: 14, rate: 2000 },
      simSeconds: 30,
      maxRequests: 400,
    },
    components: [
      {
        id: "search",
        role: "root",
        exposes: "search(request, ctx) → render(query, hits)",
        api: { version: "v1", requestFields: ["query", "request_id"], responseFields: ["query", "hits"] },
        latency: { p50: 6, p99: 15 },
        failureRate: 0,
      },
      {
        id: "scan",
        role: "upstream",
        exposes: "scan(request, ctx) → hits (full-index sweep, no timeouts)",
        api: { version: "v1", requestFields: ["q"], responseFields: ["hits", "scanned"] },
        latency: { p50: 90, p99: 420 },
        failureRate: 0,
      },
    ],
    designGates: [
      {
        question: "The monolith queues because one request blocks the process until it finishes. Where does the queue form?",
        options: [
          { label: "In the scan component", value: "scan" },
          { label: "In front of the process", value: "front" },
          { label: "Inside the disk", value: "disk" },
        ],
        correct: "front",
        explanation: "Incoming requests pile up in front of the single process while it handles the current one. That invisible queue is the p99 tail.",
      },
      {
        question: "Under the 2000 r/s burst, why does p99 explode while p50 stays modest?",
        options: [
          { label: "A few slow scans poison the tail", value: "tail" },
          { label: "Every request is slow", value: "all" },
          { label: "The index corrupts", value: "corrupt" },
        ],
        correct: "tail",
        explanation: "p50 is one lucky request; p99 is a request that arrived while a slow scan was running. The queue makes the slowest scans compound.",
      },
      {
        question: "A timeout on the scan call changes which failure?",
        options: [
          { label: "Queueing, not the scan itself", value: "queueing" },
          { label: "The scan's own latency", value: "scan-latency" },
          { label: "Nothing observable", value: "nothing" },
        ],
        correct: "queueing",
        explanation: "A timeout bounds how long one request can hold the process. The scan is still slow; the queue just stops forming behind it.",
      },
      {
        question: "The naive trap is 'no timeout, no budget'. The fixed run adds exactly one policy change. Which?",
        options: [
          { label: "Timeout the scan call", value: "timeout" },
          { label: "Split into two services", value: "split" },
          { label: "Raise the failure rate", value: "fail" },
        ],
        correct: "timeout",
        explanation: "Split into two services without timeouts still queues — behind the second process. One budgeted call bounds the tail in the same topology.",
      },
    ],
    handlers: [
      {
        name: "search",
        signature: "search(request, ctx) → dict",
        purpose: "The root handler. One policy choice lives here: whether the scan call has a timeout budget.",
      },
      {
        name: "scan",
        signature: "scan(request, ctx) → dict",
        purpose: "The upstream full-index sweep. Slow on purpose; the learner's job is to cope, not to speed it up.",
      },
    ],
    naiveCode: `
# Naive run — the monolith with no budget. Every request waits for the scan,
# and the next request waits for this one. Run it first: watch the tail.
def scan(request, ctx):
    return {"hits": ["t-001", "t-002"], "scanned": 1000}

def search(request, ctx):
    hits = ctx.call("scan", {"q": request["query"]}, api_version="v1")
    return {"query": request["query"], "hits": hits["hits"]}
`,
    starter: `
# The fixed run: one policy change — a timeout budget on the scan call.
def scan(request, ctx):
    return {"hits": ["t-001", "t-002"], "scanned": 1000}

def search(request, ctx):
    hits = ctx.call("scan", {"q": request["query"]}, timeout_ms=200, api_version="v1")
    return {"query": request["query"], "hits": hits["hits"], "budgeted": True}
`,
    contractDrillCode: `
def scan(request, ctx):
    return {"hits": ["t-001", "t-002"], "scanned": 1000}

def search(request, ctx):
    # The provider only speaks v1. Watch the boundary reject v2.
    hits = ctx.call("scan", {"q": request["query"]}, timeout_ms=200, api_version="v2")
    return {"query": request["query"], "hits": hits["hits"]}
`,
    systemGates: [
      {
        metric: "p99Ms",
        op: "<=",
        value: 250,
        name: "The tail is bounded",
        invariant: "p99 end-to-end latency must drop from the unbounded serial tail (≈480ms under the burst) to roughly one scan budget (≤250ms).",
      },
      {
        metric: "p50Ms",
        op: "<=",
        value: 130,
        name: "The median stays healthy",
        invariant: "Fast requests must stay fast — a budgeted call adds at most one bounded hop.",
      },
      {
        metric: "timeoutCount",
        op: "<=",
        value: 80,
        name: "Timeouts are not free",
        invariant: "Bounding the tail trades ~15% of requests into 504s under this burst; the count must stay at that scale, not become the whole world.",
      },
    ],
    artifact: {
      title: "S1 · The queue report",
      fields: [
        { name: "tail_before", label: "p99 before (from the naive run)", required: true },
        { name: "tail_after", label: "p99 after (from the fixed run)", required: true },
        { name: "failure", label: "What the timeout trades away", required: true },
      ],
      reflectionQuestion: "Where exactly was the queue? How did one budgeted call move it?",
    },
    relatedQuestionIds: ["OPS-001"],
    relatedLessonIds: ["ai-ml/04-inference-service/..."],
  }),

  defineScenario({
    id: "s2-inference-calls-feature-api",
    number: 2,
    title: "Inference Calls the Feature API",
    thinkingMove: "feel synchronous coupling",
    pitch: "Every prediction needs a feature lookup. A's contract is composed of B's contract, and A's p99 is B's p99 plus overhead — until A grows a budget.",
    realSystem: "An inference service A whose every request calls a feature API B. B is well-behaved on average with a slow tail; A has no timeout, so B's worst requests become A's worst requests.",
    loadShape: {
      seed: 7,
      baseRate: 500,
      simSeconds: 30,
      maxRequests: 300,
    },
    components: [
      {
        id: "inference",
        role: "root",
        exposes: "inference(request, ctx) → prediction",
        api: { version: "v1", requestFields: ["query", "request_id"], responseFields: ["prediction", "confidence"] },
        latency: { p50: 5, p99: 12 },
        failureRate: 0,
      },
      {
        id: "features",
        role: "upstream",
        exposes: "features(request, ctx) → feature vector",
        api: { version: "v3", requestFields: ["q"], responseFields: ["vector", "version"] },
        latency: { p50: 80, p99: 600 },
        failureRate: 0,
      },
    ],
    designGates: [
      {
        question: "A's latency is B's latency plus what?",
        options: [
          { label: "A's own overhead", value: "overhead" },
          { label: "B's database", value: "database" },
          { label: "The internet", value: "internet" },
        ],
        correct: "overhead",
        explanation: "A does nothing until B responds. The arithmetic: A's p95 ≥ B's p95 + A's serialization and compute. No timeout means A inherits B's entire tail.",
      },
      {
        question: "B's contract changes (a field is renamed). Which system breaks first?",
        options: [
          { label: "A, before A's code changes", value: "a-first" },
          { label: "B itself", value: "b" },
          { label: "Neither — contracts are advisory", value: "neither" },
        ],
        correct: "a-first",
        explanation: "A consumes B's response shape. A fails at parse time — its own code never changed. This is what 'A's contract is composed of B's contract' means.",
      },
      {
        question: "A timeout on the feature call converts what into what?",
        options: [
          { label: "Latency into errors", value: "latency-errors" },
          { label: "Errors into latency", value: "errors-latency" },
          { label: "Nothing", value: "nothing" },
        ],
        correct: "latency-errors",
        explanation: "The worst feature requests become 504s instead of 600ms stalls. Same dependency, different contract with the world: bounded latency, countable errors.",
      },
      {
        question: "After the fix, where do A's remaining failures come from?",
        options: [
          { label: "B's slow tail crossing the budget", value: "tail" },
          { label: "A's own bugs", value: "a-bugs" },
          { label: "Network loss", value: "network" },
        ],
        correct: "tail",
        explanation: "Failures are the dependency's tail that the budget refuses to absorb. Countable, bounded, and honestly labeled as B's behavior.",
      },
    ],
    handlers: [
      {
        name: "inference",
        signature: "inference(request, ctx) → prediction",
        purpose: "The consumer A. It needs a feature vector to produce a prediction — the dependency is not optional.",
      },
      {
        name: "features",
        signature: "features(request, ctx) → feature vector",
        purpose: "The upstream B. Well-behaved on average, slow-tailed by the scenario; its contract is the learner's boundary.",
      },
    ],
    naiveCode: `
# Naive run — A without a budget. Every prediction waits the full feature
# latency, so A's p99 equals B's p99. Run it, then build the fixed run.
def features(request, ctx):
    return {"vector": [0.2, 0.8, 0.5], "version": "v3"}

def inference(request, ctx):
    vector = ctx.call("features", {"q": request["query"]}, api_version="v3")
    return {"prediction": "bug", "confidence": vector["vector"][0]}
`,
    starter: `
# The fixed run: a budget on the feature call. Slow feature responses become
# bounded 504s, and A keeps its own tail small.
def features(request, ctx):
    return {"vector": [0.2, 0.8, 0.5], "version": "v3"}

def inference(request, ctx):
    vector = ctx.call("features", {"q": request["query"]}, timeout_ms=150, api_version="v3")
    return {"prediction": "bug", "confidence": vector["vector"][0], "budgeted": True}
`,
    contractDrillCode: `
def features(request, ctx):
    return {"vector": [0.2, 0.8, 0.5], "version": "v3"}

def inference(request, ctx):
    # A asks for v2 while B exposes v3. The call should fail at the boundary,
    # before B's latency or handler becomes relevant.
    vector = ctx.call("features", {"q": request["query"]}, timeout_ms=150, api_version="v2")
    return {"prediction": "bug", "confidence": vector["vector"][0]}
`,
    systemGates: [
      {
        metric: "p95Ms",
        op: "<=",
        value: 200,
        name: "A stops inheriting B's tail",
        invariant: "A's p95 must be well below B's 600ms p99 — a budgeted call, not an unbroken chain.",
      },
      {
        metric: "errorRate",
        op: "<=",
        value: 0.3,
        name: "Bounded errors, not outage",
        invariant: "Bounding the tail converts B's slowest ~quarter of requests into 504s — count them, know them, keep them under a third.",
      },
      {
        metric: "p50Ms",
        op: "<=",
        value: 120,
        name: "Fast path stays fast",
        invariant: "Most feature calls complete in well under 150ms; the median must reflect the happy path, not the queue.",
      },
    ],
    artifact: {
      title: "S2 · The coupling ledger",
      fields: [
        { name: "b_tail", label: "B's p99 (from the spec)", required: true },
        { name: "a_before", label: "A's p99 before the budget", required: true },
        { name: "a_after", label: "A's p99 after the budget", required: true },
        { name: "tradeoff", label: "What A pays for the budget", required: true },
      ],
      reflectionQuestion: "A's contract is composed of B's contract. What did the budget change about that composition?",
    },
    relatedQuestionIds: ["API-001"],
    relatedLessonIds: ["ai-ml/04-inference-service/..."],
  }),
]

export const systemScenarios: SystemScenario[] = scenarios

export function toRuntimeSpec(scenario: SystemScenario) {
  return {
    id: scenario.id,
    seed: scenario.loadShape.seed,
    rootComponent: scenario.components.find(component => component.role === "root")!.id,
    components: scenario.components.map(component => ({
      id: component.id,
      handler: component.id,
      api: component.api,
      latency: component.latency,
      failureRate: component.failureRate,
      failureWindow: component.failureWindow,
    })),
    loadShape: scenario.loadShape,
  }
}
