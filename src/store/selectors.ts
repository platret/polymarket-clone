/** Derived read-models computed from store state. Pure, memo-friendly. */
import type { Market, Position, Side } from '../types'
import { sidePrice, yesPrice } from '../lib/marketEngine'

export function priceYesOf(m: Market): number {
  return m.resolved ? (m.resolved === 'YES' ? 1 : 0) : yesPrice(m)
}

export function priceOf(m: Market, side: Side): number {
  if (m.resolved) return m.resolved === side ? 1 : 0
  return sidePrice(m, side)
}

/** Current cash value of an open position. */
export function positionValue(m: Market, pos: Position): number {
  return pos.shares * priceOf(m, pos.side)
}

export interface PositionView {
  value: number
  pnl: number
  pnlPct: number
  avgPrice: number
}

export function positionView(m: Market, pos: Position): PositionView {
  const value = positionValue(m, pos)
  const pnl = value - pos.cost
  const avgPrice = pos.shares > 0 ? pos.cost / pos.shares : 0
  return { value, pnl, pnlPct: pos.cost > 0 ? pnl / pos.cost : 0, avgPrice }
}

export interface PortfolioSummary {
  balance: number
  positionsValue: number
  total: number
  invested: number
  openPnl: number
  totalPnl: number // vs everything deposited
  deposited: number
}

export function portfolioSummary(
  markets: Market[],
  positions: Position[],
  balance: number,
  deposited: number,
): PortfolioSummary {
  const byId = new Map(markets.map((m) => [m.id, m]))
  let positionsValue = 0
  let invested = 0
  for (const p of positions) {
    const m = byId.get(p.marketId)
    if (!m) continue
    positionsValue += positionValue(m, p)
    invested += p.cost
  }
  const total = balance + positionsValue
  return {
    balance,
    positionsValue,
    total,
    invested,
    openPnl: positionsValue - invested,
    totalPnl: total - deposited,
    deposited,
  }
}

/** Markets that count as "open" for trading. */
export function isTradable(m: Market): boolean {
  return !m.resolved
}
