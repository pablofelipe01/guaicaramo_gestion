import { NextRequest, NextResponse } from 'next/server'
import { verificarEficacia } from '@/lib/sst/ac'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  const body = await request.json()
  if (typeof body.confirmada !== 'boolean')
    return NextResponse.json({ message: 'confirmada (boolean) es requerido' }, { status: 400 })
  return NextResponse.json({ record: await verificarEficacia(id, body.confirmada, body.verificadoPorNombre) })
}
