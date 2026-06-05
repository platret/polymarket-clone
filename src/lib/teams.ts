/**
 * A curated catalog of popular teams for the onboarding "follow your teams"
 * picker. Favorites are stored as teamKey() strings so they match live markets.
 */
export const teamKey = (league: string, abbr: string) => `${league}:${abbr.toUpperCase()}`

export interface CatalogTeam {
  league: string
  leagueLabel: string
  name: string
  abbr: string
  logo: string
  color: string
}

const nba = (a: string) => `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${a}.png`
const nfl = (a: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${a}.png`
const mlb = (a: string) => `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${a}.png`
const nhl = (a: string) => `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${a}.png`
const soc = (id: string) => `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`

function t(league: string, leagueLabel: string, name: string, abbr: string, logo: string, color: string): CatalogTeam {
  return { league, leagueLabel, name, abbr, logo, color }
}

export const TEAM_CATALOG: CatalogTeam[] = [
  // NBA
  t('nba', 'NBA', 'Lakers', 'LAL', nba('lal'), '552583'),
  t('nba', 'NBA', 'Celtics', 'BOS', nba('bos'), '007a33'),
  t('nba', 'NBA', 'Warriors', 'GS', nba('gs'), '1d428a'),
  t('nba', 'NBA', 'Nuggets', 'DEN', nba('den'), '0e2240'),
  t('nba', 'NBA', 'Thunder', 'OKC', nba('okc'), '007ac1'),
  t('nba', 'NBA', 'Knicks', 'NY', nba('ny'), 'f58426'),
  // NFL
  t('nfl', 'NFL', 'Chiefs', 'KC', nfl('kc'), 'e31837'),
  t('nfl', 'NFL', '49ers', 'SF', nfl('sf'), 'aa0000'),
  t('nfl', 'NFL', 'Cowboys', 'DAL', nfl('dal'), '003594'),
  t('nfl', 'NFL', 'Eagles', 'PHI', nfl('phi'), '06424d'),
  t('nfl', 'NFL', 'Bills', 'BUF', nfl('buf'), '00338d'),
  t('nfl', 'NFL', 'Lions', 'DET', nfl('det'), '0076b6'),
  // MLB
  t('mlb', 'MLB', 'Dodgers', 'LAD', mlb('lad'), '005a9c'),
  t('mlb', 'MLB', 'Yankees', 'NYY', mlb('nyy'), '003087'),
  t('mlb', 'MLB', 'Braves', 'ATL', mlb('atl'), 'ce1141'),
  t('mlb', 'MLB', 'Dodgers', 'LAD', mlb('lad'), '005a9c'),
  t('mlb', 'MLB', 'Cubs', 'CHC', mlb('chc'), '0e3386'),
  t('mlb', 'MLB', 'Phillies', 'PHI', mlb('phi'), 'e81828'),
  // NHL
  t('nhl', 'NHL', 'Oilers', 'EDM', nhl('edm'), 'fc4c02'),
  t('nhl', 'NHL', 'Maple Leafs', 'TOR', nhl('tor'), '00205b'),
  t('nhl', 'NHL', 'Bruins', 'BOS', nhl('bos'), 'fcb514'),
  t('nhl', 'NHL', 'Rangers', 'NYR', nhl('nyr'), '0038a8'),
  t('nhl', 'NHL', 'Panthers', 'FLA', nhl('fla'), 'c8102e'),
  // EPL
  t('epl', 'EPL', 'Man City', 'MCI', soc('382'), '6cabdd'),
  t('epl', 'EPL', 'Arsenal', 'ARS', soc('359'), 'ef0107'),
  t('epl', 'EPL', 'Liverpool', 'LIV', soc('364'), 'c8102e'),
  t('epl', 'EPL', 'Man United', 'MUN', soc('360'), 'da291c'),
  t('epl', 'EPL', 'Chelsea', 'CHE', soc('363'), '034694'),
  t('epl', 'EPL', 'Tottenham', 'TOT', soc('367'), '132257'),
]

// De-dupe accidental repeats by teamKey.
export const TEAM_CATALOG_UNIQUE: CatalogTeam[] = Object.values(
  Object.fromEntries(TEAM_CATALOG.map((t) => [teamKey(t.league, t.abbr), t])),
)
