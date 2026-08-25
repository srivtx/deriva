"use client"

import { useEffect, useState } from "react"
import { loadTasks, saveTasks, type Task } from "@/persistence/toolkit"

export default function TasksTool() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [text, setText] = useState("")
  const [filter, setFilter] = useState<"all" | "open" | "done">("all")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setTasks(loadTasks())
    setHydrated(true)
  }, [])

  const commit = (next: Task[]) => {
    setTasks(next)
    saveTasks(next)
  }

  const add = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    commit([{ id: `task-${Date.now()}`, text: trimmed, done: false, createdAt: Date.now() }, ...tasks])
    setText("")
  }

  const toggle = (id: string) => commit(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task))
  const remove = (id: string) => commit(tasks.filter(task => task.id !== id))

  const visible = tasks.filter(task => filter === "all" ? true : filter === "done" ? task.done : !task.done)
  const openCount = tasks.filter(task => !task.done).length

  return (
    <div className="tool-body">
      <div className="tool-input-row">
        <input
          value={text}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter") add() }}
          placeholder="Add a task…"
          aria-label="New task"
        />
        <button type="button" className="super-primary" onClick={add}>Add</button>
      </div>
      <div className="segmented" role="group" aria-label="Filter tasks">
        {(["all", "open", "done"] as const).map(option => (
          <button key={option} type="button" className={filter === option ? "selected" : ""} onClick={() => setFilter(option)}>{option === "all" ? `All ${tasks.length}` : option === "open" ? `Open ${openCount}` : `Done ${tasks.length - openCount}`}</button>
        ))}
      </div>
      <ul className="task-list">
        {visible.map(task => (
          <li key={task.id} className={task.done ? "done" : ""}>
            <button type="button" className="task-check" onClick={() => toggle(task.id)} aria-label={task.done ? "Mark open" : "Mark done"} aria-pressed={task.done}>{task.done ? "✓" : ""}</button>
            <span className="task-text">{task.text}</span>
            <button type="button" className="task-delete" onClick={() => remove(task.id)} aria-label="Delete task">×</button>
          </li>
        ))}
      </ul>
      {hydrated && visible.length === 0 && <p className="tool-empty">{filter === "done" ? "Nothing done yet." : filter === "open" ? "All clear — nothing open." : "No tasks yet. Add your first one above."}</p>}
    </div>
  )
}
