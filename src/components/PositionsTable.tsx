import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { positionView, priceOf } from '../store/selectors'
import { cents, usd, shares as fmtShares } from '../lib/format'
import clsx from 'clsx'

export function PositionsTable() {
  const markets = useStore((s) => s.markets)
  const positions = useStore((s) => s.positions)
  const byId = new Map(markets.map((m) => [m.id, m]))

  const rows = positions
    .map((p) => ({ p, m: byId.get(p.marketId) }))
    .filter((r) => r.m)
    .sort((a, b) => positionView(b.m!, b.p).value - positionView(a.m!, a.p).value)

  if (rows.length === 0) {
    return (
      <div className="card p-10 text-center text-text-muted">
        <div className="text-4xl mb-3">📈</div>
        No open positions yet.
        <div className="mt-3">
          <Link to="/" className="btn-brand px-4 py-2 text-sm inline-flex">Browse markets</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-faint text-xs uppercase tracking-wide border-b border-ink-600">
              <th className="text-left font-semibold px-4 py-3">Market</th>
              <th className="text-center font-semibold px-3 py-3">Side</th>
              <th className="text-right font-semibold px-3 py-3">Shares</th>
              <th className="text-right font-semibold px-3 py-3 hidden sm:table-cell">Avg</th>
              <th className="text-right font-semibold px-3 py-3">Now</th>
              <th className="text-right font-semibold px-3 py-3">Value</th>
              <th className="text-right font-semibold px-4 py-3">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, m }) => {
              const view = positionView(m!, p)
              const win = view.pnl >= 0
              return (
                <tr key={`${p.marketId}-${p.side}`} className="border-b border-ink-700/60 hover:bg-ink-800/60">
                  <td className="px-4 py-3 max-w-[260px]">
                    <Link to={`/market/${m!.id}`} className="font-semibold hover:text-brand line-clamp-1">{m!.question}</Link>
                    <div className="text-xs text-text-faint">{m!.leagueLabel} · {m!.shortName}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={clsx('pill px-2 py-0.5 text-xs font-bold', p.side === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no')}>{p.side}</span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtShares(p.shares)}</td>
                  <td className="px-3 py-3 text-right tabular-nums hidden sm:table-cell text-text-muted">{cents(view.avgPrice)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{cents(priceOf(m!, p.side))}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">{usd(view.value)}</td>
                  <td className={clsx('px-4 py-3 text-right tabular-nums font-bold', win ? 'text-yes' : 'text-no')}>
                    {usd(view.pnl, { sign: true })}
                    <div className="text-[11px] font-medium opacity-80">{(view.pnlPct * 100).toFixed(1)}%</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
