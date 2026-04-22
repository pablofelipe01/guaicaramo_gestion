import { NextRequest, NextResponse } from 'next/server'
import { obtenerPlan, actualizarPlan, listarActividades, dashboardPlan, cerrarPlan } from '@/lib/sst/plan'
import { deleteRecord } from '@/lib/airtable-client'
import { verifyToken } from '@/lib/auth'

const T_PLANES = 'sst_plan_planes'

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
    
    // Si se intenta cerrar el plan, usar función especial
    if (body.Estado === 'cerrado') {
      const plan = await cerrarPlan(id)
      return NextResponse.json(plan)
    }
    
    const plan = await actualizarPlan(id, body)
    return NextResponse.json(plan)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = token ? await verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    await deleteRecord(T_PLANES, id)
    return NextResponse.json({ message: 'Plan eliminado' })
  } catch (error) {
    console.error('Error eliminando plan:', error)
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 })
  }
}
