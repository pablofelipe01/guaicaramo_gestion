/**
 * @file route.ts
 * Ruta: POST /api/sst/capacitaciones/registros/[id]/token
 *
 * Genera un JWT de firma pública (72 horas) para compartir con asistentes.
 * El token embebe el ID del registro, el tema y la fecha de ejecución
 * para que la página pública lo muestre sin requerir autenticación.
 *
 * Restringido a: coordinador_sst, administrador.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { generarTokenFirmaCapacitacion } from '@/lib/sst/cap-firma-token'
import { getRecord } from '@/lib/airtable-client'
import type { CapRegistroFields } from '@/types/sst/cap'

const T_REGISTROS = 'sst_cap_registros'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Genera un enlace público de firma para un registro de ejecución.
 *
 * @param request - Solicitud autenticada (coordinador_sst o administrador).
 * @param ctx - `id` = ID del registro en `sst_cap_registros`.
 * @returns `{ token, url }` donde `url` es el enlace listo para compartir por QR/WhatsApp.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'coordinador_sst', 'administrador')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  // Enriquecer el token con contexto del registro para mostrarlo en la página pública
  let actividadTema: string | undefined
  let fechaEjecucion: string | undefined
  try {
    const reg = await getRecord<CapRegistroFields>(T_REGISTROS, id)
    actividadTema  = reg.fields.actividad_tema ?? undefined
    fechaEjecucion = reg.fields.fecha_ejecucion ?? undefined
  } catch { /* si el registro no existe aún, el token se genera sin contexto */ }

  const token = await generarTokenFirmaCapacitacion(id, actividadTema, fechaEjecucion)

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
  const url = `${baseUrl}/firmar/capacitacion?token=${token}`

  return NextResponse.json({ token, url })
}
