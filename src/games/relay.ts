// Algorithm Relay: one mission that composes patterns from different families.

export const ALGORITHM_RELAY = {
  id: "algorithm-relay",
  title: "Algorithm Relay",
  description: "Carry one solution through five rooms: choose, protect, route, remember, prove.",
  rooms: [
    {
      name: "The Representation Room",
      verb: "Choose the tool",
      concept: "Representation Choice",
      prompt: "You receive 100,000 values and must answer ‘have I seen x?’ instantly. What do you carry forward?",
      options: [
        { label: "A set: membership is the operation", value: "set" },
        { label: "An unsorted list: scan it each time", value: "list" },
        { label: "A random tree: structure is decoration", value: "tree" },
      ],
      correct: "set",
      success: "You chose the representation from the operation, not from habit.",
      miss: "Start with the question the data structure must answer.",
    },
    {
      name: "The Invariant Bridge",
      verb: "Protect the rule",
      concept: "Invariant-Driven Structure",
      prompt: "A pointer update is about to cut off the rest of a linked list. What happens first?",
      options: [
        { label: "Save next before overwriting current.next", value: "save" },
        { label: "Overwrite current.next and hope the path remains", value: "overwrite" },
        { label: "Restart from the head after every pointer move", value: "restart" },
      ],
      correct: "save",
      success: "The invariant is protected: the path ahead remains reachable.",
      miss: "Name what must remain true immediately before the mutation.",
    },
    {
      name: "The Frontier Gate",
      verb: "Move the boundary",
      concept: "Greedy Frontier",
      prompt: "Two unsettled routes are available: cost 3 and cost 8. Which route can be settled safely?",
      options: [
        { label: "Cost 3: extend the cheapest unsettled frontier", value: "three" },
        { label: "Cost 8: it has more room to improve", value: "eight" },
        { label: "Either: order never matters", value: "either" },
      ],
      correct: "three",
      success: "The frontier moved by a proof of safety, not just by proximity.",
      miss: "Weighted edges replace arrival order with cost order.",
    },
    {
      name: "The State Forge",
      verb: "Remember what matters",
      concept: "State Design",
      prompt: "You stand at index i with amnesia. What state is enough to decide the best future?",
      options: [
        { label: "Only the smallest information that determines the future answer", value: "minimal" },
        { label: "Every choice made since the beginning", value: "history" },
        { label: "Only the final answer", value: "final" },
      ],
      correct: "minimal",
      success: "You compressed history without losing the future.",
      miss: "State is not everything you know; it is everything the future needs.",
    },
    {
      name: "The Proof Vault",
      verb: "Prove the shortcut",
      concept: "Exchange Argument",
      prompt: "Your shortcut looks locally best. What earns the right to use it?",
      options: [
        { label: "Show an optimal solution can exchange its first choice for yours", value: "exchange" },
        { label: "Show it worked once", value: "example" },
        { label: "Use it because it is shorter code", value: "short" },
      ],
      correct: "exchange",
      success: "You finished with a proof, not a hunch. The relay is complete.",
      miss: "A shortcut becomes an algorithm when its safety survives a counterexample.",
    },
  ],
}
