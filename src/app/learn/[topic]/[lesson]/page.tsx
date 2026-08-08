"use client"

// /learn/[topic]/[lesson] — the 9-stage lesson experience (the product).
// Phone-first: horizontal stepper, one task per screen, primary action pinned
// above the tab bar. Progress + artifacts persist locally; resume anywhere.

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getLessonByRoute } from "@/curriculum"
import { useStageMachine, StageNames, type StageName, type StageArtifacts } from "@/learning/flow/stage-machine"
import { StageRail, StageStepper } from "@/learning/flow/stage-rail"
import { loadLessonProgress, saveLessonProgress, recordProbeAttempt } from "@/persistence/lesson-progress"
import { UnderstandStage } from "@/learning/stages/understand"
import { PlayStage } from "@/learning/stages/play"
import { ReasonStage } from "@/learning/stages/reason"
import { DiscoverStage } from "@/learning/stages/discover"
import { DesignStage } from "@/learning/stages/design"
import { ImplementStage } from "@/learning/stages/implement"
import { ExecuteStage } from "@/learning/stages/execute"
import { ReflectStage } from "@/learning/stages/reflect"
import { GeneralizeStage } from "@/learning/stages/generalize"

export default function LessonPage() {
  const params = useParams()
  const topic = params.topic as string
  const slug = params.lesson as string
  const lesson = useMemo(() => getLessonByRoute(topic, slug), [topic, slug])

  const machine = useStageMachine()
  const { currentStage, stages, init, completeStage, setArtifact, enterStage } = machine

  // Hydrate once per lesson
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

  // Persist on every change
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

  if (!lesson) {
    return (
      <div className="lesson-missing">
        <h2>Lesson not found</h2>
        <Link href="/">← Back to the curriculum</Link>
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
          topic={lesson.topic}
          lessonTitle={lesson.title}
          patternName={stages.reflect.completed ? patternName : undefined}
        />
        <main className="lesson-surface">
          {finished && currentStage === "generalize" ? (
            <div className="lesson-complete">
              <span className="discovery-kicker">✦ Lesson complete</span>
              <h1 className="stage-title">The recursion reflex is yours.</h1>
              <p className="narrative">
                You predicted, touched, reasoned, constructed, specified, coded, watched,
                and named. Tomorrow&rsquo;s you meets this leap again — in factorial, and
                then in every tree you&rsquo;ll ever climb.
              </p>
              <div className="lesson-complete-actions">
                <Link href="/patterns" className="btn-primary as-link">See your pattern journal →</Link>
                <Link href="/topic/trees" className="btn-ghost as-link">Continue Trees practice</Link>
              </div>
            </div>
          ) : (
            <>
              {currentStage === "understand" && (
                <UnderstandStage lesson={lesson} saved={art("understand")}
                  onComplete={(a) => advance("understand", a)} onDraft={(a) => setArtifact("understand", a)} onProbePass={() => probePass("understand")} />
              )}
              {currentStage === "play" && (
                <PlayStage lesson={lesson} saved={art("play")}
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
                <ExecuteStage lesson={lesson} implement={art("implement")}
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
