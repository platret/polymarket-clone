import clsx from 'clsx'
import { LEAGUES } from '../lib/espn'

interface Props {
  active: string // league key or 'all'
  onChange: (key: string) => void
  counts: Record<string, number>
}

export function CategoryTabs({ active, onChange, counts }: Props) {
  const tabs = [{ key: 'all', label: 'All', emoji: '🔥' }, ...LEAGUES.map((l) => ({ key: l.key, label: l.label, emoji: l.emoji }))]
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {tabs.map((t) => {
        const n = t.key === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[t.key] ?? 0
        if (t.key !== 'all' && n === 0) return null
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={clsx(
              'pill whitespace-nowrap px-3.5 py-1.5 text-sm transition border',
              active === t.key
                ? 'bg-text text-ink-900 border-text font-bold'
                : 'bg-ink-800 text-text-muted border-ink-600 hover:border-ink-500 hover:text-text',
            )}
          >
            <span>{t.emoji}</span>
            {t.label}
            <span className={clsx('text-[11px]', active === t.key ? 'text-ink-700' : 'text-text-faint')}>{n}</span>
          </button>
        )
      })}
    </div>
  )
}
