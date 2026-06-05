import { useEffect, useMemo, useState } from 'react'
import type { Market, Side } from '../types'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { buyCost, sellReturn, sharesForBudget } from '../lib/marketEngine'
import { priceOf } from '../store/selectors'
import { cents, usd, shares as fmtShares } from '../lib/format'
import clsx from 'clsx'

const BUY_CHIPS = [1, 20, 100, 500]

export function TradePanel({ market, initialSide = 'YES' }: { market: Market; initialSide?: Side }) {
  const [side, setSide] = useState<Side>(initialSide)
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState<number>(20)
  const [sellPct, setSellPct] = useState<number>(100)

  const balance = useStore((s) => s.balance)
  const positions = useStore((s) => s.positions)
  const buy = useStore((s) => s.buy)
  const sell = useStore((s) => s.sell)
  const pushToast = useUI((s) => s.pushToast)

  useEffect(() => setSide(initialSide), [initialSide])

  const pos = positions.find((p) => p.marketId === market.id && p.side === side)
  const price = priceOf(market, side)
  const resolved = !!market.resolved

  const buyPreview = useMemo(() => {
    const spend = Math.min(amount || 0, balance)
    if (spend <= 0) return null
    const n = sharesForBudget(market, side, spend)
    if (n <= 0) return null
    const cost = buyCost(market, side, n)
    return { shares: n, cost, avg: cost / n, payout: n, profit: n - cost }
  }, [amount, balance, market, side])

  const sellPreview = useMemo(() => {
    if (!pos || pos.shares <= 0) return null
    const n = (pos.shares * sellPct) / 100
    if (n <= 0) return null
    const ret = sellReturn(market, side, n)
    return { shares: n, ret, avg: ret / n }
  }, [pos, sellPct, market, side])

  const doBuy = () => {
    const r = buy(market.id, side, amount)
    if (r.ok) {
      pushToast({ kind: 'success', title: `Bought ${fmtShares(r.shares!)} ${side} @ ${cents(r.avgPrice!)}`, detail: `${usd(r.amount!)} · payout if correct ${usd(r.shares!)}` })
    } else {
      pushToast({ kind: 'error', title: 'Trade failed', detail: r.error })
    }
  }

  const doSell = () => {
    if (!pos) return
    const n = (pos.shares * sellPct) / 100
    const r = sell(market.id, side, n)
    if (r.ok) {
      pushToast({ kind: 'success', title: `Sold ${fmtShares(r.shares!)} ${side} @ ${cents(r.avgPrice!)}`, detail: `Received ${usd(r.amount!)}` })
    } else {
      pushToast({ kind: 'error', title: 'Sell failed', detail: r.error })
    }
  }

  if (resolved) {
    return (
      <div className="card p-5">
        <div className="text-sm text-text-muted mb-1">Market resolved</div>
        <div className={clsx('text-xl font-extrabold', market.resolved === 'YES' ? 'text-yes' : 'text-no')}>
          {market.resolved === 'YES' ? market.home.shortName : market.away.shortName} won
        </div>
        <p className="text-sm text-text-muted mt-2">Winning shares were redeemed at $1.00 to your cash balance.</p>
      </div>
    )
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Buy / Sell tabs */}
      <div className="flex gap-4 border-b border-ink-600 -mt-1">
        {(['buy', 'sell'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx('pb-2 text-sm font-bold capitalize transition border-b-2 -mb-px',
              mode === m ? 'text-text border-brand' : 'text-text-muted border-transparent hover:text-text')}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Yes / No selector */}
      <div className="grid grid-cols-2 gap-2">
        <SideButton active={side === 'YES'} side="YES" price={priceOf(market, 'YES')} label={market.home.shortName} onClick={() => setSide('YES')} />
        <SideButton active={side === 'NO'} side="NO" price={priceOf(market, 'NO')} label={market.away.shortName} onClick={() => setSide('NO')} />
      </div>

      {mode === 'buy' ? (
        <>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-text-muted">Amount</label>
              <span className="text-xs text-text-faint">Cash {usd(balance)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="input pl-7 text-lg font-bold tabular-nums"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              {BUY_CHIPS.map((c) => (
                <button key={c} onClick={() => setAmount(c)} className="btn-ghost px-2.5 py-1 text-xs flex-1">
                  ${c}
                </button>
              ))}
              <button onClick={() => setAmount(Math.floor(balance))} className="btn-ghost px-2.5 py-1 text-xs flex-1">Max</button>
            </div>
          </div>

          <PreviewRow label="Avg price" value={buyPreview ? cents(buyPreview.avg) : '—'} />
          <PreviewRow label="Shares" value={buyPreview ? fmtShares(buyPreview.shares) : '—'} />
          <div className="h-px bg-ink-600" />
          <PreviewRow
            label="Payout if correct"
            value={buyPreview ? usd(buyPreview.payout) : '—'}
            sub={buyPreview ? `+${usd(buyPreview.profit)}` : undefined}
            accent="yes"
          />

          <button
            onClick={doBuy}
            disabled={!buyPreview || amount > balance}
            className={clsx('btn py-3 text-base font-extrabold text-white',
              side === 'YES' ? 'bg-yes hover:brightness-110' : 'bg-no hover:brightness-110')}
          >
            {amount > balance ? 'Insufficient cash' : `Buy ${side} · ${cents(price)}`}
          </button>
        </>
      ) : (
        <>
          {pos && pos.shares > 0 ? (
            <>
              <PreviewRow label={`Your ${side} shares`} value={fmtShares(pos.shares)} />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-text-muted">Sell amount</label>
                  <span className="text-sm font-bold tabular-nums">{sellPct}%</span>
                </div>
                <input
                  type="range" min={1} max={100} value={sellPct}
                  onChange={(e) => setSellPct(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex gap-1.5 mt-2">
                  {[25, 50, 75, 100].map((p) => (
                    <button key={p} onClick={() => setSellPct(p)} className="btn-ghost px-2.5 py-1 text-xs flex-1">{p}%</button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-ink-600" />
              <PreviewRow label="You receive" value={sellPreview ? usd(sellPreview.ret) : '—'} accent="yes" />
              <button onClick={doSell} disabled={!sellPreview} className="btn-ghost py-3 text-base font-extrabold border border-ink-500">
                Sell {side}
              </button>
            </>
          ) : (
            <div className="text-sm text-text-muted py-6 text-center">
              You don't hold any <span className="font-bold">{side}</span> shares in this market.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SideButton({ active, side, price, label, onClick }: { active: boolean; side: Side; price: number; label: string; onClick: () => void }) {
  const isYes = side === 'YES'
  return (
    <button
      onClick={onClick}
      className={clsx('rounded-lg py-2.5 px-3 border-2 transition text-left',
        active
          ? isYes ? 'border-yes bg-yes-soft' : 'border-no bg-no-soft'
          : 'border-ink-600 hover:border-ink-500')}
    >
      <div className={clsx('text-[11px] font-bold uppercase tracking-wide', isYes ? 'text-yes' : 'text-no')}>
        {isYes ? 'Yes' : 'No'} · {label}
      </div>
      <div className="text-lg font-extrabold tabular-nums">{cents(price)}</div>
    </button>
  )
}

function PreviewRow({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'yes' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-bold tabular-nums flex items-center gap-1.5">
        {value}
        {sub && <span className={clsx('text-xs', accent === 'yes' ? 'text-yes' : 'text-text-muted')}>{sub}</span>}
      </span>
    </div>
  )
}
