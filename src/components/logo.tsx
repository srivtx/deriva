type LogoProps = {
  size?: number
  variant?: "mark" | "wordmark"
  label?: string
  mark?: string
  imageUrl?: string
}

function Mark({ size, label, imageUrl }: { size: number; label: string; imageUrl?: string }) {
  if (imageUrl) return <img className="custom-logo-image" src={imageUrl} width={size} height={size} alt={`${label} logo`} />
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" role="img" aria-label={`${label} logo`}>
      <rect width="512" height="512" rx="112" fill="var(--accent)" />
      <path fill="var(--paper)" fillRule="evenodd" d="M128 256a128 128 0 1 0 256 0 128 128 0 1 0-256 0Zm64 0a64 64 0 1 1 128 0 64 64 0 1 1-128 0Zm128-152h64v304h-64z" />
      <path fill="var(--ink)" d="m96 368 272-272 48 48-272 272z" />
    </svg>
  )
}

export default function Logo({ size = 28, variant = "mark", label = "Deriva", imageUrl }: LogoProps) {
  if (variant === "wordmark") {
    return <span className="logo-wordmark"><Mark size={size} label={label} imageUrl={imageUrl} /><span>{label}</span></span>
  }
  return <Mark size={size} label={label} imageUrl={imageUrl} />
}
