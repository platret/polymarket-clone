import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PricePoint } from '../types'

interface Props {
  data: PricePoint[]
  height?: number
}

export function PriceChart({ data, height = 280 }: Props) {
  const { rows, domain, up } = useMemo(() => {
    const pts = data.length ? data : [{ t: Date.now(), p: 0.5 }]
    const rows = pts.map((d) => ({ t: d.t, pct: d.p * 100 }))
    const ys = rows.map((r) => r.pct)
    const lo = Math.max(0, Math.min(...ys) - 8)
    const hi = Math.min(100, Math.max(...ys) + 8)
    return { rows, domain: [lo, hi] as [number, number], up: ys[ys.length - 1] >= ys[0] }
  }, [data])

  const color = up ? '#23c08b' : '#e5484d'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickFormatter={(t) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          tick={{ fill: '#5c6678', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          domain={domain}
          width={42}
          tickFormatter={(v) => `${Math.round(v)}¢`}
          tick={{ fill: '#5c6678', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#131722', border: '1px solid #222a3a', borderRadius: 10 }}
          labelStyle={{ color: '#8b95a7', fontSize: 12 }}
          itemStyle={{ color: '#e8edf6', fontSize: 13, fontWeight: 600 }}
          labelFormatter={(t) => new Date(Number(t)).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          formatter={(v: number) => [`${v.toFixed(1)}¢`, 'YES']}
        />
        <Area type="monotone" dataKey="pct" stroke={color} strokeWidth={2} fill="url(#priceFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
