import { NextRequest, NextResponse } from 'next/server'
import { obtenerActividad, actualizarActividad } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await ctx.params
    // Soft delete: actualizar estado a Cancelado
    await actualizarActividad(id, { estado_general: 'Cancelado' })
    return NextResponse.json({ message: 'Actividad cancelada' })
  } catch (error) {
    console.error('Error cancelando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
