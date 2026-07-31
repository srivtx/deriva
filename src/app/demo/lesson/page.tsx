"use client"

// The demo scaffold is superseded by the reference lesson (docs/12).

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DemoLessonPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/learn/trees/sum-1-to-n")
  }, [router])
  return null
}
