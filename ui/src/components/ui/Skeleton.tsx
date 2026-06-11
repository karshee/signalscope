import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function SkeletonLine({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={{ height: '14px' }}
    />
  )
}

interface SkeletonBlockProps {
  height?: string | number
  width?: string | number
  className?: string
}

export function SkeletonBlock({ height = 48, width = '100%', className }: SkeletonBlockProps) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
    />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-lg)] border border-[var(--border)] p-4 flex flex-col gap-3',
        'bg-[var(--glass)] backdrop-blur-[14px]',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock height={40} width={40} className="rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-1/2" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine className="w-4/5" />
      <div className="flex gap-2 pt-1">
        <SkeletonBlock height={24} className="flex-1" />
        <SkeletonBlock height={24} className="flex-1" />
        <SkeletonBlock height={24} className="flex-1" />
      </div>
    </div>
  )
}
