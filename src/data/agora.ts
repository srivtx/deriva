// Agora Curriculum: Linear progression ladder of 14 high-yield concepts,
// quant paradoxes, low-latency silicon mechanics, and distributed invariants.
// Used in elite oral technical rounds (Jane Street, Citadel, HRT, Figma, DeepMind).

export type AgoraTrackId = "quant" | "systems" | "distributed"

export interface AgoraOption {
  id: string
  label: string
  isTrap: boolean
  trapExplanation?: string
}

export interface ChalkboardSpec {
  type:
    | "cycles"
    | "bayes"
    | "martingale"
    | "box"
    | "cache"
    | "branch"
    | "ring"
    | "simd"
    | "tso"
    | "raft"
    | "crdt"
    | "vnodes"
    | "clocks"
  title: string
  caption: string
  highlightMetric: string
  metricLabel: string
}

export interface AgoraChallenge {
  id: string
  stageNumber: number
  levelNumber: 1 | 2 | 3
  levelName: string
  trackId: AgoraTrackId
  title: string
  company: string
  difficulty: "Hard" | "Elite"
  prompt: string
  conceptBridge: string // How this connects to the previous concept in the linear ladder
  audioScript: {
    setup: string
    question: string
    trap: string
    derivation: string
  }
  options: AgoraOption[]
  correctOptionId: string
  trapTitle: string
  trapBreakdown: string
  invariantTitle: string
  invariantDerivation: string
  chalkboard: ChalkboardSpec
  whiteboardNotes: {
    label: string
    value: string
  }[]
  interviewTakeaway: string
}

export interface AgoraTrack {
  id: AgoraTrackId
  title: string
  subtitle: string
  stagesLabel: string
  companies: string[]
  color: string
}

export const AGORA_TRACKS: AgoraTrack[] = [
  {
    id: "quant",
    title: "Quant Crucible",
    subtitle: "Probability paradoxes, martingales & adverse selection",
    stagesLabel: "Stages 1–5",
    companies: ["Jane Street", "Citadel", "HRT", "Two Sigma"],
    color: "var(--accent)",
  },
  {
    id: "systems",
    title: "Silicon & Low-Latency",
    subtitle: "Cache coherence, lock-free queues & branch prediction",
    stagesLabel: "Stages 6–10",
    companies: ["HRT", "Jump Trading", "Apple", "Cloudflare"],
    color: "var(--viz-active)",
  },
  {
    id: "distributed",
    title: "Distributed Invariants",
    subtitle: "CRDTs, Raft quorums, vector clocks & consistent hashing",
    stagesLabel: "Stages 11–14",
    companies: ["Figma", "Databricks", "CockroachDB", "DeepMind"],
    color: "var(--viz-pointer)",
  },
]

