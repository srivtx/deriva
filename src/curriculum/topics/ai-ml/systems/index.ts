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

  defineScenario({
    id: "s3-checkout-retry-storm",
    number: 3,
    title: "Checkout Retry Storm",
    thinkingMove: "bound retry amplification",
    pitch: "Payments starts failing for ten seconds. A retry feels helpful, but every attempt adds load to the same sick dependency. Bound the work before the outage spreads.",
    realSystem: "A checkout gateway calling a payment provider during a partial provider failure. The provider recovers, but unbounded retries turn a small incident into a request amplification storm.",
    loadShape: {
      seed: 19,
      baseRate: 240,
      simSeconds: 24,
      maxRequests: 400,
    },
    components: [
      {
        id: "checkout",
        role: "root",
        exposes: "checkout(request, ctx) → receipt",
        api: { version: "v1", requestFields: ["request_id", "query"], responseFields: ["receipt", "status"] },
        latency: { p50: 8, p99: 18 },
        failureRate: 0,
      },
      {
        id: "payments",
        role: "upstream",
        exposes: "payments(request, ctx) → authorization",
        api: { version: "v1", requestFields: ["order_id"], responseFields: ["authorization", "status"] },
        latency: { p50: 35, p99: 120 },
        failureRate: 0,
        failureWindow: { from: 8, until: 16, rate: 0.1 },
      },
    ],
    designGates: [
      {
        question: "When payments fails for one request, what does retrying change first?",
        options: [
          { label: "The dependency receives more work", value: "amplify" },
          { label: "The dependency becomes faster", value: "faster" },
          { label: "The failure disappears", value: "disappear" },
        ],
        correct: "amplify",
        explanation: "A retry does not repair payments. It creates another attempt against the same failing boundary, multiplying pressure while the provider is already sick.",
      },
      {
        question: "What makes a payment retry safe to repeat?",
        options: [
          { label: "An idempotent order identity", value: "idempotent" },
          { label: "A larger timeout", value: "timeout" },
          { label: "More workers", value: "workers" },
        ],
        correct: "idempotent",
        explanation: "A stable order identity lets the provider deduplicate the same effect. More time or more workers does not make a repeated charge safe.",
      },
      {
        question: "Which retry policy bounds amplification without abandoning one transient failure?",
        options: [
          { label: "Two attempts with bounded backoff", value: "bounded" },
          { label: "Retry until success", value: "forever" },
          { label: "Six immediate attempts", value: "burst" },
        ],
        correct: "bounded",
        explanation: "A small attempt budget preserves a chance of recovery while placing a hard ceiling on work generated by one incoming request.",
      },
      {
        question: "What should the system measure to prove a retry storm?",
        options: [
          { label: "Attempts per request and dependency calls", value: "amplification" },
          { label: "Only the median latency", value: "median" },
          { label: "Only successful receipts", value: "success" },
        ],
        correct: "amplification",
        explanation: "The defining symptom is work multiplication: one customer request becomes many payment attempts. Count the attempts and the dependency calls.",
      },
    ],
    handlers: [
      {
        name: "checkout",
        signature: "checkout(request, ctx) → dict",
        purpose: "The gateway owns the retry budget and must never duplicate a payment effect without an order identity.",
      },
      {
        name: "payments",
        signature: "payments(request, ctx) → dict",
        purpose: "The provider fails briefly on purpose. The learner must contain the dependency failure rather than speed it up.",
      },
    ],
    naiveCode: `
# Naive run — keep retrying until the payment provider gives an answer.
# During the failure window, one checkout creates a storm of attempts.
def payments(request, ctx):
    return {"authorization": "auth-" + request["order_id"], "status": "approved"}

def checkout(request, ctx):
    payment = ctx.call_with_retry("payments", {"order_id": request["request_id"]}, timeout_ms=120, max_attempts=6, backoff_ms=10, api_version="v1")
    return {"receipt": payment["authorization"], "status": payment["status"]}
`,
    starter: `
# Fixed run — two attempts, bounded backoff, and a stable order identity.
def payments(request, ctx):
    return {"authorization": "auth-" + request["order_id"], "status": "approved"}

def checkout(request, ctx):
    payment = ctx.call_with_retry("payments", {"order_id": request["request_id"]}, timeout_ms=120, max_attempts=2, backoff_ms=50, api_version="v1")
    return {"receipt": payment["authorization"], "status": payment["status"], "bounded": True}
`,
    contractDrillCode: `
def payments(request, ctx):
    return {"authorization": "auth-" + request["order_id"], "status": "approved"}

def checkout(request, ctx):
    # The provider speaks v1. This v2 call fails before payment work starts.
    payment = ctx.call_with_retry("payments", {"order_id": request["request_id"]}, timeout_ms=120, max_attempts=2, backoff_ms=50, api_version="v2")
    return {"receipt": payment["authorization"], "status": payment["status"]}
`,
    systemGates: [
      {
        metric: "maxAttemptsPerRequest",
        op: "<=",
        value: 2,
        name: "Work per order is bounded",
        invariant: "No customer order may create more than two payment attempts during the provider failure window.",
      },
      {
        metric: "errorRate",
        op: "<=",
        value: 0.2,
        name: "The gateway stays useful",
        invariant: "The partial provider failure may reject some orders, but it must not turn the whole checkout surface into an outage.",
      },
      {
        metric: "p95Ms",
        op: "<=",
        value: 300,
        name: "Backoff stays within the budget",
        invariant: "A bounded retry can wait briefly for recovery, but the p95 customer path must remain below the incident budget.",
      },
    ],
    artifact: {
      title: "S3 · The retry policy",
      fields: [
        { name: "amplification", label: "Attempts per order before and after", required: true },
        { name: "idempotency", label: "Why the payment retry is safe", required: true },
        { name: "tradeoff", label: "What bounded retries give up", required: true },
      ],
      reflectionQuestion: "Why did more attempts make the provider failure worse, and what does the attempt budget protect?",
    },
    relatedQuestionIds: ["QUEUE-002", "API-001"],
    relatedLessonIds: ["ai-ml/04-inference-service/..."],
  }),

  defineScenario({
    id: "s4-checkout-circuit-breaker",
    number: 4,
    title: "Checkout Circuit Breaker",
    thinkingMove: "stop spending work on failure",
    pitch: "The payment provider is still sick. A retry budget limits damage, but the gateway keeps paying the cost of discovering the same failure. Open the circuit and degrade deliberately.",
    realSystem: "The same checkout gateway after the retry-storm lesson. The provider has a prolonged failure window, so the consumer needs a stateful boundary that stops calling until recovery is plausible.",
    loadShape: {
      seed: 23,
      baseRate: 220,
      simSeconds: 26,
      maxRequests: 420,
    },
    components: [
      {
        id: "checkout",
        role: "root",
        exposes: "checkout(request, ctx) → receipt",
        api: { version: "v1", requestFields: ["request_id", "query"], responseFields: ["receipt", "status"] },
        latency: { p50: 8, p99: 18 },
        failureRate: 0,
      },
      {
        id: "payments",
        role: "upstream",
        exposes: "payments(request, ctx) → authorization",
        api: { version: "v1", requestFields: ["order_id"], responseFields: ["authorization", "status"] },
        latency: { p50: 35, p99: 120 },
        failureRate: 0,
        failureWindow: { from: 7, until: 20, rate: 0.25 },
      },
    ],
    designGates: [
      {
        question: "What does a circuit breaker add beyond a retry limit?",
        options: [
          { label: "Shared memory of dependency failure", value: "state" },
          { label: "Faster payment processing", value: "faster" },
          { label: "A guarantee the provider recovers", value: "recovery" },
        ],
        correct: "state",
        explanation: "A breaker remembers failures across requests. It can stop spending a fresh timeout on every customer request while the dependency is known to be unhealthy.",
      },
      {
        question: "What should checkout do while the circuit is open?",
        options: [
          { label: "Return an explicit degraded result", value: "degrade" },
          { label: "Hide the failure and claim payment succeeded", value: "lie" },
          { label: "Keep calling until one request works", value: "hammer" },
        ],
        correct: "degrade",
        explanation: "Degradation is an honest contract: the customer receives a known unavailable state instead of a long, repeated dependency wait or a false receipt.",
      },
      {
        question: "When should the breaker open?",
        options: [
          { label: "After a small consecutive failure threshold", value: "threshold" },
          { label: "After the first slow request forever", value: "first" },
          { label: "Only after every request fails", value: "all" },
        ],
        correct: "threshold",
        explanation: "A threshold filters isolated noise without waiting for the whole system to fail. The threshold is a policy tradeoff, not a magic constant.",
      },
      {
        question: "Which trace event proves the breaker changed future work?",
        options: [
          { label: "circuit.open followed by fewer provider calls", value: "open" },
          { label: "A successful receipt", value: "receipt" },
          { label: "The request payload", value: "payload" },
        ],
        correct: "open",
        explanation: "The breaker matters only if its state changes subsequent behavior. Select the open event and compare provider calls before and after it.",
      },
    ],
    handlers: [
      {
        name: "checkout",
        signature: "checkout(request, ctx) → dict",
        purpose: "The gateway owns the breaker state and returns a truthful degraded response when payment work is suspended.",
      },
      {
        name: "payments",
        signature: "payments(request, ctx) → dict",
        purpose: "The provider remains unhealthy long enough to make repeated discovery wasteful.",
      },
    ],
    naiveCode: `
# Naive run — every checkout calls the failing provider. There is no shared
# memory, so every request pays to rediscover the same outage.
def payments(request, ctx):
    return {"authorization": "auth-" + request["order_id"], "status": "approved"}

def checkout(request, ctx):
    payment = ctx.call("payments", {"order_id": request["request_id"]}, timeout_ms=120, api_version="v1")
    return {"receipt": payment["authorization"], "status": payment["status"]}
`,
    starter: `
# Fixed run — remember three consecutive failures, then fail fast honestly.
POLICY = {"circuit": {"threshold": 3}}

def payments(request, ctx):
    return {"authorization": "auth-" + request["order_id"], "status": "approved"}

def checkout(request, ctx):
    circuit = ctx.circuit("payments")
    if circuit.is_open():
        return {"receipt": "degraded", "status": "degraded"}
    try:
        payment = ctx.call("payments", {"order_id": request["request_id"]}, timeout_ms=120, api_version="v1")
        return {"receipt": payment["authorization"], "status": payment["status"]}
    except Exception:
        return {"receipt": "degraded", "status": "degraded"}
`,
    contractDrillCode: `
POLICY = {"circuit": {"threshold": 3}}

def payments(request, ctx):
    return {"authorization": "auth-" + request["order_id"], "status": "approved"}

def checkout(request, ctx):
    # The circuit is healthy, but the API version is not.
    payment = ctx.call("payments", {"order_id": request["request_id"]}, timeout_ms=120, api_version="v2")
    return {"receipt": payment["authorization"], "status": payment["status"]}
`,
    systemGates: [
      {
        metric: "circuitOpenCount",
        op: ">=",
        value: 1,
        name: "The breaker actually opens",
        invariant: "The fixed run must remember the dependency failure and enter an open state rather than merely catching one exception.",
      },
      {
        metric: "errorRate",
        op: "<=",
        value: 0.35,
        name: "The customer sees a bounded failure",
        invariant: "The provider may be unavailable, but the gateway must return quickly and keep the incident below a full checkout outage.",
      },
      {
        metric: "p95Ms",
        op: "<=",
        value: 250,
        name: "Open means fast failure",
        invariant: "After the threshold, requests should not continue paying the provider timeout; the p95 path must remain bounded.",
      },
    ],
    artifact: {
      title: "S4 · The breaker policy",
      fields: [
        { name: "threshold", label: "Failure threshold and why", required: true },
        { name: "degradation", label: "What the customer receives while open", required: true },
        { name: "evidence", label: "What proves future calls were suppressed", required: true },
      ],
      reflectionQuestion: "How did shared breaker state change the cost of discovering the same dependency failure?",
    },
    relatedQuestionIds: ["API-001", "QUEUE-004"],
    relatedLessonIds: ["ai-ml/04-inference-service/..."],
  }),

  defineScenario({
    id: "s5-gateway-admission-control",
    number: 5,
    title: "Gateway Admission Control",
    thinkingMove: "protect the dependency at the edge",
    pitch: "A traffic burst is not a reason to let every request enter the dependency. Decide what the system can afford, reject excess work early, and keep the accepted path useful.",
    realSystem: "The SignalDesk edge gateway sits before inference and features. During a burst, it must protect a slow feature API without pretending every request can be served immediately.",
    loadShape: {
      seed: 31,
      baseRate: 120,
      burst: { at: 8, until: 14, rate: 800 },
      simSeconds: 24,
      maxRequests: 420,
    },
    components: [
      {
        id: "gateway",
        role: "root",
        exposes: "gateway(request, ctx) → result",
        api: { version: "v1", requestFields: ["request_id", "query"], responseFields: ["result", "status"] },
        latency: { p50: 4, p99: 10 },
        failureRate: 0,
      },
      {
        id: "features",
        role: "upstream",
        exposes: "features(request, ctx) → vector",
        api: { version: "v3", requestFields: ["q"], responseFields: ["vector", "version"] },
        latency: { p50: 80, p99: 300 },
        failureRate: 0,
        failureWindow: { from: 8, until: 14, rate: 0.2 },
      },
    ],
    designGates: [
      {
        question: "Where should overload be rejected if the feature dependency is the scarce resource?",
        options: [
          { label: "At the gateway before the dependency call", value: "edge" },
          { label: "Inside the feature response parser", value: "parser" },
          { label: "After the request has timed out", value: "late" },
        ],
        correct: "edge",
        explanation: "Admission at the edge avoids spending serialization, queue, and dependency work on requests the system already knows it cannot afford.",
      },
      {
        question: "What does admission control deliberately trade away?",
        options: [
          { label: "Some requests are rejected quickly", value: "reject" },
          { label: "The dependency becomes faster", value: "faster" },
          { label: "The contract becomes optional", value: "contract" },
        ],
        correct: "reject",
        explanation: "Capacity protection is not free. The system refuses excess work so accepted requests do not all inherit the burst.",
      },
      {
        question: "Which limit should the gateway declare?",
        options: [
          { label: "A bounded requests-per-second budget", value: "rate" },
          { label: "Unlimited requests with a larger timeout", value: "unlimited" },
          { label: "One limit after the provider fails", value: "late" },
        ],
        correct: "rate",
        explanation: "The gateway needs an explicit capacity contract. A requests-per-second budget makes the protected resource visible and testable.",
      },
      {
        question: "Which evidence proves the edge protected the dependency?",
        options: [
          { label: "Admission rejects plus bounded feature calls", value: "evidence" },
          { label: "A high number of customer retries", value: "retries" },
          { label: "Only a healthy median", value: "median" },
        ],
        correct: "evidence",
        explanation: "The mechanism is visible when excess requests are rejected before the feature hop, while accepted requests stay within the latency budget.",
      },
    ],
    handlers: [
      {
        name: "gateway",
        signature: "gateway(request, ctx) → dict",
        purpose: "The edge owns the admission budget and decides which work is allowed to reach features.",
      },
      {
        name: "features",
        signature: "features(request, ctx) → dict",
        purpose: "The feature API is slow-tailed and partially failing during the burst; it is the resource the gateway protects.",
      },
    ],
    naiveCode: `
# Naive run — every request enters features, even when the burst exceeds
# the dependency's useful capacity.
def features(request, ctx):
    return {"vector": [0.2, 0.8], "version": "v3"}

def gateway(request, ctx):
    vector = ctx.call("features", {"q": request["query"]}, timeout_ms=180, api_version="v3")
    return {"result": vector["vector"][0], "status": "served"}
`,
    starter: `
# Fixed run — reject excess work at the edge before it reaches features.
def features(request, ctx):
    return {"vector": [0.2, 0.8], "version": "v3"}

def gateway(request, ctx):
    ctx.admit("edge", 180)
    vector = ctx.call("features", {"q": request["query"]}, timeout_ms=180, api_version="v3")
    return {"result": vector["vector"][0], "status": "served"}
`,
    contractDrillCode: `
def features(request, ctx):
    return {"vector": [0.2, 0.8], "version": "v3"}

def gateway(request, ctx):
    ctx.admit("edge", 180)
    # The provider speaks v3. The edge sends v2 and fails at the boundary.
    vector = ctx.call("features", {"q": request["query"]}, timeout_ms=180, api_version="v2")
    return {"result": vector["vector"][0], "status": "served"}
`,
    systemGates: [
      {
        metric: "admissionRejectCount",
        op: ">=",
        value: 1,
        name: "The edge protects capacity",
        invariant: "The burst must cause explicit admission rejects before every request is allowed to consume the feature dependency.",
      },
      {
        metric: "errorRate",
        op: "<=",
        value: 0.6,
        name: "The gateway remains useful",
        invariant: "Some burst requests may be rejected, but admission control must keep the surface below a full outage.",
      },
      {
        metric: "p95Ms",
        op: "<=",
        value: 300,
        name: "Accepted work stays bounded",
        invariant: "Requests admitted to the dependency must remain within the feature latency budget rather than waiting behind unlimited work.",
      },
    ],
    artifact: {
      title: "S5 · The capacity budget",
      fields: [
        { name: "limit", label: "The gateway requests-per-second limit", required: true },
        { name: "tradeoff", label: "What excess traffic gives up", required: true },
        { name: "evidence", label: "How the trace proves early rejection", required: true },
      ],
      reflectionQuestion: "Why is a fast rejection sometimes more useful than accepting work the dependency cannot finish?",
    },
    relatedQuestionIds: ["QUEUE-001", "QUEUE-004", "API-001"],
    relatedLessonIds: ["ai-ml/04-inference-service/..."],
  }),
]

export const systemScenarios: SystemScenario[] = scenarios

export function toRuntimeSpec(scenario: SystemScenario, interventions?: {
  trafficMultiplier: number
  failureRateOverrides: Record<string, number>
  latencyMultiplierOverrides: Record<string, number>
}) {
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
    interventions,
  }
}
