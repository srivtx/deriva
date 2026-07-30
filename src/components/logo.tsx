export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Deriva logo">
      <defs>
        <linearGradient id="deriva-g" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="30%" stopColor="#fa7e1e" />
          <stop offset="55%" stopColor="#d62976" />
          <stop offset="80%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#deriva-g)" />
      <path
        d="M30.5 9 C28 12.8, 24.8 15.2, 21.2 16.8 C16.8 18.8, 14 22.6, 14 27.2 C14 33.6, 18.6 38.6, 24.6 38.6 C30.6 38.6, 34.4 34, 34.4 28 C34.4 22.4, 30.6 18.4, 25.8 18.4 C23.2 18.4, 21 19.6, 19.6 21.6"
        stroke="white" strokeWidth="3.4" strokeLinecap="round" fill="none"
      />
    </svg>
  )
}
