import { useState } from 'react'
import type { Market } from '../types'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { TeamBadge } from './TeamBadge'
import { priceYesOf } from '../store/selectors'
import { cents, usd, usdCompact } from '../lib/format'
import clsx from 'clsx'

export function AdminMarketRow({ market, now }: { market: Market; now: number }) {
  const resolveMarket = useStore((s) => s.resolveMarket)
  const unresolveMarket = useStore((s) => s.unresolveMarket)
  const adminSetPrice = useStore((s) => s.adminSetPrice)
  const adminInjectVolume = useStore((s) => s.adminInjectVolume)
  const positions = useStore((s) => s.positions)
  const pushToast = useUI((s) => s.pushToast)

  const [open, setOpen] = useState(false)
  const [priceVal, setPriceVal] = useState(Math.round(priceYesOf(market) * 100))
  const [vol, setVol] = useState(5000)

  const yes = priceYesOf(market)
  const yesShares = positions.filter((p) => p.marketId === market.id && p.side === 'YES').reduce((a, p) => a + p.shares, 0)
  const noShares = positions.filter((p) => p.marketId === market.id && p.side === 'NO').reduce((a, p) => a + p.shares, 0)

  const resolve = (outcome: 'YES' | 'NO') => {
    const payout = outcome === 'YES' ? yesShares : noShares
    resolveMarket(market.id, outcome)
    pushToast({
      kind: 'success',
      title: `Resolved: ${outcome === 'YES' ? market.home.shortName : market.away.shortName} won`,
      detail: payout > 0 ? `Redeemed ${usd(payout)} to your cash` : 'You had no winning shares here',
    })
  }

  return (
    <div className={clsx('card p-3', market.resolved && 'opacity-70')}>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          <TeamBadge team={market.away} size="sm" />
          <TeamBadge team={market.home} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{market.question}</div>
          <div className="text-xs text-text-faint truncate">
            {market.leagueLabel} · {market.shortName} · {usdCompact(market.volume)} vol
            {(yesShares > 0 || noShares > 0) && (
              <span className="text-text-muted"> · you hold {yesShares > 0 ? `${Math.round(yesShares)} YES` : ''}{yesShares > 0 && noShares > 0 ? ', ' : ''}{noShares > 0 ? `${Math.round(noShares)} NO` : ''}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 tabular-nums">
          <div className="font-extrabold">{cents(yes)}</div>
          <div className="text-[10px] text-text-faint uppercase">{market.resolved ? `won: ${market.resolved}` : market.status}</div>
        </div>
      </div>

      {market.resolved ? (
        <div className="flex items-center gap-2 mt-3">
          <span className={clsx('pill px-2 py-1 text-xs font-bold', market.resolved === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no')}>
            Resolved {market.resolved === 'YES' ? market.home.shortName : market.away.shortName}
          </span>
          <button onClick={() => unresolveMarket(market.id)} className="btn-ghost px-3 py-1 text-xs ml-auto">↺ Re-open</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => resolve('YES')} className="btn bg-yes-soft text-yes hover:bg-yes hover:text-white py-2 text-sm font-bold flex-col leading-tight">
              <span>{market.home.shortName} wins</span>
              <span className="text-[10px] opacity-80">Resolve YES{yesShares > 0 ? ` · +${usd(yesShares)}` : ''}</span>
            </button>
            <button onClick={() => resolve('NO')} className="btn bg-no-soft text-no hover:bg-no hover:text-white py-2 text-sm font-bold flex-col leading-tight">
              <span>{market.away.shortName} wins</span>
              <span className="text-[10px] opacity-80">Resolve NO{noShares > 0 ? ` · +${usd(noShares)}` : ''}</span>
            </button>
          </div>

          <button onClick={() => setOpen((o) => !o)} className="text-xs text-text-muted hover:text-text mt-2">
            {open ? '▲ Hide' : '▼ Price & volume'}
          </button>

          {open && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-ink-600">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-muted">Set YES price</span>
                  <span className="font-bold tabular-nums">{priceVal}¢</span>
                </div>
                <input type="range" min={2} max={98} value={priceVal} onChange={(e) => setPriceVal(Number(e.target.value))} className="w-full accent-brand" />
                <button onClick={() => { adminSetPrice(market.id, priceVal / 100); pushToast({ kind: 'info', title: `Pushed price to ${priceVal}¢` }) }}
                  className="btn-ghost w-full py-1.5 text-xs mt-1">Apply price</button>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Inject volume</div>
                <div className="flex gap-1.5">
                  <input type="number" min={0} value={vol} onChange={(e) => setVol(Math.max(0, Number(e.target.value)))} className="input py-1.5 text-sm" />
                  <button onClick={() => { adminInjectVolume(market.id, vol); pushToast({ kind: 'info', title: `Injected ${usdCompact(vol)} volume` }) }}
                    className="btn-ghost px-3 py-1.5 text-xs whitespace-nowrap">Add</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
