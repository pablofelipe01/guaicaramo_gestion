import { NextRequest, NextResponse } from 'next/server'
import { listarRegistros, crearRegistro } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { searchParams } = request.nextUrl
  const filtros = {
    actividadId:    searchParams.get('actividad_id')    ?? undefined,
    programacionId: searchParams.get('programacion_id') ?? undefined,
  }
  const records = await listarRegistros(filtros)
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user

  const body = await request.json()
  if (!body.actividad_id || !body.fecha_ejecucion)
    return NextResponse.json({ message: 'actividad_id y fecha_ejecucion son requeridos' }, { status: 400 })

  // Validaciones de negocio
  if (body.presentes != null && body.convocados != null
      && body.presentes > body.convocados)
    return NextResponse.json({ message: 'Presentes no puede superar convocados' }, { status: 400 })

  if (body.evaluaciones_aprobadas != null && body.evaluaciones_realizadas != null
      && body.evaluaciones_aprobadas > body.evaluaciones_realizadas)
    return NextResponse.json({ message: 'evaluaciones_aprobadas no puede superar evaluaciones_realizadas' }, { status: 400 })

  if (body.fecha_ejecucion > new Date().toISOString().split('T')[0])
    return NextResponse.json({ message: 'fecha_ejecucion no puede ser en el futuro' }, { status: 400 })

  // Extraer campos que no existen en la tabla sst_cap_registros de Airtable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { actividad_tema: _at, registrado_por: _rp, ...camposRegistro } = body

  const record = await crearRegistro(camposRegistro)
  return NextResponse.json({ record }, { status: 201 })
}
