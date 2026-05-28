import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const typeConfig: Record<ToastType, { icon: ReactNode; style: string }> = {
  success: {
    icon: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
    style: 'border-[var(--win)] text-[var(--win)]',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
    style: 'border-[var(--loss)] text-[var(--loss)]',
  },
  info: {
    icon: <Info className="w-4 h-4 flex-shrink-0" />,
    style: 'border-[var(--accent)] text-[var(--accent)]',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      const timer = setTimeout(() => dismiss(id), 4000)
      timersRef.current.set(id, timer)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const config = typeConfig[t.type]
        return (
          <div
            key={t.id}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border',
              'bg-[var(--surface)] shadow-[var(--shadow-lg)] pointer-events-auto',
              'min-w-[280px] max-w-[400px]',
              config.style
            )}
            style={{
              animation: 'toastIn 250ms cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            <style>{`
              @keyframes toastIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            {config.icon}
            <span
              className="flex-1 text-[var(--text)]"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {t.message}
            </span>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
