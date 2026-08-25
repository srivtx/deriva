"use client"

import { useEffect, useMemo, useState } from "react"
import { loadEvents, newId, saveEvents, todayKey, type CalEvent } from "@/persistence/calendar"

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(todayKey())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [title, setTitle] = useState("")
  const [time, setTime] = useState("")
  const [note, setNote] = useState("")
  const [remind, setRemind] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [perm, setPerm] = useState<NotificationPermission>("default")

  useEffect(() => { setEvents(loadEvents()); setHydrated(true); if (typeof Notification !== "undefined") setPerm(Notification.permission) }, [])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const byDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>()
    for (const e of events) { (m.get(e.date) || m.set(e.date, []).get(e.date)!).push(e) }
    return m
  }, [events])

  const dayEvents = (byDate.get(selected) || []).slice().sort((a, b) => (a.time || "").localeCompare(b.time || ""))
  const todayEvents = (byDate.get(todayKey()) || []).length

  const move = (dir: number) => {
    const d = new Date(year, month + dir, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth())
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const ev: CalEvent = { id: newId(), date: selected, title: title.trim(), time: time || undefined, note: note.trim() || undefined, remind }
    const next = [...events, ev]
    setEvents(next); saveEvents(next)
    setTitle(""); setTime(""); setNote(""); setRemind(false)
    if (remind) {
      let p = perm
      if (typeof Notification !== "undefined" && Notification.permission === "default") p = await Notification.requestPermission()
      setPerm(p)
      if (p === "granted" && ev.time) {
        const [h, m] = ev.time.split(":").map(Number)
        const when = new Date(`${selected}T${ev.time}`)
        const delay = when.getTime() - Date.now()
        if (delay > 0) setTimeout(() => new Notification(ev.title, { body: ev.note || "Reminder", tag: ev.id }), delay)
      }
    }
  }

  const remove = (id: string) => { const next = events.filter(x => x.id !== id); setEvents(next); saveEvents(next) }

  return (
    <main className="super-page calendar-page">
      <header className="app-hero">
        <span className="super-kicker">CALENDAR</span>
        <h1>Plan your days</h1>
        <p>{todayEvents > 0 ? `${todayEvents} event${todayEvents > 1 ? "s" : ""} today.` : "Tap a date to add an event. Reminders fire while the app is open."}</p>
      </header>

      <section className="calendar-grid-wrap">
        <div className="calendar-nav">
          <button type="button" className="calendar-arrow" onClick={() => move(-1)} aria-label="Previous month">‹</button>
          <strong>{new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
          <button type="button" className="calendar-arrow" onClick={() => move(1)} aria-label="Next month">›</button>
        </div>
        <div className="calendar-grid">
          {WEEK.map(d => <span key={d} className="calendar-dow">{d}</span>)}
          {cells.map((d, i) => {
            if (d === null) return <span key={i} className="calendar-cell empty" />
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            const has = (byDate.get(key) || []).length > 0
            const isToday = key === todayKey()
            return (
              <button key={i} type="button" className={`calendar-cell${key === selected ? " selected" : ""}${isToday ? " today" : ""}`} onClick={() => setSelected(key)}>
                <span>{d}</span>
                {has && <i className="calendar-dot" />}
              </button>
            )
          })}
        </div>
      </section>

      <section className="calendar-day">
        <h2>{new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
        <form className="calendar-add" onSubmit={add}>
          <label className="super-field"><span>Title</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event name" /></label>
          <label className="super-field"><span>Time</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
          <label className="super-field"><span>Note</span><input value={note} onChange={e => setNote(e.target.value)} placeholder="optional" /></label>
          <button type="button" className={`cal-toggle${remind ? " on" : ""}`} onClick={() => setRemind(r => !r)} aria-pressed={remind}>
            <i aria-hidden="true">🔔</i> Remind me
          </button>
          <button type="submit" className="super-primary">Add event</button>
        </form>
        {dayEvents.length === 0 && <p className="calendar-empty">Nothing scheduled. Add something above.</p>}
        <ul className="calendar-events">
          {dayEvents.map(e => (
            <li key={e.id}>
              <div><strong>{e.time || "All day"}</strong><span> {e.title}</span>{e.note && <em> — {e.note}</em>}</div>
              <button type="button" className="calendar-del" onClick={() => remove(e.id)} aria-label="Delete">×</button>
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        .cal-toggle { grid-column: 1 / -1; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; transition: border-color var(--dur-fast), background var(--dur-fast), color var(--dur-fast); }
        .cal-toggle.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
        .cal-toggle i { font-style: normal; font-size: 14px; }
        .calendar-grid-wrap { padding: 14px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); }
        .calendar-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .calendar-nav strong { font: 700 15px var(--font-ui); }
        .calendar-arrow { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); font: 700 18px/1 var(--font-ui); cursor: pointer; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .calendar-dow { text-align: center; color: var(--ink-soft); font: 700 10px var(--font-ui); padding: 4px 0; }
        .calendar-cell { position: relative; aspect-ratio: 1; display: grid; place-items: center; border: 1px solid transparent; border-radius: 10px; background: var(--paper); color: var(--ink); font: 600 13px var(--font-ui); cursor: pointer; }
        .calendar-cell.empty { background: transparent; cursor: default; }
        .calendar-cell.today { border-color: var(--accent); }
        .calendar-cell.selected { background: var(--accent); color: var(--paper-raised); }
        .calendar-dot { position: absolute; bottom: 6px; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
        .calendar-cell.selected .calendar-dot { background: var(--paper-raised); }
        .calendar-day { margin-top: 16px; }
        .calendar-day h2 { margin: 0 0 12px; font: 700 18px var(--font-narrative); }
        .calendar-add { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; padding: 16px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); margin-bottom: 12px; }
        .calendar-add .super-primary { grid-column: 1 / -1; }
        .calendar-empty { color: var(--ink-soft); font: 13px var(--font-ui); }
        .calendar-events { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .calendar-events li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--paper-raised); }
        .calendar-events strong { font: 700 13px var(--font-mono); color: var(--accent); }
        .calendar-events span { font: 600 13px var(--font-ui); }
        .calendar-events em { color: var(--ink-soft); font: 12px var(--font-ui); }
        .calendar-del { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--viz-pruned); font: 700 16px/1 var(--font-ui); cursor: pointer; }
        @media (max-width: 480px) { .calendar-add { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  )
}
