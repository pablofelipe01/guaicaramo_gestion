import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { generarTokenFirmaCapacitacion } from '@/lib/sst/cap-firma-token'
import { listarRegistros } from '@/lib/sst/cap'
import type { CapRegistroFields } from '@/types/sst/cap'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/sst/capacitaciones/registros/[id]/token
 *
 * Genera un token de firma pública (72 h) para el registro de ejecución indicado.
 * Devuelve el token y la URL lista para compartir con los asistentes.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'coordinador_sst', 'administrador')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  // Obtener info del registro para embebir en el token (contexto para la página pública)
  let actividadTema: string | undefined
  let fechaEjecucion: string | undefined
  try {
    const registros = await listarRegistros({ actividadId: undefined, programacionId: undefined })
    const reg = registros.find((r: { id: string; fields: CapRegistroFields }) => r.id === id)
    if (reg) {
      actividadTema  = reg.fields.actividad_tema ?? undefined
      fechaEjecucion = reg.fields.fecha_ejecucion ?? undefined
    }
  } catch { /* si falla, el token igual se genera sin contexto */ }

  const token = await generarTokenFirmaCapacitacion(id, actividadTema, fechaEjecucion)

  const host = request.headers.get('host') ?? 'localhost:3000'
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
  const url = `${baseUrl}/firmar/capacitacion?token=${token}`

  return NextResponse.json({ token, url })
}
