import { NextRequest, NextResponse } from 'next/server'
import { listarDocumentos, subirDocumento } from '@/lib/sst/doc'
import { requireRole } from '@/lib/auth/middleware'
import type { ModuloOrigen } from '@/types/sst/doc'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const { searchParams } = request.nextUrl
    const documentos = await listarDocumentos({
      modulo: (searchParams.get('modulo') as ModuloOrigen) ?? undefined,
      estado: (searchParams.get('estado') as 'vigente' | 'borrador' | 'obsoleto') ?? undefined,
      busqueda: searchParams.get('busqueda') ?? undefined,
    })
    return NextResponse.json({ records: documentos })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener documentos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  try {
    const body = await request.json()

    if (!body.Nombre || !body['Modulo Origen']) {
      return NextResponse.json(
        { message: 'Campos requeridos: Nombre, Modulo Origen' },
        { status: 400 }
      )
    }

    const doc = await subirDocumento(body, usuario.name as string)
    return NextResponse.json({ record: doc }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al subir documento' }, { status: 500 })
  }
}
