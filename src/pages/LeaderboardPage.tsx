import clsx from 'clsx'
import { useStore } from '../store/useStore'
import { leaderboard } from '../store/selectors'
import type { LeaderRow } from '../store/selectors'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { usd } from '../lib/format'

/* ------------------------------------------------------------------ */
/* Avatar — a deterministic emoji + hue derived from the trader name.  */
/* ------------------------------------------------------------------ */

const AVATARS = [
  '🦊',
  '🐼',
  '🦉',
  '🐙',
  '🦈',
  '🐺',
  '🦁',
  '🐯',
  '🦅',
  '🐧',
  '🦝',
  '🐲',
  '🦄',
  '🐢',
  '🦂',
  '🐝',
]

/** Tiny stable string hash (FNV-ish) — same name always maps the same way. */
function hashName(name: string): number {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function avatarFor(name: string): { emoji: string; hue: number } {
  const h = hashName(name)
  return { emoji: AVATARS[h % AVATARS.length], hue: h % 360 }
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LeaderboardPage() {
  const markets = useStore((s) => s.markets)
  const traders = useStore((s) => s.traders)
  const balance = useStore((s) => s.balance)
  const positions = useStore((s) => s.positions)
  const deposited = useStore((s) => s.deposited)

  const rows = leaderboard(markets, traders, { balance, positions, deposited })
  // Only "You" present means the bot field hasn't warmed up yet.
  const warmingUp = rows.length <= 1
  const top3 = rows.slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-text-muted mt-1">You vs the bots — ranked by net worth</p>
      </header>

      {warmingUp ? (
        <WarmingUp />
      ) : (
        <>
          <Podium rows={top3} />
          <RankTable rows={rows} />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Empty / early state                                                 */
/* ------------------------------------------------------------------ */

function WarmingUp() {
  return (
    <div className="card p-10 flex flex-col items-center text-center animate-fade-in">
      <div className="flex gap-1.5 mb-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-brand/70 animate-pulse"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
      <h2 className="font-bold text-lg">Bots are warming up</h2>
      <p className="text-sm text-text-muted mt-1 max-w-xs">
        The simulated traders take a few seconds to place their first bets. The board fills in as
        soon as they get going.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Podium (top 3)                                                      */
/* ------------------------------------------------------------------ */

function Podium({ rows }: { rows: LeaderRow[] }) {
  // Visual order: 2nd, 1st, 3rd — champion raised in the middle.
  const order: Array<{ row: LeaderRow; rank: number } | null> = [
    rows[1] ? { row: rows[1], rank: 2 } : null,
    rows[0] ? { row: rows[0], rank: 1 } : null,
    rows[2] ? { row: rows[2], rank: 3 } : null,
  ]

  return (
    <div className="grid grid-cols-3 gap-3 items-end mb-8">
      {order.map((entry, i) =>
        entry ? (
          <PodiumCard key={entry.row.name} row={entry.row} rank={entry.rank} />
        ) : (
          <div key={`empty-${i}`} />
        ),
      )}
    </div>
  )
}

const PODIUM_HEIGHT: Record<number, string> = {
  1: 'pt-7 pb-6',
  2: 'pt-5 pb-5',
  3: 'pt-4 pb-4',
}

function PodiumCard({ row, rank }: { row: LeaderRow; rank: number }) {
  const { emoji, hue } = avatarFor(row.name)
  const champion = rank === 1
  const up = row.pnl >= 0

  return (
    <div
      className={clsx(
        'card relative flex flex-col items-center text-center px-2 animate-pop-in overflow-hidden',
        PODIUM_HEIGHT[rank],
        champion && 'ring-1 ring-yes-strong/50',
        row.isYou && 'ring-2 ring-brand',
      )}
      style={{ animationDelay: `${(3 - rank) * 70}ms` }}
    >
      {champion && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yes-strong/70 to-transparent"
        />
      )}
      <div className="text-2xl leading-none mb-1.5">{MEDALS[rank]}</div>
      <div
        className={clsx(
          'grid place-items-center rounded-full font-bold mb-2',
          champion ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg',
        )}
        style={{
          background: `hsl(${hue} 45% 22%)`,
          color: `hsl(${hue} 80% 78%)`,
          boxShadow: `0 0 0 1px hsl(${hue} 50% 35% / 0.6)`,
        }}
      >
        {row.isYou ? '🫵' : emoji}
      </div>
      <div className="flex items-center gap-1 min-w-0 max-w-full">
        <span className={clsx('truncate text-sm', row.isYou ? 'font-extrabold' : 'font-semibold')}>
          {row.name}
        </span>
        {row.isYou && <span className="pill text-[10px] px-1.5 py-0.5 shrink-0">YOU</span>}
      </div>
      <AnimatedNumber
        value={row.netWorth}
        format={(n) => usd(n)}
        className={clsx('tabular-nums mt-1', champion ? 'text-lg font-extrabold' : 'text-base font-bold')}
      />
      <div className={clsx('text-xs tabular-nums mt-0.5', up ? 'text-yes' : 'text-no')}>
        {usd(row.pnl, { sign: true })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Full ranked table                                                   */
/* ------------------------------------------------------------------ */

function RankTable({ rows }: { rows: LeaderRow[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="hidden sm:grid grid-cols-[3.5rem_1fr_auto_auto_auto] gap-3 px-4 py-2.5 text-[11px] uppercase tracking-wide text-text-faint border-b border-ink-600">
        <span>Rank</span>
        <span>Trader</span>
        <span className="text-right">Net worth</span>
        <span className="text-right w-28">P&amp;L</span>
        <span className="text-right w-16">Open</span>
      </div>
      <ul>
        {rows.map((row, i) => (
          <RankRow key={row.name} row={row} rank={i + 1} />
        ))}
      </ul>
    </div>
  )
}

function RankRow({ row, rank }: { row: LeaderRow; rank: number }) {
  const { emoji, hue } = avatarFor(row.name)
  const up = row.pnl >= 0
  const medal = MEDALS[rank]

  return (
    <li
      className={clsx(
        'grid grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-ink-700/70 last:border-b-0 transition-colors',
        row.isYou ? 'bg-brand/10 ring-1 ring-inset ring-brand/60' : 'hover:bg-ink-750/50',
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center">
        {medal ? (
          <span className="text-lg leading-none">{medal}</span>
        ) : (
          <span className="text-sm font-bold tabular-nums text-text-muted">{rank}</span>
        )}
      </div>

      {/* Trader */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="grid place-items-center w-8 h-8 rounded-full text-base shrink-0"
          style={{
            background: `hsl(${hue} 45% 20%)`,
            color: `hsl(${hue} 80% 78%)`,
            boxShadow: `0 0 0 1px hsl(${hue} 50% 32% / 0.6)`,
          }}
          aria-hidden
        >
          {row.isYou ? '🫵' : emoji}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={clsx('truncate', row.isYou ? 'font-extrabold text-text' : 'font-medium')}
            >
              {row.name}
            </span>
            {row.isYou && <span className="pill text-[10px] px-1.5 py-0.5 shrink-0">YOU</span>}
          </div>
          {/* P&L inline on mobile where the dedicated column is hidden */}
          <div
            className={clsx(
              'sm:hidden text-xs tabular-nums mt-0.5',
              up ? 'text-yes' : 'text-no',
            )}
          >
            {usd(row.pnl, { sign: true })} · {row.positions} open
          </div>
        </div>
      </div>

      {/* Net worth */}
      <AnimatedNumber
        value={row.netWorth}
        format={(n) => usd(n)}
        className={clsx(
          'text-right tabular-nums',
          row.isYou ? 'font-extrabold' : 'font-semibold',
        )}
      />

      {/* P&L (desktop column) */}
      <div className={clsx('hidden sm:flex flex-col items-end w-28 tabular-nums', up ? 'text-yes' : 'text-no')}>
        <span className="text-sm font-semibold">{usd(row.pnl, { sign: true })}</span>
        <span className="text-[11px] opacity-80">
          {up ? '+' : ''}
          {(row.pnlPct * 100).toFixed(1)}%
        </span>
      </div>

      {/* Open positions (desktop column) */}
      <div className="hidden sm:block text-right w-16 tabular-nums text-sm text-text-muted">
        {row.positions}
      </div>
    </li>
  )
}
