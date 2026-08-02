import { useState, createContext, useContext, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextType {
  addToast: (message: string, variant: ToastVariant, duration?: number) => void
}

const DEFAULT_DURATION = 4000

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'border-l-4 border-success bg-green-50 text-green-800',
  error: 'border-l-4 border-danger bg-red-50 text-red-800',
  warning: 'border-l-4 border-warning bg-amber-50 text-amber-800',
  info: 'border-l-4 border-blue-500 bg-blue-50 text-blue-800',
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = iconMap[toast.variant]

  useEffect(() => {
    const timer = setTimeout(() => onClose(), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-4 shadow-lg animate-slide-in-right',
        colorMap[toast.variant],
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={onClose} className="flex-shrink-0 rounded p-0.5 hover:bg-black/5">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant, duration: number = DEFAULT_DURATION) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant, duration }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
