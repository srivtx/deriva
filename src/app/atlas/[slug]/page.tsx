"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { getAtlasAlgorithm } from "@/data/atlas"
import AtlasViewer from "@/components/atlas-viewer"

export default function AtlasAlgorithmPage() {
  const params = useParams()
  const slug = useMemo(() => String(params.slug ?? ""), [params.slug])
  const algorithm = useMemo(() => getAtlasAlgorithm(slug), [slug])

  if (!algorithm) {
    return (
      <main className="super-page">
        <section className="review-empty">
          <strong>That algorithm is not in the Atlas yet.</strong>
          <p>Pick another move from the index.</p>
          <div className="review-empty-actions">
            <Link className="super-primary" href="/atlas">Back to the Atlas <span aria-hidden="true">-&gt;</span></Link>
          </div>
        </section>
      </main>
    )
  }

  return <AtlasViewer algorithm={algorithm} />
}
