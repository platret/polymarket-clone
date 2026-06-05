import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { useNow } from '../hooks/useNow'
import { PositionsTable } from '../components/PositionsTable'
import { ActivityFeed } from '../components/ActivityFeed'
import { portfolioSummary } from '../store/selectors'
import { usd } from '../lib/format'
import clsx from 'clsx'

export function PortfolioPage() {
  const markets = useStore((s) => s.markets)
  const positions = useStore((s) => s.positions)
  const balance = useStore((s) => s.balance)
  const deposited = useStore((s) => s.deposited)
  const trades = useStore((s) => s.trades)
  const setFundsOpen = useUI((s) => s.setFundsOpen)
  const now = useNow(1000)

  const s = portfolioSummary(markets, positions, balance, deposited)
  const myTrades = trades.filter((t) => t.by === 'You' || t.by.startsWith('Redeem'))

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Portfolio</h1>
        <button onClick={() => setFundsOpen(true)} className="btn-brand px-4 py-2 text-sm">+ Add funds</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Portfolio value" value={usd(s.total)} big />
        <Stat label="Cash" value={usd(s.balance)} />
        <Stat label="In positions" value={usd(s.positionsValue)} />
        <Stat label="Total P&L" value={usd(s.totalPnl, { sign: true })} tone={s.totalPnl >= 0 ? 'up' : 'down'} sub={`${((s.totalPnl / (s.deposited || 1)) * 100).toFixed(1)}% all-time`} />
      </div>

      <h2 className="font-bold mb-3">Positions</h2>
      <PositionsTable />

      <h2 className="font-bold mt-8 mb-3">Your trade history</h2>
      <div className="card p-4">
        <ActivityFeed trades={myTrades} now={now} limit={60} />
      </div>
    </div>
  )
}

function Stat({ label, value, sub, big, tone }: { label: string; value: string; sub?: string; big?: boolean; tone?: 'up' | 'down' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-text-faint uppercase tracking-wide">{label}</div>
      <div className={clsx('font-extrabold tabular-nums mt-1', big ? 'text-2xl' : 'text-xl',
        tone === 'up' && 'text-yes', tone === 'down' && 'text-no')}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
