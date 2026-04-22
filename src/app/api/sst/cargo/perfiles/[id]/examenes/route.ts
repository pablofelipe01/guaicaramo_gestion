import { NextRequest, NextResponse } from 'next/server'
import { listarExamenesDeCargo, crearExamen, obtenerPerfil } from '@/lib/sst/cargo'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/examenes'>
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const { id } = await ctx.params
    const examenes = await listarExamenesDeCargo(id)
    return NextResponse.json({ records: examenes })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener exámenes' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/sst/cargo/perfiles/[id]/examenes'>
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const { id } = await ctx.params
    const body = await request.json()
    const perfil = await obtenerPerfil(id)
    const examen = await crearExamen({ ...body, 'Cargo ID': id, 'Cargo Nombre': perfil.fields['Nombre Cargo'] })
    return NextResponse.json({ record: examen }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear examen' }, { status: 500 })
  }
}
