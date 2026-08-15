"use client"

// AI lab lesson page (docs/13) — the 9-stage flow for AI/ML lessons only.
// Shares the stage machine, persistence, rail, and generic schema-driven
// surfaces; Play and Execute get lab-native surfaces. DSA lessons keep their
// own page untouched.

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { getLessonByRoute } from "@/curriculum"
import { useStageMachine, StageNames, type StageName, type StageArtifacts } from "@/learning/flow/stage-machine"
import { StageRail, StageStepper } from "@/learning/flow/stage-rail"
import { loadLessonProgress, saveLessonProgress, recordProbeAttempt } from "@/persistence/lesson-progress"
import { UnderstandStage } from "@/learning/stages/understand"
import { ReasonStage } from "@/learning/stages/reason"
import { DiscoverStage } from "@/learning/stages/discover"
import { DesignStage } from "@/learning/stages/design"
import { ImplementStage } from "@/learning/stages/implement"
import { ReflectStage } from "@/learning/stages/reflect"
import { GeneralizeStage } from "@/learning/stages/generalize"
import { DatasetPlayStage } from "./dataset-play"
import { DatasetExecuteStage } from "./dataset-execute"
import { ArtifactCard } from "./artifact-card"

export function AiLabPage({ topic, slug }: { topic: string; slug: string }) {
  const lesson = useMemo(() => getLessonByRoute(topic, slug), [topic, slug])
  const machine = useStageMachine()
  const { currentStage, stages, init, completeStage, setArtifact, enterStage } = machine

  useEffect(() => {
    if (!lesson) return
    const saved = loadLessonProgress(lesson.id)
    init(
      lesson.id,
      saved ? { currentStage: saved.currentStage, stages: saved.stages } : undefined,
      {
        playExperiments: lesson.stages.play.experiments.length,
        reasonQuestions: lesson.stages.reason.socraticLadder.length,
        discoverSlots: lesson.stages.discover.artifact.slots.length,
        implementTests: lesson.stages.implement.tests.length,
      },
    )
  }, [lesson, init])

  useEffect(() => {
    if (!lesson || machine.lessonKey !== lesson.id) return
    const progressStages: Record<string, { completed: boolean; viaProbe: boolean; artifacts?: StageArtifacts[StageName] }> = {}
    for (const name of StageNames) {
      const g = stages[name]
      progressStages[name] = { completed: g.completed, viaProbe: g.viaProbe, artifacts: g.artifacts }
    }
    const reflect = stages.reflect.artifacts as StageArtifacts["reflect"]
    saveLessonProgress(lesson.id, {
      currentStage,
      stages: progressStages,
      probeAttempts: loadLessonProgress(lesson.id)?.probeAttempts ?? 0,
      patternDeposit: stages.reflect.completed && reflect?.ownWords
        ? {
            patternId: lesson.stages.reflect.pattern.id as string,
            name: lesson.stages.reflect.pattern.name,
            ownWords: reflect.ownWords,
            lessonId: lesson.id,
            earnedAt: new Date().toISOString(),
          }
        : loadLessonProgress(lesson.id)?.patternDeposit,
      finishedAt: stages.generalize.completed ? new Date().toISOString() : undefined,
    })
  }, [lesson, machine.lessonKey, currentStage, stages])

  if (!lesson || !lesson.ai) {
    return (
      <div className="lesson-missing">
        <h2>Lab not found</h2>
        <Link href="/lab">← Back to the labs</Link>
      </div>
    )
  }

  const advance = (stage: StageName, artifacts?: StageArtifacts[StageName]) => {
    if (stages[stage].completed) {
      const frontier = StageNames.find(name => !stages[name].completed && !stages[name].locked)
      if (frontier) enterStage(frontier)
      return
    }
    completeStage(stage, artifacts)
    const idx = StageNames.indexOf(stage)
    if (idx + 1 < StageNames.length) enterStage(StageNames[idx + 1])
  }

  const probePass = (stage: StageName) => {
    recordProbeAttempt(lesson.id)
    completeStage(stage, undefined, true)
    const idx = StageNames.indexOf(stage)
    if (idx + 1 < StageNames.length) enterStage(StageNames[idx + 1])
  }

  const art = <K extends StageName>(s: K) => stages[s].artifacts as StageArtifacts[K]
  const patternName = lesson.stages.reflect.pattern.name
  const finished = stages.generalize.completed

  return (
    <div className="lesson-page">
      <StageStepper />
      <div className="lesson-body">
        <StageRail
          topic={`${lesson.topic} · lab`}
          lessonTitle={lesson.title}
          patternName={stages.reflect.completed ? patternName : undefined}
        />
        <main className="lesson-surface">
          <ArtifactCard ai={lesson.ai} />
          {finished && currentStage === "generalize" ? (
            <div className="lesson-complete">
              <span className="discovery-kicker">✦ Lab complete</span>
              <h1 className="stage-title">Your dataset is measurable now.</h1>
              <p className="narrative">
                You predicted, touched, reasoned, constructed, specified, coded, watched,
                and named. The contract you built in this lab is the first link in the
                artifact chain — split policy, baseline, model, and service all inherit it.
              </p>
              <div className="lesson-complete-actions">
                <Link href="/lab" className="btn-primary as-link">See the lab map →</Link>
                <Link href="/patterns" className="btn-ghost as-link">View your pattern journal</Link>
              </div>
            </div>
          ) : (
            <>
              {currentStage === "understand" && (
                <UnderstandStage lesson={lesson} saved={art("understand")}
                  onComplete={(a) => advance("understand", a)} onDraft={(a) => setArtifact("understand", a)} onProbePass={() => probePass("understand")} />
              )}
              {currentStage === "play" && (
                <DatasetPlayStage lesson={lesson} saved={art("play")}
                  onComplete={(a) => advance("play", a)} onDraft={(a) => setArtifact("play", a)} onProbePass={() => probePass("play")} />
              )}
              {currentStage === "reason" && (
                <ReasonStage lesson={lesson} saved={art("reason")}
                  onComplete={(a) => advance("reason", a)} onDraft={(a) => setArtifact("reason", a)} onProbePass={() => probePass("reason")} />
              )}
              {currentStage === "discover" && (
                <DiscoverStage lesson={lesson} saved={art("discover")}
                  onComplete={(a) => advance("discover", a)} onDraft={(a) => setArtifact("discover", a)} onProbePass={() => probePass("discover")} />
              )}
              {currentStage === "design" && (
                <DesignStage lesson={lesson} saved={art("design")}
                  onComplete={(a) => advance("design", a)} onDraft={(a) => setArtifact("design", a)} onProbePass={() => probePass("design")} />
              )}
              {currentStage === "implement" && (
                <ImplementStage lesson={lesson} saved={art("implement")} design={art("design")}
                  onComplete={(a) => advance("implement", a)}
                  onDraft={(a) => setArtifact("implement", a)} />
              )}
              {currentStage === "execute" && (
                <DatasetExecuteStage lesson={lesson} implement={art("implement")}
                  onComplete={(a) => advance("execute", a)} />
              )}
              {currentStage === "reflect" && (
                <ReflectStage lesson={lesson} design={art("design")} saved={art("reflect")}
                  onComplete={(a) => advance("reflect", a)} onDraft={(a) => setArtifact("reflect", a)} />
              )}
              {currentStage === "generalize" && (
                <GeneralizeStage lesson={lesson} reflect={art("reflect")} saved={art("generalize")}
                  onComplete={(a) => advance("generalize", a)} onDraft={(a) => setArtifact("generalize", a)} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
