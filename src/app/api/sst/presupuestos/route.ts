import { NextRequest, NextResponse } from 'next/server'
import { listarPresupuestos, crearPresupuesto } from '@/lib/sst/ppto'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ records: await listarPresupuestos() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Titulo || !body['Año']) return NextResponse.json({ message: 'Titulo y Año requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearPresupuesto(body, usuario.name as string) }, { status: 201 })
}
