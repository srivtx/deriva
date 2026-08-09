type LogoProps = {
  size?: number
  variant?: "mark" | "wordmark"
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="Deriva logo">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--ink)" />
      <path d="M24 12v11M24 23 14 35M24 23l10 12" stroke="var(--paper)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="12" r="4" fill="var(--accent)" />
      <circle cx="24" cy="23" r="3.2" fill="var(--paper)" />
      <circle cx="14" cy="35" r="3.2" fill="var(--accent)" />
      <circle cx="34" cy="35" r="3.2" fill="var(--accent)" />
      <path d="M11 12h6M31 12h6" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ size = 28, variant = "mark" }: LogoProps) {
  if (variant === "wordmark") {
    return <span className="logo-wordmark"><Mark size={size} /><span>Deriva</span></span>
  }
  return <Mark size={size} />
}
