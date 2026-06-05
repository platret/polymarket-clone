/** Formatting helpers — money, cents, percents, relative time. */

export function usd(n: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign && n > 0 ? '+' : ''
  const neg = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${neg || sign}$${s}`
}

export function usdCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

/** YES price 0..1 -> "62¢" */
export function cents(p: number): string {
  return `${Math.round(clamp01(p) * 100)}¢`
}

/** 0..1 -> "62%" */
export function pct(p: number, digits = 0): string {
  return `${(clamp01(p) * 100).toFixed(digits)}%`
}

export function clamp01(p: number): number {
  if (Number.isNaN(p)) return 0.5
  return Math.min(1, Math.max(0, p))
}

export function shares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function relTime(t: number, now: number): string {
  const d = t - now
  const past = d < 0
  const s = Math.abs(d) / 1000
  const fmt = (v: number, unit: string) => `${Math.round(v)}${unit}`
  let label: string
  if (s < 60) label = fmt(s, 's')
  else if (s < 3600) label = fmt(s / 60, 'm')
  else if (s < 86400) label = fmt(s / 3600, 'h')
  else label = fmt(s / 86400, 'd')
  return past ? `${label} ago` : `in ${label}`
}

export function startLabel(t: number, now: number): string {
  const date = new Date(t)
  const sameDay = new Date(now).toDateString() === date.toDateString()
  const tomorrow = new Date(now + 86400_000).toDateString() === date.toDateString()
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today ${time}`
  if (tomorrow) return `Tomorrow ${time}`
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` ${time}`
}
