/**
 * Convert market probabilities (0..1) to real sportsbook odds formats.
 * Lets the UI show "actual odds" (American / Decimal) instead of only cents.
 */
import type { OddsFormat } from '../types'
import { clamp01 } from './format'

function clampP(p: number): number {
  return Math.min(0.99, Math.max(0.01, clamp01(p)))
}

/** 0.62 -> -163 ; 0.38 -> +163 */
export function probToAmerican(p: number): number {
  const pp = clampP(p)
  if (pp >= 0.5) return -Math.round((pp / (1 - pp)) * 100)
  return Math.round(((1 - pp) / pp) * 100)
}

/** 0.62 -> 1.61 */
export function probToDecimal(p: number): number {
  return 1 / clampP(p)
}

export function formatAmerican(p: number): string {
  const a = probToAmerican(p)
  return a > 0 ? `+${a}` : `${a}`
}

export function formatDecimal(p: number): string {
  return probToDecimal(p).toFixed(2)
}

/** The one entry point the UI uses — respects the user's chosen odds format. */
export function formatOdds(p: number, fmt: OddsFormat): string {
  switch (fmt) {
    case 'american':
      return formatAmerican(p)
    case 'decimal':
      return formatDecimal(p)
    case 'percent':
    default:
      return `${Math.round(clamp01(p) * 100)}%`
  }
}

/** Short label for the active format, e.g. shown next to a value. */
export function oddsFormatLabel(fmt: OddsFormat): string {
  return fmt === 'american' ? 'US odds' : fmt === 'decimal' ? 'Decimal' : 'Percent'
}

export const ODDS_FORMATS: { key: OddsFormat; label: string; sample: string }[] = [
  { key: 'american', label: 'American', sample: '-160 / +140' },
  { key: 'decimal', label: 'Decimal', sample: '1.63 / 2.40' },
  { key: 'percent', label: 'Percent', sample: '62% / 38%' },
]
