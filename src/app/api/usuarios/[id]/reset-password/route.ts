import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { updateRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'
    const hash = await bcrypt.hash(String(password), 10)
    await updateRecord<{ 'Password Hash': string }>(table, id, { 'Password Hash': hash })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error al resetear contraseña:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar contraseña' }, { status: 500 })
  }
}
