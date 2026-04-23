import { NextRequest, NextResponse } from 'next/server'
import { calcularKPIs, listarIndicadores, listarSnapshots } from '@/lib/sst/ind'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const vista = searchParams.get('vista')
  const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()))
  if (vista === 'kpis') return NextResponse.json({ kpis: await calcularKPIs(anio) })
  if (vista === 'snapshots') return NextResponse.json({ records: await listarSnapshots() })
  return NextResponse.json({ records: await listarIndicadores() })
}
