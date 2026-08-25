"use client"

import { useEffect, useState } from "react"
import { dayKey, lastNDays, loadHabits, saveHabits, type Habit } from "@/persistence/toolkit"

export default function HabitsTool() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [name, setName] = useState("")
  const [days, setDays] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHabits(loadHabits())
    setDays(lastNDays(7))
    setHydrated(true)
  }, [])

  const commit = (next: Habit[]) => {
    setHabits(next)
    saveHabits(next)
  }

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    commit([...habits, { id: `habit-${Date.now()}`, name: trimmed, days: {} }])
    setName("")
  }

  const toggleDay = (habitId: string, day: string) => {
    commit(habits.map(habit => {
      if (habit.id !== habitId) return habit
      const next = { ...habit.days }
      if (next[day]) delete next[day]
      else next[day] = true
      return { ...habit, days: next }
    }))
  }

  const remove = (habitId: string) => commit(habits.filter(habit => habit.id !== habitId))

  const today = dayKey()

  return (
    <div className="tool-body">
      <div className="tool-input-row">
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter") add() }}
          placeholder="New habit — e.g. one drill problem…"
          aria-label="New habit"
        />
        <button type="button" className="super-primary" onClick={add}>Add</button>
      </div>
      {hydrated && habits.length === 0 && <p className="tool-empty">No habits yet. Small daily reps beat heroic weekends.</p>}
      <div className="habit-list">
        {habits.map(habit => {
          const streak = (() => {
            let count = 0
            for (let i = days.length - 1; i >= 0; i--) {
              if (habit.days[days[i]]) count++
              else if (days[i] !== today) break
              else continue
            }
            return count
          })()
          return (
            <article key={habit.id} className="habit-row">
              <div className="habit-head">
                <strong>{habit.name}</strong>
                <div className="habit-head-actions">
                  <span className="habit-streak">{streak}d</span>
                  <button type="button" className="task-delete" onClick={() => remove(habit.id)} aria-label={`Delete ${habit.name}`}>×</button>
                </div>
              </div>
              <div className="habit-grid">
                {days.map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`habit-cell${habit.days[day] ? " done" : ""}${day === today ? " today" : ""}`}
                    onClick={() => toggleDay(habit.id, day)}
                    aria-label={`${habit.name} on ${day}${habit.days[day] ? " — done" : ""}`}
                    aria-pressed={Boolean(habit.days[day])}
                  >
                    {habit.days[day] ? "✓" : Number(day.slice(8))}
                  </button>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
