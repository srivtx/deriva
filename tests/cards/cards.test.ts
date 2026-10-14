import { describe, it, expect } from "vitest"
import { PATTERN_CARDS, TOPIC_LABELS, type CardTopic } from "../../src/data/cards"
import {
  loadCardsProgress,
  recordCardReview,
  loadTodayReviewedCount,
} from "../../src/persistence/cards"

describe("Pattern Cards Deck & Data Invariants", () => {
  it("contains all 36 pattern cards across core topics", () => {
    expect(PATTERN_CARDS.length).toBe(36)
  })

  it("every card has complete schema, 3 options, and correct option index", () => {
    for (const card of PATTERN_CARDS) {
      expect(card.id).toBeTruthy()
      expect(card.title).toBeTruthy()
      expect(card.prompt.length).toBeGreaterThan(15)
      expect(card.options.length).toBe(3)
      expect(card.correctOption).toBeGreaterThanOrEqual(0)
      expect(card.correctOption).toBeLessThanOrEqual(2)
      expect(card.invariant.length).toBeGreaterThan(20)
      expect(card.naiveWaste.length).toBeGreaterThan(15)
      expect(card.cue.length).toBeGreaterThan(10)
      expect(["Easy", "Medium", "Hard"]).toContain(card.difficulty)
    }
  })

  it("covers all 10 DSA topics defined in TOPIC_LABELS", () => {
    const topics = new Set(PATTERN_CARDS.map(c => c.topic))
    const expectedTopics = Object.keys(TOPIC_LABELS) as CardTopic[]

    for (const t of expectedTopics) {
      expect(topics.has(t)).toBe(true)
      const count = PATTERN_CARDS.filter(c => c.topic === t).length
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  it("has zero AI-like sparkle or star icons in card data", () => {
    const jsonStr = JSON.stringify(PATTERN_CARDS)
    expect(jsonStr).not.toContain("✦")
    expect(jsonStr).not.toContain("★")
    expect(jsonStr).not.toContain("✨")
    expect(jsonStr).not.toContain("🪄")
  })
})

describe("Pattern Cards Leitner Persistence", () => {
  it("initializes empty progress cleanly", () => {
    const p = loadCardsProgress()
    expect(typeof p).toBe("object")
  })

  it("advances card box and streak on good and easy ratings", () => {
    const cardId = "trees-bottom-up"
    const r1 = recordCardReview(cardId, "good")
    expect(r1.box).toBeGreaterThanOrEqual(2)
    expect(r1.streak).toBe(1)
    expect(r1.totalReviews).toBeGreaterThanOrEqual(1)

    const r2 = recordCardReview(cardId, "easy")
    expect(r2.box).toBeGreaterThanOrEqual(3)
    expect(r2.streak).toBe(3)
    expect(r2.mastered).toBe(true)
  })

  it("resets streak on again rating", () => {
    const cardId = "graphs-cycle-3color"
    recordCardReview(cardId, "good")
    const reset = recordCardReview(cardId, "again")
    expect(reset.streak).toBe(0)
    expect(reset.box).toBe(1)
  })

  it("tracks today reviewed count", () => {
    const count = loadTodayReviewedCount()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
