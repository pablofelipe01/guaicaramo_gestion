import { NextRequest, NextResponse } from 'next/server'
import { listarRegistros, crearRegistro, registrosNivelI, crearAccionSiNivelI } from '@/lib/sst/ipvr'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const area = searchParams.get('area') ?? undefined
  const nivelI = searchParams.get('nivelI')
  if (nivelI) return NextResponse.json({ records: await registrosNivelI() })
  return NextResponse.json(await listarRegistros(area))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body.Area || !body['Proceso Actividad'] || !body['Descripcion Peligro'] || body.ND == null || body.NE == null || body.NC == null)
    return NextResponse.json({ message: 'Faltan campos requeridos: Area, Proceso Actividad, Descripcion Peligro, ND, NE, NC' }, { status: 400 })
  const record = await crearRegistro(body)
  // Trigger: si es Nivel I, crear acción correctiva automáticamente
  crearAccionSiNivelI(record.id, record.fields).catch(err =>
    console.error('Error creando acción correctiva automática IPVR:', err)
  )
  return NextResponse.json({ record }, { status: 201 })
}
