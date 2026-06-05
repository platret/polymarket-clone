import { Link } from 'react-router-dom'
import type { Trade } from '../types'
import { cents, usd, shares as fmtShares, relTime } from '../lib/format'
import clsx from 'clsx'

export function ActivityFeed({ trades, now, showMarket = true, limit = 40 }: {
  trades: Trade[]
  now: number
  showMarket?: boolean
  limit?: number
}) {
  if (trades.length === 0) {
    return <div className="text-sm text-text-muted py-8 text-center">No activity yet — place a bet to get things moving.</div>
  }
  return (
    <ul className="divide-y divide-ink-700/60">
      {trades.slice(0, limit).map((t) => {
        const isYou = t.by === 'You' || t.by.startsWith('Redeem')
        return (
          <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className={clsx('pill px-2 py-0.5 text-[11px] font-bold shrink-0',
              t.side === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no')}>
              {t.action} {t.side}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <span className={clsx('font-semibold', isYou ? 'text-brand' : 'text-text')}>{t.by}</span>
                <span className="text-text-muted"> · {fmtShares(t.shares)} @ {cents(t.price)}</span>
              </div>
              {showMarket && (
                <Link to={`/market/${t.marketId}`} className="text-xs text-text-faint hover:text-text-muted truncate block">
                  {t.marketQuestion}
                </Link>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="tabular-nums font-semibold">{usd(t.amount)}</div>
              <div className="text-[11px] text-text-faint">{relTime(t.t, now)}</div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
