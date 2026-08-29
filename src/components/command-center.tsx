"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { TOPIC_LIST } from "@/data"
import { PATTERN_DIRECTORY } from "@/data/patterns"
import { systemScenarios } from "@/curriculum/topics/ai-ml/systems"
import { applyPreferences, loadPreferences, savePreferences } from "@/persistence/preferences"

type Command = {
  id: string
  title: string
  meta: string
  keywords: string
  href?: string
  action?: () => void
}

const PRESETS = [
  { id: "moss-technical", title: "Use Moss Technical atmosphere", values: { theme: "moss" as const, accent: "mint" as const, type: "technical" as const, density: "focused" as const, shape: "precise" as const, texture: "grid" as const } },
  { id: "classic", title: "Use Deriva Classic atmosphere", values: { theme: "paper" as const, accent: "cobalt" as const, type: "editorial" as const, density: "calm" as const, shape: "soft" as const, texture: "plain" as const } },
  { id: "field-notes", title: "Use Field Notes atmosphere", values: { theme: "moss" as const, accent: "mint" as const, type: "humanist" as const, density: "calm" as const, shape: "soft" as const, texture: "grid" as const } },
  { id: "night-lab", title: "Use Night Lab atmosphere", values: { theme: "violet" as const, accent: "violet" as const, type: "technical" as const, density: "focused" as const, shape: "precise" as const, texture: "grid" as const } },
]

