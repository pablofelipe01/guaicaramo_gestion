import { NextRequest, NextResponse } from 'next/server'
import { listarRequisitos, crearRequisito, alertasLegal, resumenCumplimiento } from '@/lib/sst/legal'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = request.nextUrl
  if (searchParams.get('alertas') === 'true') return NextResponse.json({ alertas: await alertasLegal() })
  if (searchParams.get('resumen') === 'true') return NextResponse.json(await resumenCumplimiento())
  const todos = searchParams.get('todos') === 'true'
  return NextResponse.json({ records: await listarRequisitos(!todos) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  if (!body.Norma || !body.Tipo || !body.Ambito) return NextResponse.json({ message: 'Norma, Tipo y Ambito son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearRequisito(body) }, { status: 201 })
}
