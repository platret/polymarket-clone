import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0 group">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15 L10 9 L14 13 L20 6" />
          <circle cx="20" cy="6" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[19px] font-extrabold tracking-tight text-text">
          Poly<span className="text-brand">market</span>
        </span>
      )}
    </Link>
  )
}
