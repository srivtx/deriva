import { EXPEDITION_CAPSULES } from "./schema"

export function getCapsule(id: string) {
  return EXPEDITION_CAPSULES.find(capsule => capsule.id === id)
}

export { EXPEDITION_CAPSULES }
export type { PatternCapsule, ExpeditionStep } from "./schema"
