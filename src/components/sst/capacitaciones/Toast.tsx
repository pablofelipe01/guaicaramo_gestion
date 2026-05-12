/**
 * @file Toast.tsx
 * Componente de notificaciones temporales (toast) para el módulo de capacitaciones.
 * Soporta tipos: 'success', 'error', 'warning', 'info'.
 * Los toasts desaparecen automáticamente después de 4 segundos por defecto.
 *
 * @example
 * // Disparar un toast desde otro componente usando el hook useToast
 * showToast('Registro guardado', 'success')
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

const ICONS: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
  info:    'bg-green-50 border-green-200 text-green-800',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-orange-500',
  info:    'text-green-500',
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
              max-w-sm w-full pointer-events-auto
              animate-[slideInRight_0.25s_ease-out]
              ${STYLES[t.type]}
            `}
            role="alert"
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ICON_STYLES[t.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.message && <p className="text-xs mt-0.5 opacity-80">{t.message}</p>}
            </div>
            <button
              onClick={() => onRemove(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const toast = {
    success: (title: string, message?: string) => add('success', title, message),
    error:   (title: string, message?: string) => add('error',   title, message),
    warning: (title: string, message?: string) => add('warning', title, message),
    info:    (title: string, message?: string) => add('info',    title, message),
  }

  return { toasts, toast, remove }
}
