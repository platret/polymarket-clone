import { useState } from 'react'
import clsx from 'clsx'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { teamKey } from '../lib/teams'

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

const HIT = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
}

const GOLD = '#f5c518'

interface FavoriteStarProps {
  league: string
  abbr: string
  /** Optional human label used in the follow toast (e.g. team name). */
  label?: string
  size?: keyof typeof SIZES
}

export function FavoriteStar({ league, abbr, label, size = 'md' }: FavoriteStarProps) {
  const key = teamKey(league, abbr)
  const isFav = useStore((s) => s.settings.favorites.includes(key))
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const pushToast = useUI((s) => s.pushToast)

  // Re-keyed on every toggle to retrigger the pop animation.
  const [pulse, setPulse] = useState(0)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const wasFav = isFav
    toggleFavorite(key)
    setPulse((n) => n + 1)
    if (wasFav) {
      pushToast({ kind: 'info', title: 'Unfollowed', detail: label ?? abbr })
    } else {
      pushToast({ kind: 'success', title: `Following ${label ?? abbr}` })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFav}
      aria-label={isFav ? `Unfollow ${label ?? abbr}` : `Follow ${label ?? abbr}`}
      title={isFav ? 'Unfollow' : 'Follow'}
      className={clsx(
        'group inline-grid place-items-center rounded-full shrink-0 transition-colors',
        'hover:bg-ink-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        HIT[size],
      )}
    >
      <svg
        key={pulse}
        viewBox="0 0 24 24"
        className={clsx(
          SIZES[size],
          'transition-[transform,color] duration-200',
          pulse > 0 && 'animate-pop-in',
          isFav
            ? 'drop-shadow-[0_0_6px_rgba(245,197,24,0.45)]'
            : 'text-text-faint group-hover:text-text-muted',
        )}
        fill={isFav ? GOLD : 'none'}
        stroke={isFav ? GOLD : 'currentColor'}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.94l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.6z" />
      </svg>
    </button>
  )
}
