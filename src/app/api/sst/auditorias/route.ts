import { NextRequest, NextResponse } from 'next/server'
import { listarAuditorias, crearAuditoria, estadisticasAuditorias } from '@/lib/sst/aud'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const vista = request.nextUrl.searchParams.get('vista')
  if (vista === 'estadisticas') return NextResponse.json(await estadisticasAuditorias())
  const tipo = request.nextUrl.searchParams.get('tipo') ?? undefined
  return NextResponse.json(await listarAuditorias(tipo))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const fields = await request.json()
  if (!fields.Titulo || !fields['Auditor Nombre'] || !fields['Fecha Inicio'] || !fields.Alcance)
    return NextResponse.json({ message: 'Titulo, Auditor Nombre, Fecha Inicio y Alcance son requeridos' }, { status: 400 })
  return NextResponse.json({ record: await crearAuditoria(fields) }, { status: 201 })
}
