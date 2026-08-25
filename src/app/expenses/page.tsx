"use client"

import { useEffect, useMemo, useState } from "react"
import { EXPENSE_CATS, INCOME_CATS, formatMoney, loadExpenses, monthKey, newId, saveExpenses, type ExpenseEntry } from "@/persistence/expenses"

export default function ExpensesPage() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(EXPENSE_CATS[0])
  const [note, setNote] = useState("")
  const [type, setType] = useState<"expense" | "income">("expense")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setEntries(loadExpenses()); setHydrated(true) }, [])

  const persist = (next: ExpenseEntry[]) => { setEntries(next); saveExpenses(next) }

  const month = monthKey()
  const monthEntries = useMemo(() => entries.filter(e => e.date.startsWith(month)), [entries, month])
  const spent = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0)
  const earned = monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0)

  const breakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of monthEntries) if (e.type === "expense") map.set(e.category, (map.get(e.category) || 0) + e.amount)
    const max = Math.max(1, ...map.values())
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([cat, val]) => ({ cat, val, pct: (val / max) * 100 }))
  }, [monthEntries])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    persist([{ id: newId(), amount: amt, category, note: note.trim(), date: new Date().toISOString().slice(0, 10), type }, ...entries])
    setAmount(""); setNote("")
  }

  const remove = (id: string) => persist(entries.filter(x => x.id !== id))

  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  return (
    <main className="super-page expense-page">
      <span className="super-kicker">EXPENSE TRACKER</span>
      <h1 className="expense-title">Where the money goes</h1>

      <section className="expense-summary">
        <div className="expense-stat"><span>Spent this month</span><strong>{formatMoney(spent)}</strong></div>
        <div className="expense-stat"><span>Earned</span><strong>{formatMoney(earned)}</strong></div>
        <div className="expense-stat"><span>Net</span><strong className={earned - spent >= 0 ? "pos" : "neg"}>{formatMoney(earned - spent)}</strong></div>
      </section>

      <form className="expense-form" onSubmit={add}>
        <div className="expense-type">
          <button type="button" className={type === "expense" ? "active" : ""} onClick={() => { setType("expense"); setCategory(EXPENSE_CATS[0]) }}>Expense</button>
          <button type="button" className={type === "income" ? "active" : ""} onClick={() => { setType("income"); setCategory(INCOME_CATS[0]) }}>Income</button>
        </div>
        <label className="super-field"><span>Amount</span>
          <input type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </label>
        <label className="super-field"><span>Category</span>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {(type === "expense" ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="super-field"><span>Note</span>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
        </label>
        <button type="submit" className="super-primary">Add</button>
      </form>

      {breakdown.length > 0 && (
        <section className="expense-breakdown">
          <span className="super-kicker">BY CATEGORY · THIS MONTH</span>
          {breakdown.map(b => (
            <div key={b.cat} className="expense-bar">
              <span className="expense-bar-label">{b.cat}</span>
              <div className="expense-bar-track"><div className="expense-bar-fill" style={{ width: `${b.pct}%` }} /></div>
              <span className="expense-bar-val">{formatMoney(b.val)}</span>
            </div>
          ))}
        </section>
      )}

      {hydrated && recent.length > 0 && (
        <section className="expense-list">
          <span className="super-kicker">RECENT</span>
          <ul>
            {recent.map(e => (
              <li key={e.id}>
                <div><strong>{e.category}</strong>{e.note && <span> · {e.note}</span>}</div>
                <div className="expense-list-right">
                  <span className={e.type === "income" ? "pos" : "neg"}>{e.type === "income" ? "+" : "−"}{formatMoney(e.amount)}</span>
                  <button type="button" className="expense-del" onClick={() => remove(e.id)} aria-label="Delete">×</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <style>{`
        .expense-title { margin: 6px 0 14px; font: 700 clamp(24px, 5vw, 36px)/1.02 var(--font-narrative); letter-spacing: -.03em; }
        .expense-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .expense-stat { padding: 14px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 4px); background: var(--paper-raised); display: grid; gap: 4px; min-width: 0; }
        .expense-stat span { color: var(--ink-soft); font: 700 9px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; }
        .expense-stat strong { font: 700 clamp(15px, 4.6vw, 20px)/1 var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .expense-stat .pos { color: var(--viz-settled); }
        .expense-stat .neg { color: var(--viz-pruned); }
        .expense-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; padding: 16px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); }
        .expense-type { grid-column: 1 / -1; display: flex; gap: 8px; }
        .expense-type button { flex: 1; min-height: 42px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; }
        .expense-type button.active { border-color: var(--accent); background: var(--accent); color: var(--paper-raised); }
        .expense-form .super-primary { grid-column: 1 / -1; }
        .expense-breakdown { margin-top: 16px; display: grid; gap: 8px; }
        .expense-bar { display: grid; grid-template-columns: 84px 1fr 78px; align-items: center; gap: 10px; }
        .expense-bar-label { font: 600 12px var(--font-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .expense-bar-track { height: 10px; border-radius: 6px; background: var(--line); overflow: hidden; }
        .expense-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--viz-settled))); border-radius: 6px; }
        .expense-bar-val { font: 600 11px var(--font-mono); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .expense-list { margin-top: 16px; }
        .expense-list ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
        .expense-list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--paper-raised); }
        .expense-list li strong { font: 700 13px var(--font-ui); }
        .expense-list li span { color: var(--ink-soft); font: 12px var(--font-ui); }
        .expense-list-right { display: flex; align-items: center; gap: 8px; }
        .expense-list-right .pos { color: var(--viz-settled); font: 700 14px var(--font-mono); }
        .expense-list-right .neg { color: var(--ink); font: 700 14px var(--font-mono); }
        .expense-del { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--viz-pruned); font: 700 16px/1 var(--font-ui); cursor: pointer; }
        @media (max-width: 480px) { .expense-form { grid-template-columns: 1fr; } .expense-bar { grid-template-columns: 64px 1fr 64px; } }
      `}</style>
    </main>
  )
}
