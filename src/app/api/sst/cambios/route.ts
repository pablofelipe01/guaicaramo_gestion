import { NextRequest, NextResponse } from 'next/server'
import { listarCambios, crearCambio } from '@/lib/sst/cambio'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ records: await listarCambios() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Titulo || !body.Tipo)
    return NextResponse.json({ message: 'Titulo y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearCambio({ ...body, Estado: 'borrador', Solicitante: body.Solicitante ?? usuario.name }),
  }, { status: 201 })
}
