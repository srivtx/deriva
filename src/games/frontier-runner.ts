// Bike Route Runner turns graph search into a route-planning game.
// The authored states keep the learning move visible instead of hiding it in a solver.

export type RouteNode = {
  id: string
  position: [number, number, number]
}

export type RouteEdge = {
  from: string
  to: string
  weight?: number
}

export type FrontierStep = {
  prompt: string
  instruction: string
  choices: string[]
  correct: string
  frontier: string[]
  visited: string[]
  distances: Record<string, number>
  afterFrontier: string[]
  afterVisited: string[]
  afterDistances: Record<string, number>
  explanation: string
}

const bfsDistances = { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3, G: 4 }

const bfsSteps: FrontierStep[] = [
  {
    prompt: "The bike is at A. Which node should leave the queue first?",
    instruction: "Predict the next layer, then ride the node at the front of the queue.",
    choices: ["B", "C", "G"],
    correct: "B",
    frontier: ["B", "C"],
    visited: ["A"],
    distances: bfsDistances,
    afterFrontier: ["C", "D"],
    afterVisited: ["A", "B"],
    afterDistances: bfsDistances,
    explanation: "B is one edge from A. BFS settles the oldest node in the nearest layer first.",
  },
  {
    prompt: "B is settled. Which node keeps the queue moving layer by layer?",
    instruction: "Do not jump ahead to the goal. Follow the queue's order.",
    choices: ["C", "D", "G"],
    correct: "C",
    frontier: ["C", "D"],
    visited: ["A", "B"],
    distances: bfsDistances,
    afterFrontier: ["D", "E"],
    afterVisited: ["A", "B", "C"],
    afterDistances: bfsDistances,
    explanation: "C is still in the first layer. BFS finishes a layer before moving farther away.",
  },
  {
    prompt: "C is settled. Which frontier node is now next?",
    instruction: "The first deeper node may enter, but it cannot skip the queue.",
    choices: ["D", "E", "A"],
    correct: "D",
    frontier: ["D", "E"],
    visited: ["A", "B", "C"],
    distances: bfsDistances,
    afterFrontier: ["E", "F"],
    afterVisited: ["A", "B", "C", "D"],
    afterDistances: bfsDistances,
    explanation: "D was discovered from B before F was discovered from C, so the queue preserves that order.",
  },
  {
    prompt: "D is settled. Which ride exposes the next frontier node?",
    instruction: "Keep the search exhaustive, but never leap over an older frontier entry.",
    choices: ["E", "F", "C"],
    correct: "E",
    frontier: ["E", "F"],
    visited: ["A", "B", "C", "D"],
    distances: bfsDistances,
    afterFrontier: ["F"],
    afterVisited: ["A", "B", "C", "D", "E"],
    afterDistances: bfsDistances,
    explanation: "E is the remaining node at distance two. The queue never confuses distance with discovery order.",
  },
  {
    prompt: "E is settled. Which node is the next layer's gateway?",
    instruction: "Ride the node that was discovered by the current layer.",
    choices: ["F", "G", "D"],
    correct: "F",
    frontier: ["F"],
    visited: ["A", "B", "C", "D", "E"],
    distances: bfsDistances,
    afterFrontier: ["G"],
    afterVisited: ["A", "B", "C", "D", "E", "F"],
    afterDistances: bfsDistances,
    explanation: "F is the first node at distance three. The frontier expands one layer at a time.",
  },
  {
    prompt: "F is settled. Which node completes the shortest unweighted route?",
    instruction: "The first time BFS reaches the goal, its layer distance is proven.",
    choices: ["G", "E", "A"],
    correct: "G",
    frontier: ["G"],
    visited: ["A", "B", "C", "D", "E", "F"],
    distances: bfsDistances,
    afterFrontier: [],
    afterVisited: ["A", "B", "C", "D", "E", "F", "G"],
    afterDistances: bfsDistances,
    explanation: "BFS reaches G in four edges. Every shorter layer was exhausted first.",
  },
]

const dijkstraDistances = { S: 0, A: 2, B: 6, C: Infinity, D: Infinity, T: Infinity }

