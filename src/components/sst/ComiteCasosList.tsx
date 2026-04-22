'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Modal } from '@/components/ui/Modal'
import { Plus, Lock, AlertCircle, Loader } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { CclCasoFields } from '@/types/sst/ccl'
import type { AirtableRecord } from '@/lib/airtable-client'

type Caso = AirtableRecord<CclCasoFields>

interface ComiteCasosListProps {
  comiteId?: string
  onSuccess?: () => void
}

const ESTADO_VARIANT: Record<string, 'neutral' | 'primary' | 'success' | 'error'> = {
  abierto: 'primary',
  en_seguimiento: 'primary',
  cerrado: 'success',
  derivado: 'neutral',
}

const SEVERIDAD_VARIANT: Record<string, 'primary' | 'error'> = {
  leve: 'primary',
  grave: 'error',
}

export function ComiteCasosList({ comiteId, onSuccess }: ComiteCasosListProps) {
  const { user } = useAuth()
  const [casos, setCasos] = useState<Caso[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    Descripcion: '',
    Partes: '',
    Severidad: 'leve',
    'Fecha Reporte': new Date().toISOString().split('T')[0],
    Observaciones: '',
  })
  const [error, setError] = useState('')

  function authHeaders() {
    const token = localStorage.getItem('authToken')
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const query = comiteId ? `?comiteId=${comiteId}` : ''
      const res = await fetch(`/api/sst/ccl/casos${query}`, { headers: authHeaders() })
      const data = await res.json()
      setCasos(data.records ?? [])
    } catch (err) {
      console.error('Error cargando casos:', err)
    } finally {
      setLoading(false)
    }
  }, [comiteId])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const response = await fetch('/api/sst/ccl/casos', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...formData,
          'Comite ID': comiteId,
          'Reportado Por': user?.name,
          Estado: 'abierto',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al registrar caso')
      }

      setFormData({
        Descripcion: '',
        Partes: '',
        Severidad: 'leve',
        'Fecha Reporte': new Date().toISOString().split('T')[0],
        Observaciones: '',
      })
      setOpen(false)
      await cargar()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-700">Casos confidenciales</h3>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus size={14} /> Registrar caso
        </button>
      </div>

      <div className="border rounded-lg divide-y">
        {loading ? (
          <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-2">
            <Loader className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : casos.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            <AlertCircle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
            Sin casos registrados
          </div>
        ) : (
          casos.map((caso) => (
            <div key={caso.id} className="p-4 hover:bg-red-50/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">{caso.fields.Descripcion}</div>
                    <StatusBadge
                      variant={SEVERIDAD_VARIANT[caso.fields.Severidad] || 'primary'}
                      label={caso.fields.Severidad}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>Partes: {caso.fields.Partes}</span>
                    <span>·</span>
                    <span>{caso.fields['Fecha Reporte']}</span>
                  </div>
                  {caso.fields.Observaciones && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      {caso.fields.Observaciones}
                    </div>
                  )}
                </div>
                <StatusBadge
                  variant={ESTADO_VARIANT[caso.fields.Estado] || 'neutral'}
                  label={caso.fields.Estado}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar caso confidencial" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del caso *</label>
            <textarea
              required
              value={formData.Descripcion}
              onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              placeholder="Describa brevemente el caso de convivencia laboral"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partes involucradas *</label>
              <input
                type="text"
                required
                value={formData.Partes}
                onChange={(e) => setFormData({ ...formData, Partes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ej: Juan, María"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
              <select
                value={formData.Severidad}
                onChange={(e) => setFormData({ ...formData, Severidad: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="leve">Leve</option>
                <option value="grave">Grave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={formData.Observaciones}
              onChange={(e) => setFormData({ ...formData, Observaciones: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={2}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
