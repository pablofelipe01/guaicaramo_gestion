'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { CronogramaContainer } from '@/components/sst/capacitaciones/CronogramaContainer'
import { ArrowLeft, Calendar } from 'lucide-react'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'
import { getAuthHeaders } from '@/lib/client/authFetch'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

export default function CronogramaPage() {
  const router = useRouter()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [programaciones, setProgramaciones] = useState<Prog[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [actRes, progRes] = await Promise.all([
      fetch('/api/sst/capacitaciones', { headers: getAuthHeaders() }),
      fetch('/api/sst/capacitaciones/programacion', { headers: getAuthHeaders() }),
    ])
    if (actRes.ok)  setActividades((await actRes.json()).records ?? [])
    if (progRes.ok) setProgramaciones((await progRes.json()).records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const mesActual = MESES[new Date().getMonth()]
  const progsDelMes = programaciones.filter(p => p.fields.mes === mesActual)
  const totalProgramadas = progsDelMes.length
  const totalEjecutadas  = progsDelMes.filter(p => p.fields.estado === 'Ejecutado').length
  const pct = totalProgramadas > 0 ? Math.round((totalEjecutadas / totalProgramadas) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/capacitaciones')}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--sst-dark-500)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sst-dark-100)'; e.currentTarget.style.color = 'var(--sst-dark-900)' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--sst-dark-500)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: 'var(--sst-green-700)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--sst-dark-900)', fontFamily: 'var(--font-poppins)' }}>Cronograma de Capacitaciones 2026</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--sst-dark-500)' }}>Panel de control visual del programa anual SST</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
        </div>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--sst-green-700)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <CronogramaContainer
            actividades={actividades}
            programaciones={programaciones}
            onUpdate={cargar}
          />
        )}
      </Card>
    </div>
  )
}
