export type Side = 'YES' | 'NO'

export type MarketStatus = 'pre' | 'in' | 'post'

export interface Team {
  name: string
  shortName: string
  abbr: string
  logo: string
  color: string // hex without leading '#'
  score: number
}

export interface PricePoint {
  t: number // epoch ms
  p: number // YES price, 0..1
}

export interface Market {
  id: string // ESPN event id, or sample id
  league: string // 'nba'
  leagueLabel: string // 'NBA'
  category: string // 'Sports'
  question: string // "Will the Spurs win?"
  shortName: string // "NYK @ SAS"
  home: Team
  away: Team // convention: YES = home team wins
  startTime: number // epoch ms
  status: MarketStatus
  statusDetail: string // "Fri 8:30 PM" / "Q3 4:21" / "Final"

  // LMSR engine state
  b: number // liquidity parameter
  qYes: number // outstanding YES shares
  qNo: number // outstanding NO shares
  fair: number // hidden "fair" YES prob that bots gravitate toward (0..1)

  volume: number // total $ traded
  history: PricePoint[] // YES price over time
  resolved: Side | null // outcome once settled
  resolvedAt: number | null
  source: 'espn' | 'sample'
}

export interface Position {
  marketId: string
  side: Side
  shares: number
  cost: number // cost basis: total $ spent acquiring current shares
}

export interface Trade {
  id: string
  marketId: string
  marketQuestion: string
  league: string
  side: Side
  action: 'BUY' | 'SELL'
  shares: number
  price: number // avg price/share, 0..1
  amount: number // $ moved (positive)
  t: number
  by: string // 'You' or a bot handle
}

export type OddsFormat = 'percent' | 'american' | 'decimal'

export interface Settings {
  leagues: string[] // enabled league keys
  botsEnabled: boolean
  liquidity: number // base b
  oddsFormat: OddsFormat
  favorites: string[] // teamKey() values the user follows
  onboarded: boolean
}

/** A simulated trader's ledger — powers the leaderboard. */
export interface TraderLedger {
  name: string
  cash: number
  positions: Position[]
}
