import { NextRequest, NextResponse } from 'next/server'
import {
  obtenerActividad,
  actualizarActividad,
  eliminarActividad,
  listarProgramacion,
  recalcularEstadoActividad,
  calcularIndicadoresTrimestre,
} from '@/lib/sst/cap'
import { obtenerTrimestreActual } from '@/lib/sst/cap-estados'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest, ctx: Ctx) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await ctx.params
  try {
    const [record, programaciones] = await Promise.all([
      obtenerActividad(id),
      listarProgramacion({ actividadId: id }),
    ])
    // Automatización 3: campo derivado que indica si hay al menos una sesión ejecutada.
    // La UI lo usa para habilitar el paso 5 (evaluación de eficacia) sin cálculo en cliente.
    const tieneRegistroEjecutado = programaciones.some(p => p.fields.estado === 'Ejecutado')
    return NextResponse.json({ record, tieneRegistroEjecutado })
  } catch {
    return NextResponse.json({ message: 'No encontrado' }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    const body = await request.json()

    // Leer estado anterior antes de actualizar para detectar transición a Completado
    const actividadAnterior = await obtenerActividad(id).catch(() => null)
    const estadoAnterior = actividadAnterior?.fields.estado_general ?? null

    const record = await actualizarActividad(id, body)

    // Automatización 4: si la actividad transiciona a Completado, calcular indicadores
    const { estado: nuevoEstado } = await recalcularEstadoActividad(id)
    if (nuevoEstado === 'Completado' && estadoAnterior !== 'Completado') {
      try {
        const trimestre = obtenerTrimestreActual()
        await calcularIndicadoresTrimestre(trimestre)
      } catch (error) {
        // No bloquear la respuesta principal si falla el cálculo de indicadores
        console.error('[Auto4 indicadores]', error)
      }
    }

    return NextResponse.json({ record, estadoActividad: nuevoEstado })
  } catch (error) {
    console.error('Error actualizando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
    const { id } = await ctx.params
    await eliminarActividad(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error eliminando actividad:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
