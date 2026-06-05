import { useStore } from '../store/useStore'
import { useNow } from '../hooks/useNow'
import { ActivityFeed } from '../components/ActivityFeed'

export function ActivityPage() {
  const trades = useStore((s) => s.trades)
  const now = useNow(1000)
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2.5 h-2.5 rounded-full bg-yes animate-pulse" />
        <h1 className="text-2xl font-extrabold tracking-tight">Live activity</h1>
      </div>
      <div className="card p-4">
        <ActivityFeed trades={trades} now={now} limit={120} />
      </div>
    </div>
  )
}
