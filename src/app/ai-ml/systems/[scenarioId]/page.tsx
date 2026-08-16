import { notFound } from "next/navigation"
import { systemScenarios } from "@/curriculum/topics/ai-ml/systems"
import { SystemScenarioStage } from "@/learning/stages/ai/system-scenario"

export default async function ScenarioPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params
  const scenario = systemScenarios.find(candidate => candidate.id === scenarioId)
  if (!scenario) notFound()
  return <SystemScenarioStage scenario={scenario} />
}
