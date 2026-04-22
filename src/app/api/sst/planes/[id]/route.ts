import { NextRequest, NextResponse } from 'next/server'
import { obtenerPlan, actualizarPlan, listarActividades, dashboardPlan } from '@/lib/sst/plan'
import { verifyToken } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? await verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const plan = await obtenerPlan(id)
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error obteniendo plan:', error)
    return NextResponse.json({ error: 'Error al obtener plan' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? await verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const plan = await actualizarPlan(id, body)
    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error actualizando plan:', error)
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 })
  }
}
