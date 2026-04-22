'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertCircle, CheckCircle2, Clock, Loader } from 'lucide-react'
import type { AirtableRecord } from '@/lib/airtable-client'
import type { EvalEvaluacionFields } from '@/types/sst/eval'

export function EvaluacionesList() {
  const [evaluaciones, setEvaluaciones] = useState<AirtableRecord<EvalEvaluacionFields>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvaluaciones()
  }, [])

  async function fetchEvaluaciones() {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/sst/evaluaciones', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setEvaluaciones(data)
      }
    } catch (error) {
      console.error('Error fetching evaluaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { header: 'Título', key: 'Titulo' },
    {
      header: 'Estado',
      key: 'Estado',
      render: (row: AirtableRecord<EvalEvaluacionFields>) => {
        const value = row.fields.Estado
        const icons = {
          en_progreso: <Clock className="w-4 h-4 text-yellow-500" />,
          cerrada: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        }
        return (
          <div className="flex items-center gap-2">
            {icons[value as keyof typeof icons]}
            <span className="capitalize">{value.replace('_', ' ')}</span>
          </div>
        )
      },
    },
    { header: 'Responsable', key: 'Responsable' },
    {
      header: 'Nivel',
      key: 'Nivel',
      render: (row: AirtableRecord<EvalEvaluacionFields>) => {
        const value = row.fields.Nivel
        if (!value) return <span className="text-gray-400">—</span>
        const colors = {
          critico: 'bg-red-100 text-red-700',
          moderado: 'bg-yellow-100 text-yellow-700',
          aceptable: 'bg-green-100 text-green-700',
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors[value as keyof typeof colors]}`}>
            {value}
          </span>
        )
      },
    },
    { header: 'Puntaje', key: 'Puntaje Total', render: (row: AirtableRecord<EvalEvaluacionFields>) => row.fields['Puntaje Total'] ? `${row.fields['Puntaje Total']}%` : '—' },
    { header: 'Inicio', key: 'Fecha Inicio' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!evaluaciones.length) {
    return <EmptyState title="Sin evaluaciones" description="No hay evaluaciones registradas. Crea una nueva." />
  }

  return (
    <Card>
      <DataTable columns={columns} data={evaluaciones} />
    </Card>
  )
}
