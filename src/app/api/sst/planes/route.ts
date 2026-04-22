import { NextRequest, NextResponse } from 'next/server'
import { listarPlanes, crearPlan } from '@/lib/sst/plan'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ records: await listarPlanes() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  
  const body = await request.json()
  
  // Validar campos requeridos
  if (!body.Titulo?.trim()) {
    return NextResponse.json({ message: 'Título es requerido' }, { status: 400 })
  }
  if (!body['Año'] || body['Año'] < 2000 || body['Año'] > 2100) {
    return NextResponse.json({ message: 'Año inválido' }, { status: 400 })
  }
  
  // Usar usuario logueado como responsable si no se proporciona
  const fields = {
    ...body,
    Responsable: body.Responsable || usuario.name
  }
  
  try {
    const record = await crearPlan(fields, usuario.name as string)
    return NextResponse.json({ record }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear plan'
    return NextResponse.json({ message }, { status: 400 })
  }
}
