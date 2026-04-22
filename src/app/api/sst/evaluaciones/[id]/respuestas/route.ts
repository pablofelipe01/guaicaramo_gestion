import { NextRequest, NextResponse } from 'next/server'
import { listarRespuestas, guardarRespuesta } from '@/lib/sst/eval'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const records = await listarRespuestas(id)
  return NextResponse.json({ records })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const record = await guardarRespuesta({
    ...body,
    'Evaluacion ID': id,
    'Respondido Por': usuario.name as string,
    'Fecha Respuesta': new Date().toISOString().split('T')[0],
  })
  return NextResponse.json({ record }, { status: 201 })
}
