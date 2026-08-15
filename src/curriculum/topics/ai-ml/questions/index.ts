// ai-ml question registry (docs/13 §Product navigation and question bank).
// Pure data — the /ai-ml routes read from here; no UI imports.

import { AiQuestionSchema, type AiQuestion } from "../../../schema/question"
import { mathQuestions } from "./questions-math"
import { dataQuestions } from "./questions-data"
import { classicalQuestions } from "./questions-classical"
import { experimentQuestions } from "./questions-experiments"
import { deepQuestions } from "./questions-deep"
import { retrievalQuestions } from "./questions-retrieval"
import { ragQuestions } from "./questions-rag"
import { backendQuestions } from "./questions-backend"

export const aiQuestions: AiQuestion[] = [
  ...mathQuestions,
  ...dataQuestions,
  ...classicalQuestions,
  ...experimentQuestions,
  ...deepQuestions,
  ...retrievalQuestions,
  ...ragQuestions,
  ...backendQuestions,
]

// Parse every question at module scope → an invalid question fails the build (C1).
for (const question of aiQuestions) {
  AiQuestionSchema.parse(question)
}

export const questionById = new Map(aiQuestions.map(question => [question.id, question]))

export const aiQuestionTracks = [
  { id: "math", name: "Mathematics and theory", from: "MATH-001", to: "THEORY-006" },
  { id: "data", name: "Data engineering", from: "DATA-001", to: "BASE-005" },
  { id: "classical", name: "Classical ML", from: "MODEL-001", to: "TREE-ML-005" },
  { id: "experiments", name: "Experiments and evaluation", from: "EXP-001", to: "EVAL-010" },
  { id: "deep", name: "Deep learning and transformers", from: "TENSOR-001", to: "LM-002" },
  { id: "retrieval", name: "Retrieval, ranking, and recommendation", from: "SEARCH-001", to: "REC-005" },
  { id: "rag", name: "Generative AI and RAG", from: "RAG-001", to: "GENEVAL-005" },
  { id: "backend", name: "Backend, MLOps, and safety", from: "API-001", to: "OPS-001" },
] as const

export function listQuestionsByTrack(trackId: string): AiQuestion[] {
  return aiQuestions.filter(question => question.track === trackId)
}

export function getQuestionById(id: string): AiQuestion | undefined {
  return questionById.get(id)
}

export function nextQuestionOf(question: AiQuestion): AiQuestion | undefined {
  if (!question.nextQuestionId) return undefined
  return questionById.get(question.nextQuestionId)
}
