/**
 * ESPN's free, no-key, CORS-enabled scoreboard API -> normalised Markets.
 *
 *   https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard
 *
 * Returns real teams, logos, colours, live scores, final status, and — handily —
 * embedded sportsbook odds we use to seed an honest opening price.
 */
import type { Market, MarketStatus, Team } from '../types'
import { devig, moneylineToProb, seedQuantities } from './marketEngine'

export interface LeagueDef {
  key: string // our internal key
  label: string // 'NBA'
  path: string // ESPN sport/league path
  emoji: string
}

export const LEAGUES: LeagueDef[] = [
  { key: 'nfl', label: 'NFL', path: 'football/nfl', emoji: '🏈' },
  { key: 'nba', label: 'NBA', path: 'basketball/nba', emoji: '🏀' },
  { key: 'mlb', label: 'MLB', path: 'baseball/mlb', emoji: '⚾' },
  { key: 'nhl', label: 'NHL', path: 'hockey/nhl', emoji: '🏒' },
  { key: 'epl', label: 'EPL', path: 'soccer/eng.1', emoji: '⚽' },
  { key: 'ncaaf', label: 'NCAAF', path: 'football/college-football', emoji: '🏟️' },
  { key: 'ncaam', label: 'NCAAM', path: 'basketball/mens-college-basketball', emoji: '🎓' },
  { key: 'wnba', label: 'WNBA', path: 'basketball/wnba', emoji: '🏀' },
  { key: 'ucl', label: 'UCL', path: 'soccer/uefa.champions', emoji: '🏆' },
  { key: 'laliga', label: 'La Liga', path: 'soccer/esp.1', emoji: '⚽' },
]

export const LEAGUE_BY_KEY: Record<string, LeagueDef> = Object.fromEntries(
  LEAGUES.map((l) => [l.key, l]),
)

const BASE = 'https://site.api.espn.com/apis/site/v2/sports'

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? (n as number) : fallback
}

function stateToStatus(state: string): MarketStatus {
  if (state === 'in') return 'in'
  if (state === 'post') return 'post'
  return 'pre'
}

function toTeam(c: any): Team {
  const t = c?.team ?? {}
  return {
    name: t.displayName ?? t.name ?? 'TBD',
    shortName: t.shortDisplayName ?? t.name ?? t.displayName ?? 'TBD',
    abbr: t.abbreviation ?? (t.displayName ?? 'TBD').slice(0, 3).toUpperCase(),
    logo: t.logo ?? t.logos?.[0]?.href ?? '',
    color: (t.color && t.color !== '000000' ? t.color : t.alternateColor) || '64748b',
    score: num(c?.score, 0),
  }
}

/** Derive a fair P(home wins) from ESPN's embedded odds, with sensible fallbacks. */
function fairFromOdds(odds: any, homeFavoriteHint?: boolean): number {
  if (!odds) return 0.5
  const homeML = odds.homeTeamOdds?.moneyLine ?? odds.homeTeamOdds?.current?.moneyLine?.american
  const awayML = odds.awayTeamOdds?.moneyLine ?? odds.awayTeamOdds?.current?.moneyLine?.american
  const hML = typeof homeML === 'string' ? parseFloat(homeML.replace('+', '')) : homeML
  const aML = typeof awayML === 'string' ? parseFloat(awayML.replace('+', '')) : awayML
  if (Number.isFinite(hML) && Number.isFinite(aML)) {
    return clampFair(devig(moneylineToProb(hML), moneylineToProb(aML)))
  }
  // Fall back to the point spread: convert margin to a win prob via a logistic.
  const spread = num(odds.spread, NaN)
  if (Number.isFinite(spread)) {
    const homeFav = odds.homeTeamOdds?.favorite ?? homeFavoriteHint ?? spread < 0
    const mag = Math.abs(spread)
    const pFav = 1 / (1 + Math.exp(-mag * 0.18)) // ~0.5 at pick'em, ~0.8 at -8.5
    return clampFair(homeFav ? pFav : 1 - pFav)
  }
  return 0.5
}

function clampFair(p: number): number {
  return Math.min(0.92, Math.max(0.08, p))
}

function buildMarket(event: any, league: LeagueDef, b: number, now: number): Market | null {
  try {
    const comp = event?.competitions?.[0]
    if (!comp) return null
    const competitors: any[] = comp.competitors ?? []
    const homeC = competitors.find((c) => c.homeAway === 'home') ?? competitors[0]
    const awayC = competitors.find((c) => c.homeAway === 'away') ?? competitors[1]
    if (!homeC || !awayC) return null

    const home = toTeam(homeC)
    const away = toTeam(awayC)
    const state = event?.status?.type?.state ?? 'pre'
    const status = stateToStatus(state)
    const startTime = Date.parse(event?.date ?? '') || now

    const odds = comp.odds?.[0]
    const fair = fairFromOdds(odds, homeC.favorite)
    const { qYes, qNo } = seedQuantities(b, fair)

    // Resolve immediately if the game is already final.
    let resolved: Market['resolved'] = null
    let resolvedAt: number | null = null
    const completed = event?.status?.type?.completed === true || status === 'post'
    if (completed) {
      // Question is "Will the home team win?" -> YES iff home wins; a draw or
      // away win both resolve NO (handles soccer draws correctly).
      resolved = home.score > away.score ? 'YES' : 'NO'
      resolvedAt = now
    }

    return {
      id: String(event.id),
      league: league.key,
      leagueLabel: league.label,
      category: 'Sports',
      question: `Will the ${home.shortName} win?`,
      shortName: `${away.abbr} @ ${home.abbr}`,
      home,
      away,
      startTime,
      status,
      statusDetail: event?.status?.type?.shortDetail ?? '',
      b,
      qYes,
      qNo,
      fair,
      volume: 0,
      history: [{ t: now, p: fair }],
      resolved,
      resolvedAt,
      source: 'espn',
    }
  } catch {
    return null
  }
}

async function fetchLeague(league: LeagueDef, b: number, now: number): Promise<Market[]> {
  const res = await fetch(`${BASE}/${league.path}/scoreboard`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`ESPN ${league.key} ${res.status}`)
  const data = await res.json()
  const events: any[] = data?.events ?? []
  return events.map((e) => buildMarket(e, league, b, now)).filter((m): m is Market => m !== null)
}

/** Fetch markets for the given league keys. Resolves per-league; failures are skipped. */
export async function fetchMarkets(leagueKeys: string[], b: number): Promise<Market[]> {
  const now = Date.now()
  const defs = leagueKeys.map((k) => LEAGUE_BY_KEY[k]).filter(Boolean)
  const results = await Promise.allSettled(defs.map((d) => fetchLeague(d, b, now)))
  const out: Market[] = []
  for (const r of results) if (r.status === 'fulfilled') out.push(...r.value)
  return out
}
