"use client"

import { useEffect, useRef, useState } from "react"

interface Option { value: string; label: string }

export default function PickList({
  value, options, onChange, label,
}: {
  value: string
  options: Option[]
  onChange: (value: string) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])

  const current = options.find(option => option.value === value)

  return (
    <div className="pick-list" ref={ref}>
      {label && <span className="pick-label">{label}</span>}
      <button type="button" className="pick-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>{current?.label ?? value}</span>
        <i aria-hidden="true">⌄</i>
      </button>
      {open && (
        <div className="pick-menu" role="listbox" aria-label={label}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`pick-option${option.value === value ? " selected" : ""}`}
              onClick={() => { onChange(option.value); setOpen(false) }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
