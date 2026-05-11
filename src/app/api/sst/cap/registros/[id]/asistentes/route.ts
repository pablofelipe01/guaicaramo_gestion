/**
 * @file route.ts
 * Ruta: GET /api/sst/cap/registros/[id]/asistentes
 *
 * Lista todos los asistentes de un registro de ejecución junto con
 * el estado de evaluación de cada uno.
 *
 * Respuesta por trabajador:
 *   asistencia: { nombre_trabajador, cargo_empresa, asistio, tiene_firma, fecha_firma, nota_evaluacion }
 *   evaluacion: { puntaje, aprobado, estado } | null
 *
 * Requiere autenticación.
 */
import { NextRequest, NextResponse } from 'next/server'
import { listarAsistentesConEvaluacion } from '@/lib/sst/cap-evaluaciones'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { id } = await params
  if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 })

  try {
    const items = await listarAsistentesConEvaluacion(id)

    // Sanitizar: omitir firma_encriptada, agregar tiene_firma y campo aprobado calculado
    const resultado = items.map(({ asistencia, evaluacion }) => ({
      asistencia: {
        id:                asistencia.id,
        nombre_trabajador: asistencia.fields.nombre_trabajador,
        numero_documento:  asistencia.fields.numero_documento,
        cargo_empresa:     asistencia.fields.cargo_empresa,
        asistio:           asistencia.fields.asistio,
        tiene_firma:       !!asistencia.fields.firma_encriptada,
        nota_evaluacion:   asistencia.fields.nota_evaluacion,
        fecha_firma:       asistencia.fields.fecha_firma,
      },
      evaluacion: evaluacion
        ? {
            id:      evaluacion.id,
            puntaje: evaluacion.fields.puntaje,
            aprobado: (evaluacion.fields.puntaje ?? 0) >= 6.0,
            estado:  evaluacion.fields.estado,
            area:    evaluacion.fields.area,
            fecha:   evaluacion.fields.fecha,
          }
        : null,
    }))

    return NextResponse.json({ records: resultado, total: resultado.length })
  } catch (e) {
    console.error('[GET /api/sst/cap/registros/[id]/asistentes]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
