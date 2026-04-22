import { NextRequest, NextResponse } from 'next/server'
import { listarCasos, crearCaso } from '@/lib/sst/ccl'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const comiteId = request.nextUrl.searchParams.get('comiteId') ?? undefined
  return NextResponse.json({ records: await listarCasos(comiteId) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  return NextResponse.json({
    record: await crearCaso({
      ...body,
      Estado: 'abierto',
      Confidencial: true,
      'Fecha Apertura': new Date().toISOString().split('T')[0],
      'Registrado Por': usuario.name,
    }),
  }, { status: 201 })
}
