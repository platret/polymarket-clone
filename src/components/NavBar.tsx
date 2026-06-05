import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { SettingsMenu } from './SettingsMenu'
import { AnimatedUsd } from './AnimatedNumber'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { portfolioSummary } from '../store/selectors'
import clsx from 'clsx'

export function NavBar() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const markets = useStore((s) => s.markets)
  const positions = useStore((s) => s.positions)
  const balance = useStore((s) => s.balance)
  const deposited = useStore((s) => s.deposited)
  const setFundsOpen = useUI((s) => s.setFundsOpen)

  const summary = portfolioSummary(markets, positions, balance, deposited)

  const onSearch = (v: string) => {
    setQ(v)
    nav(v ? `/?q=${encodeURIComponent(v)}` : '/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 bg-ink-900/85 backdrop-blur border-b border-ink-600">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 ml-2">
          <TopLink to="/" label="Markets" />
          <TopLink to="/portfolio" label="Portfolio" />
          <TopLink to="/leaderboard" label="Leaderboard" />
          <TopLink to="/activity" label="Activity" />
        </nav>

        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
            </svg>
            <input
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search markets, teams…"
              className="input pl-9 py-2 bg-ink-800 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setFundsOpen(true)}
            className="hidden sm:flex flex-col items-end px-3 py-1 rounded-lg hover:bg-ink-800 transition"
            title="Portfolio value"
          >
            <span className="text-[10px] uppercase tracking-wide text-text-faint leading-none">Portfolio</span>
            <AnimatedUsd value={summary.total} className="font-bold tabular-nums leading-tight" />
          </button>
          <button onClick={() => setFundsOpen(true)} className="flex flex-col items-end px-3 py-1 rounded-lg hover:bg-ink-800 transition" title="Cash balance">
            <span className="text-[10px] uppercase tracking-wide text-text-faint leading-none">Cash</span>
            <AnimatedUsd value={balance} className="font-bold tabular-nums leading-tight text-yes" />
          </button>
          <button onClick={() => setFundsOpen(true)} className="btn-brand px-3 py-2 text-sm">
            + Funds
          </button>
          <SettingsMenu />
          <Link
            to="/admin"
            className="btn-ghost px-3 py-2 text-sm border border-ink-600"
            title="Admin god-mode"
          >
            ⚙︎ <span className="hidden lg:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx('px-3 py-2 rounded-lg text-sm font-semibold transition',
          isActive ? 'text-text bg-ink-800' : 'text-text-muted hover:text-text')
      }
    >
      {label}
    </NavLink>
  )
}
