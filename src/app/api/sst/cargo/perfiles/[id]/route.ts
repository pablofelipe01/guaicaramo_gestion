import { NextRequest, NextResponse } from 'next/server'
import { obtenerPerfil, actualizarPerfil } from '@/lib/sst/cargo'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]'>
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { id } = await ctx.params
    const perfil = await obtenerPerfil(id)
    return NextResponse.json({ record: perfil })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener perfil' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]'>
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { id } = await ctx.params
    const body = await request.json()
    const perfil = await actualizarPerfil(id, body)
    return NextResponse.json({ record: perfil })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al actualizar perfil' }, { status: 500 })
  }
}