export default function CommandCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const commands = useMemo<Command[]>(() => {
    const styleCommands: Command[] = PRESETS.map(preset => ({
      id: `style-${preset.id}`,
      title: preset.title,
      meta: "Settings · visual profile",
      keywords: "theme style color typography density",
      action: () => {
        const next = { ...loadPreferences(), ...preset.values }
        savePreferences(next)
        applyPreferences(next)
      },
    }))
    return [
      { id: "today", title: "Continue today's derivation", meta: "Learn · Stage 1–9", keywords: "lesson recursion derive", href: "/learn/trees/sum-1-to-n" },
      { id: "observatory", title: "Open Learning Observatory", meta: "Observe · your evidence", keywords: "progress mastery patterns systems", href: "/observatory" },
      { id: "one", title: "Open 0NE Ladder", meta: "Practice · 148 problems, zero to mastery", keywords: "one ladder dsa mastery complete linear greedy bits math strings dp design flow", href: "/one" },
      { id: "icpc", title: "Open ICPC Ladder", meta: "Practice · 91 contest problems", keywords: "icpc contest ladder competitive programming", href: "/icpc" },
      { id: "daily", title: "Open Daily Challenge", meta: "Habit · today's problem", keywords: "daily challenge today streak", href: "/daily" },
      { id: "review", title: "Open Review Queue", meta: "Memory · spaced repetition", keywords: "review flashcards spaced repetition patterns due", href: "/review" },
      { id: "contest", title: "Start a Contest", meta: "Pressure · 3 problems, one clock", keywords: "contest simulator timer virtual icpc", href: "/contest" },
      { id: "interview", title: "Enter Mock Interview", meta: "Pressure · hints locked", keywords: "interview mock practice timed rubric", href: "/interview" },
      { id: "cheatsheets", title: "Open Cheatsheet Hub", meta: "Reference · contest templates", href: "/cheatsheets", keywords: "cheatsheet templates binary search dsu dijkstra kmp reference" },
      { id: "atlas", title: "Open Algorithm Atlas", meta: "Watch · animated algorithms", keywords: "atlas visualize watch animation bubble merge sort bfs dfs dijkstra kadane call stack", href: "/atlas" },
      { id: "playground", title: "Open Playground", meta: "Sandbox · free Python", keywords: "playground sandbox run python free", href: "/playground" },
      { id: "complexity", title: "Open Complexity Lab", meta: "Measure · empirical Big-O", keywords: "complexity big-o benchmark measure timing performance", href: "/complexity" },
      { id: "notebook", title: "Open Notebook", meta: "Notes · all your theory", keywords: "notebook notes theory journal search", href: "/notebook" },
      { id: "toolkit", title: "Open Life Toolkit", meta: "Life · tasks focus habits utils", keywords: "toolkit tasks todo focus timer habits calculator converter regex json password utilities", href: "/toolkit" },
      { id: "releases", title: "See What's New", meta: "Releases · changelog", keywords: "releases changelog whats new updates", href: "/releases" },
      { id: "systems", title: "Enter Systems Atelier", meta: "AI/ML · incidents", keywords: "systems services queue retry failure", href: "/ai-ml/systems" },
      { id: "patterns", title: "Open Pattern Journal", meta: "Recall · transfer", keywords: "patterns recognition review", href: "/patterns" },
      { id: "glyph", title: "Open Glyph Studio", meta: "Studio · draw dot glyphs", keywords: "glyph studio dot matrix draw frames animation export png svg personal pack", href: "/glyph" },
      { id: "ghost", title: "Summon Ghost", meta: "Studio · offline AI tutor", keywords: "ghost ai tutor offline local llm chat hints socratic qwen wllama", href: "/ghost" },
      { id: "osc", title: "Play OSC-1", meta: "Studio · pocket synthesizer", keywords: "osc synth synthesizer music sequencer beats audio sound wave", href: "/osc" },
      { id: "settings", title: "Open workspace settings", meta: "Customize · PWA identity", keywords: "settings theme logo pwa", href: "/settings" },
      ...styleCommands,
      ...TOPIC_LIST.flatMap(topic => topic.problems.map(problem => ({
        id: `problem-${topic.id}-${problem.id}`,
        title: problem.title,
        meta: `${topic.name} · P${problem.id}${problem.difficulty ? ` · ${problem.difficulty}` : ""}`,
        keywords: `${problem.pattern} ${problem.skill} ${topic.name} ${problem.difficulty ?? ""} practice solve problem`,
        href: `/practice?topic=${topic.id}&problem=${problem.id}`,
      }))),
      ...TOPIC_LIST.map(topic => ({ id: `topic-${topic.id}`, title: topic.name, meta: `DSA · ${topic.problems.length} problems`, keywords: `topic ${topic.id} dsa`, href: `/topic/${topic.id}` })),
      ...PATTERN_DIRECTORY.map(pattern => ({ id: `pattern-${pattern.id}`, title: pattern.name, meta: `Pattern · ${pattern.family}`, keywords: `${pattern.family} ${pattern.cue} ${pattern.move}`, href: `/patterns?pattern=${pattern.id}` })),
      ...systemScenarios.map(scenario => ({ id: `system-${scenario.id}`, title: scenario.title, meta: `S${scenario.number} · ${scenario.thinkingMove}`, keywords: `${scenario.pitch} ${scenario.thinkingMove}`, href: `/ai-ml/systems/${scenario.id}` })),
    ]
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return commands.slice(0, 10)
    return commands.filter(command => `${command.title} ${command.meta} ${command.keywords}`.toLowerCase().includes(normalized)).slice(0, 14)
  }, [commands, query])

  useEffect(() => {
    if (!open) return
    setQuery("")
    setActiveIndex(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, Math.max(filtered.length - 1, 0))) }
      if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)) }
      if (event.key === "Enter" && filtered[activeIndex]) { event.preventDefault(); select(filtered[activeIndex]!) }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, filtered, activeIndex, onClose])

  const select = (command: Command) => {
    if (command.action) command.action()
    if (command.href) router.push(command.href)
    onClose()
  }

  if (!open) return null

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="command-center" role="dialog" aria-modal="true" aria-label="Command Center" onMouseDown={event => event.stopPropagation()}>
        <div className="command-input-wrap"><span aria-hidden="true">⌕</span><input ref={inputRef} value={query} onChange={event => { setQuery(event.target.value); setActiveIndex(0) }} placeholder="Search lessons, patterns, systems, or actions…" aria-label="Search Deriva" /><kbd>ESC</kbd></div>
        <div className="command-results" role="listbox" aria-label="Command results">
          {filtered.map((command, index) => <button type="button" role="option" aria-selected={index === activeIndex} key={command.id} className={`command-result${index === activeIndex ? " active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(command)}><span className="command-result-mark">{command.id.startsWith("style-") ? "✦" : command.id.startsWith("pattern-") ? "◆" : command.id.startsWith("system-") ? "◎" : command.id.startsWith("problem-") ? "#" : "→"}</span><span><strong>{command.title}</strong><small>{command.meta}</small></span><span className="command-result-enter">↵</span></button>)}
          {filtered.length === 0 && <p className="command-empty">No matching move. Try a problem name, a topic, a pattern, or “night lab”.</p>}
        </div>
        <footer className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></footer>
      </section>
    </div>
  )
}