export const AGORA_CHALLENGES: AgoraChallenge[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL 1: QUANT FOUNDATIONS (STAGES 1–5)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "bertrands-box-gold",
    stageNumber: 1,
    levelNumber: 1,
    levelName: "Level 1: Information & Priors",
    trackId: "quant",
    title: "Bertrand's Box Paradox",
    company: "Jane Street",
    difficulty: "Hard",
    prompt: "Three identical boxes each contain two coins: Box 1 has two Gold coins, Box 2 has two Silver coins, Box 3 has one Gold and one Silver. You draw a random box and withdraw one coin blindly: it is Gold. What is the probability that the other coin in the same box is also Gold?",
    conceptBridge: "The starting point of all probability interviews: learning that conditioning on physical coins shifts probabilities away from naive 50/50 box symmetry.",
    audioScript: {
      setup: "Three identical boxes each contain two coins. Box one contains two gold coins. Box two contains two silver coins. Box three contains one gold and one silver coin. You choose a box at random and withdraw one coin without looking inside. It is gold. What is the probability that the remaining coin in that same box is also gold?",
      question: "Since the coin was gold, you know you did not pick the silver box. You are either holding the all-gold box, or the mixed box. Intuition screams fifty-fifty. Why is the true mathematical answer two-thirds?",
      trap: "The trap is treating the two surviving boxes as equally likely after seeing the gold coin. Candidates say: there are two boxes left, one has gold and one has silver, so it is one in two. They count boxes instead of counting the individual gold coin paths.",
      derivation: "There are three total gold coins in the universe: Gold One and Gold Two in the all-gold box, and Gold Three in the mixed box. Because each gold coin is equally likely to be drawn, your draw could be any of those three coins with probability one-third. If you drew Gold One, the other coin is Gold Two. If you drew Gold Two, the other coin is Gold One. Only if you drew Gold Three is the other coin Silver. Two out of the three possible gold coin states lead to another gold coin. The probability is two-thirds.",
    },
    options: [
      { id: "opt-half", label: "1/2 (50%) because only the All-Gold and Mixed boxes remain", isTrap: true, trapExplanation: "Counting boxes ignores that the All-Gold box is twice as likely to produce a gold coin." },
      { id: "opt-twothirds", label: "2/3 (66.7%) because 2 of the 3 total gold coins reside in the All-Gold box", isTrap: false },
      { id: "opt-threefourths", label: "3/4 (75%) because Box 2 is completely eliminated", isTrap: true, trapExplanation: "Over-adjusts the Bayes denominator." },
    ],
    correctOptionId: "opt-twothirds",
    trapTitle: "The Symmetrical Box Fallacy",
    trapBreakdown: "Candidates intuitively condition on the remaining boxes rather than conditioning on the individual coins. Box 1 has two opportunities to produce a gold coin, whereas Box 3 only has one. The evidence (drawing gold) is twice as likely under Box 1 than Box 3.",
    invariantTitle: "Bayes Rule & Coin-Path Partitioning",
    invariantDerivation: "P(Box 1 | Drawn Gold) = [P(Drawn Gold | Box 1) × P(Box 1)] / P(Drawn Gold). P(Drawn Gold | Box 1) = 1.0; P(Drawn Gold | Box 3) = 0.5; P(Drawn Gold) = (1/3)(1) + (1/3)(0) + (1/3)(1/2) = 1/2. Thus P(Box 1 | Gold) = (1/3 × 1) / (1/2) = 2/3.",
    chalkboard: {
      type: "box",
      title: "Coin Sample Space Partitioning",
      caption: "3 gold coins exist in the system. 2 of them belong to Box 1.",
      highlightMetric: "2/3 (66.7%)",
      metricLabel: "P(Gold in same box)",
    },
    whiteboardNotes: [
      { label: "Total Gold Coins", value: "3 (G1, G2 in Box 1; G3 in Box 3)" },
      { label: "Successful Paths", value: "Drawing G1 or G2 (2 out of 3)" },
      { label: "Bayes Formula", value: "(1/3 × 1) / (1/2) = 2/3" },
    ],
    interviewTakeaway: "In probability interviews, condition on individual micro-states (the coins), not the macro-containers (the boxes).",
  },
  {
    id: "adverse-selection-die",
    stageNumber: 2,
    levelNumber: 1,
    levelName: "Level 1: Information & Priors",
    trackId: "quant",
    title: "Adverse Selection & The Lemon Die",
    company: "Citadel",
    difficulty: "Elite",
    prompt: "A fair 10-sided die is rolled secretly. A trader offers to pay you $X if you guess whether the roll is odd or even. But the trader only makes the offer when the roll is a prime number. What is your expected value?",
    conceptBridge: "Now that we know evidence alters sample spaces (Stage 1), we see how a counterparty's decision to offer a trade leaks conditional information.",
    audioScript: {
      setup: "A fair ten-sided die is rolled secretly with faces one through ten. An experienced trader offers you a bet: you guess whether the secret roll is odd or even. If you are right, you win six dollars; if you are wrong, you lose five dollars. The payout looks like a positive expected value bet. But there is a catch: the trader only offers you this bet when the secret roll is a prime number.",
      question: "On a fair die, odd and even are equally likely with a fifty percent prior. Does this game offer a positive expected value, or does the trader's condition introduce adverse selection?",
      trap: "The trap is computing expected value using the unconditioned die faces. Candidates compute: zero point five times plus six, minus zero point five times minus five, which gives plus fifty cents per roll. They ignore that the offer itself is informative conditioning.",
      derivation: "The primes between one and ten are two, three, five, and seven. Exactly one of them is even (two), while three of them are odd (three, five, seven). If the trader offers the bet, the probability of the roll being odd is three out of four, or seventy-five percent. If you guess even, your EV is one fourth times six minus three fourths times five, which is negative two point two five dollars. If you guess odd, your EV is positive. The trader's selective offer leaks non-uniform information.",
    },
    options: [
      { id: "opt-positive", label: "+$0.50 EV based on equal 50/50 prior probabilities", isTrap: true, trapExplanation: "Fails to condition on the fact that an offer being made proves the roll is prime." },
      { id: "opt-conditional", label: "Condition on prime subset {2, 3, 5, 7}: Odd is 75%, Even is 25%", isTrap: false },
      { id: "opt-zero", label: "Zero EV because the trader knows the number and always hedges", isTrap: true, trapExplanation: "The trader's rule is fixed and deterministic, creating asymmetric informational leakage you can exploit." },
    ],
    correctOptionId: "opt-conditional",
    trapTitle: "Unconditional Expectation Bias",
    trapBreakdown: "In market making, receiving a trade request is never a neutral event. The existence of the trade itself conveys private signal. Calculating expected value over the prior distribution rather than the posterior conditional distribution is the classic 'Winner's Curse' / Adverse Selection failure.",
    invariantTitle: "Bayesian Updating Under Selective Offers",
    invariantDerivation: "Conditioning Event E = {Roll in Primes} = {2, 3, 5, 7}. P(Odd | E) = 3/4 = 0.75; P(Even | E) = 1/4 = 0.25. If betting Odd: EV = 0.75 × (+$6) + 0.25 × (-$5) = $4.50 - $1.25 = +$3.25. If betting Even: EV = 0.25 × (+$6) + 0.75 × (-$5) = $1.50 - $3.75 = -$2.25. The asymmetry of primes transforms a 50/50 prior into a 75/25 posterior.",
    chalkboard: {
      type: "bayes",
      title: "Posterior Probability Shift",
      caption: "Prior: 50% Odd / 50% Even → Posterior under Prime: 75% Odd / 25% Even",
      highlightMetric: "75%",
      metricLabel: "Conditional probability of Odd given Prime",
    },
    whiteboardNotes: [
      { label: "Prime Set", value: "{2, 3, 5, 7} (1 Even, 3 Odd)" },
      { label: "Posterior P(Odd)", value: "3/4 = 75%" },
      { label: "Correct Move", value: "Always bet Odd when offered (+ $3.25 EV)" },
    ],
    interviewTakeaway: "In quant finance, the offer to trade is itself market data. Never calculate risk on naive priors when the counterparty's action is conditional.",
  },
  {
    id: "penneys-game-coin",
    stageNumber: 3,
    levelNumber: 1,
    levelName: "Level 1: Information & Priors",
    trackId: "quant",
    title: "Penney's Game (Non-Transitive Sequences)",
    company: "Hudson River Trading",
    difficulty: "Elite",
    prompt: "You flip a fair coin repeatedly. Player A chooses the sequence H-T-H. Player B chooses H-H-T. The first sequence to appear wins. Why does Player B win with a 2-to-1 advantage (66.7%)?",
    conceptBridge: "Conditional probability in static bets (Stage 2) expands into stochastic sequences: how overlapping patterns create non-transitive preemption traps.",
    audioScript: {
      setup: "A fair coin is flipped repeatedly to generate an infinite sequence of Heads and Tails. Player A picks a three-flip pattern: Heads, Tails, Heads. Player B picks Heads, Heads, Tails. The first player whose pattern appears as a consecutive substring wins the entire pot. Because both patterns contain two Heads and one Tails, intuition suggests this should be a fifty-fifty coin race.",
      question: "Why is Penney's coin game non-transitive, and why does Heads-Heads-Tails beat Heads-Tails-Heads twice as often, winning sixty-six point seven percent of all matches?",
      trap: "The trap is confusing the expected waiting time to see a pattern with the head-to-head race between two patterns. Even though HTH has an expected waiting time of ten flips and HHT has an expected waiting time of eight flips, waiting times do not determine pairwise victory probabilities.",
      derivation: "Look at what happens if Player A's pattern HTH appears. For HTH to appear without HHT having already appeared, the two flips immediately preceding the final H must be H and T. But if the sequence ever reached H-H before reaching HTH, Player B is already one flip away from HHT. If the next flip is T, B wins immediately. If the next flip is H, B still holds H-H and waits for T. Once H-H occurs, A can NEVER win. Conway's algorithm computes the exact correlation numbers: Player B wins with probability two-thirds.",
    },
    options: [
      { id: "opt-equal", label: "50% because both patterns have 2 Heads and 1 Tails", isTrap: true, trapExplanation: "Ignores the overlap prefix correlation between consecutive sequences." },
      { id: "opt-hht-wins", label: "Player B wins 2/3 (66.7%) because HH blocks HTH from occurring", isTrap: false },
      { id: "opt-waiting", label: "Player B wins because HHT has an average wait of 8 flips vs 10 for HTH", isTrap: true, trapExplanation: "Expected waiting times do not equal pairwise head-to-head race probabilities." },
    ],
    correctOptionId: "opt-hht-wins",
    trapTitle: "The Transitivity Trap",
    trapBreakdown: "Humans assume that if pattern X has probability P, competitive races between patterns are transitive like real numbers. Penney's game is non-transitive: like Rock-Paper-Scissors, for ANY 3-flip sequence Player A picks, Player B can choose a counter-sequence that beats it with probability between 2:1 and 7:1.",
    invariantTitle: "Conway's Sequence Prefix Overlap",
    invariantDerivation: "Conway's algorithm formula computes the leading overlap string between sequences A and B. If A picks (x1, x2, x3), B should pick (not x2, x1, x2). Here A = HTH, so B picks not(T), H, T = HHT. Once the coin lands on HH, sequence HTH is mathematically impossible to reach without B winning first on the next T.",
    chalkboard: {
      type: "martingale",
      title: "State Machine for HHT vs HTH",
      caption: "Once state HH is reached, Player B wins with probability 1",
      highlightMetric: "66.7%",
      metricLabel: "Player B win rate (2-to-1 advantage)",
    },
    whiteboardNotes: [
      { label: "A's Choice", value: "H-T-H (E[wait] = 10)" },
      { label: "B's Counter", value: "H-H-T (E[wait] = 8)" },
      { label: "Conway's Rule", value: "To beat (x1, x2, x3), pick (~x2, x1, x2)" },
    ],
    interviewTakeaway: "Stochastic arrival races are non-transitive. In market games, position overlap and preemption dominate raw unconditioned expectations.",
  },
  {
    id: "100-prisoners-cycle",
    stageNumber: 4,
    levelNumber: 1,
    levelName: "Level 1: Information & Priors",
    trackId: "quant",
    title: "100 Prisoners & The Permutation Cycle",
    company: "Jane Street",
    difficulty: "Elite",
    prompt: "100 numbered prisoners must each find their own number in 100 closed boxes. Each prisoner can open 50 boxes in isolation. If even one prisoner fails, all die. What strategy raises their survival from near-zero to over 30%?",
    conceptBridge: "In Stage 3, sequence preemption relied on state alignment. Here, 100 individuals couple their fate to a single algebraic invariant: permutation cycle length.",
    audioScript: {
      setup: "One hundred prisoners are numbered one to one hundred. In a closed room stand one hundred boxes, each holding a random number from one to one hundred. Each prisoner enters alone and opens at most fifty boxes, trying to find their own number. They cannot communicate after entering. If every single prisoner finds their number, all go free. If even one fails, all are executed.",
      question: "If each prisoner opens fifty random boxes, their chance of collective survival is one in two to the power of one hundred — virtually zero. How can they follow pointer chains to boost their collective survival above thirty-one percent?",
      trap: "The naive trap is treating the prisoners as independent trials. In probability, when independent probabilities multiply, survival collapses exponentially: one half raised to the one hundredth is eight times ten to the minus thirty-one. The secret is breaking independence completely.",
      derivation: "The optimal strategy is deterministic cycle following: each prisoner first opens the box with their own number, reads the slip inside, and uses that number as the next box to open. The slips form disjoint permutation cycles. All prisoners succeed if and only if every cycle has length fifty or less. The probability of a random permutation having no cycle longer than fifty equals one minus the harmonic sum, which approaches one minus natural log of two: approximately thirty-one point two percent.",
    },
    options: [
      { id: "opt-random", label: "Open 50 random boxes with uniform probability", isTrap: true, trapExplanation: "Independent 1/2 chances multiply: (1/2)^100 ≈ 8 × 10^-31. Guaranteed execution." },
      { id: "opt-cycle", label: "Open your number's box, then follow pointer slips in a cycle", isTrap: false },
      { id: "opt-parity", label: "Odd prisoners open boxes 1–50, even prisoners open 51–100", isTrap: true, trapExplanation: "If any prisoner's number is placed in the other half, they fail immediately with 0% total survival." },
    ],
    correctOptionId: "opt-cycle",
    trapTitle: "The Independence Fallacy",
    trapBreakdown: "Candidates intuitively evaluate each prisoner's 50% chance as an isolated event. Multiplying 100 independent 1/2 probabilities yields 1/2^100 ≈ 7.89 × 10^-31. To survive, the prisoners must couple their fates so they either all succeed together or all fail together on the same underlying permutation structure.",
    invariantTitle: "Permutation Cycle Decomposition",
    invariantDerivation: "Any permutation of N elements decomposes into disjoint disjoint cycles. A prisoner starting at box K and following slips is guaranteed to navigate the cycle containing K. If that cycle length is ≤ 50, every prisoner in that cycle succeeds. The probability of having a cycle of length L > 50 in S_100 is 1/L. Since at most one such cycle can exist: P(Survival) = 1 - sum_{L=51}^{100} (1/L) = 1 - (H_100 - H_50) ≈ 1 - ln(2) ≈ 31.18%.",
    chalkboard: {
      type: "cycles",
      title: "Permutation Cycle Decomposition",
      caption: "All 100 prisoners succeed if max cycle length ≤ 50",
      highlightMetric: "31.18%",
      metricLabel: "Survival probability (1 - ln 2)",
    },
    whiteboardNotes: [
      { label: "Naive Odds", value: "(1/2)^100 ≈ 7.89 × 10^-31" },
      { label: "Optimal Odds", value: "1 - ln(2) ≈ 31.18%" },
      { label: "Core Invariant", value: "Coupled fates via permutation cycle length ≤ N/2" },
    ],
    interviewTakeaway: "In quant interviews, whenever collective survival requires all N agents to succeed, never allow independent trials. Couple their outcomes to a single shared invariant.",
  },
  {
    id: "martingale-stopping-time",
    stageNumber: 5,
    levelNumber: 1,
    levelName: "Level 1: Information & Priors",
    trackId: "quant",
    title: "The Martingale & Stopping Time Trap",
    company: "Two Sigma",
    difficulty: "Elite",
    prompt: "A gambler doubles their bet after every loss on a fair coin toss (1, 2, 4, 8...). They quit the moment they win $1. Why does Doob's Optional Stopping Theorem prove this strategy cannot produce positive expected value under finite wealth?",
    conceptBridge: "Cycle limits in Stage 4 lead directly to stopping times: why infinite-horizon guarantees collapse under physical finite boundaries.",
    audioScript: {
      setup: "The Martingale betting strategy is the oldest illusion in gambling. You bet one dollar on a fair coin. If you lose, you bet two dollars. If you lose again, you bet four, then eight, then sixteen. Because a win is mathematically guaranteed eventually, you are guaranteed to walk away with exactly one dollar of profit.",
      question: "Since the probability of eventually seeing a win approaches one, why does Doob's Optional Stopping Theorem prove that no stopping rule can turn a fair game into positive expected value?",
      trap: "The trap is computing the probability of winning (which approaches 1) and ignoring the tail expectation of loss (which approaches negative infinity). Candidates see a 99.9% win rate and call it an arbitrage.",
      derivation: "Doob's Optional Stopping Theorem states that for a martingale X_t and a stopping time T, E[X_T] = E[X_0] IF AND ONLY IF the process is uniformly integrable or the bankroll is bounded. In reality, bankrolls are finite B. If you hit a streak of K losses such that 2^K exceeds your bankroll B, you suffer a catastrophic total loss of B. The probability of this catastrophic loss is 1/2^K = 1/B, and the loss magnitude is B. The expected value is (1 - 1/B)(+1) + (1/B)(-B) = 1 - 1/B - 1 = -1/B, which is strictly negative after house edge.",
    },
    options: [
      { id: "opt-arbitrage", label: "It is an arbitrage: P(Win) = 1 so E[Profit] = +$1", isTrap: true, trapExplanation: "Ignores the infinite negative tail of losses when wealth is bounded." },
      { id: "opt-doob", label: "E[X_T] = E[X_0] = 0 under finite bankroll; tail risk exactly cancels frequent small gains", isTrap: false },
      { id: "opt-memory", label: "The coin has memory and adjusts probabilities after streaks", isTrap: true, trapExplanation: "The Gambler's Fallacy: coin flips remain independently distributed." },
    ],
    correctOptionId: "opt-doob",
    trapTitle: "The Tail Expectation Blindspot",
    trapBreakdown: "High win-rate strategies frequently hide catastrophic left-tail risk. A 99.9% chance of making $1 paired with a 0.1% chance of losing $1,000 yields exactly $0 expected value in a fair game.",
    invariantTitle: "Doob's Optional Stopping Theorem",
    invariantDerivation: "Let X_n be a zero-mean martingale. For any stopping time T with finite bankroll constraint M (where |X_{n ∧ T}| ≤ M for all n), E[X_T] = E[X_0] = 0. No dynamic position sizing or stopping rule can transform a fair game into positive expected return.",
    chalkboard: {
      type: "martingale",
      title: "Martingale Tail Risk Distribution",
      caption: "Frequent +$1 wins vs catastrophic -$B bankroll wipeout",
      highlightMetric: "E[X_T] = 0",
      metricLabel: "Optional stopping theorem invariant",
    },
    whiteboardNotes: [
      { label: "Win Probability", value: "1 - (1/2)^K (approaches 1)" },
      { label: "Catastrophic Loss", value: "-2^K with probability (1/2)^K" },
      { label: "Expected Value", value: "E[Gain] = 1 × (1 - p) + (-B) × p = $0.00" },
    ],
    interviewTakeaway: "In quantitative risk, never evaluate a strategy by its win rate. The product of low probability and extreme tail loss always balances the equation.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL 2: SILICON & LOW-LATENCY SYSTEMS (STAGES 6–10)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "aos-vs-soa-simd",
    stageNumber: 6,
    levelNumber: 2,
    levelName: "Level 2: Silicon & Low-Latency",
    trackId: "systems",
    title: "AoS vs SoA Memory Layout (SIMD)",
    company: "Hudson River Trading",
    difficulty: "Hard",
    prompt: "An order book engine stores 1,000,000 orders. Each order has `price`, `qty`, `trader_id`, `timestamp`. Why does transforming an Array of Structs (AoS) into a Structure of Arrays (SoA) make price aggregation 4x faster on CPU?",
    conceptBridge: "Transitioning from mathematical abstraction to physical silicon: how CPU memory buses and SIMD registers mandate memory layout.",
    audioScript: {
      setup: "In financial exchanges, matching engines must scan millions of orders to compute volume-weighted price levels. The natural object-oriented way to represent orders is an Array of Structures: a single array where each element contains a price, a quantity, a trader ID, and a timestamp.",
      question: "Why does converting this clean object model into a Structure of Arrays — four separate parallel arrays — make numerical aggregation four times faster on modern CPUs?",
      trap: "The trap is thinking the total amount of memory allocated has changed. Both layouts store the exact same numbers of integers and floats in DRAM.",
      derivation: "The bottleneck is memory bandwidth and CPU vector registers. In an Array of Structures, computing the sum of prices requires reading one price, skipping twenty-four bytes of unused fields, and reading the next price. Your L1 cache fills with seventy-five percent useless data that is evicted before ever being touched. In a Structure of Arrays, prices are contiguous in memory. A single sixty-four-byte cache line loads eight consecutive prices with zero waste, and CPU SIMD instructions like AVX-512 can sum eight prices per clock cycle in a single instruction.",
    },
    options: [
      { id: "opt-ram", label: "SoA uses 50% less physical RAM than AoS", isTrap: true, trapExplanation: "The total byte size of the fields is identical in both layouts." },
      { id: "opt-simd", label: "Contiguous field storage saturates 64-byte cache lines and enables SIMD vectorization", isTrap: false },
      { id: "opt-compiler", label: "The C++ compiler optimizes SoA because it eliminates pointer indirection", isTrap: true, trapExplanation: "AoS arrays have zero pointer indirection; the issue is strided memory access." },
    ],
    correctOptionId: "opt-simd",
    trapTitle: "The Object-Oriented Memory Trap",
    trapBreakdown: "Object-oriented programming groups data by logical entity (Order). Hardware groups data by temporal operation (Aggregation). Interleaving fields creates strided access patterns that waste 75%+ of memory bus bandwidth.",
    invariantTitle: "Spatial Locality & SIMD Lane Saturation",
    invariantDerivation: "Cache lines are 64 bytes. If struct Order is 32 bytes (8B price, 8B qty, 8B id, 8B time), each cache line holds only 2 prices (16 useful bytes / 64 bytes = 25% cache efficiency). In SoA, price[] is a contiguous array: each 64B cache line holds 8 doubles (100% cache efficiency). AVX2 / AVX-512 registers load 256/512 contiguous bits in 1 clock cycle.",
    chalkboard: {
      type: "simd",
      title: "AoS vs SoA Cache Utilization",
      caption: "AoS: 25% useful bytes per line vs SoA: 100% saturation",
      highlightMetric: "4x Speedup",
      metricLabel: "Cache line bandwidth saturation",
    },
    whiteboardNotes: [
      { label: "AoS Layout", value: "[P, Q, ID, T][P, Q, ID, T] (25% bus utilization)" },
      { label: "SoA Layout", value: "P[0..N], Q[0..N] (100% bus utilization)" },
      { label: "Hardware Hook", value: "AVX-512 vector load (8 doubles / cycle)" },
    ],
    interviewTakeaway: "In high-throughput systems, design data around access patterns, not domain nouns. Store fields that are processed together contiguously.",
  },
  {
    id: "branch-predictor-cliff",
    stageNumber: 7,
    levelNumber: 2,
    levelName: "Level 2: Silicon & Low-Latency",
    trackId: "systems",
    title: "The Branch Predictor Cliff",
    company: "Jump Trading",
    difficulty: "Elite",
    prompt: "You iterate through an array of 100,000 random integers from 0 to 255. If `x >= 128`, you add it to a sum. If you sort the array before summing, the loop runs 3x faster — even though both loops do the exact same arithmetic. Why?",
    conceptBridge: "In Stage 6, we fixed data spatial layout. Now we look at instruction execution pipelines: how conditional jumps destroy instruction throughput.",
    audioScript: {
      setup: "Consider a classic performance paradox observed in production trading engines. You have an array of one hundred thousand random numbers between zero and two hundred fifty-five. You iterate through the array and accumulate only the numbers greater than or equal to one hundred twenty-eight. If you sort the array first, the loop executes three times faster than on the unsorted array. Both loops perform the exact same additions and inspect the exact same numbers.",
      question: "Why does the spatial ordering of values cause a three-hundred-percent speed difference on modern processors?",
      trap: "The trap is thinking the speedup comes from memory locality or cache prefetching. Because you are sequentially scanning the array either way, cache lines stream into L1 at the exact same hardware throughput.",
      derivation: "The bottleneck is the CPU's branch prediction pipeline. Modern CPUs execute instructions speculatively across deep fifteen-to-twenty stage pipelines. When the array is unsorted, the condition is random noise: the branch predictor guesses wrong fifty percent of the time. Each branch misprediction forces the CPU to flush its entire speculative pipeline, discarding fifteen to twenty cycles of work. When the array is sorted, the condition is false for all early elements, then permanently true for all later elements. The branch predictor achieves ninety-nine percent accuracy, pipeline flushes drop to zero, and the CPU sustains multiple instructions per cycle.",
    },
    options: [
      { id: "opt-prefetch", label: "L1 hardware prefetcher detects the sorted order and loads RAM faster", isTrap: true, trapExplanation: "Sequential array traversal triggers the stream prefetcher regardless of value sorting." },
      { id: "opt-branch", label: "Sorted data yields ~99% branch prediction vs ~50% random pipeline flush stalls", isTrap: false },
      { id: "opt-simd", label: "The C++ compiler automatically vectorizes only when data is monotonically increasing", isTrap: true, trapExplanation: "Compilers can vectorize conditionals with blends or bitmasks regardless of value ordering." },
    ],
    correctOptionId: "opt-branch",
    trapTitle: "The Prefetch Misconception",
    trapBreakdown: "Engineers often attribute array performance to cache hits. But sequential array traversal is effortlessly predicted by hardware stream prefetchers. The true killer is speculative execution rollback in deep out-of-order execution pipelines.",
    invariantTitle: "Speculative Execution Pipeline Flushes",
    invariantDerivation: "A branch misprediction penalty on modern x86 (Golden Cove / Zen 4) is 15–20 clock cycles. With random data, P(Mispredict) ≈ 50%, adding ~10 dead cycles per element. With sorted data, the branch predictor shifts state once (from strongly not-taken to strongly taken), causing only 1 misprediction across 100,000 items. Alternative low-latency fix: eliminate the branch entirely using conditional moves: `sum += (x >= 128) * x` or `cmov`.",
    chalkboard: {
      type: "branch",
      title: "Speculative Instruction Pipeline",
      caption: "Mispredict cost: 15–20 cycles flushed on random data",
      highlightMetric: "15–20 Cycles",
      metricLabel: "Cost per branch misprediction flush",
    },
    whiteboardNotes: [
      { label: "Random Array", value: "~50% branch misprediction rate" },
      { label: "Sorted Array", value: "> 99% branch accuracy (1 flush)" },
      { label: "Branchless Fix", value: "cmov / bitmask: sum += (-int(x >= 128)) & x" },
    ],
    interviewTakeaway: "Unpredictable branches destroy deep CPU pipelines. If data cannot be sorted, replace conditional jumps with branchless bitwise arithmetic or conditional moves.",
  },
  {
    id: "false-sharing-cache",
    stageNumber: 8,
    levelNumber: 2,
    levelName: "Level 2: Silicon & Low-Latency",
    trackId: "systems",
    title: "The False Sharing Disaster",
    company: "Hudson River Trading",
    difficulty: "Elite",
    prompt: "Two threads concurrently increment two adjacent 64-bit integers in an array: `arr[0]` and `arr[1]`. Why does multi-threading make execution 10x SLOWER than a single thread, and how do you eliminate the penalty?",
    conceptBridge: "In Stage 6 and 7, we saw single-core cache and pipeline bottlenecks. Now we add multi-threading: how the hardware coherence protocol synchronizes 64-byte lines across cores.",
    audioScript: {
      setup: "Imagine writing an ultra-low-latency order router in C++ or Rust. You create an array of sixty-four-bit integers to count messages per core. Thread zero runs on Core Zero and increments index zero in a tight loop. Thread one runs on Core One and increments index one in a tight loop. The two threads never touch the same variable; their memory addresses are completely distinct. Yet running both cores together makes the code ten times slower than running a single core alone.",
      question: "Why do independent memory writes to adjacent variables trigger catastrophic slowdown on modern multicore CPUs?",
      trap: "The trap is thinking the CPU operates on individual bytes or eight-byte words. Hardware does not move individual integers across the memory bus. Hardware moves sixty-four-byte cache lines.",
      derivation: "Under the MESI cache coherence protocol, when Core Zero modifies index zero, its L1 cache marks the entire sixty-four-byte cache line as Modified. Because index zero and index one share the same cache line, Core One's L1 cache line is forcibly invalidated over the interconnect bus. When Core One attempts to write index one, it experiences an L1 cache miss, forces Core Zero to flush its cache line to L3, and stalls. The two cores bounce the cache line back and forth in an invalidation storm. The fix is padding the struct to sixty-four bytes so each counter occupies its own cache line.",
    },
    options: [
      { id: "opt-mutex", label: "CPU memory bus locks the array with an internal mutex", isTrap: true, trapExplanation: "CPUs don't acquire software mutexes; the issue is cache coherence protocol ping-pong." },
      { id: "opt-cacheline", label: "Both variables share one 64-byte cache line; MESI invalidation bounces it between cores", isTrap: false },
      { id: "opt-dram", label: "DRAM cannot serve two reads on the same clock cycle", isTrap: true, trapExplanation: "L1 cache never hits DRAM unless a full writeback occurs; this is entirely an L1/L2 coherence bottleneck." },
    ],
    correctOptionId: "opt-cacheline",
    trapTitle: "The Word-Level Memory Illusion",
    trapBreakdown: "Software developers reason about memory addresses as distinct independent cells. Hardware reality is that the unit of coherence is a 64-byte line. Concurrent writes to distinct variables within the same 64-byte block serialize execution through cache coherence bus traffic.",
    invariantTitle: "MESI Cache Coherence Invalidation",
    invariantDerivation: "On x86 and ARM, L1 caches maintain coherence via MESI (Modified, Exclusive, Shared, Invalid). When Core 0 writes arr[0], line enters Modified state in Core 0's L1, broadcasting Invalidate to Core 1. When Core 1 writes arr[1], it misses, sends Read-For-Ownership (RFO), forcing Core 0 to stall and invalidate. Result: millions of RFO cycles per second. Solution: `alignas(64) uint64_t counter;`",
    chalkboard: {
      type: "cache",
      title: "64-Byte Cache Line Bouncing",
      caption: "arr[0] and arr[1] reside in the same 64-byte L1 line",
      highlightMetric: "64 Bytes",
      metricLabel: "Hardware cache line boundary",
    },
    whiteboardNotes: [
      { label: "Cache Line", value: "64 bytes (8 × 64-bit ints)" },
      { label: "Root Cause", value: "RFO (Read-For-Ownership) bus storm" },
      { label: "Hardware Fix", value: "alignas(64) or 56-byte dummy padding" },
    ],
    interviewTakeaway: "In high-throughput systems, data layout is performance. Distinct variables that are written concurrently by separate cores must never share a 64-byte cache line.",
  },
  {
    id: "spsc-ring-buffer",
    stageNumber: 9,
    levelNumber: 2,
    levelName: "Level 2: Silicon & Low-Latency",
    trackId: "systems",
    title: "Lock-Free SPSC Ring Buffer",
    company: "Citadel Securities",
    difficulty: "Elite",
    prompt: "In a Single-Producer Single-Consumer queue, how do you achieve microsecond message passing with zero mutexes, zero atomic compare-and-swap (CAS) instructions, and zero thread stalls?",
    conceptBridge: "Armed with cache-line padding from Stage 8, we build the workhorse of low-latency trading: decoupling head and tail onto separate lines with memory barriers.",
    audioScript: {
      setup: "In financial exchanges, matching engines must ingest millions of market orders per second without waiting on operating system kernel locks. An architectural pattern used across proprietary trading is the Single-Producer Single-Consumer lock-free ring buffer. One thread writes orders; another thread reads orders.",
      question: "How can this queue operate at maximum wire speed without a single mutex, and without even using expensive atomic compare-and-swap instructions?",
      trap: "The trap is assuming all concurrent data structures require atomic compare-and-swap loops or mutexes. Compare-and-swap is only required when multiple writers compete for the exact same variable.",
      derivation: "When there is exactly one writer and exactly one reader, ownership of pointers is decoupled. The producer uniquely owns and writes the tail pointer, only reading head to check if the buffer is full. The consumer uniquely owns and writes the head pointer, only reading tail to check if the buffer is empty. By enforcing Acquire-Release memory order semantics, writes to the message payload are guaranteed to be visible before the tail pointer update is observed. Furthermore, by placing head and tail on separate sixty-four-byte cache lines, false sharing is eliminated, and the queue streams at pure L1 memory speed.",
    },
    options: [
      { id: "opt-cas", label: "Use an atomic compare_exchange weak loop on the head and tail", isTrap: true, trapExplanation: "CAS instructions lock the cache line across the coherence bus; single-producer needs only relaxed/release stores." },
      { id: "opt-spsc", label: "Decouple head/tail ownership: Producer writes tail, Consumer writes head, with acquire/release barriers", isTrap: false },
      { id: "opt-futex", label: "Use a kernel futex wait condition when the buffer is empty", isTrap: true, trapExplanation: "Kernel transitions take 1,000–3,000 nanoseconds — unacceptable in sub-microsecond low-latency trading." },
    ],
    correctOptionId: "opt-spsc",
    trapTitle: "The CAS Over-Engineering Trap",
    trapBreakdown: "Engineers familiar with multi-producer queues reflexively reach for `atomic_compare_exchange`. But CAS instructions lock the cache line and invoke hardware bus arbitration. In SPSC, contention is zero because each thread writes to its own dedicated pointer.",
    invariantTitle: "Acquire-Release Memory Ordering Decoupling",
    invariantDerivation: "Producer writes payload, then stores tail with `memory_order_release`. Consumer reads tail with `memory_order_acquire`. The release-acquire pair establishes a happens-before relationship: payload is guaranteed visible before tail advances. Head and tail must be separated by 64 bytes of cache line padding to prevent MESI bouncing.",
    chalkboard: {
      type: "ring",
      title: "Decoupled Head & Tail Ring Buffer",
      caption: "Producer owns tail; Consumer owns head; Zero CAS needed",
      highlightMetric: "0 Mutexes",
      metricLabel: "Wait-free thread synchronization",
    },
    whiteboardNotes: [
      { label: "Producer", value: "Writes data, stores tail (Release)" },
      { label: "Consumer", value: "Loads tail (Acquire), reads data, stores head" },
      { label: "Hardware Rule", value: "Cache-pad head and tail to distinct 64B lines" },
    ],
    interviewTakeaway: "Constrain the problem to Single-Producer Single-Consumer whenever possible. Single ownership turns expensive atomic synchronization into simple memory barriers.",
  },
  {
    id: "memory-fence-tso",
    stageNumber: 10,
    levelNumber: 2,
    levelName: "Level 2: Silicon & Low-Latency",
    trackId: "systems",
    title: "Store Buffers & Total Store Order (TSO)",
    company: "Apple CoreOS",
    difficulty: "Elite",
    prompt: "Thread 1 executes: `flag1 = 1; r1 = flag2;`. Thread 2 executes: `flag2 = 1; r2 = flag1;`. All variables start at 0. Why is it possible on physical x86/ARM hardware for BOTH `r1 == 0` and `r2 == 0`?",
    conceptBridge: "The culmination of Level 2: CPU store buffers can reorder memory writes after reads, proving that sequential consistency is a software illusion without hardware fences.",
    audioScript: {
      setup: "Consider Peterson's or Dekker's mutual exclusion algorithm taught in operating systems textbooks. Thread one sets flag one to one, then reads flag two into register one. Thread two sets flag two to one, then reads flag one into register two. If sequential consistency held, at least one thread must see the other thread's flag set. It seems mathematically impossible for both register one and register two to end up zero.",
      question: "Why do modern x86 and ARM processors regularly observe both registers equal to zero in real hardware executions?",
      trap: "The trap is assuming the CPU executes instructions in the exact order written in source code. Modern out-of-order CPUs decouple execution from memory retirement using hardware store buffers.",
      derivation: "To hide the high latency of L1 cache writes, CPUs place stores into a FIFO store buffer and immediately proceed with subsequent read instructions. Core One executes flag one equals one, placing the write in its private store buffer. Before that write drains to L1 cache, Core One speculatively executes the read of flag two from L1 cache, seeing zero. Simultaneously, Core Two places flag two equals one into its store buffer and reads flag one as zero. Both cores read zero before their store buffers flush to shared memory. To prevent this reordering, you must issue a hardware memory fence instruction like mfence on x86 or DMB on ARM.",
    },
    options: [
      { id: "opt-compiler", label: "The C compiler reordered the instructions during -O3 optimization", isTrap: true, trapExplanation: "Even with volatile or asm barriers preventing compiler reordering, physical hardware causes this." },
      { id: "opt-storebuf", label: "Hardware store buffers allow reads to bypass pending writes, requiring an mfence instruction", isTrap: false },
      { id: "opt-quantum", label: "Quantum tunneling in sub-3nm transistors corrupts the read bits", isTrap: true, trapExplanation: "This is a deterministic architectural design feature of modern CPU memory models (TSO)." },
    ],
    correctOptionId: "opt-storebuf",
    trapTitle: "The Sequential Consistency Illusion",
    trapBreakdown: "Software developers assume computer memory behaves like a single global notebook where writes appear instantaneously. Modern CPUs use store buffers and write invalidation queues that reorder Store-Load pairs.",
    invariantTitle: "Store-Load Reordering & Hardware Fences",
    invariantDerivation: "x86 Total Store Order (TSO) guarantees: (1) Stores are not reordered with older stores; (2) Loads are not reordered with older loads. HOWEVER, a Load CAN be reordered with an older Store to a different address (Store-Load reordering). To guarantee global visibility, an `mfence` or atomic instruction (`lock xchg`) must drain the store buffer before the read.",
    chalkboard: {
      type: "tso",
      title: "CPU Store Buffer Reordering",
      caption: "Reads bypass pending store buffers before cache retirement",
      highlightMetric: "Store-Load",
      metricLabel: "Allowed reordering on x86 TSO",
    },
    whiteboardNotes: [
      { label: "Hardware Component", value: "CPU Store Buffer (FIFO queue)" },
      { label: "x86 Rule", value: "Stores drain after later reads bypass them" },
      { label: "Hardware Fix", value: "std::atomic_thread_fence(memory_order_seq_cst)" },
    ],
    interviewTakeaway: "Sequential consistency does not exist in multi-core hardware. Lock-free algorithms must account for Store-Load reordering with explicit memory barriers.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL 3: DISTRIBUTED INVARIANTS (STAGES 11–14)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "vector-clocks-concurrency",
    stageNumber: 11,
    levelNumber: 3,
    levelName: "Level 3: Distributed Invariants",
    trackId: "distributed",
    title: "Vector Clocks & Causality",
    company: "Amazon Dynamo / Databricks",
    difficulty: "Hard",
    prompt: "In a distributed key-value store across 3 data centers, why do physical NTP timestamps fail to distinguish between causal dependency (A happened before B) vs true concurrency (A and B happened independently)?",
    conceptBridge: "Entering the distributed world: just as hardware store buffers destroyed global time in Stage 10, network latency destroys physical wall-clock synchronization across servers.",
    audioScript: {
      setup: "Imagine running a globally distributed shopping cart across three data centers: US-East, US-West, and Europe. A user adds an item to their cart on their phone while roaming. Server clocks are synchronized using Network Time Protocol. Yet NTP clocks can drift by tens of milliseconds due to network jitter, leap seconds, and asymmetric routing.",
      question: "If Server A writes at timestamp 100 and Server B writes at timestamp 105, why is it dangerous to assume Server B happened after Server A, and how do Vector Clocks track true causal history?",
      trap: "The trap is trusting physical timestamps in distributed systems. A clock on Server B could be twenty milliseconds ahead of Server A, making an older independent write look newer and silently overwriting newer data.",
      derivation: "Lamport proved that physical time cannot establish causal ordering in distributed systems. Vector Clocks solve this by giving each node an array of logical counters, one per node. When node i takes an event, it increments its own counter V[i]. When sending a message, it attaches its vector. When node j receives it, it updates each entry to the maximum of its local entry and the incoming entry. Event A causally precedes Event B if and only if every element in Vector A is less than or equal to Vector B, with at least one strictly less. If neither vector dominates the other, the events are mathematically concurrent, preserving both versions for safe resolution.",
    },
    options: [
      { id: "opt-ntp", label: "Use TrueTime GPS atomic clocks on every commodity server to guarantee UTC order", isTrap: true, trapExplanation: "Atomic GPS hardware is expensive, proprietary to Google Spanner, and still carries a non-zero uncertainty window ε." },
      { id: "opt-vector", label: "Vector Clocks capture partial orders: A < B iff every vector component is ≤ and at least one is <", isTrap: false },
      { id: "opt-lamport", label: "A single Lamport integer clock can detect whether two events were concurrent", isTrap: true, trapExplanation: "Scalar Lamport clocks establish a total order but CANNOT distinguish between causality and concurrency." },
    ],
    correctOptionId: "opt-vector",
    trapTitle: "The Wall-Clock Synchronization Illusion",
    trapBreakdown: "Physical clocks drift. Relying on UTC timestamps to order distributed writes produces data loss: an earlier causal write with a drifted clock can overwrite a later edit.",
    invariantTitle: "Partial Order Causal Dominance",
    invariantDerivation: "Let V(A) and V(B) be vector timestamps of size N. Event A causally precedes Event B (A → B) iff: (1) ∀k: V(A)[k] ≤ V(B)[k], and (2) ∃k: V(A)[k] < V(B)[k]. If neither A → B nor B → A holds, A || B (A and B are concurrent).",
    chalkboard: {
      type: "clocks",
      title: "Vector Clock Causality Dominance",
      caption: "V(A) ≤ V(B) proves causal history; non-dominance detects conflict",
      highlightMetric: "V(A) || V(B)",
      metricLabel: "Concurrent conflict detection",
    },
    whiteboardNotes: [
      { label: "NTP Danger", value: "Clock skew (±50ms) causes silent overwrite" },
      { label: "Vector Rule", value: "V_j[k] = max(V_j[k], V_msg[k]); V_j[j]++" },
      { label: "Concurrency", value: "Neither vector dominates → Causal conflict" },
    ],
    interviewTakeaway: "In distributed data stores, physical time is an estimate; logical vector clocks represent actual causality.",
  },
  {
    id: "raft-split-brain-quorum",
    stageNumber: 12,
    levelNumber: 3,
    levelName: "Level 3: Distributed Invariants",
    trackId: "distributed",
    title: "Raft Consensus & Quorum Intersection",
    company: "CockroachDB",
    difficulty: "Elite",
    prompt: "A 5-node distributed database cluster experiences a network partition separating Nodes {1, 2} from Nodes {3, 4, 5}. Why is it mathematically impossible for both partitions to elect a leader, and why must clusters always have an odd number of voting nodes?",
    conceptBridge: "When causal vectors in Stage 11 encounter a partitioned network, we need consensus: how majority quorums eliminate split-brain at the physical layer.",
    audioScript: {
      setup: "In distributed consensus protocols like Raft and Paxos, database clusters must maintain a single authoritative state machine even when underlying physical networks fail. Imagine a production cluster of five database nodes distributed across data centers. A backhoe cuts a fiber cable, severing the network into two isolated partitions: Partition A contains Nodes One and Two, while Partition B contains Nodes Three, Four, and Five.",
      question: "How does the quorum intersection invariant mathematically guarantee that the database will never split into two conflicting leaders, and why are clusters almost always sized with odd numbers of nodes?",
      trap: "The trap is assuming that the larger partition simply detects the network failure through a heartbeat ping and takes over. Heartbeat failure is symmetric: both sides observe the other side as missing.",
      derivation: "The fundamental invariant of consensus is the Pigeonhole Principle applied to majorities: any two majorities of size N must share at least one overlapping node. For a five-node cluster, a majority quorum requires strictly greater than N over two, which is at least three votes. Partition A has only two nodes, so neither node can ever collect three votes — election fails, and it enters read-only survival mode. Partition B has three nodes, which satisfies the quorum requirement of three. Because any two sets of three nodes from five must overlap by at least one member, two simultaneous majorities can never exist. Odd cluster sizes (2F + 1) maximize fault tolerance F without requiring extra nodes for ties.",
    },
    options: [
      { id: "opt-master", label: "Node 1 is designated the primary master and always wins unless manually reassigned", isTrap: true, trapExplanation: "Static master nodes introduce a single point of failure and trigger split-brain if partitioned." },
      { id: "opt-quorum", label: "Strict majority quorums (⌊N/2⌋ + 1) guarantee any two quorums overlap by ≥ 1 node", isTrap: false },
      { id: "opt-latency", label: "The partition with lower round-trip latency to the gateway wins", isTrap: true, trapExplanation: "Network latency is non-deterministic and can vary dynamically across partitions." },
    ],
    correctOptionId: "opt-quorum",
    trapTitle: "Symmetric Heartbeat Illusion",
    trapBreakdown: "When a network partition occurs, both sides experience silence from the other. Without an objective majority rule, both partitions would assume the other died and promote a new leader, creating two divergent databases writing contradictory transactions.",
    invariantTitle: "Pigeonhole Majority Quorum Intersection",
    invariantDerivation: "Let total nodes be N. A quorum size Q is defined as Q = ⌊N/2⌋ + 1. Suppose two disjoint quorums Q1 and Q2 exist. Then |Q1 ∪ Q2| = |Q1| + |Q2| = 2 × (⌊N/2⌋ + 1) > N. By the Pigeonhole Principle, this is a contradiction: the sum of two majorities strictly exceeds total nodes N. Therefore, Q1 ∩ Q2 ≠ ∅. Any candidate must obtain a vote from the intersection, which will reject it if its term/log is stale.",
    chalkboard: {
      type: "raft",
      title: "Raft Quorum Intersection",
      caption: "N = 5 nodes: Majority Q = 3. Two quorums must overlap by ≥ 1 node",
      highlightMetric: "Q = 3 / 5",
      metricLabel: "Strict majority threshold",
    },
    whiteboardNotes: [
      { label: "Cluster Size", value: "2F + 1 nodes tolerates F failures" },
      { label: "Partition A {1, 2}", value: "2 votes < 3 → Cannot form quorum" },
      { label: "Partition B {3, 4, 5}", value: "3 votes ≥ 3 → Safe leader elected" },
    ],
    interviewTakeaway: "Consensus relies on the mathematical truth that any two majorities must overlap. Designing distributed systems around strict majorities prevents split-brain at the physical layer.",
  },
  {
    id: "consistent-hashing-vnodes",
    stageNumber: 13,
    levelNumber: 3,
    levelName: "Level 3: Distributed Invariants",
    trackId: "distributed",
    title: "Consistent Hashing & Virtual Nodes",
    company: "Cloudflare",
    difficulty: "Elite",
    prompt: "In a cluster of N cache servers, why does naive `hash(key) % N` cause 99% cache evictions when 1 server dies, and how do Virtual Nodes on a Chord ring eliminate hot-spot partition skew?",
    conceptBridge: "Now that we can elect leaders and maintain consensus (Stage 12), we scale data partitioning: minimizing remapping when nodes join or leave.",
    audioScript: {
      setup: "Imagine building a distributed cache cluster for millions of user sessions. The classic textbook approach is modulo hashing: compute the hash of the user session key, and take it modulo the number of cache servers N. It distributes keys evenly when the cluster is healthy.",
      question: "If you have one hundred servers and just one server crashes, why does modulo hashing trigger a total collapse of ninety-nine percent of all cached data, and how do Virtual Nodes solve this?",
      trap: "The trap is thinking only the keys on the dead server are lost. Because the denominator changes from one hundred to ninety-nine, almost every key hashes to a brand new server index, invalidating the entire cache fleet simultaneously.",
      derivation: "Consistent Hashing maps both servers and keys onto a circular ring from zero to two to the thirty-two minus one. A key is assigned to the first server whose position on the ring is greater than or equal to the key's hash. When a server dies, ONLY the keys that were assigned to that specific server fall onto the next server clockwise; all other ninety-nine percent of keys stay completely undisturbed. To prevent the next server from suffering an unfair double load, each physical server is assigned hundreds of Virtual Nodes scattered uniformly across the ring, distributing the failover load evenly across the entire fleet.",
    },
    options: [
      { id: "opt-modulo", label: "Use hash(key) % (N - 1) and broadcast the new denominator to all clients", isTrap: true, trapExplanation: "Changing the denominator shifts virtually every key's index, causing 99% cache misses." },
      { id: "opt-vnodes", label: "Chord ring topology: only keys on the dead node shift; virtual nodes balance the failover evenly", isTrap: false },
      { id: "opt-master", label: "Store a centralized hash lookup table in Redis and update it on server failure", isTrap: true, trapExplanation: "A central lookup table creates a single point of failure and bottleneck for millions of queries." },
    ],
    correctOptionId: "opt-vnodes",
    trapTitle: "The Modulo Re-Hashing Storm",
    trapBreakdown: "With modulo hashing, changing N to N - 1 alters the destination index for (N - 1)/N keys (~99%). This triggers a 'thundering herd' cache stampede that overwhelms backend databases.",
    invariantTitle: "Chord Ring & K/N Minimal Redistribution",
    invariantDerivation: "On a consistent hash ring, adding or removing a node redistributes on average only K/N keys, where K is total keys and N is total nodes. By placing V virtual nodes per physical machine (e.g. V = 256), the variance in partition size drops according to the Central Limit Theorem, bounding load imbalance to O(1/√V).",
    chalkboard: {
      type: "vnodes",
      title: "Consistent Hash Ring with Virtual Nodes",
      caption: "Keys route clockwise to nearest virtual node; only K/N keys move on failure",
      highlightMetric: "K / N",
      metricLabel: "Keys moved on node failure",
    },
    whiteboardNotes: [
      { label: "Modulo Evictions", value: "~99% of total keys remapped" },
      { label: "Consistent Hash", value: "Only 1/N of keys remapped (optimal)" },
      { label: "Virtual Nodes", value: "V = 256 nodes/server eliminates hot-spot skew" },
    ],
    interviewTakeaway: "In distributed caching, changing cluster size must never re-hash the universe. Consistent hashing limits churn to the bare mathematical minimum: 1/N.",
  },
  {
    id: "crdt-collaborative-canvas",
    stageNumber: 14,
    levelNumber: 3,
    levelName: "Level 3: Distributed Invariants",
    trackId: "distributed",
    title: "CRDTs & The Collaborative Canvas",
    company: "Figma",
    difficulty: "Elite",
    prompt: "Two users offline simultaneously drag the same rectangle on a shared canvas. When both reconnect, why does Last-Write-Wins (LWW) cause irreversible data corruption, and how do State-based CRDTs guarantee mathematical convergence?",
    conceptBridge: "The capstone of the curriculum: combining causal order (Stage 11) and partitioned operation (Stage 12) to achieve conflict-free convergence without central locks.",
    audioScript: {
      setup: "In collaborative design applications like Figma, multiple designers work on the exact same document simultaneously, even while offline or on flaky mobile connections. Imagine Designer A and Designer B both select the same vector rectangle. While offline on an airplane, Designer A changes its color to green and resizes its width. Meanwhile, Designer B changes its position on the canvas. When both laptops reconnect to Wi-Fi, their changes must merge without a central lock.",
      question: "Why does the common database strategy of Last-Write-Wins silently destroy work, and what mathematical algebraic structure ensures zero-conflict convergence?",
      trap: "The trap is using client wall-clock timestamps with Last-Write-Wins at the object level. Physical computer clocks drift by hundreds of milliseconds. If Designer B's clock is fifty milliseconds ahead, Designer B's position change overwrites and obliterates Designer A's color and width changes completely.",
      derivation: "The solution is a Conflict-Free Replicated Data Type based on a semilattice. To achieve convergence, the merge operation must satisfy three algebraic properties: associativity, commutativity, and idempotence. By decomposing the rectangle into independent attribute registers with Lamport logical timestamps, concurrent changes to distinct properties (color, position, size) commute. Regardless of packet arrival order or network partitions, the join of the state semilattice always converges to the exact same mathematical state on all devices.",
    },
    options: [
      { id: "opt-lww", label: "Keep the object with the latest client UTC timestamp (Last-Write-Wins)", isTrap: true, trapExplanation: "Clock drift causes one client's edits to completely clobber the other's non-conflicting attribute updates." },
      { id: "opt-crdt", label: "Use a Bounded Semilattice CRDT where merges are associative, commutative, and idempotent", isTrap: false },
      { id: "opt-ot", label: "Route all edits through a central server using Operational Transformation", isTrap: true, trapExplanation: "OT requires a centralized sequential server and breaks down during multi-hour offline editing sessions." },
    ],
    correctOptionId: "opt-crdt",
    trapTitle: "The Wall-Clock LWW Fallacy",
    trapBreakdown: "Physical clocks are not synchronized across distributed devices. Relying on NTP timestamps to resolve concurrent writes means client clock skew determines whose work survives, leading to silent data loss.",
    invariantTitle: "Bounded Semilattice Algebraic Convergence",
    invariantDerivation: "A state-based CRDT (CvRDT) forms a partially ordered set (L, ≤) equipped with a join operator ⊔ representing the least upper bound. The merge function f(x, y) = x ⊔ y satisfies: (1) Associativity: (a ⊔ b) ⊔ c = a ⊔ (b ⊔ c); (2) Commutativity: a ⊔ b = b ⊔ a; (3) Idempotence: a ⊔ a = a. Because merge is commutative and associative, messages can arrive in any order, be duplicated, or be delayed without altering the final converged state.",
    chalkboard: {
      type: "crdt",
      title: "Semilattice Convergence Lattice",
      caption: "Merge is associative, commutative, and idempotent: a ⊔ b = b ⊔ a",
      highlightMetric: "a ⊔ b = b ⊔ a",
      metricLabel: "Commutative join convergence",
    },
    whiteboardNotes: [
      { label: "LWW Danger", value: "Physical clock drift overwrites concurrent properties" },
      { label: "CRDT Math", value: "Join-Semilattice: Least Upper Bound (⊔)" },
      { label: "Guarantees", value: "Eventual consistency without central lock" },
    ],
    interviewTakeaway: "Never resolve distributed conflicts with wall-clock timestamps. Model distributed state as a semilattice whose merge operator is mathematically commutative and idempotent.",
  },
]
