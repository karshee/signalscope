import { Zap } from 'lucide-react'
import type { Signal } from '../../lib/api'
import { SignalCard } from './SignalCard'
import { SkeletonCard } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'

interface SignalFeedProps {
  signals: Signal[]
  onSignalClick: (s: Signal) => void
  loading?: boolean
  newIds?: Set<string>
}

export function SignalFeed({ signals, onSignalClick, loading = false, newIds }: SignalFeedProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (signals.length === 0) {
    return (
      <EmptyState
        icon={<Zap className="w-7 h-7" />}
        title="No signals yet"
        description="Signals from your tracked channels will appear here as they come in."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {signals.map((signal) => (
        <SignalCard
          key={signal.id}
          signal={signal}
          onClick={() => onSignalClick(signal)}
          isNew={newIds?.has(signal.id)}
        />
      ))}
    </div>
  )
}
