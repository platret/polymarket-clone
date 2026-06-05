/**
 * Single source of truth for the whole app: balance, markets, positions, trades.
 * LMSR trading, resolution + payouts, the bot simulator, and admin god-mode all
 * live here. Persisted to localStorage so a refresh keeps your money & bets.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Market, OddsFormat, Position, Settings, Side, Trade, TraderLedger } from '../types'
import {
  applyBuy,
  applySell,
  buyCost,
  sellReturn,
  seedQuantities,
  sharesForBudget,
  yesPrice,
} from '../lib/marketEngine'
import { fetchMarkets, LEAGUES } from '../lib/espn'
import { makeSampleMarkets } from '../lib/sampleData'
import { useUI } from './useUI'

/** True if the user holds winning shares in this market for the given outcome. */
function userWins(positions: Position[], marketId: string, outcome: Side): boolean {
  return positions.some((p) => p.marketId === marketId && p.side === outcome && p.shares > 0)
}

const START_BALANCE = 10_000
const HISTORY_CAP = 600
const TRADES_CAP = 250
const BOT_START = 10_000 // each simulated trader's starting bankroll (leaderboard)
// LMSR depth. ~$100 of flow moves the price a cent or two — deep like the real thing.
const DEFAULT_LIQUIDITY = 2500

const BOT_NAMES = [
  'whale_0x', 'degenking', 'sharpmoney', 'parlay_pete', 'edgehunter', 'cold_take',
  'moonshot', 'vig_slayer', 'chalk_eater', 'fade_the_public', 'liquidity_lord',
  'arb_andy', 'tilted', 'closing_line', 'sweat_equity', 'juice_box',
]

export interface TradeResult {
  ok: boolean
  error?: string
  shares?: number
  avgPrice?: number
  amount?: number
}

export type DataStatus = 'idle' | 'loading' | 'live' | 'sample' | 'error'

interface StoreState {
  balance: number
  deposited: number // total fake money ever added (for P&L baseline)
  markets: Market[]
  positions: Position[]
  trades: Trade[]
  traders: Record<string, TraderLedger> // simulated traders' ledgers (leaderboard)
  settings: Settings
  dataStatus: DataStatus
  lastSync: number

  // lifecycle / data
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>

  // trading
  buy: (marketId: string, side: Side, budget: number) => TradeResult
  sell: (marketId: string, side: Side, shares: number) => TradeResult

  // money
  addFunds: (amount: number) => void
  resetAll: () => Promise<void>

  // settings
  setLeagues: (keys: string[]) => void
  toggleBots: () => void
  setLiquidity: (b: number) => void
  setOddsFormat: (fmt: OddsFormat) => void

  // favorites & onboarding
  toggleFavorite: (teamKey: string) => void
  completeOnboarding: (favorites: string[]) => void
  resetOnboarding: () => void

  // simulator
  botTick: () => void

  // admin god-mode
  resolveMarket: (marketId: string, outcome: Side, by?: string) => void
  unresolveMarket: (marketId: string) => void
  adminSetPrice: (marketId: string, p: number) => void
  adminInjectVolume: (marketId: string, amount: number) => void
}

const defaultSettings: Settings = {
  leagues: ['nfl', 'nba', 'mlb', 'nhl', 'epl'],
  botsEnabled: true,
  liquidity: DEFAULT_LIQUIDITY,
  oddsFormat: 'american',
  favorites: [],
  onboarded: false,
}

function pushPoint(history: Market['history'], p: number, t: number) {
  const next = history.length && t - history[history.length - 1].t < 500
    ? history.slice(0, -1).concat({ t, p }) // collapse sub-second updates
    : history.concat({ t, p })
  return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next
}

function mkTrade(t: Omit<Trade, 'id'>): Trade {
  return { ...t, id: `${t.t}-${Math.random().toString(36).slice(2, 8)}` }
}

