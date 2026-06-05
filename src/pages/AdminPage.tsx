import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { useNow } from '../hooks/useNow'
import { LEAGUES } from '../lib/espn'
import { AdminMarketRow } from '../components/AdminMarketRow'
import { usd } from '../lib/format'
import clsx from 'clsx'

export function AdminPage() {
  const markets = useStore((s) => s.markets)
  const settings = useStore((s) => s.settings)
  const toggleBots = useStore((s) => s.toggleBots)
  const setLiquidity = useStore((s) => s.setLiquidity)
  const setLeagues = useStore((s) => s.setLeagues)
  const refresh = useStore((s) => s.refresh)
  const balance = useStore((s) => s.balance)
  const positions = useStore((s) => s.positions)
  const setFundsOpen = useUI((s) => s.setFundsOpen)
  const now = useNow(1000)

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'open' | 'all'>('open')

  const visible = useMemo(() => {
    return markets
      .filter((m) => (filter === 'all' ? true : !m.resolved))
      .filter((m) => !q || `${m.question} ${m.shortName} ${m.leagueLabel}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a.resolved ? 1 : 0) - (b.resolved ? 1 : 0) || a.startTime - b.startTime)
  }, [markets, filter, q])

  const toggleLeague = (key: string) => {
    const has = settings.leagues.includes(key)
    setLeagues(has ? settings.leagues.filter((k) => k !== key) : [...settings.leagues, key])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">⚙️</span>
        <h1 className="text-2xl font-extrabold tracking-tight">Admin god-mode</h1>
      </div>
      <p className="text-text-muted text-sm mb-6">Force outcomes, bend prices, fuel volume, and tune the simulation. You hold {usd(balance)} cash across {positions.length} positions.</p>

      {/* control deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {/* simulation */}
        <div className="card p-4">
          <h2 className="font-bold mb-3 text-sm uppercase tracking-wide text-text-muted">Simulation</h2>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm">Bot traders</span>
            <Switch on={settings.botsEnabled} onClick={toggleBots} />
          </label>
          <div className="py-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Liquidity (b)</span>
              <span className="tabular-nums font-bold">{settings.liquidity}</span>
            </div>
            <input type="range" min={500} max={10000} step={100} value={settings.liquidity}
              onChange={(e) => setLiquidity(Number(e.target.value))} className="w-full accent-brand" />
            <p className="text-[11px] text-text-faint mt-1">Higher = deeper book, smaller price moves. Affects new/refreshed markets.</p>
          </div>
        </div>

        {/* leagues */}
        <div className="card p-4">
          <h2 className="font-bold mb-3 text-sm uppercase tracking-wide text-text-muted">Leagues</h2>
          <div className="flex flex-wrap gap-1.5">
            {LEAGUES.map((l) => {
              const on = settings.leagues.includes(l.key)
              return (
                <button key={l.key} onClick={() => toggleLeague(l.key)}
                  className={clsx('pill px-2.5 py-1 text-xs border',
                    on ? 'bg-brand text-white border-brand' : 'bg-ink-800 text-text-muted border-ink-600')}>
                  {l.emoji} {l.label}
                </button>
              )
            })}
          </div>
          <button onClick={() => refresh()} className="btn-ghost w-full mt-3 py-2 text-sm">↻ Refresh from ESPN</button>
        </div>

        {/* money */}
        <div className="card p-4">
          <h2 className="font-bold mb-3 text-sm uppercase tracking-wide text-text-muted">Money</h2>
          <button onClick={() => setFundsOpen(true)} className="btn-brand w-full py-2 text-sm mb-2">+ Add funds</button>
          <p className="text-[11px] text-text-faint">Resolving a market instantly redeems your winning shares at $1.00. Watch your cash balance jump in the navbar.</p>
        </div>
      </div>

      {/* market controls */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-bold">Markets ({visible.length})</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-ink-600">
            {(['open', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={clsx('px-3 py-1.5 text-sm capitalize', filter === f ? 'bg-ink-700 text-text font-semibold' : 'text-text-muted')}>{f}</button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="input py-1.5 text-sm w-40" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((m) => (
          <AdminMarketRow key={m.id} market={m} now={now} />
        ))}
        {visible.length === 0 && <div className="card p-8 text-center text-text-muted">No markets.</div>}
      </div>
    </div>
  )
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('w-11 h-6 rounded-full transition relative', on ? 'bg-brand' : 'bg-ink-600')}>
      <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}
