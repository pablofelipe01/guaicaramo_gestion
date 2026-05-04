import { NextRequest, NextResponse } from 'next/server'
import { actualizarProgramacion } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    const { id } = await ctx.params
    const body = await request.json()
    const record = await actualizarProgramacion(id, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error actualizando programación:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
