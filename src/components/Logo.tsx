import { Link } from 'react-router-dom'

/** The brand mark — a gradient squircle with a glowing market curve + candles. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="shrink-0">
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="0.55" stopColor="#2d6cff" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="lm-line" x1="8" y1="28" x2="33" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a7f3d0" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <filter id="lm-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#lm-bg)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" stroke="#ffffff" strokeOpacity="0.14" />
      {/* candlesticks */}
      <g stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.4" strokeLinecap="round">
        <line x1="13" y1="23" x2="13" y2="31" />
        <line x1="20" y1="19" x2="20" y2="29" />
        <line x1="27" y1="14" x2="27" y2="25" />
      </g>
      {/* upward market curve */}
      <path d="M8 28 L16 22 L22 25 L32 12" stroke="url(#lm-line)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lm-glow)" />
      <circle cx="32" cy="12" r="3" fill="#ffffff" filter="url(#lm-glow)" />
      <circle cx="32" cy="12" r="1.3" fill="#2d6cff" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
      <span className="transition-transform group-hover:scale-105 group-active:scale-95">
        <LogoMark size={34} />
      </span>
      {!compact && (
        <span className="text-[20px] font-extrabold tracking-tight text-text leading-none">
          Poly<span className="bg-gradient-to-r from-brand to-[#8b5cf6] bg-clip-text text-transparent">market</span>
        </span>
      )}
    </Link>
  )
}
