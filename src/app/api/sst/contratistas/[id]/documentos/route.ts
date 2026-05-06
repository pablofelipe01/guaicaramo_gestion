import { NextRequest, NextResponse } from 'next/server'
import { listarDocumentos, crearDocumento } from '@/lib/sst/cont'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarDocumentos(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  if (!body.Tipo || !body['Fecha Vencimiento'])
    return NextResponse.json({ message: 'Tipo y Fecha Vencimiento son requeridos' }, { status: 400 })
  return NextResponse.json({
    record: await crearDocumento({ ...body, 'Contratista ID': id, 'Fecha Carga': new Date().toISOString().split('T')[0] }),
  }, { status: 201 })
}
