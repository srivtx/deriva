"use client"

import { useEffect, useState } from "react"

interface Coords { lat: number; lon: number; name: string }
interface Day { date: string; code: number; tmax: number; tmin: number }
interface WeatherData { current: { temp: number; code: number; wind: number; humidity: number }; days: Day[] }

const CODE: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear", icon: "☀️" }, 1: { label: "Mainly clear", icon: "🌤️" }, 2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" }, 45: { label: "Fog", icon: "🌫️" }, 48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" }, 53: { label: "Drizzle", icon: "🌦️" }, 55: { label: "Dense drizzle", icon: "🌦️" },
  61: { label: "Light rain", icon: "🌧️" }, 63: { label: "Rain", icon: "🌧️" }, 65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" }, 73: { label: "Snow", icon: "🌨️" }, 75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" }, 81: { label: "Rain showers", icon: "🌧️" }, 82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" }, 96: { label: "Thunderstorm + hail", icon: "⛈️" }, 99: { label: "Thunderstorm + hail", icon: "⛈️" },
}

function info(code: number) { return CODE[code] ?? { label: "Unknown", icon: "🌡️" } }

const DEFAULT: Coords = { lat: 37.7749, lon: -122.4194, name: "San Francisco" }

export default function WeatherPage() {
  const [coords, setCoords] = useState<Coords>(DEFAULT)
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [fahrenheit, setFahrenheit] = useState(false)
  const [locating, setLocating] = useState(false)

  const conv = (c: number) => Math.round(fahrenheit ? (c * 9) / 5 + 32 : c)

  const fetchWeather = async (c: Coords) => {
    setLoading(true); setError("")
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      const res = await fetch(url)
      const j = await res.json()
      const wd: WeatherData = {
        current: { temp: j.current.temperature_2m, code: j.current.weather_code, wind: j.current.wind_speed_10m, humidity: j.current.relative_humidity_2m },
        days: j.daily.time.map((d: string, i: number) => ({ date: d, code: j.daily.weather_code[i], tmax: j.daily.temperature_2m_max[i], tmin: j.daily.temperature_2m_min[i] })),
      }
      setData(wd); setCoords(c)
      try { localStorage.setItem("deriva-weather-cache", JSON.stringify({ c, wd, ts: Date.now() })) } catch {}
    } catch {
      setError("Couldn't load weather. Check your connection.")
    } finally { setLoading(false) }
  }

  useEffect(() => {
    let cached: { c: Coords; wd: WeatherData; ts: number } | null = null
    try { const raw = localStorage.getItem("deriva-weather-cache"); if (raw) cached = JSON.parse(raw) } catch {}
    if (cached && Date.now() - cached.ts < 30 * 60_000) {
      setCoords(cached.c); setData(cached.wd); setLoading(false); return
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather({ lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), name: "Your location" }),
        () => fetchWeather(cached?.c ?? DEFAULT),
        { timeout: 6000 },
      )
    } else { fetchWeather(cached?.c ?? DEFAULT) }
  }, [])

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLocating(true)
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`)
      const j = await r.json()
      if (j.results?.length) {
        const g = j.results[0]
        await fetchWeather({ lat: g.latitude, lon: g.longitude, name: `${g.name}${g.country ? ", " + g.country : ""}` })
      } else { setError("No city found.") }
    } catch { setError("Search failed.") } finally { setLocating(false) }
  }

  const refresh = () => fetchWeather(coords)

  return (
    <main className="super-page weather-page">
      <div className="weather-top">
        <div>
          <span className="super-kicker">WEATHER</span>
          <h1 className="weather-loc">{coords.name}</h1>
        </div>
        <div className="weather-top-actions">
          <button type="button" className="weather-mini" onClick={() => setFahrenheit(f => !f)}>{fahrenheit ? "°F" : "°C"}</button>
          <button type="button" className="weather-mini" onClick={refresh} aria-label="Refresh">↻</button>
        </div>
      </div>

      <form className="weather-search" onSubmit={search}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a city…" aria-label="Search city" />
        <button type="submit" className="super-primary" disabled={locating}>{locating ? "…" : "Go"}</button>
      </form>

      {error && <p className="weather-error">{error}</p>}
      {loading && <div className="page-loading">Loading forecast…</div>}

      {data && (
        <>
          <section className="weather-now">
            <div className="weather-now-icon" aria-hidden="true">{info(data.current.code).icon}</div>
            <div className="weather-now-temp">{conv(data.current.temp)}°</div>
            <div className="weather-now-meta">
              <span>{info(data.current.code).label}</span>
              <span>Wind {Math.round(data.current.wind)} km/h · Humidity {data.current.humidity}%</span>
            </div>
          </section>

          <section className="weather-days">
            {data.days.map((d, i) => {
              const dt = new Date(d.date)
              const label = i === 0 ? "Today" : dt.toLocaleDateString(undefined, { weekday: "short" })
              const w = info(d.code)
              return (
                <div key={d.date} className="weather-day">
                  <span className="weather-day-name">{label}</span>
                  <span className="weather-day-icon" aria-hidden="true">{w.icon}</span>
                  <span className="weather-day-label">{w.label}</span>
                  <span className="weather-day-temp">{conv(d.tmin)}° / {conv(d.tmax)}°</span>
                </div>
              )
            })}
          </section>
        </>
      )}

      <p className="weather-foot">Forecast by Open-Meteo. Position is used only to fetch weather and is never stored or uploaded.</p>

      <style>{`
        .weather-loc { margin: 4px 0 0; font: 700 clamp(24px, 5vw, 34px)/1 var(--font-narrative); }
        .weather-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .weather-top-actions { display: flex; gap: 8px; }
        .weather-mini { min-height: 38px; min-width: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-raised); color: var(--ink); font: 600 13px var(--font-ui); cursor: pointer; }
        .weather-search { display: flex; gap: 8px; margin: 14px 0; }
        .weather-search input { flex: 1; min-height: 42px; padding: 0 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: 600 14px var(--font-ui); }
        .weather-error { color: var(--viz-pruned); font: 600 13px var(--font-ui); }
        .weather-now { display: flex; align-items: center; gap: 16px; padding: 22px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 8px); background: radial-gradient(circle at 85% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 50%), var(--paper-raised); box-shadow: var(--shadow-raised); }
        .weather-now-icon { font-size: 56px; line-height: 1; }
        .weather-now-temp { font: 700 clamp(44px, 12vw, 72px)/1 var(--font-mono); letter-spacing: -.03em; }
        .weather-now-meta { display: grid; gap: 3px; }
        .weather-now-meta span:first-child { font: 700 16px var(--font-ui); }
        .weather-now-meta span:last-child { color: var(--ink-soft); font: 12px var(--font-ui); }
        .weather-days { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 10px; margin-top: 14px; }
        .weather-day { display: grid; gap: 4px; justify-items: center; padding: 14px 8px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 2px); background: var(--paper-raised); text-align: center; }
        .weather-day-name { font: 700 12px var(--font-ui); }
        .weather-day-icon { font-size: 26px; }
        .weather-day-label { color: var(--ink-soft); font: 10px/1.3 var(--font-ui); min-height: 26px; }
        .weather-day-temp { font: 600 12px var(--font-mono); }
        .weather-foot { margin-top: 16px; color: var(--ink-soft); font: 11px/1.5 var(--font-ui); }
        @media (max-width: 480px) { .weather-now { flex-direction: column; text-align: center; } }
      `}</style>
    </main>
  )
}
