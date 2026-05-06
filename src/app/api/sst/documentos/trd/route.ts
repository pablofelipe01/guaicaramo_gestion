import { NextRequest, NextResponse } from 'next/server'
import { listarTrd, crearEntradaTrd } from '@/lib/sst/doc'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const trd = await listarTrd()
    return NextResponse.json({ records: trd })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener TRD' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const body = await request.json()
    const entrada = await crearEntradaTrd(body)
    return NextResponse.json({ record: entrada }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear entrada TRD' }, { status: 500 })
  }
}
