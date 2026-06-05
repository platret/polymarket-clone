/**
 * Tiny, reusable bits for displaying a probability in the user's chosen odds
 * format. `OddsValue` is a bare inline value; `PriceTag` is a compact pill that
 * leads with the cents price and trails the formatted odds as a muted aside.
 */
import clsx from 'clsx'
import type { Side } from '../types'
import { useStore } from '../store/useStore'
import { formatOdds } from '../lib/odds'
import { cents } from '../lib/format'

/** A probability rendered in whatever odds format the user has selected. */
export function OddsValue({ p, className }: { p: number; className?: string }) {
  const fmt = useStore((s) => s.settings.oddsFormat)
  return <span className={clsx('tabular-nums', className)}>{formatOdds(p, fmt)}</span>
}

const SIDE_STYLES: Record<Side, string> = {
  YES: 'bg-yes-soft text-yes-strong',
  NO: 'bg-no-soft text-no-strong',
}

/**
 * Compact price pill: big cents value with the formatted odds underneath as a
 * small muted secondary line. Tints to YES/NO when `side` is supplied.
 */
export function PriceTag({
  p,
  side,
  label,
  className,
}: {
  p: number
  side?: Side
  label?: string
  className?: string
}) {
  const fmt = useStore((s) => s.settings.oddsFormat)
  return (
    <span
      className={clsx(
        'inline-flex flex-col items-center leading-none rounded-lg px-2 py-1',
        side ? SIDE_STYLES[side] : 'bg-ink-750 text-text',
        className,
      )}
    >
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      )}
      <span className="text-base font-bold tabular-nums">{cents(p)}</span>
      <span className="text-[10px] tabular-nums opacity-60">{formatOdds(p, fmt)}</span>
    </span>
  )
}
