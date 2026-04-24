import { NextRequest, NextResponse } from 'next/server'
import { listarAuditorias, crearAuditoria, estadisticasAuditorias } from '@/lib/sst/aud'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const vista = request.nextUrl.searchParams.get('vista')
  if (vista === 'estadisticas') return NextResponse.json(await estadisticasAuditorias())
  const tipo = request.nextUrl.searchParams.get('tipo') ?? undefined
  return NextResponse.json({ records: await listarAuditorias(tipo) })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const fields = await request.json()
  if (!fields.Titulo || !fields['Auditor Nombre'] || !fields['Fecha Inicio'] || !fields.Alcance)
    return NextResponse.json({ message: 'Titulo, Auditor Nombre, Fecha Inicio y Alcance son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearAuditoria(fields) }, { status: 201 })
}
