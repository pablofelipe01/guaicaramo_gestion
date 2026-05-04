'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { CronogramaSemanal } from '@/components/sst/capacitaciones/CronogramaSemanal'
import { CATEGORIAS_CAP } from '@/lib/sst/cap-client'
import { ArrowLeft, Calendar, Filter } from 'lucide-react'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export default function CronogramaPage() {
  const router = useRouter()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [programaciones, setProgramaciones] = useState<Prog[]>([])
  const [loading, setLoading] = useState(true)
  const [catFiltro, setCatFiltro] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const [actRes, progRes] = await Promise.all([
      fetch('/api/sst/capacitaciones', { headers: authHeaders() }),
      fetch('/api/sst/capacitaciones/programacion', { headers: authHeaders() }),
    ])
    if (actRes.ok)  setActividades((await actRes.json()).records ?? [])
    if (progRes.ok) setProgramaciones((await progRes.json()).records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const totalProgramadas = programaciones.length
  const totalEjecutadas  = programaciones.filter(p => p.fields.estado === 'Ejecutado').length
  const pct = totalProgramadas > 0 ? Math.round((totalEjecutadas / totalProgramadas) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">Cronograma Semanal 2026</h1>
          </div>
          <p className="text-sm text-gray-500">Programación P/E por semana y mes</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full">
            {totalProgramadas} programadas
          </span>
          <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full">
            {totalEjecutadas} ejecutadas ({pct}%)
          </span>
        </div>
      </div>

      {/* Filtro categoría */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">Filtrar por categoría:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCatFiltro('')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              catFiltro === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {CATEGORIAS_CAP.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFiltro(cat === catFiltro ? '' : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                catFiltro === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <CronogramaSemanal
            actividades={actividades}
            programaciones={programaciones}
            categoriaFiltro={catFiltro || undefined}
          />
        )}
      </Card>
    </div>
  )
}
