import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useNow } from '../hooks/useNow'
import { PriceChart } from '../components/PriceChart'
import { TradePanel } from '../components/TradePanel'
import { TeamBadge } from '../components/TeamBadge'
import { StatusChip } from '../components/MarketCard'
import { ActivityFeed } from '../components/ActivityFeed'
import { FavoriteStar } from '../components/FavoriteStar'
import { OddsValue } from '../components/OddsValue'
import { priceYesOf, priceOf, positionView } from '../store/selectors'
import { cents, usd, usdCompact, startLabel, shares as fmtShares } from '../lib/format'
import { LEAGUE_BY_KEY } from '../lib/espn'
import type { Side } from '../types'
import clsx from 'clsx'

export function MarketPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const initialSide = (params.get('side') as Side) === 'NO' ? 'NO' : 'YES'
  const now = useNow(1000)

  const market = useStore((s) => s.markets.find((m) => m.id === id))
  const positions = useStore((s) => s.positions)
  const trades = useStore((s) => s.trades)

  if (!market) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-text-muted">
        Market not found. <Link to="/" className="text-brand">Back to markets</Link>
      </div>
    )
  }

  const yes = priceYesOf(market)
  const league = LEAGUE_BY_KEY[market.league]
  const myPos = positions.filter((p) => p.marketId === market.id)
  const marketTrades = trades.filter((t) => t.marketId === market.id)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/" className="text-sm text-text-muted hover:text-text inline-flex items-center gap-1 mb-4">← Markets</Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* main */}
        <div className="flex flex-col gap-5">
          {/* header */}
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
              <span className="font-semibold">{league?.emoji} {market.leagueLabel}</span>
              <span className="text-text-faint">·</span>
              <StatusChip market={market} now={now} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{market.question}</h1>
              <FavoriteStar league={market.league} abbr={market.home.abbr} size="md" />
            </div>

            <div className="flex items-center gap-5 mt-4">
              <Matchup label={market.away.shortName} team={market.away} score={market.status !== 'pre' ? market.away.score : undefined} />
              <span className="text-text-faint font-bold">@</span>
              <Matchup label={market.home.shortName} team={market.home} score={market.status !== 'pre' ? market.home.score : undefined} home />
              <div className="ml-auto text-right">
                <div className={clsx('text-4xl font-extrabold tabular-nums', market.resolved ? (market.resolved === 'YES' ? 'text-yes' : 'text-no') : '')}>{cents(yes)}</div>
                <div className="text-xs text-text-muted">{market.home.shortName} · <OddsValue p={yes} /> to win</div>
              </div>
            </div>
          </div>

          {/* chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold">Price history</h2>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yes" /> YES {cents(priceOf(market, 'YES'))}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-no" /> NO {cents(priceOf(market, 'NO'))}</span>
              </div>
            </div>
            <PriceChart data={market.history} />
          </div>

          {/* your position */}
          {myPos.length > 0 && (
            <div className="card p-5">
              <h2 className="font-bold mb-3">Your position</h2>
              <div className="grid grid-cols-2 gap-3">
                {myPos.map((p) => {
                  const v = positionView(market, p)
                  return (
                    <div key={p.side} className="rounded-lg border border-ink-600 p-3">
                      <div className="flex items-center justify-between">
                        <span className={clsx('pill px-2 py-0.5 text-xs font-bold', p.side === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no')}>{p.side}</span>
                        <span className={clsx('text-sm font-bold tabular-nums', v.pnl >= 0 ? 'text-yes' : 'text-no')}>{usd(v.pnl, { sign: true })}</span>
                      </div>
                      <div className="mt-2 text-sm tabular-nums">{fmtShares(p.shares)} shares</div>
                      <div className="text-xs text-text-muted">avg {cents(v.avgPrice)} · value {usd(v.value)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* info */}
          <div className="card p-5">
            <h2 className="font-bold mb-3">Market info</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Info label="Volume" value={usdCompact(market.volume)} />
              <Info label="Starts" value={startLabel(market.startTime, now)} />
              <Info label="Liquidity" value={`b=${Math.round(market.b)}`} />
              <Info label="Status" value={market.resolved ? 'Resolved' : market.status === 'in' ? 'Live' : 'Open'} />
            </dl>
            <p className="text-sm text-text-muted mt-4 leading-relaxed">
              This market resolves <span className="text-text font-semibold">YES</span> if the {market.home.name} win,
              and <span className="text-text font-semibold">NO</span> if the {market.away.name} win. Winning shares
              redeem for $1.00. Results settle automatically from the live final score, or instantly via the admin panel.
            </p>
          </div>

          {/* activity */}
          <div className="card p-5">
            <h2 className="font-bold mb-1">Activity</h2>
            <ActivityFeed trades={marketTrades} now={now} showMarket={false} limit={30} />
          </div>
        </div>

        {/* trade rail */}
        <div className="lg:sticky lg:top-20">
          <TradePanel market={market} initialSide={initialSide} />
        </div>
      </div>
    </div>
  )
}

function Matchup({ team, label, score, home }: { team: any; label: string; score?: number; home?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <TeamBadge team={team} size="lg" />
      <div>
        <div className="font-bold leading-tight">{label}</div>
        {score !== undefined && <div className="text-2xl font-extrabold tabular-nums leading-none">{score}</div>}
        {home && <div className="text-[11px] text-text-faint">home</div>}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-faint uppercase tracking-wide">{label}</dt>
      <dd className="font-semibold mt-0.5">{value}</dd>
    </div>
  )
}
