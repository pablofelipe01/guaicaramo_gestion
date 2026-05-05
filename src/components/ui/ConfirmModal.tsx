'use client'

import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from './Modal'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  loading = false,
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const isDanger = variant === 'danger'
  const confirmBg = isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
  const iconBg   = isDanger ? 'bg-red-100'   : 'bg-amber-100'
  const iconCls  = isDanger ? 'text-red-600'  : 'text-amber-600'

  return (
    <Modal open={open} onClose={onCancel} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 pb-2">
        <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center`}>
          {isDanger
            ? <Trash2 className={`w-7 h-7 ${iconCls}`} />
            : <AlertTriangle className={`w-7 h-7 ${iconCls}`} />
          }
        </div>

        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 w-full pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmBg}`}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
