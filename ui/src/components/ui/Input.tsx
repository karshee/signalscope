import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[var(--text-sm)] text-[var(--text-muted)] font-medium"
          style={{ fontSize: 'var(--text-sm)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={clsx(
          'w-full px-3 py-2.5 rounded-[var(--radius-md)] border text-[var(--text)] placeholder-[var(--text-faint)] outline-none transition-all duration-200',
          'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--border-strong)]',
          'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)] focus:shadow-[0_0_20px_rgba(0,229,179,0.15)]',
          error &&
            'border-[var(--loss)] hover:border-[var(--loss)] focus:border-[var(--loss)] focus:ring-[var(--loss-dim)] focus:shadow-[0_0_20px_rgba(255,93,108,0.15)]',
          className
        )}
        style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-ui)' }}
      />
      {error && (
        <span className="text-[var(--loss)]" style={{ fontSize: 'var(--text-xs)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
