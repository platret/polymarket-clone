/**
 * A realistic fallback slate used when ESPN is unreachable (offline / rate-limit).
 * Logos point at ESPN's stable CDN; if any 404 the UI falls back to coloured initials.
 */
import type { Market, Team } from '../types'
import { seedQuantities } from './marketEngine'

interface Seed {
  id: string
  league: string
  leagueLabel: string
  home: [name: string, short: string, abbr: string, logoKey: string, color: string]
  away: [name: string, short: string, abbr: string, logoKey: string, color: string]
  fair: number // P(home wins)
  inHours: number // start time offset
  live?: { hs: number; as: number; detail: string }
}

function nbaLogo(k: string) {
  return `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${k}.png`
}
function nflLogo(k: string) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${k}.png`
}
function mlbLogo(k: string) {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${k}.png`
}
function nhlLogo(k: string) {
  return `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${k}.png`
}
function soccerLogo(id: string) {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`
}

const SEEDS: Seed[] = [
  {
    id: 'sample-nba-1', league: 'nba', leagueLabel: 'NBA',
    home: ['Boston Celtics', 'Celtics', 'BOS', nbaLogo('bos'), '007a33'],
    away: ['Los Angeles Lakers', 'Lakers', 'LAL', nbaLogo('lal'), '552583'],
    fair: 0.63, inHours: 3,
  },
  {
    id: 'sample-nba-2', league: 'nba', leagueLabel: 'NBA',
    home: ['Denver Nuggets', 'Nuggets', 'DEN', nbaLogo('den'), '0e2240'],
    away: ['Golden State Warriors', 'Warriors', 'GSW', nbaLogo('gs'), '1d428a'],
    fair: 0.58, inHours: 5,
    live: { hs: 71, as: 68, detail: 'Q3 4:12' },
  },
  {
    id: 'sample-nba-3', league: 'nba', leagueLabel: 'NBA',
    home: ['Oklahoma City Thunder', 'Thunder', 'OKC', nbaLogo('okc'), '007ac1'],
    away: ['Minnesota Timberwolves', 'Wolves', 'MIN', nbaLogo('min'), '0c2340'],
    fair: 0.7, inHours: 27,
  },
  {
    id: 'sample-nfl-1', league: 'nfl', leagueLabel: 'NFL',
    home: ['Kansas City Chiefs', 'Chiefs', 'KC', nflLogo('kc'), 'e31837'],
    away: ['Buffalo Bills', 'Bills', 'BUF', nflLogo('buf'), '00338d'],
    fair: 0.55, inHours: 49,
  },
  {
    id: 'sample-nfl-2', league: 'nfl', leagueLabel: 'NFL',
    home: ['San Francisco 49ers', '49ers', 'SF', nflLogo('sf'), 'aa0000'],
    away: ['Dallas Cowboys', 'Cowboys', 'DAL', nflLogo('dal'), '041e42'],
    fair: 0.61, inHours: 51,
  },
  {
    id: 'sample-nfl-3', league: 'nfl', leagueLabel: 'NFL',
    home: ['Philadelphia Eagles', 'Eagles', 'PHI', nflLogo('phi'), '06424d'],
    away: ['New York Giants', 'Giants', 'NYG', nflLogo('nyg'), '0b2265'],
    fair: 0.74, inHours: 73,
  },
  {
    id: 'sample-mlb-1', league: 'mlb', leagueLabel: 'MLB',
    home: ['Los Angeles Dodgers', 'Dodgers', 'LAD', mlbLogo('lad'), '005a9c'],
    away: ['New York Yankees', 'Yankees', 'NYY', mlbLogo('nyy'), '003087'],
    fair: 0.56, inHours: 6,
  },
  {
    id: 'sample-mlb-2', league: 'mlb', leagueLabel: 'MLB',
    home: ['Atlanta Braves', 'Braves', 'ATL', mlbLogo('atl'), 'ce1141'],
    away: ['Philadelphia Phillies', 'Phillies', 'PHI', mlbLogo('phi'), 'e81828'],
    fair: 0.52, inHours: 8,
  },
  {
    id: 'sample-nhl-1', league: 'nhl', leagueLabel: 'NHL',
    home: ['Edmonton Oilers', 'Oilers', 'EDM', nhlLogo('edm'), 'fc4c02'],
    away: ['Colorado Avalanche', 'Avalanche', 'COL', nhlLogo('col'), '6f263d'],
    fair: 0.49, inHours: 4,
  },
  {
    id: 'sample-nhl-2', league: 'nhl', leagueLabel: 'NHL',
    home: ['Florida Panthers', 'Panthers', 'FLA', nhlLogo('fla'), 'c8102e'],
    away: ['Toronto Maple Leafs', 'Maple Leafs', 'TOR', nhlLogo('tor'), '00205b'],
    fair: 0.6, inHours: 26,
  },
  {
    id: 'sample-epl-1', league: 'epl', leagueLabel: 'EPL',
    home: ['Manchester City', 'Man City', 'MCI', soccerLogo('382'), '6cabdd'],
    away: ['Arsenal', 'Arsenal', 'ARS', soccerLogo('359'), 'ef0107'],
    fair: 0.57, inHours: 30,
  },
  {
    id: 'sample-epl-2', league: 'epl', leagueLabel: 'EPL',
    home: ['Liverpool', 'Liverpool', 'LIV', soccerLogo('364'), 'c8102e'],
    away: ['Manchester United', 'Man Utd', 'MUN', soccerLogo('360'), 'da291c'],
    fair: 0.64, inHours: 32,
  },
]

function team([name, shortName, abbr, logo, color]: Seed['home'], score: number): Team {
  return { name, shortName, abbr, logo, color, score }
}

export function makeSampleMarkets(b: number): Market[] {
  const now = Date.now()
  return SEEDS.map((s) => {
    const { qYes, qNo } = seedQuantities(b, s.fair)
    const status = s.live ? 'in' : 'pre'
    const startTime = now + s.inHours * 3600_000 - (s.live ? 3600_000 : 0)
    return {
      id: s.id,
      league: s.league,
      leagueLabel: s.leagueLabel,
      category: 'Sports',
      question: `Will the ${s.home[1]} win?`,
      shortName: `${s.away[2]} @ ${s.home[2]}`,
      home: team(s.home, s.live?.hs ?? 0),
      away: team(s.away, s.live?.as ?? 0),
      startTime,
      status,
      statusDetail: s.live?.detail ?? '',
      b,
      qYes,
      qNo,
      fair: s.fair,
      volume: Math.round(5000 + Math.abs(hash(s.id)) % 90000),
      history: seedHistory(now, s.fair),
      resolved: null,
      resolvedAt: null,
      source: 'sample',
    } satisfies Market
  })
}

/** A gently wandering opening price history so charts aren't a flat line. */
function seedHistory(now: number, fair: number) {
  const pts = []
  const n = 40
  let p = fair
  let seed = Math.floor(fair * 9973)
  for (let i = n; i >= 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const noise = ((seed / 0x7fffffff) - 0.5) * 0.05
    p = Math.min(0.95, Math.max(0.05, fair + noise + (p - fair) * 0.6))
    pts.push({ t: now - i * 1800_000, p })
  }
  pts.push({ t: now, p: fair })
  return pts
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
