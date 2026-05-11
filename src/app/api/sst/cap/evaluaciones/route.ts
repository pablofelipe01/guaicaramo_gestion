/**
 * @file route.ts
 * Ruta: GET  /api/sst/cap/evaluaciones  → Historial con filtros (admin)
 *       POST /api/sst/cap/evaluaciones  → Guardar evaluación integrada (PÚBLICO)
 *
 * POST es público (sin auth) porque el trabajador accede desde el QR.
 * El servidor auto-completa campos desde el registro de ejecución vinculado,
 * calcula el puntaje y registra la asistencia en sst_cap_asistencias.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  listarEvaluaciones,
  guardarEvaluacionIntegrada,
} from '@/lib/sst/cap-evaluaciones'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

/** Lista el historial de evaluaciones con filtros opcionales (autenticado). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const sp = request.nextUrl.searchParams
  const records = await listarEvaluaciones({
    fecha_desde:         sp.get('fecha_desde')         ?? undefined,
    fecha_hasta:         sp.get('fecha_hasta')         ?? undefined,
    area:                sp.get('area')                ?? undefined,
    nombre_capacitacion: sp.get('nombre_capacitacion') ?? undefined,
    puntaje_minimo:      sp.get('puntaje_minimo') ? Number(sp.get('puntaje_minimo')) : undefined,
    qr_token:            sp.get('qr_token')            ?? undefined,
    id_capacitacion:     sp.get('id_capacitacion')     ?? undefined,
  })
  return NextResponse.json({ records })
}

/** Guarda evaluación integrada. Público — acceso por QR token. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Solo se requieren: qr_token, nombre_trabajador, área y respuestas
    // El resto se auto-completa desde el registro de ejecución vinculado
    const requeridos = ['qr_token', 'nombre_trabajador', 'area', 'respuesta_2', 'respuesta_3', 'respuesta_4', 'firma_base64']
    const faltantes = requeridos.filter(k => !body[k]?.toString().trim())
    if (faltantes.length > 0)
      return NextResponse.json({ message: `Campos requeridos: ${faltantes.join(', ')}` }, { status: 400 })

    if (typeof body.firma_base64 === 'string' && body.firma_base64.length > 512_000)
      return NextResponse.json({ message: 'La imagen de firma supera el tamaño permitido (500 KB)' }, { status: 413 })

    if (!/^[0-9a-f-]{8,36}$/i.test(body.qr_token))
      return NextResponse.json({ message: 'Token de evaluación con formato inválido' }, { status: 400 })

    const { record, puntaje, aprobado } = await guardarEvaluacionIntegrada({
      qr_token:          body.qr_token,
      nombre_trabajador: body.nombre_trabajador,
      area:              body.area,
      respuesta_1:       body.respuesta_1 ?? '',
      respuesta_2:       body.respuesta_2,
      respuesta_3:       body.respuesta_3,
      respuesta_4:       body.respuesta_4,
      firma_base64:      body.firma_base64,
      // Campos opcionales por si la plantilla no está vinculada a un registro
      fecha:             body.fecha,
      tema:              body.tema,
      nombre_capacitacion: body.nombre_capacitacion,
      nombre_capacitador:  body.nombre_capacitador,
      entidad:             body.entidad,
    })

    return NextResponse.json({ record, puntaje, aprobado }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/sst/cap/evaluaciones]', e)
    const msg = e instanceof Error ? e.message : 'Error interno del servidor'
    const status = msg.includes('inválido') || msg.includes('inactiva') ? 400 : 500
    return NextResponse.json({ message: msg }, { status })
  }
}
