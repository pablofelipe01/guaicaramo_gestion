'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { AlertCircle, Loader } from 'lucide-react'
import type { AirtableRecord } from '@/lib/airtable-client'
import type { EvalEvaluacionFields, EvalEstandarFields, EvalRespuestaFields } from '@/types/sst/eval'

interface EvaluacionDetailProps {
  id: string
  onBack?: () => void
}

export function EvaluacionDetail({ id, onBack }: EvaluacionDetailProps) {
  const [evaluacion, setEvaluacion] = useState<AirtableRecord<EvalEvaluacionFields> | null>(null)
  const [estandares, setEstandares] = useState<AirtableRecord<EvalEstandarFields>[]>([])
  const [respuestas, setRespuestas] = useState<AirtableRecord<EvalRespuestaFields>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localRespuestas, setLocalRespuestas] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const token = localStorage.getItem('authToken')
      const headers = { Authorization: `Bearer ${token}` }

      const [evalRes, estRes, respRes] = await Promise.all([
        fetch(`/api/sst/evaluaciones/${id}`, { headers }),
        fetch('/api/sst/estandares', { headers }),
        fetch(`/api/sst/evaluaciones/${id}/respuestas`, { headers }),
      ])

      if (evalRes.ok) setEvaluacion(await evalRes.json())
      if (estRes.ok) setEstandares(await estRes.json())
      if (respRes.ok) {
        const data = await respRes.json()
        setRespuestas(data)
        const map = Object.fromEntries(data.map((r: AirtableRecord<EvalRespuestaFields>) => [r.id, r.fields.Resultado]))
        setLocalRespuestas(map)
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGuardarRespuesta(estandarId: string, resultado: string) {
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/sst/evaluaciones/${id}/respuestas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estandarId,
          resultado,
        }),
      })

      if (response.ok) {
        setLocalRespuestas({ ...localRespuestas, [estandarId]: resultado })
      }
    } catch (error) {
      console.error('Error saving respuesta:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleCerrar() {
    if (!confirm('¿Cerrar evaluación? Se calculará el puntaje total.')) return

    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/sst/evaluaciones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cerrar' }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error cerrando:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!evaluacion) {
    return <div className="text-red-600">Evaluación no encontrada</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={evaluacion.fields.Titulo}
        description={evaluacion.fields.Descripcion || 'Evaluación inicial del SG-SST'}
        icon={AlertCircle}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Estado</div>
          <div className="text-lg font-semibold capitalize">{evaluacion.fields.Estado.replace('_', ' ')}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Puntaje</div>
          <div className="text-lg font-semibold">{evaluacion.fields['Puntaje Total'] ?? '—'}%</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Nivel</div>
          <div className={`text-lg font-semibold capitalize ${
            evaluacion.fields.Nivel === 'critico' ? 'text-red-600' :
            evaluacion.fields.Nivel === 'moderado' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {evaluacion.fields.Nivel || '—'}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Estándares (Res. 0312)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2">Código</th>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Ciclo</th>
                <th className="text-center px-4 py-2">Peso</th>
                <th className="text-center px-4 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {estandares.map((e) => (
                <tr key={e.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.fields.Codigo}</td>
                  <td className="px-4 py-3">{e.fields.Nombre}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-600">{e.fields['Ciclo PHVA']}</td>
                  <td className="px-4 py-3 text-center font-medium">{e.fields['Peso Porcentual']}%</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={localRespuestas[e.id] || ''}
                      onChange={(ev) => handleGuardarRespuesta(e.id, ev.target.value)}
                      disabled={saving || evaluacion.fields.Estado === 'cerrada'}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="cumple">Cumple</option>
                      <option value="parcial">Parcial</option>
                      <option value="no_cumple">No cumple</option>
                      <option value="no_aplica">No aplica</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {evaluacion.fields.Estado === 'en_progreso' && (
        <div className="flex gap-2">
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
              Volver
            </button>
          )}
          <button onClick={handleCerrar} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            Cerrar y calcular puntaje
          </button>
        </div>
      )}
    </div>
  )
}