function posKey(marketId: string, side: Side) {
  return `${marketId}::${side}`
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      balance: START_BALANCE,
      deposited: START_BALANCE,
      markets: [],
      positions: [],
      trades: [],
      traders: {},
      settings: defaultSettings,
      dataStatus: 'idle',
      lastSync: 0,

      ensureLoaded: async () => {
        if (get().markets.length === 0) await get().refresh()
      },

      refresh: async () => {
        const { settings, markets } = get()
        set({ dataStatus: 'loading' })
        let live: Market[] = []
        try {
          live = await fetchMarkets(settings.leagues, settings.liquidity)
        } catch {
          live = []
        }
        const now = Date.now()

        if (live.length === 0) {
          // No connectivity / nothing scheduled -> ensure a sample slate exists.
          if (markets.length === 0) {
            set({ markets: makeSampleMarkets(settings.liquidity), dataStatus: 'sample', lastSync: now })
          } else {
            set({ dataStatus: markets.some((m) => m.source === 'espn') ? 'live' : 'sample', lastSync: now })
          }
          return
        }

        const celebrateIds = mergeMarkets(get().markets, live, now).toSettle
          .filter(({ id, outcome }) => userWins(get().positions, id, outcome))
        set((s) => {
          const { markets, toSettle } = mergeMarkets(s.markets, live, now)
          // Pay out any games that just went final, reusing the resolution path.
          let next: StoreState = { ...s, markets }
          for (const { id, outcome } of toSettle) {
            next = { ...next, ...settleInto(next, id, outcome, 'Auto (final score)') }
          }
          return {
            markets: next.markets,
            positions: next.positions,
            balance: next.balance,
            trades: next.trades,
            dataStatus: 'live',
            lastSync: now,
          }
        })
        if (celebrateIds.length > 0) useUI.getState().celebrate()
      },

      buy: (marketId, side, budget) => {
        const state = get()
        const m = state.markets.find((x) => x.id === marketId)
        if (!m) return { ok: false, error: 'Market not found' }
        if (m.resolved) return { ok: false, error: 'Market already resolved' }
        const spend = Math.min(budget, state.balance)
        if (spend <= 0) return { ok: false, error: 'Insufficient balance' }
        const n = sharesForBudget(m, side, spend)
        if (n <= 0) return { ok: false, error: 'Amount too small' }
        const amount = buyCost(m, side, n)
        const avgPrice = amount / n
        const now = Date.now()
        const q = applyBuy(m.qYes, m.qNo, side, n)

        set((s) => {
          const markets = s.markets.map((x) =>
            x.id !== marketId ? x : { ...x, qYes: q.qYes, qNo: q.qNo, volume: x.volume + amount, history: pushPoint(x.history, sidePriceOf(q, x.b, 'YES'), now) },
          )
          const positions = upsertPosition(s.positions, marketId, side, n, amount)
          const trade = mkTrade({ marketId, marketQuestion: m.question, league: m.league, side, action: 'BUY', shares: n, price: avgPrice, amount, t: now, by: 'You' })
          return { markets, positions, balance: s.balance - amount, trades: [trade, ...s.trades].slice(0, TRADES_CAP) }
        })
        return { ok: true, shares: n, avgPrice, amount }
      },

      sell: (marketId, side, sharesToSell) => {
        const state = get()
        const m = state.markets.find((x) => x.id === marketId)
        if (!m) return { ok: false, error: 'Market not found' }
        if (m.resolved) return { ok: false, error: 'Market already resolved' }
        const pos = state.positions.find((p) => p.marketId === marketId && p.side === side)
        if (!pos || pos.shares <= 0) return { ok: false, error: 'No shares to sell' }
        const n = Math.min(sharesToSell, pos.shares)
        if (n <= 0) return { ok: false, error: 'Nothing to sell' }
        const ret = sellReturn(m, side, n)
        const avgPrice = ret / n
        const now = Date.now()
        const q = applySell(m.qYes, m.qNo, side, n)

        set((s) => {
          const markets = s.markets.map((x) =>
            x.id !== marketId ? x : { ...x, qYes: q.qYes, qNo: q.qNo, volume: x.volume + ret, history: pushPoint(x.history, sidePriceOf(q, x.b, 'YES'), now) },
          )
          const positions = reducePosition(s.positions, marketId, side, n)
          const trade = mkTrade({ marketId, marketQuestion: m.question, league: m.league, side, action: 'SELL', shares: n, price: avgPrice, amount: ret, t: now, by: 'You' })
          return { markets, positions, balance: s.balance + ret, trades: [trade, ...s.trades].slice(0, TRADES_CAP) }
        })
        return { ok: true, shares: n, avgPrice, amount: ret }
      },

      addFunds: (amount) => {
        if (!(amount > 0)) return
        set((s) => ({ balance: s.balance + amount, deposited: s.deposited + amount }))
      },

      resetAll: async () => {
        set((s) => ({ balance: START_BALANCE, deposited: START_BALANCE, markets: [], positions: [], trades: [], traders: {}, dataStatus: 'idle', lastSync: 0, settings: { ...s.settings, favorites: [] } }))
        await get().refresh()
      },

      setLeagues: (keys) => {
        const valid = keys.filter((k) => LEAGUES.some((l) => l.key === k))
        set((s) => ({ settings: { ...s.settings, leagues: valid.length ? valid : s.settings.leagues } }))
        void get().refresh()
      },

      toggleBots: () => set((s) => ({ settings: { ...s.settings, botsEnabled: !s.settings.botsEnabled } })),

      setLiquidity: (b) => set((s) => ({ settings: { ...s.settings, liquidity: Math.max(40, b) } })),

      setOddsFormat: (fmt) => set((s) => ({ settings: { ...s.settings, oddsFormat: fmt } })),

      toggleFavorite: (key) =>
        set((s) => {
          const has = s.settings.favorites.includes(key)
          const favorites = has ? s.settings.favorites.filter((k) => k !== key) : [...s.settings.favorites, key]
          return { settings: { ...s.settings, favorites } }
        }),

      completeOnboarding: (favorites) =>
        set((s) => ({ settings: { ...s.settings, favorites, onboarded: true } })),

      resetOnboarding: () => set((s) => ({ settings: { ...s.settings, onboarded: false } })),

      botTick: () => {
        const s = get()
        if (!s.settings.botsEnabled) return
        const open = s.markets.filter((m) => !m.resolved)
        if (open.length === 0) return
        const now = Date.now()
        // Touch a random handful of markets each tick.
        const touches = Math.min(open.length, 2 + Math.floor(Math.random() * 3))
        const trades: Trade[] = []
        const fills: Array<{ name: string; marketId: string; side: Side; shares: number; cost: number }> = []
        const moved = new Map<string, Market>()

        for (let i = 0; i < touches; i++) {
          const pick = open[Math.floor(Math.random() * open.length)]
          const m = moved.get(pick.id) ?? pick
          if (m.resolved) continue

          // Live games: let "fair" drift toward whoever's leading.
          let fair = m.fair
          if (m.status === 'in') {
            const lead = (m.home.score - m.away.score)
            const target = 0.5 + 0.5 * Math.tanh(lead * 0.09)
            fair = clamp(fair + (target - fair) * 0.06, 0.04, 0.96)
          }
          const noise = (Math.random() - 0.5) * 0.06
          const targetP = clamp(fair + noise, 0.03, 0.97)
          const curr = yesPrice(m)
          const side: Side = targetP >= curr ? 'YES' : 'NO'
          const size = 20 + Math.random() * 180
          const n = sharesForBudget(m, side, size)
          if (n <= 0) continue
          const amount = buyCost(m, side, n)
          const q = applyBuy(m.qYes, m.qNo, side, n)
          const updated: Market = {
            ...m,
            fair,
            qYes: q.qYes,
            qNo: q.qNo,
            volume: m.volume + amount,
            history: pushPoint(m.history, sidePriceOf(q, m.b, 'YES'), now + i),
          }
          moved.set(m.id, updated)
          const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
          fills.push({ name: botName, marketId: m.id, side, shares: n, cost: amount })
          // Only surface ~half of bot trades to the activity feed to avoid spam.
          if (Math.random() < 0.6) {
            trades.push(mkTrade({
              marketId: m.id, marketQuestion: m.question, league: m.league, side,
              action: 'BUY', shares: n, price: amount / n, amount, t: now + i,
              by: botName,
            }))
          }
        }
        if (moved.size === 0) return
        set((st) => ({
          markets: st.markets.map((x) => moved.get(x.id) ?? x),
          trades: [...trades, ...st.trades].slice(0, TRADES_CAP),
          traders: applyBotFills(st.traders, fills),
        }))
      },

      resolveMarket: (marketId, outcome, by = 'Admin') => {
        const willCelebrate = userWins(get().positions, marketId, outcome)
        set((s) => settleInto(s, marketId, outcome, by))
        if (willCelebrate) useUI.getState().celebrate()
      },

      unresolveMarket: (marketId) => {
        set((s) => ({
          markets: s.markets.map((m) => (m.id === marketId ? { ...m, resolved: null, resolvedAt: null } : m)),
        }))
      },

      adminSetPrice: (marketId, p) => {
        const pp = clamp(p, 0.02, 0.98)
        const now = Date.now()
        set((s) => ({
          markets: s.markets.map((m) => {
            if (m.id !== marketId) return m
            // Hold qNo, solve qYes so the YES price becomes exactly pp.
            const qYes = m.qNo + m.b * Math.log(pp / (1 - pp))
            return { ...m, qYes, fair: pp, history: pushPoint(m.history, pp, now) }
          }),
        }))
      },

      adminInjectVolume: (marketId, amount) => {
        const now = Date.now()
        set((s) => ({
          markets: s.markets.map((m) =>
            m.id === marketId ? { ...m, volume: m.volume + Math.max(0, amount), history: pushPoint(m.history, yesPrice(m), now) } : m,
          ),
        }))
      },
    }),
    {
      name: 'polymarket-clone-v1',
      version: 3,
      migrate: (persisted: any) => {
        if (!persisted) return persisted
        // Backfill new settings fields + traders for stores saved before v3.
        return {
          ...persisted,
          settings: { ...defaultSettings, ...(persisted.settings ?? {}) },
          traders: persisted.traders ?? {},
        }
      },
      partialize: (s) => ({
        balance: s.balance,
        deposited: s.deposited,
        markets: s.markets,
        positions: s.positions,
        trades: s.trades,
        traders: s.traders,
        settings: s.settings,
      }),
    },
  ),
)

