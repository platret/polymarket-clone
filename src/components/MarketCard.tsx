import { useNavigate } from 'react-router-dom'
import type { Market, Side } from '../types'
import { TeamBadge } from './TeamBadge'
import { Sparkline } from './Sparkline'
import { priceYesOf, priceOf } from '../store/selectors'
import { cents, usdCompact, startLabel } from '../lib/format'
import { LEAGUE_BY_KEY } from '../lib/espn'
import clsx from 'clsx'

export function MarketCard({ market, now }: { market: Market; now: number }) {
  const nav = useNavigate()
  const yes = priceYesOf(market)
  const league = LEAGUE_BY_KEY[market.league]

  const go = (side?: Side) => nav(`/market/${market.id}${side ? `?side=${side}` : ''}`)

  return (
    <div
      className="card p-4 flex flex-col gap-3 cursor-pointer hover:border-ink-500 transition animate-fade-in"
      onClick={() => go()}
    >
      {/* header */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span>{league?.emoji ?? '🏟️'}</span>
          {market.leagueLabel}
        </span>
        <StatusChip market={market} now={now} />
      </div>

      {/* matchup */}
      <div className="flex items-center gap-3 min-h-[44px]">
        <div className="flex -space-x-2">
          <TeamBadge team={market.away} size="md" />
          <TeamBadge team={market.home} size="md" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[15px] leading-tight text-text truncate">{market.question}</div>
          <div className="text-xs text-text-muted truncate">
            {market.away.shortName} <span className="text-text-faint">@</span> {market.home.shortName}
            {market.status === 'in' && (
              <span className="ml-1 text-text">· {market.away.score}–{market.home.score}</span>
            )}
          </div>
        </div>
      </div>

      {/* probability + sparkline */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold tabular-nums leading-none">{cents(yes)}</div>
          <div className="text-[11px] text-text-muted mt-1">{market.home.shortName} chance</div>
        </div>
        <Sparkline data={market.history} />
      </div>

      {/* buy buttons */}
      {market.resolved ? (
        <div className={clsx('rounded-lg py-2 text-center text-sm font-bold',
          market.resolved === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no')}>
          Resolved · {market.resolved === 'YES' ? market.home.shortName : market.away.shortName} won
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => go('YES')}
            className="btn bg-yes-soft text-yes hover:bg-yes hover:text-white py-2 font-bold"
          >
            Yes {cents(priceOf(market, 'YES'))}
          </button>
          <button
            onClick={() => go('NO')}
            className="btn bg-no-soft text-no hover:bg-no hover:text-white py-2 font-bold"
          >
            No {cents(priceOf(market, 'NO'))}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-text-faint pt-0.5">
        <span>${usdCompact(market.volume).replace('$', '')} Vol.</span>
        <span>{startLabel(market.startTime, now)}</span>
      </div>
    </div>
  )
}

export function StatusChip({ market, now }: { market: Market; now: number }) {
  if (market.resolved) {
    return <span className="pill bg-ink-700 text-text-muted py-0.5 px-2 text-[11px]">Resolved</span>
  }
  if (market.status === 'in') {
    return (
      <span className="pill bg-no-soft text-no py-0.5 px-2 text-[11px] font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-no animate-pulse" /> LIVE {market.statusDetail}
      </span>
    )
  }
  return <span className="text-[11px] text-text-faint">{startLabel(market.startTime, now)}</span>
}
