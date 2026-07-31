export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="Deriva logo">
      <rect x="2" y="2" width="44" height="44" rx="13" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="2" />
      <path d="M12 14h5v20h-5M36 14h-5v20h5" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 16.5 29 24 19 31.5" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="24" r="2.5" fill="var(--viz-settled)" />
    </svg>
  )
}
