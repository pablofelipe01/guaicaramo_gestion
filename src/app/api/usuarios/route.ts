import { NextRequest, NextResponse } from 'next/server'
import { listarUsuarios, crearUsuario } from '@/lib/usuarios'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ records: await listarUsuarios() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { nombre, email, password, rolId } = await request.json()
  if (!nombre || !email || !password)
    return NextResponse.json({ message: 'nombre, email y password son requeridos' }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ message: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  return NextResponse.json({ record: await crearUsuario({ nombre, email, password, rolId }) }, { status: 201 })
}
