import { NextRequest, NextResponse } from 'next/server'
import { actualizarRegistro, eliminarRegistro } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    const body = await request.json()
    const record = await actualizarRegistro(id, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error actualizando registro:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    await eliminarRegistro(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error eliminando registro:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
