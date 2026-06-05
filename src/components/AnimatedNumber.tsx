import { useEffect, useRef, useState } from 'react'
import { usd } from '../lib/format'

const DEFAULT_DURATION = 550

/** Ease-out cubic — fast start, gentle settle. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function defaultFormat(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  className?: string
  duration?: number
}

/**
 * Smoothly counts from its previously displayed value to `value` over ~550ms
 * using requestAnimationFrame and an ease-out curve. Interruptions mid-flight
 * animate from wherever the number currently sits, so rapid updates stay fluid.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  className,
  duration = DEFAULT_DURATION,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const frameRef = useRef<number | null>(null)
  // The value currently shown on screen — the start point for the next animation.
  const displayRef = useRef(value)

  useEffect(() => {
    const from = displayRef.current
    const to = value

    if (from === to) return

    // No animation for the very first non-finite/instant cases.
    if (!Number.isFinite(from) || !Number.isFinite(to) || duration <= 0) {
      displayRef.current = to
      setDisplay(to)
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = easeOutCubic(t)
      const next = from + (to - from) * eased
      displayRef.current = next
      setDisplay(next)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        displayRef.current = to
        setDisplay(to)
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [value, duration])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format(display)}
    </span>
  )
}

interface AnimatedUsdProps {
  value: number
  sign?: boolean
  className?: string
}

/** AnimatedNumber preset that renders the running value as USD. */
export function AnimatedUsd({ value, sign, className }: AnimatedUsdProps) {
  return <AnimatedNumber value={value} format={(n) => usd(n, { sign })} className={className} />
}
