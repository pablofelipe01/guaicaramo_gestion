import { NextRequest, NextResponse } from 'next/server'
import { actualizarProgramacion, eliminarProgramacion } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    const body = await request.json()
    const record = await actualizarProgramacion(id, body)
    return NextResponse.json({ record })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error actualizando programación:', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    await eliminarProgramacion(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando programación:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
