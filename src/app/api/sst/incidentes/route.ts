import { NextRequest, NextResponse } from 'next/server'
import { listarIncidentes, crearIncidente, estadisticasIncidentes } from '@/lib/sst/inc'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

const TIPOS_INCIDENTE = ['incidente', 'accidente_trabajo', 'enfermedad_laboral'] as const
type TipoIncidente = typeof TIPOS_INCIDENTE[number]

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { searchParams } = new URL(request.url)
    const tipoRaw = searchParams.get('tipo')
    const tipo: TipoIncidente | undefined = TIPOS_INCIDENTE.includes(tipoRaw as TipoIncidente)
      ? (tipoRaw as TipoIncidente)
      : undefined
    const anio = searchParams.get('anio')
    if (anio) return NextResponse.json(await estadisticasIncidentes(parseInt(anio)))
    return NextResponse.json(await listarIncidentes(tipo))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('[GET /api/sst/incidentes]', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const body = await request.json()
    if (!body['Trabajador ID'] || !body.Tipo || !body['Fecha Ocurrencia'] || !body.Descripcion)
      return NextResponse.json({ message: 'Trabajador ID, Tipo, Fecha Ocurrencia y Descripcion son requeridos' }, { status: 400 })
    if (!TIPOS_INCIDENTE.includes(body.Tipo))
      return NextResponse.json({ message: `Tipo inválido. Valores aceptados: ${TIPOS_INCIDENTE.join(', ')}` }, { status: 400 })
    return NextResponse.json({ record: await crearIncidente(body) }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('[POST /api/sst/incidentes]', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
