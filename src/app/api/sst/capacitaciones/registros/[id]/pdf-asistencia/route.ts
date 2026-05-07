/**
 * @file route.ts
 * Ruta: POST /api/sst/capacitaciones/registros/[id]/pdf-asistencia
 *
 * Genera el PDF "Control de Asistencia" (formato GH-FO-1) para un registro
 * de ejecución, incluyendo las firmas digitales de los asistentes.
 *
 * Las funciones de dibujo residen en @/lib/pdf/asistencia para ser
 * reutilizadas también por pdf-firmado/route.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { desencriptarFirma, esFirmaEncriptada } from '@/lib/crypto-firma'
import { generatePDF, getLogoBuffer } from '@/lib/pdf/asistencia'
import type { PDFHeaderData, AsistenteData } from '@/lib/pdf/asistencia'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(
    request,
    'coordinador_sst', 'jefe_area', 'gerencia', 'administrador'
  )
  if ('error' in auth) return auth.error

  try {
    const { id: registroId } = await ctx.params
    const body = (await request.json()) as PDFHeaderData

    // 1. Fetch asistencias desde Airtable (servidor — desencripta firmas)
    const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY
    const BASE_ID        = process.env.AIRTABLE_BASE_ID

    if (!AIRTABLE_TOKEN || !BASE_ID) {
      return NextResponse.json({ error: 'Configuración de Airtable incompleta' }, { status: 500 })
    }

    const formula = encodeURIComponent(`{registro_id}='${registroId}'`)
    const asistenciasRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/sst_cap_asistencias?filterByFormula=${formula}&sort[0][field]=nombre_trabajador&sort[0][direction]=asc`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    )

    if (!asistenciasRes.ok) {
      const errBody = await asistenciasRes.text()
      console.error('[pdf-asistencia] Airtable error:', asistenciasRes.status, errBody)
      return NextResponse.json({ error: 'Error al consultar asistencias' }, { status: 500 })
    }

    type RawAsistente = AsistenteData & { firma_encriptada?: string }
    const asistenciasData = await asistenciasRes.json() as { records: { fields: RawAsistente }[] }
    const asistentes: AsistenteData[] = asistenciasData.records.map(r => {
      const fields = { ...r.fields } as RawAsistente
      if (fields.firma_encriptada && esFirmaEncriptada(fields.firma_encriptada)) {
        const dataUrl = desencriptarFirma(fields.firma_encriptada)
        if (dataUrl) fields.firma_digital = dataUrl
      }
      const { firma_encriptada: _omit, ...sinFirmaEncriptada } = fields
      return sinFirmaEncriptada
    })

    // 2. Generar PDF usando la lib compartida
    const logoBuffer = getLogoBuffer()
    const pdfBuffer  = await generatePDF(body, asistentes, logoBuffer)

    const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const temaSlug = (body.tema_principal || 'asistencia')
      .toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    const filename = `control_asistencia_${fechaStr}_${temaSlug}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[pdf-asistencia] Error generando PDF:', error)
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 })
  }
}

