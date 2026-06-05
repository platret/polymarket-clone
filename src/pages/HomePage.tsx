import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useNow } from '../hooks/useNow'
import { MarketCard } from '../components/MarketCard'
import { CategoryTabs } from '../components/CategoryTabs'
import { ActivityFeed } from '../components/ActivityFeed'
import { DataStatusPill } from '../components/DataStatusPill'
import type { Market } from '../types'

function matches(m: Market, q: string): boolean {
  if (!q) return true
  const hay = `${m.question} ${m.home.name} ${m.away.name} ${m.shortName} ${m.leagueLabel}`.toLowerCase()
  return hay.includes(q.toLowerCase())
}

function sortMarkets(a: Market, b: Market): number {
  // open before resolved; live before scheduled; then soonest start
  const rank = (m: Market) => (m.resolved ? 2 : m.status === 'in' ? 0 : 1)
  if (rank(a) !== rank(b)) return rank(a) - rank(b)
  if (a.status === 'in' && b.status === 'in') return b.volume - a.volume
  return a.startTime - b.startTime
}

export function HomePage() {
  const markets = useStore((s) => s.markets)
  const trades = useStore((s) => s.trades)
  const now = useNow(1000)
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const [league, setLeague] = useState('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const m of markets) c[m.league] = (c[m.league] ?? 0) + 1
    return c
  }, [markets])

  const visible = useMemo(
    () => markets.filter((m) => (league === 'all' || m.league === league) && matches(m, q)).sort(sortMarkets),
    [markets, league, q],
  )

  const liveCount = markets.filter((m) => m.status === 'in' && !m.resolved).length
  const totalVol = markets.reduce((s, m) => s + m.volume, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* hero / stats */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sports Markets</h1>
          <p className="text-text-muted text-sm mt-1">
            Trade real games with fake money · {markets.length} markets
            {liveCount > 0 && <span className="text-no font-semibold"> · {liveCount} live</span>}
            <span className="text-text-faint"> · ${(totalVol / 1000).toFixed(0)}k volume</span>
          </p>
        </div>
        <DataStatusPill />
      </div>

      <div className="mb-5">
        <CategoryTabs active={league} onChange={setLeague} counts={counts} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* market grid */}
        <div>
          {q && <div className="text-sm text-text-muted mb-3">{visible.length} result{visible.length === 1 ? '' : 's'} for “{q}”</div>}
          {visible.length === 0 ? (
            <div className="card p-12 text-center text-text-muted">No markets match. Try another league or search.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visible.map((m) => (
                <MarketCard key={m.id} market={m} now={now} />
              ))}
            </div>
          )}
        </div>

        {/* live activity rail */}
        <aside className="hidden xl:block">
          <div className="card p-4 sticky top-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-yes animate-pulse" />
              <h2 className="font-bold text-sm">Live activity</h2>
            </div>
            <ActivityFeed trades={trades} now={now} limit={18} />
          </div>
        </aside>
      </div>
    </div>
  )
}
