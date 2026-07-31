export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="Deriva logo">
      <rect x="2" y="2" width="44" height="44" rx="13" fill="var(--ink)" />
      <path d="M15 12v24h7.2c7.6 0 12.8-4.6 12.8-12s-5.2-12-12.8-12H15Z" stroke="var(--paper)" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M11 34 19.5 27.5 26.5 29 37 14" stroke="var(--accent)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="34" r="2.7" fill="var(--paper)" />
      <circle cx="37" cy="14" r="2.7" fill="var(--accent)" />
    </svg>
  )
}
