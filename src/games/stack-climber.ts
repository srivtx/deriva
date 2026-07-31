// Concept game data. Games teach one mental move through a physical loop;
// they are not trivia and never modify the existing question bank.

export const STACK_CLIMBER = {
  id: "stack-climber",
  title: "Stack Climber",
  concept: "Recursive Leap of Faith",
  description: "Build the contract, descend the call stack, find the base case, and climb back with answers.",
  start: 5,
  contractChoices: [
    { label: "It returns the sum from 1 through n", value: "sum" },
    { label: "It returns the next smaller n", value: "smaller" },
    { label: "It returns every frame in the call stack", value: "frames" },
  ],
  nextChoices: (n: number) => [n - 1, n, n + 1],
  baseChoices: [
    { label: "Stop: n = 1 can answer itself", value: "stop" },
    { label: "Keep calling until the number is negative", value: "negative" },
    { label: "Stop whenever the number feels small", value: "feels-small" },
  ],
  returnChoices: (n: number) => Array.from(new Set([n, n + 1, n + (n - 1), n * (n - 1)])),
}
