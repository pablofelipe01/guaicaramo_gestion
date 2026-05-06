/**
 * @file route.ts
 * Ruta: GET /api/sst/capacitaciones/registros/[id]/asistencias
 *       POST /api/sst/capacitaciones/registros/[id]/asistencias
 *
 * Gestión de la lista de asistentes de un registro de ejecución.
 *
 * Seguridad: `firma_encriptada` NUNCA se envía al cliente.
 * El GET la omite y agrega el campo `tiene_firma: boolean`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { listarAsistenciasRegistro, crearAsistenciaRegistro } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

/** Roles que pueden consultar la lista de asistentes. */
const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

/**
 * Lista los asistentes de un registro de ejecución.
 * Reemplaza `firma_encriptada` por `tiene_firma: boolean` por seguridad.
 *
 * @param request - Solicitud autenticada.
 * @param ctx - `id` = ID del registro en `sst_cap_registros`.
 * @returns `{ records }` con asistencias sin datos de firma.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const records = await listarAsistenciasRegistro(id)
  // Nunca exponer firma_encriptada al cliente — solo indicar si existe firma
  const recordsSeguros = records.map(r => {
    const { firma_encriptada, ...campos } = r.fields
    return { ...r, fields: { ...campos, tiene_firma: !!firma_encriptada } }
  })
  return NextResponse.json({ records: recordsSeguros })
}

/**
 * Registra manualmente la asistencia de un trabajador.
 * Restringido a coordinadores SST y administradores.
 * Para registro público vía QR, usar el endpoint `firmar-publico`.
 *
 * @param request - Body JSON con `nombre_trabajador` (requerido), `cedula`, `cargo`, `area`, `nota_evaluacion`.
 * @param ctx - `id` = ID del registro en `sst_cap_registros`.
 * @returns `{ record }` con status 201.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'coordinador_sst', 'administrador')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const body = await request.json()

  if (!body.nombre_trabajador?.trim())
    return NextResponse.json({ message: 'nombre_trabajador es requerido' }, { status: 400 })

  const record = await crearAsistenciaRegistro({
    registro_id: id,
    nombre_trabajador: String(body.nombre_trabajador).trim(),
    numero_documento: body.cedula ? String(body.cedula).trim() : undefined,
    cargo_empresa: body.cargo ? String(body.cargo).trim() : undefined,
    telefono: body.area ? String(body.area).trim() : undefined,
    asistio: body.asistio !== false,
    nota_evaluacion: body.nota_evaluacion != null ? Number(body.nota_evaluacion) : undefined,
  })
  return NextResponse.json({ record }, { status: 201 })
}
