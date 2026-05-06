/**
 * GET /api/sst/capacitaciones/registros/[id]/asistencias-firma
 *
 * Endpoint exclusivo para el formulario imprimible "Control de Asistencia" (GH-FO-1).
 * Retorna las asistencias con las firmas DESENCRIPTADAS como data URLs.
 *
 * Solo coordinador_sst y administrador pueden acceder.
 * El campo firma_encriptada NUNCA se incluye en la respuesta.
 */
import { NextRequest, NextResponse } from 'next/server'
import { listarAsistenciasRegistro } from '@/lib/sst/cap'
import { desencriptarFirma } from '@/lib/crypto-firma'
import { requireRole } from '@/lib/auth/middleware'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'coordinador_sst', 'administrador')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const records = await listarAsistenciasRegistro(id)

  const recordsConFirma = records.map(r => {
    const { firma_encriptada, firma_url, ...campos } = r.fields

    let firma_data_url: string | null = null
    if (firma_encriptada) {
      firma_data_url = desencriptarFirma(firma_encriptada)
    }
    if (!firma_data_url && firma_url) {
      firma_data_url = firma_url
    }

    return {
      ...r,
      fields: {
        ...campos,
        firma_data_url,
        tiene_firma: !!firma_encriptada || !!firma_url,
      },
    }
  })

  return NextResponse.json({ records: recordsConFirma })
}
