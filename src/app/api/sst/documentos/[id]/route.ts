import { NextRequest, NextResponse } from 'next/server'
import { obtenerDocumento, actualizarDocumento } from '@/lib/sst/doc'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  ctx: Ctx
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const { id } = await ctx.params
    const doc = await obtenerDocumento(id)
    return NextResponse.json({ record: doc })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener documento' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  ctx: Ctx
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const { id } = await ctx.params
    const body = await request.json()
    const doc = await actualizarDocumento(id, body)
    return NextResponse.json({ record: doc })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al actualizar documento' }, { status: 500 })
  }
}
