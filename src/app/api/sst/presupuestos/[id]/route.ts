import { NextRequest, NextResponse } from 'next/server'
import { obtenerPresupuesto, actualizarPresupuesto } from '@/lib/sst/ppto'
import { verifyToken } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const record = await obtenerPresupuesto(id)
    if (!record) return NextResponse.json({ message: 'Presupuesto no encontrado' }, { status: 404 })
    return NextResponse.json({ record })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al obtener presupuesto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const body = await request.json()
  
  // Validaciones
  if (body.Titulo && !body.Titulo.toString().trim()) return NextResponse.json({ message: 'Título no puede estar vacío' }, { status: 400 })
  if (body['Total Presupuestado'] !== undefined && (typeof body['Total Presupuestado'] !== 'number' || body['Total Presupuestado'] < 0))
    return NextResponse.json({ message: 'Total debe ser un número positivo' }, { status: 400 })
  
  try {
    const updated = await actualizarPresupuesto(id, body)
    return NextResponse.json({ record: updated })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error al actualizar presupuesto' }, { status: 500 })
  }
}
