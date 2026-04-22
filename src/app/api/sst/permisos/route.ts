import { NextRequest, NextResponse } from 'next/server'
import { listarPermisos, crearPermiso } from '@/lib/sst/perm'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado') ?? undefined
  return NextResponse.json({ records: await listarPermisos(estado) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Tipo ID'] || !body.Area || !body['Tarea Descripcion'] || !body['Fecha Inicio'] || !body['Fecha Fin'])
    return NextResponse.json({ message: 'Tipo ID, Area, Tarea Descripcion, Fecha Inicio y Fecha Fin son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearPermiso({ ...body, 'Solicitante Nombre': usuario.name }),
  }, { status: 201 })
}
