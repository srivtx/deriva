// Separate local-first store for the Expedition experiment.
// It never reads or writes the existing practice progress keys.

import type { ExpeditionStep } from "@/expedition/schema"

export type ExpeditionProgress = {
  currentStep: ExpeditionStep
  completed: Partial<Record<ExpeditionStep, boolean>>
  confidence?: number
  retrievalCorrect?: boolean
  failureCorrect?: boolean
  transferCorrect?: boolean
  ownWords?: string
  nextQuestion?: string
  lastVisited: string
  completedAt?: string
}

const KEY = "deriva-expedition-v1"
type Store = Record<string, ExpeditionProgress>

function read(): Store {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

function write(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

export function loadExpeditionProgress(id: string): ExpeditionProgress | undefined {
  return read()[id]
}

export function saveExpeditionProgress(id: string, progress: ExpeditionProgress) {
  const store = read()
  store[id] = progress
  write(store)
}

export function updateExpeditionProgress(id: string, patch: Partial<ExpeditionProgress>) {
  const current = loadExpeditionProgress(id)
  saveExpeditionProgress(id, {
    currentStep: current?.currentStep || "retrieve",
    completed: current?.completed || {},
    lastVisited: new Date().toISOString(),
    ...current,
    ...patch,
  })
}
