/**
 * @file route.ts
 * GET  /api/sst/capacitaciones/reportes?id_actividad=XXX
 * POST /api/sst/capacitaciones/reportes
 *
 * Historial de reportes de control de asistencia (sst_cap_reportes).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { crearReporte, listarReportesPorActividad } from '@/lib/sst/reportes'
import type { CapReporteFields } from '@/types/sst/reportes'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

/**
 * Lista reportes de una actividad.
 * Parámetro: `?id_actividad=<id>`
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const actividadId = request.nextUrl.searchParams.get('id_actividad')
  if (!actividadId)
    return NextResponse.json({ message: 'id_actividad es requerido' }, { status: 400 })

  try {
    const records = await listarReportesPorActividad(actividadId)

    // Omitir las firmas (base64 pesado) en la lista — se carga en el detalle
    const recordsLimpios = records.map(r => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { firma_capacitador, firma_director, datos_encabezado, ...campos } = r.fields
      return {
        ...r,
        fields: {
          ...campos,
          tiene_firma_cap: !!firma_capacitador,
          tiene_firma_dir: !!firma_director,
        },
      }
    })

    return NextResponse.json({ records: recordsLimpios })
  } catch (error) {
    console.error('[reportes GET]', error)
    const msg = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

/**
 * Crea un nuevo reporte al generar un PDF.
 * Body: { id_registro, id_actividad, nombre_reporte, datos_encabezado (object),
 *         total_asistentes, generado_por }
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'coordinador_sst', 'jefe_area', 'gerencia', 'administrador')
  if ('error' in auth) return auth.error

  const body = await request.json() as {
    id_registro:      string
    id_actividad:     string
    nombre_reporte:   string
    datos_encabezado: Record<string, unknown>
    total_asistentes: number
    generado_por:     string
  }

  if (!body.id_registro || !body.id_actividad || !body.nombre_reporte)
    return NextResponse.json({ message: 'id_registro, id_actividad y nombre_reporte son requeridos' }, { status: 400 })

  const fields: Omit<CapReporteFields, 'estado'> = {
    id_registro:      body.id_registro,
    id_actividad:     body.id_actividad,
    nombre_reporte:   body.nombre_reporte,
    fecha_generacion: new Date().toISOString().slice(0, 10),
    generado_por:     body.generado_por || 'Sistema',
    datos_encabezado: JSON.stringify(body.datos_encabezado ?? {}),
    total_asistentes: Number(body.total_asistentes) || 0,
  }

  try {
    const record = await crearReporte(fields)
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('[reportes POST]', error)
    const msg = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
