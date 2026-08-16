type LogoProps = {
  size?: number
  variant?: "mark" | "wordmark"
  label?: string
  mark?: string
  imageUrl?: string
}

function Mark({ size, label, mark, imageUrl }: { size: number; label: string; mark: string; imageUrl?: string }) {
  if (imageUrl) return <img className="custom-logo-image" src={imageUrl} width={size} height={size} alt={`${label} logo`} />
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label={`${label} logo`}>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--ink)" />
      <text x="24" y="36" textAnchor="middle" fill="var(--paper)" fontFamily="Georgia, Times New Roman, serif" fontSize="32" fontStyle="italic" fontWeight="700">{mark}</text>
      <path d="M11 36 36 12" stroke="var(--accent)" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="36" cy="12" r="2.7" fill="var(--accent)" />
    </svg>
  )
}

export default function Logo({ size = 28, variant = "mark", label = "Deriva", mark = "d", imageUrl }: LogoProps) {
  if (variant === "wordmark") {
    return <span className="logo-wordmark"><Mark size={size} label={label} mark={mark} imageUrl={imageUrl} /><span>{label}</span></span>
  }
  return <Mark size={size} label={label} mark={mark} imageUrl={imageUrl} />
}
