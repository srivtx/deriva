"use client"

import { useState } from "react"

const UNITS: Record<string, { label: string; units: Record<string, number> }> = {
  length: {
    label: "Length",
    units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  },
  weight: {
    label: "Weight",
    units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523, t: 1000 },
  },
  data: {
    label: "Data",
    units: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  },
}

const TEMPS = ["°C", "°F", "K"]

function convertTemp(value: number, from: string, to: string): number {
  const celsius = from === "°C" ? value : from === "°F" ? (value - 32) * 5 / 9 : value - 273.15
  return to === "°C" ? celsius : to === "°F" ? celsius * 9 / 5 + 32 : celsius + 273.15
}

export default function ConverterTool() {
  const [category, setCategory] = useState<keyof typeof UNITS | "temp">("length")
  const [value, setValue] = useState("1")
  const [from, setFrom] = useState("m")
  const [to, setTo] = useState("km")

  const numeric = parseFloat(value)
  const valid = Number.isFinite(numeric)

  const unitNames = category === "temp" ? TEMPS : Object.keys(UNITS[category].units)
  const results = unitNames.filter(unit => unit !== from).map(unit => {
    let converted: number
    if (category === "temp") converted = convertTemp(numeric, from, unit)
    else converted = numeric * UNITS[category].units[from] / UNITS[category].units[unit]
    return { unit, text: Number(converted.toPrecision(8)).toString() }
  })

  const switchCategory = (next: keyof typeof UNITS | "temp") => {
    setCategory(next)
    const first = next === "temp" ? TEMPS[0] : Object.keys(UNITS[next].units)[0]
    const second = next === "temp" ? TEMPS[1] : Object.keys(UNITS[next].units)[1]
    setFrom(first)
    setTo(second)
  }

  return (
    <div className="tool-body">
      <div className="segmented" role="group" aria-label="Conversion category">
        {(["length", "weight", "data", "temp"] as const).map(option => (
          <button key={option} type="button" className={category === option ? "selected" : ""} onClick={() => switchCategory(option)}>
            {option === "temp" ? "Temp" : UNITS[option].label}
          </button>
        ))}
      </div>
      <div className="tool-input-row">
        <input
          value={value}
          onChange={event => setValue(event.target.value)}
          inputMode="decimal"
          aria-label="Value to convert"
        />
        <select value={from} onChange={event => setFrom(event.target.value)} aria-label="From unit">
          {unitNames.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select>
        <span className="converter-arrow">→</span>
        <select value={to} onChange={event => setTo(event.target.value)} aria-label="To unit">
          {unitNames.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select>
      </div>
      {!valid && <p className="tool-empty">Enter a number to convert.</p>}
      {valid && (
        <ul className="converter-results">
          {results.map(entry => (
            <li key={entry.unit}><strong>{entry.text}</strong><span>{entry.unit}</span></li>
          ))}
        </ul>
      )}
    </div>
  )
}
