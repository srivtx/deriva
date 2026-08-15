"use client"

// /lab/[slug] — AI/ML lab lesson. DSA lessons stay on /learn/[topic]/[lesson].

import { useParams } from "next/navigation"
import { AiLabPage } from "@/learning/stages/ai/ai-page"

export default function LabLessonPage() {
  const params = useParams()
  return <AiLabPage topic="ai-ml" slug={params.slug as string} />
}
