import { useState } from 'react'
import type { Team } from '../types'
import clsx from 'clsx'

const SIZES = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-9 h-9 text-[11px]',
  lg: 'w-12 h-12 text-sm',
}

/** Pick black or white text for legibility against a team's brand color. */
function readableText(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length < 6) return '#fff'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0b0e13' : '#ffffff'
}

export function TeamBadge({ team, size = 'md' }: { team: Team; size?: keyof typeof SIZES }) {
  const [broken, setBroken] = useState(false)
  const showImg = team.logo && !broken
  return (
    <span
      className={clsx(
        'inline-grid place-items-center rounded-full shrink-0 overflow-hidden font-bold',
        SIZES[size],
      )}
      style={showImg ? undefined : { background: `#${team.color}`, color: readableText(team.color) }}
      title={team.name}
    >
      {showImg ? (
        <img
          src={team.logo}
          alt={team.abbr}
          className="w-full h-full object-contain"
          onError={() => setBroken(true)}
          loading="lazy"
        />
      ) : (
        team.abbr.slice(0, 3)
      )}
    </span>
  )
}
