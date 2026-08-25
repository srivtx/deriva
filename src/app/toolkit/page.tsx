"use client"

import { useEffect, useState } from "react"
import TasksTool from "@/components/toolkit/tasks-tool"
import FocusTool from "@/components/toolkit/focus-tool"
import HabitsTool from "@/components/toolkit/habits-tool"
import CalcTool from "@/components/toolkit/calc-tool"
import ConverterTool from "@/components/toolkit/converter-tool"
import RegexTool from "@/components/toolkit/regex-tool"
import JsonTool from "@/components/toolkit/json-tool"
import PasswordTool from "@/components/toolkit/password-tool"

const TOOLS = [
  { id: "tasks", name: "Tasks", desc: "today's list", glyph: "☑" },
  { id: "focus", name: "Focus", desc: "25/5 timer", glyph: "◔" },
  { id: "habits", name: "Habits", desc: "daily reps", glyph: "▦" },
  { id: "calc", name: "Calculator", desc: "safe math", glyph: "±" },
  { id: "converter", name: "Converter", desc: "units + temp", glyph: "⇄" },
  { id: "regex", name: "Regex", desc: "live tester", glyph: ".*" },
  { id: "json", name: "JSON", desc: "format + check", glyph: "{}" },
  { id: "password", name: "Password", desc: "local generator", glyph: "🔑" },
] as const

type ToolId = (typeof TOOLS)[number]["id"]
const LAST_KEY = "deriva-toolkit-tab-v1"

export default function ToolkitPage() {
  const [active, setActive] = useState<ToolId>("tasks")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get("tool") as ToolId | null
      const saved = localStorage.getItem(LAST_KEY) as ToolId | null
      if (requested && TOOLS.some(tool => tool.id === requested)) setActive(requested)
      else if (saved && TOOLS.some(tool => tool.id === saved)) setActive(saved)
    } catch {}
    setHydrated(true)
  }, [])

  const select = (id: ToolId) => {
    setActive(id)
    try { localStorage.setItem(LAST_KEY, id) } catch {}
  }

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">LIFE TOOLKIT / EVERYDAY UTILITIES</span>
          <h1>The everyday half of a super app.</h1>
          <p>Tasks, focus sessions, habits, and the small utilities you otherwise open five other apps for — all local, all offline, all yours.</p>
        </div>
        <div className="contest-history-signal" aria-label="Tool count">
          <span>TOOLS</span>
          <strong>{TOOLS.length}</strong>
          <small>zero accounts</small>
        </div>
      </section>

      <div className="toolkit-tabs" role="tablist" aria-label="Toolkit tools">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            type="button"
            role="tab"
            aria-selected={active === tool.id}
            className={`toolkit-tab${active === tool.id ? " active" : ""}`}
            onClick={() => select(tool.id)}
          >
            <span className="toolkit-tab-glyph" aria-hidden="true">{tool.glyph}</span>
            <strong>{tool.name}</strong>
            <small>{tool.desc}</small>
          </button>
        ))}
      </div>

      <section className="toolkit-panel" aria-label={`${active} tool`}>
        {active === "tasks" && <TasksTool />}
        {active === "focus" && <FocusTool />}
        {active === "habits" && <HabitsTool />}
        {active === "calc" && <CalcTool />}
        {active === "converter" && <ConverterTool />}
        {active === "regex" && <RegexTool />}
        {active === "json" && <JsonTool />}
        {active === "password" && <PasswordTool />}
      </section>

      <p className="playground-elapsed">Everything in the toolkit lives in this browser only — export a backup from Settings anytime.</p>
    </main>
  )
}
