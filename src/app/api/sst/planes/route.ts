import { NextRequest, NextResponse } from 'next/server'
import { listarPlanes, crearPlan } from '@/lib/sst/plan'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ records: await listarPlanes() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Titulo || !body['Año']) return NextResponse.json({ message: 'Titulo y Año son requeridos' }, { status: 400 })
  const record = await crearPlan(body, usuario.name as string)
  return NextResponse.json({ record }, { status: 201 })
}
