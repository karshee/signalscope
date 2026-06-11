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
        'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] transition-all duration-200 ease-out cursor-pointer select-none border',
        {
          // Variants
          '[background:var(--accent-gradient)] text-[var(--text-inverse)] border-transparent shadow-[var(--shadow-accent)] hover:brightness-110 hover:-translate-y-[1px] active:translate-y-0 active:brightness-100':
            variant === 'primary',
          'bg-[var(--glass)] backdrop-blur-[14px] text-[var(--text)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:-translate-y-[1px] active:translate-y-0':
            variant === 'ghost',
          'bg-[var(--loss-dim)] text-[var(--loss)] border-[var(--loss)] hover:bg-[var(--loss)] hover:text-white hover:-translate-y-[1px] hover:shadow-[0_4px_24px_rgba(255,93,108,0.25)] active:translate-y-0':
            variant === 'danger',
          // Sizes
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
          // Disabled
          'opacity-50 cursor-not-allowed hover:translate-y-0 hover:brightness-100': disabled || loading,
        },
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
