import { NextRequest, NextResponse } from 'next/server'
import { listarTrabajadores, crearTrabajador } from '@/lib/sst/cont'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  return NextResponse.json(await listarTrabajadores(id))
}

export async function POST(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  if (!body['Nombre Completo'])
    return NextResponse.json({ message: 'Nombre Completo es requerido' }, { status: 400 })
  return NextResponse.json({
    record: await crearTrabajador({ ...body, 'Contratista ID': id, Estado: 'activo', 'Induccion Realizada': false }),
  }, { status: 201 })
}
