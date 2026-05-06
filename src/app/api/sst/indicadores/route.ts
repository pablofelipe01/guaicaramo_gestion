import { NextRequest, NextResponse } from 'next/server'
import { calcularKPIs, listarIndicadores, listarSnapshots, guardarSnapshot } from '@/lib/sst/ind'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const vista = searchParams.get('vista')
  const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()))
  try {
    if (vista === 'kpis') return NextResponse.json({ kpis: await calcularKPIs(anio) })
    if (vista === 'snapshots') return NextResponse.json(await listarSnapshots())
    return NextResponse.json(await listarIndicadores())
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/sst/indicadores GET]', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

/**
 * POST /api/sst/indicadores
 * Guarda un snapshot de un KPI calculado.
 * Body: { indicadorId, periodo, valor, meta }
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { indicadorId, periodo, valor, meta } = body

    if (!indicadorId || !periodo || valor === undefined || meta === undefined) {
      return NextResponse.json(
        { success: false, message: 'indicadorId, periodo, valor y meta son requeridos' },
        { status: 400 }
      )
    }

    const snapshot = await guardarSnapshot(
      String(indicadorId),
      String(periodo),
      Number(valor),
      Number(meta)
    )
    return NextResponse.json({ success: true, snapshot }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/sst/indicadores POST]', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
