type LogoProps = {
  size?: number
  variant?: "mark" | "wordmark"
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="Deriva logo">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--ink)" />
      <path d="M14 12.5h8.1c7.4 0 12.1 4.4 12.1 11.5s-4.7 11.5-12.1 11.5H14v-23Z" stroke="var(--paper)" strokeWidth="3.1" strokeLinejoin="round" />
      <path d="M10.5 34 18.5 27.5 25 30 37.5 14" stroke="var(--accent)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10.5" cy="34" r="2.5" fill="var(--paper)" />
      <circle cx="25" cy="30" r="2.5" fill="var(--accent)" />
      <circle cx="37.5" cy="14" r="2.5" fill="var(--accent)" />
    </svg>
  )
}

export default function Logo({ size = 28, variant = "mark" }: LogoProps) {
  if (variant === "wordmark") {
    return <span className="logo-wordmark"><Mark size={size} /><span>Deriva</span></span>
  }
  return <Mark size={size} />
}
