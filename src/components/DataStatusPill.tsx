import { useState } from 'react'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

export function DataStatusPill() {
  const status = useStore((s) => s.dataStatus)
  const refresh = useStore((s) => s.refresh)
  const [spinning, setSpinning] = useState(false)

  const onRefresh = async () => {
    setSpinning(true)
    await refresh()
    setTimeout(() => setSpinning(false), 400)
  }

  const map = {
    live: { dot: 'bg-yes', label: 'Live data · ESPN' },
    sample: { dot: 'bg-amber-400', label: 'Sample data (offline)' },
    loading: { dot: 'bg-brand animate-pulse', label: 'Loading…' },
    error: { dot: 'bg-no', label: 'Connection error' },
    idle: { dot: 'bg-text-faint', label: 'Idle' },
  }[status]

  return (
    <div className="flex items-center gap-2">
      <span className="pill bg-ink-800 border border-ink-600 px-3 py-1.5 text-xs text-text-muted">
        <span className={clsx('w-1.5 h-1.5 rounded-full', map.dot)} />
        {map.label}
      </span>
      <button
        onClick={onRefresh}
        className="btn-ghost w-9 h-9 p-0"
        title="Refresh from ESPN"
      >
        <svg className={clsx('w-4 h-4', spinning && 'animate-spin')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
        </svg>
      </button>
    </div>
  )
}
