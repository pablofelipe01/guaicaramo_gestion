import { NextRequest, NextResponse } from 'next/server'
import { listarCapacitaciones, crearCapacitacion, coberturaCapacitaciones } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  if (request.nextUrl.searchParams.get('cobertura') === 'true')
    return NextResponse.json(await coberturaCapacitaciones())
  const programaId = request.nextUrl.searchParams.get('programaId') ?? undefined
  return NextResponse.json({ records: await listarCapacitaciones(programaId) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body['Programa ID'] || !body.Tema || !body.Tipo)
    return NextResponse.json({ message: 'Programa ID, Tema y Tipo son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearCapacitacion({ ...body, Estado: 'programada' }),
  }, { status: 201 })
}
