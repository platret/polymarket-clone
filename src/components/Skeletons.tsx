import clsx from 'clsx'

/**
 * A pulsing placeholder block. The `shimmer` flag adds a subtle moving
 * highlight on top of the base pulse for a more lifelike loading state.
 */
function Block({ className, shimmer = true }: { className?: string; shimmer?: boolean }) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-md bg-ink-700 animate-pulse',
        className,
      )}
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-600/60 to-transparent"
          style={{ animation: 'sk-shimmer 1.6s ease-in-out infinite' }}
        />
      )}
    </div>
  )
}

/**
 * Card-shaped placeholder that mirrors the MarketCard layout:
 * header line, matchup row with two round badges, big number,
 * two buttons, and a footer line.
 */
export function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3 animate-fade-in" aria-hidden>
      {/* keyframes for the shimmer sweep — scoped, no global config needed */}
      <style>{`@keyframes sk-shimmer{to{transform:translateX(200%)}}`}</style>

      {/* header */}
      <div className="flex items-center justify-between">
        <Block className="h-3.5 w-24" />
        <Block className="h-3.5 w-12" />
      </div>

      {/* matchup */}
      <div className="flex items-center gap-3 min-h-[44px]">
        <div className="flex -space-x-2">
          <Block className="h-9 w-9 rounded-full ring-2 ring-ink-800" />
          <Block className="h-9 w-9 rounded-full ring-2 ring-ink-800" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <Block className="h-4 w-4/5" />
          <Block className="h-3 w-2/5" />
        </div>
      </div>

      {/* probability + sparkline */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <Block className="h-7 w-16" />
          <Block className="h-2.5 w-20" />
        </div>
        <Block className="h-8 w-20 rounded" />
      </div>

      {/* buy buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Block className="h-9 w-full rounded-lg" />
        <Block className="h-9 w-full rounded-lg" />
      </div>

      {/* footer */}
      <div className="flex items-center justify-between pt-0.5">
        <Block className="h-2.5 w-14" />
        <Block className="h-2.5 w-16" />
      </div>
    </div>
  )
}

/**
 * Responsive grid of SkeletonCards, matching the markets grid layout.
 */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
