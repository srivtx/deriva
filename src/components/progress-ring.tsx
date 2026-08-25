"use client"

type ProgressRingProps = {
  value: number
  size?: number
  stroke?: number
  label?: string
  sub?: string
}

export default function ProgressRing({ value, size = 76, stroke = 8, label, sub }: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Progress"}${sub ? ` ${sub}` : ""}: ${Math.round(clamped)} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-ring-fill"
        />
      </svg>
      <div className="progress-ring-text">
        <strong>{label ?? `${Math.round(clamped)}%`}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  )
}
