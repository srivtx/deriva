type LogoProps = {
  size?: number
  variant?: "mark" | "wordmark"
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="Deriva logo">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--ink)" />
      <path d="m11 35 13-24 13 24H11Z" stroke="var(--paper)" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M15 31.5 21 25l5 3.5L35 17" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="31.5" r="2.6" fill="var(--paper)" />
      <circle cx="21" cy="25" r="2.6" fill="var(--accent)" />
      <circle cx="26" cy="28.5" r="2.6" fill="var(--accent)" />
      <circle cx="35" cy="17" r="2.6" fill="var(--accent)" />
    </svg>
  )
}

export default function Logo({ size = 28, variant = "mark" }: LogoProps) {
  if (variant === "wordmark") {
    return <span className="logo-wordmark"><Mark size={size} /><span>Deriva</span></span>
  }
  return <Mark size={size} />
}
