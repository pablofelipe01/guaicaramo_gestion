import { NextRequest, NextResponse } from 'next/server'
import { verificarTokenFirmaCapacitacion } from '@/lib/sst/cap-firma-token'
import { crearAsistenciaRegistro } from '@/lib/sst/cap'
import { encriptarFirma } from '@/lib/crypto-firma'

/**
 * GET /api/sst/capacitaciones/firmar-publico?token=XXX
 *
 * Endpoint público (sin autenticación).
 * Valida el token y devuelve el contexto mínimo del registro para mostrar en la
 * página de firma (actividad, fecha).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ message: 'Token requerido' }, { status: 400 })

  const payload = await verificarTokenFirmaCapacitacion(token)
  if (!payload) return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 })

  return NextResponse.json({
    registroId:     payload.registroId,
    actividadTema:  payload.actividadTema ?? null,
    fechaEjecucion: payload.fechaEjecucion ?? null,
  })
}

/**
 * POST /api/sst/capacitaciones/firmar-publico
 *
 * Endpoint público (sin autenticación).
 * Recibe el token + datos del asistente + firma (data URL base64) y registra
 * la asistencia individual.
 *
 * Body: { token, nombre_trabajador, numero_documento?, telefono?, cargo_empresa?, correo_externo?, firma_data_url? }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { token, nombre_trabajador, numero_documento, telefono, cargo_empresa, correo_externo, firma_data_url } = body

  if (!token || typeof token !== 'string')
    return NextResponse.json({ message: 'Token requerido' }, { status: 400 })

  if (!nombre_trabajador || typeof nombre_trabajador !== 'string' || !nombre_trabajador.trim())
    return NextResponse.json({ message: 'nombre_trabajador es requerido' }, { status: 400 })

  if (!firma_data_url || typeof firma_data_url !== 'string' || !firma_data_url.startsWith('data:image/'))
    return NextResponse.json({ message: 'La firma es obligatoria' }, { status: 400 })

  const payload = await verificarTokenFirmaCapacitacion(token)
  if (!payload) return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 })

  // Encriptar firma con AES-256-GCM antes de persistir
  let firma_encriptada: string | undefined
  if (typeof firma_data_url === 'string' && firma_data_url.startsWith('data:image/')) {
    firma_encriptada = encriptarFirma(firma_data_url)
  }

  const record = await crearAsistenciaRegistro({
    registro_id:       payload.registroId,
    nombre_trabajador: String(nombre_trabajador).trim(),
    numero_documento:  typeof numero_documento === 'string' ? numero_documento.trim() : undefined,
    telefono:          typeof telefono          === 'string' ? telefono.trim()         : undefined,
    cargo_empresa:     typeof cargo_empresa     === 'string' ? cargo_empresa.trim()    : undefined,
    correo_externo:    typeof correo_externo    === 'string' ? correo_externo.trim()   : undefined,
    asistio:           true,
    firma_encriptada,
    fecha_firma:       new Date().toISOString().split('T')[0],
  })

  // No devolver la firma encriptada en la respuesta — solo confirmación
  const { firma_encriptada: _omit, ...camposSeguros } = record.fields
  return NextResponse.json({ record: { ...record, fields: camposSeguros } }, { status: 201 })
}