const dijkstraSteps: FrontierStep[] = [
  {
    prompt: "The bike starts at S. Which known route is safe to settle?",
    instruction: "Predict the cheapest known frontier, then ride it.",
    choices: ["A", "B", "C"],
    correct: "A",
    frontier: ["A", "B"],
    visited: ["S"],
    distances: dijkstraDistances,
    afterFrontier: ["B", "C"],
    afterVisited: ["S", "A"],
    afterDistances: { S: 0, A: 2, B: 3, C: 7, D: Infinity, T: Infinity },
    explanation: "A costs 2, so no route through an unsettled node can beat it yet.",
  },
  {
    prompt: "A is settled and reveals a cheaper route to B. What goes next?",
    instruction: "Relax the roads, then choose the smallest total cost.",
    choices: ["B", "C", "D"],
    correct: "B",
    frontier: ["B", "C"],
    visited: ["S", "A"],
    distances: { S: 0, A: 2, B: 3, C: 7, D: Infinity, T: Infinity },
    afterFrontier: ["C", "D"],
    afterVisited: ["S", "A", "B"],
    afterDistances: { S: 0, A: 2, B: 3, C: 4, D: 7, T: Infinity },
    explanation: "The route S-A-B costs 3, beating B's old cost of 6. The frontier stores the better evidence.",
  },
  {
    prompt: "B is settled. Which route has the smallest known total now?",
    instruction: "Use the updated costs, not the order the nodes first appeared.",
    choices: ["C", "D", "T"],
    correct: "C",
    frontier: ["C", "D"],
    visited: ["S", "A", "B"],
    distances: { S: 0, A: 2, B: 3, C: 4, D: 7, T: Infinity },
    afterFrontier: ["D", "T"],
    afterVisited: ["S", "A", "B", "C"],
    afterDistances: { S: 0, A: 2, B: 3, C: 4, D: 5, T: 12 },
    explanation: "C costs 4. Settling it reveals D at 5, a route that was not visible before.",
  },
  {
    prompt: "C is settled. Which route can no cheaper path replace?",
    instruction: "The smallest unsettled total cost earns the next guarantee.",
    choices: ["D", "T", "B"],
    correct: "D",
    frontier: ["D", "T"],
    visited: ["S", "A", "B", "C"],
    distances: { S: 0, A: 2, B: 3, C: 4, D: 5, T: 12 },
    afterFrontier: ["T"],
    afterVisited: ["S", "A", "B", "C", "D"],
    afterDistances: { S: 0, A: 2, B: 3, C: 4, D: 5, T: 7 },
    explanation: "D costs 5, so its road to T improves the goal from 12 to 7 before T is settled.",
  },
  {
    prompt: "D is settled. Which route reaches the destination with the proof intact?",
    instruction: "Settle the cheapest remaining route, not the route that looked direct.",
    choices: ["T", "C", "D"],
    correct: "T",
    frontier: ["T"],
    visited: ["S", "A", "B", "C", "D"],
    distances: { S: 0, A: 2, B: 3, C: 4, D: 5, T: 7 },
    afterFrontier: [],
    afterVisited: ["S", "A", "B", "C", "D", "T"],
    afterDistances: { S: 0, A: 2, B: 3, C: 4, D: 5, T: 7 },
    explanation: "T is settled at cost 7. Dijkstra is BFS after roads gain weights, so cost replaces layer order.",
  },
]

export const FRONTIER_RUNNER = {
  id: "frontier-runner",
  title: "Bike Route Runner",
  concept: "Frontier Search",
  description: "Ride a graph, expand the frontier, and learn why weights change the next safe move.",
  bfs: {
    nodes: [
      { id: "A", position: [-3.4, 0, 0] },
      { id: "B", position: [-1.9, 0, -1.35] },
      { id: "C", position: [-1.9, 0, 1.35] },
      { id: "D", position: [0, 0, -1.35] },
      { id: "E", position: [0, 0, 1.35] },
      { id: "F", position: [1.8, 0, 0] },
      { id: "G", position: [3.5, 0, 0] },
    ] satisfies RouteNode[],
    edges: [
      { from: "A", to: "B" }, { from: "A", to: "C" }, { from: "B", to: "D" },
      { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" }, { from: "F", to: "G" },
    ] satisfies RouteEdge[],
    steps: bfsSteps,
  },
  dijkstra: {
    nodes: [
      { id: "S", position: [-3.4, 0, 0] },
      { id: "A", position: [-1.7, 0, -1.35] },
      { id: "B", position: [-1.7, 0, 1.35] },
      { id: "C", position: [0, 0, -1.35] },
      { id: "D", position: [1.7, 0, 1.35] },
      { id: "T", position: [3.5, 0, 0] },
    ] satisfies RouteNode[],
    edges: [
      { from: "S", to: "A", weight: 2 }, { from: "S", to: "B", weight: 6 }, { from: "A", to: "B", weight: 1 },
      { from: "A", to: "C", weight: 5 }, { from: "B", to: "C", weight: 1 }, { from: "B", to: "D", weight: 4 },
      { from: "C", to: "D", weight: 1 }, { from: "D", to: "T", weight: 2 }, { from: "C", to: "T", weight: 8 },
    ] satisfies RouteEdge[],
    steps: dijkstraSteps,
  },
}
