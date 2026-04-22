'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Plus, Loader } from 'lucide-react'

interface CreateEvaluacionProps {
  onSuccess?: () => void
}

export function CreateEvaluacionModal({ onSuccess }: CreateEvaluacionProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    Titulo: '',
    Descripcion: '',
    Responsable: '',
  })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/sst/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al crear evaluación')
      }

      setFormData({ Titulo: '', Descripcion: '', Responsable: '' })
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Nueva Evaluación
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Crear evaluación inicial">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.Titulo}
              onChange={(e) => setFormData({ ...formData, Titulo: e.target.value })}
              className="input-field"
              placeholder="Ej: Evaluación inicial 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.Descripcion}
              onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
              className="input-field"
              placeholder="Descripción de la evaluación"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable *
            </label>
            <input
              type="text"
              required
              value={formData.Responsable}
              onChange={(e) => setFormData({ ...formData, Responsable: e.target.value })}
              className="input-field"
              placeholder="Nombre del responsable"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Crear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
