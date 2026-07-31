import { describe, expect, it } from "vitest"
import { PATTERN_DIRECTORY, PATTERN_QUIZ } from "../../src/data/patterns"
import { GAME_ENGINES } from "../../src/games/catalog"

describe("pattern directory", () => {
  it("covers every named Game Mode pattern exactly once", () => {
    const catalogNames = GAME_ENGINES.flatMap(engine => engine.patterns)
    const directoryNames = PATTERN_DIRECTORY.map(pattern => pattern.name)

    expect(new Set(directoryNames).size).toBe(directoryNames.length)
    expect(directoryNames).toHaveLength(35)
    expect(new Set(directoryNames)).toEqual(new Set(catalogNames))
  })

  it("keeps the quiz authored, complete, and linked to the directory", () => {
    const directoryIds = new Set(PATTERN_DIRECTORY.map(pattern => pattern.id))

    expect(PATTERN_QUIZ).toHaveLength(35)
    expect(new Set(PATTERN_QUIZ.map(question => question.id)).size).toBe(PATTERN_QUIZ.length)
    expect(PATTERN_QUIZ.every(question => directoryIds.has(question.patternId))).toBe(true)
    expect(PATTERN_QUIZ.every(question => question.answer >= 0 && question.answer < question.options.length)).toBe(true)
    expect(new Set(PATTERN_QUIZ.map(question => question.kind))).toEqual(new Set(["recognize", "invariant", "state", "contrast", "transfer"]))
  })
})
