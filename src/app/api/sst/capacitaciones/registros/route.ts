import { NextRequest, NextResponse } from 'next/server'
import { listarRegistros, crearRegistro, obtenerActividad } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const filtros = {
    actividadId:    searchParams.get('actividad_id')    ?? undefined,
    programacionId: searchParams.get('programacion_id') ?? undefined,
  }
  const records = await listarRegistros(filtros)
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const usuario = token ? await verifyToken(token) : null
  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.actividad_id || !body.fecha_ejecucion)
    return NextResponse.json({ message: 'actividad_id y fecha_ejecucion son requeridos' }, { status: 400 })

  // Validaciones de negocio
  if (body.asistentes_presentes != null && body.asistentes_convocados != null
      && body.asistentes_presentes > body.asistentes_convocados)
    return NextResponse.json({ message: 'asistentes_presentes no puede superar asistentes_convocados' }, { status: 400 })

  if (body.evaluaciones_aprobadas != null && body.evaluaciones_realizadas != null
      && body.evaluaciones_aprobadas > body.evaluaciones_realizadas)
    return NextResponse.json({ message: 'evaluaciones_aprobadas no puede superar evaluaciones_realizadas' }, { status: 400 })

  if (body.fecha_ejecucion > new Date().toISOString().split('T')[0])
    return NextResponse.json({ message: 'fecha_ejecucion no puede ser en el futuro' }, { status: 400 })

  let actividad_tema: string | undefined
  try {
    const act = await obtenerActividad(body.actividad_id)
    actividad_tema = act.fields.tema
  } catch { /* continuar sin tema */ }

  const record = await crearRegistro({
    ...body,
    actividad_tema,
    registrado_por: usuario.name,
  })
  return NextResponse.json({ record }, { status: 201 })
}
