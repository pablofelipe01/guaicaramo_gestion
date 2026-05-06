import { NextRequest, NextResponse } from 'next/server'
import { obtenerActividad, actualizarActividad, eliminarActividad } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  try {
    const record = await obtenerActividad(id)
    return NextResponse.json({ record })
  } catch {
    return NextResponse.json({ message: 'No encontrado' }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    const body = await request.json()
    return NextResponse.json({ record: await actualizarActividad(id, body) })
  } catch (error) {
    console.error('Error actualizando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    await eliminarActividad(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error eliminando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
