import { NextRequest, NextResponse } from 'next/server'
import { listarDocumentos, subirDocumento } from '@/lib/sst/doc'
import { verifyToken } from '@/lib/auth'
import type { ModuloOrigen } from '@/types/sst/doc'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

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
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const usuario = token ? await verifyToken(token) : null
    if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

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