/* ------------------------------- helpers --------------------------------- */

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

function sidePriceOf(q: { qYes: number; qNo: number }, b: number, side: Side): number {
  const y = yesPrice({ qYes: q.qYes, qNo: q.qNo, b })
  return side === 'YES' ? y : 1 - y
}

function upsertPosition(positions: Position[], marketId: string, side: Side, shares: number, cost: number): Position[] {
  const idx = positions.findIndex((p) => p.marketId === marketId && p.side === side)
  if (idx === -1) return [...positions, { marketId, side, shares, cost }]
  const next = positions.slice()
  next[idx] = { ...next[idx], shares: next[idx].shares + shares, cost: next[idx].cost + cost }
  return next
}

function reducePosition(positions: Position[], marketId: string, side: Side, shares: number): Position[] {
  const idx = positions.findIndex((p) => p.marketId === marketId && p.side === side)
  if (idx === -1) return positions
  const p = positions[idx]
  const frac = Math.min(1, shares / p.shares)
  const remainingShares = p.shares - shares
  if (remainingShares <= 1e-6) return positions.filter((_, i) => i !== idx)
  const next = positions.slice()
  next[idx] = { ...p, shares: remainingShares, cost: p.cost * (1 - frac) }
  return next
}

/** Pure state-update: resolve a market, redeem the user's winning shares to cash. */
function settleInto(s: StoreState, marketId: string, outcome: Side, by: string): Partial<StoreState> {
  const m = s.markets.find((x) => x.id === marketId)
  if (!m || m.resolved) return {}
  const now = Date.now()
  let payout = 0
  const newTrades: Trade[] = []
  for (const p of s.positions) {
    if (p.marketId !== marketId) continue
    if (p.side === outcome) {
      payout += p.shares // each winning share redeems for $1
      newTrades.push(mkTrade({ marketId, marketQuestion: m.question, league: m.league, side: p.side, action: 'SELL', shares: p.shares, price: 1, amount: p.shares, t: now, by: `Redeem (${by})` }))
    }
  }
  const markets = s.markets.map((x) =>
    x.id === marketId ? { ...x, resolved: outcome, resolvedAt: now, history: pushPoint(x.history, outcome === 'YES' ? 1 : 0, now) } : x,
  )
  const positions = s.positions.filter((p) => p.marketId !== marketId)
  return {
    markets,
    positions,
    balance: s.balance + payout,
    trades: [...newTrades, ...s.trades].slice(0, TRADES_CAP),
    traders: settleTraders(s.traders, marketId, outcome),
  }
}

