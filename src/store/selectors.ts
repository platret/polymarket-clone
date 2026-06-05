/** Derived read-models computed from store state. Pure, memo-friendly. */
import type { Market, Position, Side, TraderLedger } from '../types'
import { sidePrice, yesPrice } from '../lib/marketEngine'
import { teamKey } from '../lib/teams'

const BOT_START = 10_000 // keep in sync with useStore BOT_START

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

/* ------------------------------ favorites -------------------------------- */

/** Does this market feature one of the user's followed teams? */
export function marketFavorited(m: Market, favorites: string[]): boolean {
  if (favorites.length === 0) return false
  const set = new Set(favorites)
  return set.has(teamKey(m.league, m.home.abbr)) || set.has(teamKey(m.league, m.away.abbr))
}

/* ----------------------------- leaderboard ------------------------------- */

export interface LeaderRow {
  name: string
  isYou: boolean
  cash: number
  openValue: number
  netWorth: number
  pnl: number
  pnlPct: number
  positions: number
}

function ledgerOpenValue(byId: Map<string, Market>, positions: Position[]): number {
  let v = 0
  for (const p of positions) {
    const m = byId.get(p.marketId)
    if (m) v += positionValue(m, p)
  }
  return v
}

/** Rank you against every simulated trader by net worth. */
export function leaderboard(
  markets: Market[],
  traders: Record<string, TraderLedger>,
  user: { balance: number; positions: Position[]; deposited: number },
): LeaderRow[] {
  const byId = new Map(markets.map((m) => [m.id, m]))

  const youOpen = ledgerOpenValue(byId, user.positions)
  const youNet = user.balance + youOpen
  const rows: LeaderRow[] = [
    {
      name: 'You',
      isYou: true,
      cash: user.balance,
      openValue: youOpen,
      netWorth: youNet,
      pnl: youNet - user.deposited,
      pnlPct: user.deposited > 0 ? (youNet - user.deposited) / user.deposited : 0,
      positions: user.positions.length,
    },
  ]

  for (const led of Object.values(traders)) {
    const open = ledgerOpenValue(byId, led.positions)
    const net = led.cash + open
    rows.push({
      name: led.name,
      isYou: false,
      cash: led.cash,
      openValue: open,
      netWorth: net,
      pnl: net - BOT_START,
      pnlPct: (net - BOT_START) / BOT_START,
      positions: led.positions.length,
    })
  }

  return rows.sort((a, b) => b.netWorth - a.netWorth)
}
