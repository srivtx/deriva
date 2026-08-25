export interface ExpenseEntry {
  id: string
  amount: number
  category: string
  note: string
  date: string // YYYY-MM-DD
  type: "expense" | "income"
}

const KEY = "deriva-expenses-v1"

export const EXPENSE_CATS = ["Food", "Transport", "Bills", "Shopping", "Health", "Fun", "Other"]
export const INCOME_CATS = ["Salary", "Gift", "Savings", "Other"]

export function loadExpenses(): ExpenseEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as ExpenseEntry[] } catch { return [] }
}

export function saveExpenses(list: ExpenseEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function newId(): string {
  return `e${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
}
