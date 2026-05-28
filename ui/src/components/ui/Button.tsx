import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition)] cursor-pointer select-none border',
        {
          // Variants
          'bg-[var(--accent)] text-[var(--text-inverse)] border-transparent hover:bg-[var(--accent-hover)] shadow-[var(--shadow-accent)]':
            variant === 'primary',
          'bg-transparent text-[var(--text)] border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]':
            variant === 'ghost',
          'bg-[var(--loss-dim)] text-[var(--loss)] border-[var(--loss)] hover:bg-[var(--loss)] hover:text-white':
            variant === 'danger',
          // Sizes
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
          // Disabled
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
