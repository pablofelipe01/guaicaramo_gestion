/**
 * GET /api/sst/capacitaciones/[id]/faltantes - v2
 *
 * Compara el personal activo de la unidad objetivo (dirigido_a) con las
 * asistencias ya registradas en todos los registros de la actividad.
 *
 * Seguridad: firma_encriptada NUNCA se incluye en respuestas.
 * numero_documento se sanitiza con /\D/g en ambos lados del cruce.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { obtenerActividad, listarRegistros, listarAsistenciasRegistro, listarPersonalPorUnidad } from '@/lib/sst/cap'

type Ctx = { params: Promise<{ id: string }> }

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  try {
    const actividad = await obtenerActividad(id)
    const dirigidoA = (actividad.fields['dirigido_a'] ?? '').trim()

    if (!dirigidoA) {
      return NextResponse.json({
        dirigido_a: '', total_unidad: 0, asistidos: 0, faltantes: [], pct_cobertura: 0,
        warning: 'dirigido_a vacio',
      })
    }

    const personalUnidad = await listarPersonalPorUnidad(dirigidoA)

    const registros = await listarRegistros({ actividadId: id })
    const todasAsistencias = (
      await Promise.all(registros.map(r => listarAsistenciasRegistro(r.id)))
    ).flat()

    const cedulasFirmaron = new Set(
      todasAsistencias
        .map(a => String(a.fields['numero_documento'] ?? '').replace(/\D/g, ''))
        .filter(Boolean)
    )

    const faltantes = personalUnidad
      .filter(p => {
        const ced = String(p.fields['numero_documento'] ?? '').replace(/\D/g, '')
        return ced ? !cedulasFirmaron.has(ced) : true
      })
      .map(p => {
        const nombre: string = (p.fields['nombre_empleado'] ?? 'Sin nombre').trim()
        return {
          id: p.id,
          nombre_empleado: nombre,
          descripcion_cargo: p.fields['descripcion_cargo'] ?? 'Sin cargo',
          numero_documento: String(p.fields['numero_documento'] ?? ''),
          iniciales: nombre.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase(),
        }
      })
      .sort((a, b) => a.nombre_empleado.localeCompare(b.nombre_empleado, 'es'))

    const totalUnidad = personalUnidad.length
    const asistidos = totalUnidad - faltantes.length
    const pctCobertura = totalUnidad > 0 ? Math.round((asistidos / totalUnidad) * 100) : 0

    return NextResponse.json({
      dirigido_a: dirigidoA, total_unidad: totalUnidad, asistidos, faltantes, pct_cobertura: pctCobertura,
    })
  } catch (error) {
    console.error('[GET /api/sst/capacitaciones/[id]/faltantes]', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
