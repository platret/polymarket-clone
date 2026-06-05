import { useMemo } from 'react'
import type { PricePoint } from '../types'

/** Tiny inline trend line for cards. Green if up over the window, red if down. */
export function Sparkline({ data, width = 96, height = 30 }: { data: PricePoint[]; width?: number; height?: number }) {
  const { path, up, area } = useMemo(() => {
    const pts = data.length >= 2 ? data.slice(-60) : [{ t: 0, p: 0.5 }, { t: 1, p: 0.5 }]
    const ys = pts.map((d) => d.p)
    const min = Math.min(...ys)
    const max = Math.max(...ys)
    const span = max - min || 1
    const stepX = width / (pts.length - 1)
    const coords = pts.map((d, i) => {
      const x = i * stepX
      const y = height - ((d.p - min) / span) * (height - 4) - 2
      return [x, y] as const
    })
    const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    const area = `${path} L${width},${height} L0,${height} Z`
    return { path, area, up: ys[ys.length - 1] >= ys[0] }
  }, [data, width, height])

  const color = up ? '#23c08b' : '#e5484d'
  const id = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, [])
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
