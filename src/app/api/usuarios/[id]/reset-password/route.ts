import { NextRequest, NextResponse } from 'next/server'
import { resetearPassword } from '@/lib/usuarios'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const { nuevaPassword } = await request.json()
  if (!nuevaPassword || nuevaPassword.length < 8)
    return NextResponse.json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  await resetearPassword(id, nuevaPassword)
  return NextResponse.json({ message: 'Contraseña restablecida. El usuario deberá cambiarla en el próximo ingreso.' })
}