/** Apply a batch of bot fills to their ledgers (cash out, shares in). */
function applyBotFills(
  traders: Record<string, TraderLedger>,
  fills: Array<{ name: string; marketId: string; side: Side; shares: number; cost: number }>,
): Record<string, TraderLedger> {
  if (fills.length === 0) return traders
  const next: Record<string, TraderLedger> = { ...traders }
  for (const f of fills) {
    const ledger = next[f.name] ?? { name: f.name, cash: BOT_START, positions: [] }
    next[f.name] = {
      ...ledger,
      cash: ledger.cash - f.cost,
      positions: upsertPosition(ledger.positions, f.marketId, f.side, f.shares, f.cost),
    }
  }
  return next
}

/** Resolve a market across all bot ledgers: winners redeem at $1, all positions clear. */
function settleTraders(
  traders: Record<string, TraderLedger>,
  marketId: string,
  outcome: Side,
): Record<string, TraderLedger> {
  const next: Record<string, TraderLedger> = {}
  for (const [name, ledger] of Object.entries(traders)) {
    let cash = ledger.cash
    for (const p of ledger.positions) {
      if (p.marketId === marketId && p.side === outcome) cash += p.shares
    }
    next[name] = { ...ledger, cash, positions: ledger.positions.filter((p) => p.marketId !== marketId) }
  }
  return next
}

