import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { useStore } from '../store/useStore'
import { teamKey, TEAM_CATALOG_UNIQUE, type CatalogTeam } from '../lib/teams'
import { LogoMark } from './Logo'

type Step = 0 | 1 | 2

const VALUE_PROPS: { icon: string; title: string; detail: string }[] = [
  {
    icon: '📡',
    title: 'Real games, real odds',
    detail: 'Live matchups and prices pulled straight from ESPN.',
  },
  {
    icon: '🃏',
    title: 'Play with fake money',
    detail: 'Start with $10,000 in house cash. Zero risk, all the thrill.',
  },
  {
    icon: '📈',
    title: 'Move the market',
    detail: 'Every trade shifts the odds. Beat the bots to the top.',
  },
]

/** Renders one selectable team tile with a logo + colored fallback. */
function TeamTile({
  team,
  selected,
  onToggle,
}: {
  team: CatalogTeam
  selected: boolean
  onToggle: () => void
}) {
  const [broken, setBroken] = useState(false)
  const showImg = team.logo && !broken
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={clsx(
        'group relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
        'hover:bg-ink-700/70 active:scale-[0.98]',
        selected
          ? 'border-brand bg-brand/10 ring-1 ring-brand shadow-[0_0_0_1px_rgba(45,108,255,0.35),0_8px_24px_-12px_rgba(45,108,255,0.6)]'
          : 'border-ink-600 bg-ink-800',
      )}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold"
        style={showImg ? undefined : { background: `#${team.color}`, color: '#fff' }}
      >
        {showImg ? (
          <img
            src={team.logo}
            alt={team.abbr}
            className="h-full w-full object-contain"
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : (
          team.abbr.slice(0, 3)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text">{team.name}</span>
        <span className="block text-[11px] font-medium text-text-faint">{team.abbr}</span>
      </span>
      <span
        className={clsx(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition',
          selected
            ? 'scale-100 border-brand bg-brand text-white opacity-100'
            : 'scale-90 border-ink-500 text-transparent opacity-0 group-hover:opacity-60',
        )}
      >
        ✓
      </span>
    </button>
  )
}

export function Onboarding() {
  const show = useStore((s) => !s.settings.onboarded)
  const completeOnboarding = useStore((s) => s.completeOnboarding)

  const [step, setStep] = useState<Step>(0)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogTeam[]>()
    for (const team of TEAM_CATALOG_UNIQUE) {
      const list = map.get(team.leagueLabel)
      if (list) list.push(team)
      else map.set(team.leagueLabel, [team])
    }
    return [...map.entries()]
  }, [])

  if (!show) return null

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const finish = () => completeOnboarding([...selected])

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4">
      {/* Backdrop: dark gradient + animated brand blobs + subtle grain */}
      <div className="absolute inset-0 animate-fade-in bg-ink-900">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-850 to-[#0a0d18]" />
        <div className="absolute -left-32 top-[-10%] h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-[120px] animate-blob-a" />
        <div className="absolute -right-32 bottom-[-12%] h-[30rem] w-[30rem] rounded-full bg-[#6d28d9]/25 blur-[130px] animate-blob-b" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-yes/15 blur-[120px] animate-blob-c" />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <style>{`
        @keyframes ob-blob-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.12); } }
        @keyframes ob-blob-b { 0%,100% { transform: translate(0,0) scale(1.05); } 50% { transform: translate(-36px,-26px) scale(1); } }
        @keyframes ob-blob-c { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-44%,-58%) scale(1.18); } }
        .animate-blob-a { animation: ob-blob-a 14s ease-in-out infinite; }
        .animate-blob-b { animation: ob-blob-b 16s ease-in-out infinite; }
        .animate-blob-c { animation: ob-blob-c 18s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob-a, .animate-blob-b, .animate-blob-c { animation: none; }
        }
      `}</style>

      {/* Card */}
      <div className="relative w-full max-w-xl animate-pop-in rounded-2xl border border-ink-600 bg-ink-850/90 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
        {/* Top bar: back + progress */}
        <div className="mb-7 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
            className={clsx(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-ink-700 hover:text-text',
              step === 0 && 'pointer-events-none opacity-0',
            )}
            aria-label="Go back"
          >
            ←
          </button>
          <div className="flex flex-1 items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={clsx(
                  'h-1.5 rounded-full transition-all duration-500',
                  i === step ? 'w-8 bg-brand' : i < step ? 'w-4 bg-brand/50' : 'w-4 bg-ink-600',
                )}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-text-faint">
            {step + 1} / 3
          </span>
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div key="s0" className="animate-fade-in">
            <div className="mb-5 flex items-center gap-3">
              <span className="drop-shadow-[0_6px_18px_rgba(45,108,255,0.5)]">
                <LogoMark size={48} />
              </span>
              <span className="text-2xl font-extrabold tracking-tight">
                Poly
                <span className="bg-gradient-to-r from-brand to-[#8b5cf6] bg-clip-text text-transparent">
                  market
                </span>
              </span>
            </div>

            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight">
              Trade the games <br className="hidden sm:block" />
              you love.
            </h1>
            <p className="mt-3 max-w-md text-text-muted">
              A prediction market for live sports — powered by real odds, played with funny money.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {VALUE_PROPS.map((vp, i) => (
                <div
                  key={vp.title}
                  className="flex animate-fade-in items-start gap-3 rounded-xl border border-ink-600 bg-ink-800/60 px-3.5 py-3"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-700 text-base">
                    {vp.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">{vp.title}</div>
                    <div className="text-[13px] leading-snug text-text-muted">{vp.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-brand mt-7 w-full py-3 text-base font-bold shadow-[0_10px_30px_-8px_rgba(45,108,255,0.7)]"
            >
              Get started →
            </button>
          </div>
        )}

        {/* Step 1 — Follow your teams */}
        {step === 1 && (
          <div key="s1" className="animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Follow your teams</h2>
                <p className="mt-1.5 max-w-sm text-sm text-text-muted">
                  We'll surface their games first. Optional — pick as many as you like.
                </p>
              </div>
              <span
                className={clsx(
                  'pill shrink-0 tabular-nums transition',
                  selected.size > 0 ? 'bg-brand/15 text-brand' : 'bg-ink-700 text-text-faint',
                )}
              >
                {selected.size} following
              </span>
            </div>

            <div className="-mr-2 mt-5 max-h-[46vh] space-y-5 overflow-y-auto pr-2">
              {grouped.map(([label, teams]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint">
                      {label}
                    </span>
                    <span className="h-px flex-1 bg-ink-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {teams.map((team) => {
                      const key = teamKey(team.league, team.abbr)
                      return (
                        <TeamTile
                          key={key}
                          team={team}
                          selected={selected.has(key)}
                          onToggle={() => toggle(key)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm font-medium text-text-faint transition hover:text-text"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-brand ml-auto px-6 py-3 font-bold"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — You're set */}
        {step === 2 && (
          <div key="s2" className="animate-fade-in text-center">
            <div className="mx-auto grid h-16 w-16 animate-pop-in place-items-center rounded-2xl bg-gradient-to-br from-yes to-yes-strong text-3xl text-white shadow-[0_12px_36px_-8px_rgba(39,174,139,0.7)]">
              ✓
            </div>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">You're all set</h2>
            <p className="mx-auto mt-2 max-w-sm text-text-muted">
              {selected.size > 0
                ? `Following ${selected.size} ${selected.size === 1 ? 'team' : 'teams'}. Your $10,000 is ready to wager.`
                : 'Your $10,000 in fake cash is loaded and ready to wager.'}
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-ink-600 bg-ink-800/60 px-4 py-3.5 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-text">
                <span className="text-base">💡</span> How to trade
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                Tap a market, pick <span className="font-semibold text-yes">Yes</span> or{' '}
                <span className="font-semibold text-no">No</span>, then size your bet. Buy low,
                sell high, and watch the odds move with every trade.
              </p>
            </div>

            <button
              type="button"
              onClick={finish}
              className="btn-brand mt-7 w-full py-3 text-base font-bold shadow-[0_10px_30px_-8px_rgba(45,108,255,0.7)]"
            >
              Enter Polymarket
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
