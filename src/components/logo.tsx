type LogoProps = {
  size?: number
  variant?: "mark" | "wordmark"
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="Deriva logo">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--ink)" />
      <text x="24" y="36" textAnchor="middle" fill="var(--paper)" fontFamily="Georgia, Times New Roman, serif" fontSize="32" fontStyle="italic" fontWeight="700">d</text>
      <path d="M11 36 36 12" stroke="var(--accent)" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="36" cy="12" r="2.7" fill="var(--accent)" />
    </svg>
  )
}

export default function Logo({ size = 28, variant = "mark" }: LogoProps) {
  if (variant === "wordmark") {
    return <span className="logo-wordmark"><Mark size={size} /><span>Deriva</span></span>
  }
  return <Mark size={size} />
}