/**
 * Merge a freshly-fetched live slate into existing markets:
 *  - existing markets keep their engine state (q, history, volume) but take new scores/status
 *  - games that just went final are returned in `toSettle` so the caller can pay out
 *  - brand-new games are added (already-final new games arrive pre-resolved)
 *  - untouched sample markets are dropped once real data arrives
 */
function mergeMarkets(
  existing: Market[],
  live: Market[],
  now: number,
): { markets: Market[]; toSettle: Array<{ id: string; outcome: Side }> } {
  const byId = new Map(existing.map((m) => [m.id, m]))
  const liveIds = new Set(live.map((m) => m.id))
  const out: Market[] = []
  const toSettle: Array<{ id: string; outcome: Side }> = []

  for (const f of live) {
    const prev = byId.get(f.id)
    if (!prev) {
      out.push(f) // brand-new game (already resolved if it's final)
      continue
    }
    // Keep engine state; refresh live fields.
    const merged: Market = {
      ...prev,
      home: { ...prev.home, score: f.home.score },
      away: { ...prev.away, score: f.away.score },
      status: f.status,
      statusDetail: f.statusDetail,
      startTime: f.startTime,
      leagueLabel: f.leagueLabel,
    }
    // Defer payout to the caller: leave resolved=null, flag it.
    if (!merged.resolved && f.resolved) {
      toSettle.push({ id: merged.id, outcome: f.resolved })
    }
    out.push(merged)
  }

  // Preserve existing markets the live feed didn't return, EXCEPT untouched samples.
  for (const m of existing) {
    if (liveIds.has(m.id)) continue
    if (m.source === 'sample') continue // sample slate retired once we have real games
    out.push(m)
  }
  return { markets: out, toSettle }
}
