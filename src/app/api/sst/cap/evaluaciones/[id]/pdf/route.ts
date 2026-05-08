/**
 * @file route.ts
 * Ruta: GET /api/sst/cap/evaluaciones/[id]/pdf
 * Genera y descarga el PDF GH-FO-14 de una evaluación.
 * Requiere rol SST.
 */
import { NextRequest, NextResponse } from 'next/server'
import { obtenerEvaluacion, obtenerPlantilla } from '@/lib/sst/cap-evaluaciones'
import { generarEvaluacionPDF } from '@/lib/pdf/evaluacion-cap'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { id } = await params

  try {
    const evaluacion = await obtenerEvaluacion(id)
    const plantilla  = await obtenerPlantilla(evaluacion.fields.id_plantilla)

    const pdfBuffer = await generarEvaluacionPDF(evaluacion, plantilla)

    const nombre = `evaluacion_${evaluacion.fields.nombre_trabajador?.replace(/\s+/g, '_')}_${evaluacion.fields.fecha}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Content-Length':      String(pdfBuffer.byteLength),
      },
    })
  } catch (e) {
    console.error('[GET /api/sst/cap/evaluaciones/[id]/pdf]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error generando PDF' },
      { status: 500 }
    )
  }
}
