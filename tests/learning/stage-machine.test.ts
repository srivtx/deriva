import { beforeEach, describe, expect, it } from "vitest"
import { artifactIsComplete, StageNames, useStageMachine } from "../../src/learning/flow/stage-machine"

describe("stage machine", () => {
  beforeEach(() => {
    useStageMachine.getState().reset()
  })

  it("rejects completion of a stage that is not the current unlocked stage", () => {
    const machine = useStageMachine.getState()
    machine.init("trees/test")
    machine.completeStage("design", { name: "sum_to", param: "n", baseCase: "0", recursiveStep: "n", complexity: "n" })

    const state = useStageMachine.getState()
    expect(state.stages.understand.completed).toBe(false)
    expect(state.stages.design.completed).toBe(false)
    expect(state.currentStage).toBe("understand")
  })

  it("rejects an unlocked stage with an incomplete artifact", () => {
    const machine = useStageMachine.getState()
    machine.init("trees/test")
    machine.completeStage("understand", { prediction: "10", wasRight: true })
    machine.enterStage("play")
    machine.completeStage("play", { experimentsDone: [] })

    expect(useStageMachine.getState().stages.play.completed).toBe(false)
    expect(useStageMachine.getState().currentStage).toBe("play")
  })

  it("uses lesson-specific requirements for multi-step stages", () => {
    const machine = useStageMachine.getState()
    machine.init("trees/test", undefined, { playExperiments: 3 })
    machine.completeStage("understand", { prediction: "10", wasRight: true })
    machine.enterStage("play")
    machine.completeStage("play", { experimentsDone: ["peel-once"] })
    expect(useStageMachine.getState().stages.play.completed).toBe(false)

    machine.completeStage("play", { experimentsDone: ["peel-once", "peel-down", "build-back"] })
    expect(useStageMachine.getState().stages.play.completed).toBe(true)
  })

  it("unlocks exactly the next stage and permits revisiting completed stages", () => {
    const machine = useStageMachine.getState()
    machine.init("trees/test")
    machine.completeStage("understand", { prediction: "15", wasRight: true })

    let state = useStageMachine.getState()
    expect(state.stages.play.locked).toBe(false)
    expect(state.stages.reason.locked).toBe(true)

    machine.enterStage("play")
    machine.completeStage("play", { experimentsDone: ["peel"] })
    machine.enterStage("understand")
    state = useStageMachine.getState()
    expect(state.currentStage).toBe("understand")
    expect(state.stages.play.completed).toBe(true)
    expect(state.stages.reason.locked).toBe(false)
  })

  it("ignores artifacts written to locked stages", () => {
    const machine = useStageMachine.getState()
    machine.init("trees/test")
    machine.setArtifact("design", { name: "sum_to", param: "n", baseCase: "0", recursiveStep: "n", complexity: "n" })

    expect(useStageMachine.getState().stages.design.artifacts).toBeUndefined()
    expect(StageNames).toHaveLength(9)
  })

  it("requires a selected transfer problem before Generalize can complete", () => {
    expect(artifactIsComplete("generalize", { confirmed: true })).toBe(false)
    expect(artifactIsComplete("generalize", { confirmed: true, selectedRelated: "Tree Height" })).toBe(true)
  })
})
