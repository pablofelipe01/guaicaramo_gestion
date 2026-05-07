/**
 * @file route.ts
 * POST /api/sst/capacitaciones/reportes/[id]/pdf-firmado
 *
 * Regenera el PDF con las firmas del capacitador y director
 * almacenadas en sst_cap_reportes.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { obtenerReporte } from '@/lib/sst/reportes'
import { generatePDF, getLogoBuffer } from '@/lib/pdf/asistencia'
import type { AsistenteData, PDFHeaderData } from '@/lib/pdf/asistencia'
import { desencriptarFirma, esFirmaEncriptada } from '@/lib/crypto-firma'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(
    request,
    'coordinador_sst', 'jefe_area', 'gerencia', 'administrador'
  )
  if ('error' in auth) return auth.error

  try {
    const { id: reporteId } = await ctx.params

    // 1. Obtener el reporte
    const reporteRecord = await obtenerReporte(reporteId)
    const reporte = reporteRecord.fields

    if (reporte.estado !== 'completo') {
      return NextResponse.json(
        { error: 'El reporte debe tener ambas firmas antes de generar el PDF firmado' },
        { status: 400 }
      )
    }

    // 2. Parsear el encabezado guardado
    let encabezado: PDFHeaderData
    try {
      encabezado = JSON.parse(reporte.datos_encabezado || '{}') as PDFHeaderData
    } catch {
      return NextResponse.json({ error: 'datos_encabezado inválido en el reporte' }, { status: 500 })
    }

    // Inyectar las firmas del reporte en el encabezado
    encabezado.firma_capacitador = reporte.firma_capacitador
    encabezado.firma_director    = reporte.firma_director

    // 3. Obtener asistencias del registro
    const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY
    const BASE_ID        = process.env.AIRTABLE_BASE_ID
    if (!AIRTABLE_TOKEN || !BASE_ID) {
      return NextResponse.json({ error: 'Configuración de Airtable incompleta' }, { status: 500 })
    }

    const formula = encodeURIComponent(`{registro_id}='${reporte.id_registro}'`)
    const asistenciasRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/sst_cap_asistencias?filterByFormula=${formula}&sort[0][field]=nombre_trabajador&sort[0][direction]=asc`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    )

    if (!asistenciasRes.ok) {
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

    // 4. Generar PDF
    const logoBuffer = getLogoBuffer()
    const pdfBuffer  = await generatePDF(encabezado, asistentes, logoBuffer)

    const fecha     = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const temaSlug  = (encabezado.tema_principal || 'asistencia')
      .toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    const filename  = `control_asistencia_firmado_${fecha}_${temaSlug}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[pdf-firmado] Error:', error)
    return NextResponse.json({ error: 'Error al generar el PDF firmado' }, { status: 500 })
  }
}
