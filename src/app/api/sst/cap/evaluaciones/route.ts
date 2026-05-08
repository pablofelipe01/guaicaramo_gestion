/**
 * @file route.ts
 * Ruta: GET  /api/sst/cap/evaluaciones  → Historial con filtros (admin)
 *       POST /api/sst/cap/evaluaciones  → Guardar evaluación completada (PÚBLICO)
 *
 * El POST es público (sin autenticación) porque el trabajador accede desde el QR.
 * El puntaje y estado se calculan en el servidor antes de persistir.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  listarEvaluaciones,
  guardarEvaluacion,
  obtenerPlantillaPorToken,
} from '@/lib/sst/cap-evaluaciones'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

/** Lista el historial de evaluaciones con filtros opcionales (autenticado). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const sp = request.nextUrl.searchParams
  const records = await listarEvaluaciones({
    fecha_desde:        sp.get('fecha_desde')        ?? undefined,
    fecha_hasta:        sp.get('fecha_hasta')        ?? undefined,
    area:               sp.get('area')               ?? undefined,
    nombre_capacitacion: sp.get('nombre_capacitacion') ?? undefined,
    puntaje_minimo:     sp.get('puntaje_minimo')     ? Number(sp.get('puntaje_minimo')) : undefined,
    qr_token:           sp.get('qr_token')           ?? undefined,
  })
  return NextResponse.json({ records })
}

/** Guarda una evaluación completada. No requiere autenticación (acceso público por QR). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos obligatorios del formulario
    const requeridos = [
      'fecha', 'tema', 'nombre_capacitacion',
      'nombre_trabajador', 'area', 'nombre_capacitador', 'entidad',
      'respuesta_1', 'respuesta_2', 'respuesta_3', 'respuesta_4',
      'firma_base64', 'qr_token', 'id_plantilla',
    ]
    const faltantes = requeridos.filter(k => !body[k]?.toString().trim())
    if (faltantes.length > 0)
      return NextResponse.json(
        { message: `Campos requeridos: ${faltantes.join(', ')}` },
        { status: 400 }
      )

    // Obtener la plantilla para calificar (el servidor valida el token)
    const plantilla = await obtenerPlantillaPorToken(body.qr_token)
    if (!plantilla)
      return NextResponse.json(
        { message: 'Token de evaluación inválido o plantilla inactiva' },
        { status: 400 }
      )

    const record = await guardarEvaluacion(
      {
        fecha:               body.fecha,
        tema:                body.tema,
        nombre_capacitacion: body.nombre_capacitacion,
        nombre_trabajador:   body.nombre_trabajador,
        area:                body.area,
        nombre_capacitador:  body.nombre_capacitador,
        entidad:             body.entidad,
        respuesta_1:         body.respuesta_1,
        respuesta_2:         body.respuesta_2,
        respuesta_3:         body.respuesta_3,
        respuesta_4:         body.respuesta_4,
        firma_base64:        body.firma_base64,
        qr_token:            body.qr_token,
        id_plantilla:        body.id_plantilla,
      },
      plantilla.fields
    )

    return NextResponse.json(
      {
        record,
        puntaje: record.fields.puntaje,
        aprobado: record.fields.puntaje >= 7.5,
      },
      { status: 201 }
    )
  } catch (e) {
    console.error('[POST /api/sst/cap/evaluaciones]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
