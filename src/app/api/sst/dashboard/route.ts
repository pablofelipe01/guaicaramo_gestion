import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { calcularKPIs } from '@/lib/sst/ind'
import { obtenerAlertasDashboard } from '@/lib/sst/alertas'
import { obtenerTareasDashboard } from '@/lib/sst/tareas'
import { listRecords } from '@/lib/airtable-client'
import type { IncIncidenteFields } from '@/types/sst/inc'

function getUltimos6Meses(): string[] {
  const meses: string[] = []
  const hoy = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const anio = new Date().getFullYear()

  try {
    const [kpis, alertas, tareas, incidentesRes] = await Promise.all([
      calcularKPIs(anio).catch(() => []),
      obtenerAlertasDashboard().catch(() => []),
      obtenerTareasDashboard().catch(() => []),
      listRecords<IncIncidenteFields>('sst_inc_incidentes', {
        filterByFormula: `IS_AFTER({Fecha Ocurrencia},'${anio - 1}-12-31')`,
      }).catch(() => ({ records: [] })),
    ])

    const meses = getUltimos6Meses()
    const tendencias = meses.map(ym => {
      const [year, month] = ym.split('-')
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('es-CO', { month: 'short' })
      const delMes = incidentesRes.records.filter(r =>
        r.fields['Fecha Ocurrencia']?.startsWith(ym)
      )
      return {
        mes: label,
        AT: delMes.filter(r => r.fields.Tipo === 'accidente_trabajo').length,
        incidentes: delMes.filter(r => r.fields.Tipo === 'incidente').length,
        EL: delMes.filter(r => r.fields.Tipo === 'enfermedad_laboral').length,
      }
    })

    return NextResponse.json({ kpis, alertas, tareas, tendencias })
  } catch (err) {
    console.error('[dashboard] Error:', err)
    return NextResponse.json({ error: 'Error al cargar dashboard' }, { status: 500 })
  }
}
