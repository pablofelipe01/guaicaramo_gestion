import { NextRequest, NextResponse } from 'next/server'
import { listarActividades, crearActividad } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const filtros = {
    categoria:   searchParams.get('categoria')   ?? undefined,
    estado:      searchParams.get('estado')      ?? undefined,
    responsable: searchParams.get('responsable') ?? undefined,
  }
  const records = await listarActividades(filtros)
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.tema || !body.categoria)
      return NextResponse.json({ message: 'tema y categoria son requeridos' }, { status: 400 })

    const record = await crearActividad(body)
    return NextResponse.json({ record }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/sst/capacitaciones]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error interno del servidor' }, { status: 500 })
  }
}
