import { NextRequest, NextResponse } from 'next/server'
import { listarEstandares, crearEstandar } from '@/lib/sst/eval'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const records = await listarEstandares()
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  const record = await crearEstandar({ ...body, Activo: true })
  return NextResponse.json({ record }, { status: 201 })
}
