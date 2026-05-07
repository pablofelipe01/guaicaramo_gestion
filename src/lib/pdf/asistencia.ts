/**
 * @file asistencia.ts
 * Funciones compartidas de generación del PDF "Control de Asistencia" (GH-FO-1).
 * Importado tanto por pdf-asistencia/route.ts como por pdf-firmado/route.ts.
 */
import 'server-only'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface PDFHeaderData {
  tipo_actividad: 'CAPACITACIÓN' | 'CHARLA' | 'INDUCCIÓN' | 'REUNIÓN' | 'RECREACIÓN Y DEPORTE'
  fecha: string
  duracion_horas: string
  lugar: string
  capacitador: string
  num_convocados: string
  tema_principal: string
  objetivo: string
  contenido: string
  plan_capacitacion: 'SI' | 'NO' | 'N/A'
  firma_capacitador?: string
  firma_director?: string
}

export interface AsistenteData {
  numero_asistente?: number
  no_cedula?: string
  nombre_completo?: string
  nombre_trabajador?: string
  numero_documento?: string
  cargo?: string
  cargo_empresa?: string
  telefono?: string
  correo_externo?: string
  firma_digital?: string
  firma_url?: string
}

// ─── Colores corporativos ─────────────────────────────────────────────────────
const VERDE       = '#28A745'
const VERDE_DARK  = '#1e7e34'
const VERDE_LIGHT = '#EBF7EE'
const GRIS_FILA   = '#F2FAF5'
const GRIS_BORDE  = '#C8E6C9'
const GRIS_HEADER = '#F8FAFC'

// ─── Dimensiones A4 portrait ─────────────────────────────────────────────────
const PAGE_W = 595
const PAGE_H = 842
const MARGIN  = 20
const CONTENT_W = PAGE_W - MARGIN * 2   // 555

const TIPOS_ACTIVIDAD = ['CAPACITACIÓN', 'CHARLA', 'INDUCCIÓN', 'REUNIÓN', 'RECREACIÓN Y DEPORTE'] as const
const ROWS_PER_PAGE   = 14

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lee el logo desde /public y devuelve el Buffer, o null si no existe. */
export function getLogoBuffer(): Buffer | null {
  const logoPath = path.join(process.cwd(), 'public', 'logo-guaicaramo.png')
  return fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Genera el PDF completo y devuelve el Buffer resultante.
 *
 * @param encabezado  Datos del encabezado (campos del formulario + firmas opcionales).
 * @param asistentes  Lista de asistentes ya procesados (firma_digital ya desencriptada).
 * @param logoBuffer  Buffer del logo o null si no existe.
 */
export async function generatePDF(
  encabezado: PDFHeaderData,
  asistentes: AsistenteData[],
  logoBuffer: Buffer | null
): Promise<Buffer> {
  const chunks: Buffer[] = []
  const doc = new PDFDocument({
    layout: 'portrait',
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    autoFirstPage: true,
  })

  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve)
    doc.on('error', reject)

    const totalPages = Math.ceil(Math.max(asistentes.length, 1) / ROWS_PER_PAGE)

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) doc.addPage()

      const pageAsistentes = asistentes.slice(
        pageIdx * ROWS_PER_PAGE,
        (pageIdx + 1) * ROWS_PER_PAGE
      )

      let y = MARGIN
      y = drawHeader(doc, encabezado, logoBuffer, y, pageIdx === 0)
      y = drawTablaAsistentes(doc, pageAsistentes, y, pageIdx * ROWS_PER_PAGE)
      drawFirmasVerificacion(doc, y, encabezado.firma_capacitador, encabezado.firma_director)
    }

    doc.end()
  })

  return Buffer.concat(chunks)
}

// =============================================================================
// FUNCIONES DE DIBUJO (internas)
// =============================================================================

/** Dibuja el encabezado completo y retorna la coordenada Y siguiente. */
function drawHeader(
  doc: PDFKit.PDFDocument,
  data: PDFHeaderData,
  logoBuffer: Buffer | null,
  startY: number,
  fullHeader: boolean
): number {
  let y = startY
  const x0 = MARGIN

  // ── Fila 1: Logo | Título | Info formato ──────────────────────────────────
  const ROW1_H = 70
  const COL_LOGO_W  = 140
  const COL_META_W  = 130
  const COL_TITLE_W = CONTENT_W - COL_LOGO_W - COL_META_W

  doc.rect(x0, y, CONTENT_W, ROW1_H).fillAndStroke(VERDE_LIGHT, GRIS_BORDE)

  doc.moveTo(x0 + COL_LOGO_W, y).lineTo(x0 + COL_LOGO_W, y + ROW1_H).strokeColor(GRIS_BORDE).lineWidth(0.5).stroke()
  doc.moveTo(x0 + COL_LOGO_W + COL_TITLE_W, y).lineTo(x0 + COL_LOGO_W + COL_TITLE_W, y + ROW1_H).strokeColor(GRIS_BORDE).lineWidth(0.5).stroke()

  // Logo
  doc.rect(x0, y, COL_LOGO_W, ROW1_H).fillAndStroke('#FFFFFF', GRIS_BORDE)
  doc.rect(x0, y, 4, ROW1_H).fill(VERDE)
  if (logoBuffer) {
    const lw = COL_LOGO_W - 16
    const lh = lw * (643 / 1616)
    const logoX = x0 + 4 + (COL_LOGO_W - 4 - lw) / 2
    const logoY = y + (ROW1_H - lh) / 2
    doc.image(logoBuffer, logoX, logoY, { width: lw })
  } else {
    doc.rect(x0 + 8, y + 6, COL_LOGO_W - 14, ROW1_H - 12).fill(VERDE_LIGHT)
    doc.fillColor('#1A202C').fontSize(8).font('Helvetica-Bold')
      .text('GUAICARAMO', x0 + 8, y + (ROW1_H - 8) / 2, { width: COL_LOGO_W - 14, align: 'center' })
  }

  // Título central
  doc.fillColor('#1A202C').fontSize(15).font('Helvetica-Bold')
    .text('CONTROL DE ASISTENCIA', x0 + COL_LOGO_W + 5, y + 18, {
      width: COL_TITLE_W - 10, align: 'center', lineBreak: false,
    })
  doc.fillColor('#1A202C').fontSize(8.5).font('Helvetica-Bold')
    .text('SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO', x0 + COL_LOGO_W + 5, y + 42, {
      width: COL_TITLE_W - 10, align: 'center', lineBreak: false,
    })

  // Meta info
  const metaX = x0 + COL_LOGO_W + COL_TITLE_W
  doc.rect(metaX, y, COL_META_W, ROW1_H).fillAndStroke(GRIS_HEADER, GRIS_BORDE)
  const metaInX = metaX + 6
  const metaRows: [string, string][] = [
    ['Código:',   'GH-FO-1'],
    ['Versión:',  '13'],
    ['Tipo:',     'Formato'],
    ['Vigencia:', '01/08/2022'],
  ]
  const subH = ROW1_H / metaRows.length
  metaRows.forEach(([label, value], mi) => {
    const ry = y + mi * subH
    if (mi > 0) {
      doc.moveTo(metaX, ry).lineTo(metaX + COL_META_W, ry)
        .strokeColor('#DDE5EC').lineWidth(0.3).stroke()
    }
    const ty = ry + (subH - 7) / 2
    doc.fillColor('#1A202C').font('Helvetica-Bold').fontSize(7)
      .text(label, metaInX, ty, { lineBreak: false, continued: true })
    doc.fillColor('#1A202C').font('Helvetica-Bold').fontSize(7)
      .text(` ${value}`, { lineBreak: false })
  })

  y += ROW1_H

  if (!fullHeader) {
    const H = 22
    doc.rect(x0, y, CONTENT_W, H).fill(VERDE)
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
      .text(`CONTINUACIÓN — TEMA: ${data.tema_principal.toUpperCase()}`, x0 + 5, y + 6, {
        width: CONTENT_W - 10,
      })
    return y + H
  }

  // ── Fila 2: Tipo de actividad + N° convocados ─────────────────────────────
  const ROW2_H = 22
  doc.rect(x0, y, CONTENT_W, ROW2_H).fillAndStroke('#FFFFFF', GRIS_BORDE)
  const tiposX = x0 + 5
  let tiposCursor = tiposX
  TIPOS_ACTIVIDAD.forEach(tipo => {
    const isSelected = data.tipo_actividad?.toUpperCase() === tipo
    doc.rect(tiposCursor, y + 6, 8, 8)
    if (isSelected) { doc.fill(VERDE) } else { doc.strokeColor('#9CA3AF').lineWidth(0.6).stroke() }
    doc.fillColor('#1A202C').font('Helvetica-Bold').fontSize(8)
      .text(tipo, tiposCursor + 11, y + 7, { lineBreak: false })
    tiposCursor += doc.widthOfString(tipo) + 22
  })
  const convX = x0 + CONTENT_W - 110
  doc.rect(convX, y, 110, ROW2_H).fillAndStroke(VERDE_LIGHT, GRIS_BORDE)
  doc.fillColor('#1A202C').font('Helvetica-Bold').fontSize(8)
    .text('# CONVOCADOS:', convX + 4, y + 7, { continued: true })
    .fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.num_convocados || ''}`)
  y += ROW2_H

  // ── Fila 3: Fecha | Duración | Lugar | Capacitador ────────────────────────
  const ROW3_H = 22
  doc.rect(x0, y, CONTENT_W, ROW3_H).fillAndStroke(GRIS_FILA, GRIS_BORDE)
  const COL_FECHA_W  = 110
  const COL_DUR_W    = 80
  const COL_LUGAR_W  = CONTENT_W - COL_FECHA_W - COL_DUR_W - 155
  const COL_CAP_W    = 155
  doc.moveTo(x0 + COL_FECHA_W, y).lineTo(x0 + COL_FECHA_W, y + ROW3_H).strokeColor(GRIS_BORDE).lineWidth(0.4).stroke()
  doc.moveTo(x0 + COL_FECHA_W + COL_DUR_W, y).lineTo(x0 + COL_FECHA_W + COL_DUR_W, y + ROW3_H).strokeColor(GRIS_BORDE).lineWidth(0.4).stroke()
  doc.moveTo(x0 + COL_FECHA_W + COL_DUR_W + COL_LUGAR_W, y).lineTo(x0 + COL_FECHA_W + COL_DUR_W + COL_LUGAR_W, y + ROW3_H).strokeColor(GRIS_BORDE).lineWidth(0.4).stroke()
  const f3y = y + 7
  doc.fontSize(8)
  doc.fillColor('#1A202C').font('Helvetica-Bold').text('FECHA:', x0 + 4, f3y, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.fecha || ''}`, x0 + 4 + 38, f3y, { width: COL_FECHA_W - 46, lineBreak: false, ellipsis: true })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text('DUR. (h):', x0 + COL_FECHA_W + 4, f3y, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.duracion_horas || ''}`, x0 + COL_FECHA_W + 4 + 36, f3y, { width: COL_DUR_W - 44, lineBreak: false, ellipsis: true })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text('LUGAR:', x0 + COL_FECHA_W + COL_DUR_W + 4, f3y, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.lugar || ''}`, x0 + COL_FECHA_W + COL_DUR_W + 4 + 34, f3y, { width: COL_LUGAR_W - 42, lineBreak: false, ellipsis: true })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text('CAPACITADOR:', x0 + COL_FECHA_W + COL_DUR_W + COL_LUGAR_W + 4, f3y, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.capacitador || ''}`, x0 + COL_FECHA_W + COL_DUR_W + COL_LUGAR_W + 4 + 70, f3y, { width: COL_CAP_W - 78, lineBreak: false, ellipsis: true })
  y += ROW3_H

  // ── Fila 4: Tema principal + Plan capacitación ────────────────────────────
  const ROW4_H = 22
  doc.rect(x0, y, CONTENT_W, ROW4_H).fillAndStroke('#FFFFFF', GRIS_BORDE)
  const COL_PLAN_W = 140
  doc.moveTo(x0 + CONTENT_W - COL_PLAN_W, y).lineTo(x0 + CONTENT_W - COL_PLAN_W, y + ROW4_H).strokeColor(GRIS_BORDE).lineWidth(0.4).stroke()
  doc.fontSize(8)
  doc.fillColor('#1A202C').font('Helvetica-Bold').text('TEMA:', x0 + 4, y + 7, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.tema_principal || ''}`, x0 + 4 + 32, y + 7, { width: CONTENT_W - COL_PLAN_W - 42, lineBreak: false, ellipsis: true })
  const planX = x0 + CONTENT_W - COL_PLAN_W + 4
  doc.fillColor('#1A202C').font('Helvetica-Bold').fontSize(8).text('PLAN CAP.:', planX, y + 7, { lineBreak: false })
  let planCursor = planX + 50
  ;(['SI', 'NO', 'N/A'] as const).forEach(op => {
    const sel = data.plan_capacitacion === op
    doc.rect(planCursor, y + 6, 8, 8)
    if (sel) doc.fill(VERDE)
    else { doc.strokeColor('#9CA3AF').lineWidth(0.6).stroke() }
    doc.fillColor('#1A202C').font('Helvetica-Bold').fontSize(8).text(op, planCursor + 11, y + 7, { lineBreak: false })
    planCursor += 26
  })
  y += ROW4_H

  // ── Fila 5: Objetivo ──────────────────────────────────────────────────────
  const ROW5_H = 26
  doc.rect(x0, y, CONTENT_W, ROW5_H).fillAndStroke(GRIS_FILA, GRIS_BORDE)
  doc.fillColor('#1A202C').fontSize(8).font('Helvetica-Bold').text('OBJETIVO:', x0 + 4, y + 9, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.objetivo || ''}`, x0 + 4 + 46, y + 9, { width: CONTENT_W - 58, lineBreak: false, ellipsis: true })
  y += ROW5_H

  // ── Fila 6: Contenido ─────────────────────────────────────────────────────
  const ROW6_H = 26
  doc.rect(x0, y, CONTENT_W, ROW6_H).fillAndStroke('#FFFFFF', GRIS_BORDE)
  doc.fillColor('#1A202C').fontSize(8).font('Helvetica-Bold').text('CONTENIDO:', x0 + 4, y + 9, { lineBreak: false })
  doc.fillColor('#1A202C').font('Helvetica-Bold').text(` ${data.contenido || ''}`, x0 + 4 + 54, y + 9, { width: CONTENT_W - 66, lineBreak: false, ellipsis: true })
  y += ROW6_H

  // ── Fila 7: Política de tratamiento de datos personales ───────────────────
  const ROW7_H = 65
  doc.rect(x0, y, CONTENT_W, ROW7_H).fillAndStroke(VERDE_LIGHT, GRIS_BORDE)
  doc.fillColor('#1A202C').fontSize(8.5).font('Helvetica-Bold')
    .text('Política de Tratamiento de Datos Personales', x0 + 4, y + 5, { width: CONTENT_W - 8, align: 'center', lineBreak: false })
  doc.fillColor('#1A202C').fontSize(7).font('Helvetica-Bold')
    .text(
      'Autorizo de manera libre, expresa, inequívoca e informada a GUAICARAMO S.A.S., identificada con NIT No. 800.204.985-1, ' +
      'para que en los términos del artículo 6 de la Ley 1581 de 2012 y demás normas que la complementen o modifiquen, ' +
      'recopile, almacene, use, circule y suprima los datos personales aquí suministrados. ' +
      'Esta autorización permite el uso de mi información con fines estadísticos, de seguridad y salud en el trabajo, ' +
      'de cumplimiento normativo y de gestión documental del SG-SST.',
      x0 + 4, y + 18,
      { width: CONTENT_W - 8, align: 'justify', lineGap: 1 }
    )
  y += ROW7_H

  return y
}

/** Dibuja la tabla de asistentes y retorna la coordenada Y siguiente. */
function drawTablaAsistentes(
  doc: PDFKit.PDFDocument,
  asistentes: AsistenteData[],
  startY: number,
  indexOffset: number
): number {
  const x0 = MARGIN
  let y = startY

  const HEADER_H = 18
  const COL_NO_W     = 24
  const COL_CED_W    = 68
  const COL_NOMBRE_W = 110
  const COL_CARGO_W  = 85
  const COL_TEL_W    = 72
  const COL_EMAIL_W  = CONTENT_W - COL_NO_W - COL_CED_W - COL_NOMBRE_W - COL_CARGO_W - COL_TEL_W - 78
  const COL_FIRMA_W  = 78

  const cols = [
    { label: 'No.',                   w: COL_NO_W,     align: 'center' as const },
    { label: 'No. CÉDULA',            w: COL_CED_W,    align: 'center' as const },
    { label: 'NOMBRE DEL ASISTENTE',  w: COL_NOMBRE_W, align: 'left'   as const },
    { label: 'CARGO O EMPRESA',       w: COL_CARGO_W,  align: 'left'   as const },
    { label: 'No. TELÉFONO',          w: COL_TEL_W,    align: 'center' as const },
    { label: 'CORREO ELECTRÓNICO\n(personal externo)', w: COL_EMAIL_W,  align: 'left'   as const },
    { label: 'FIRMA',                 w: COL_FIRMA_W,  align: 'center' as const },
  ]

  doc.rect(x0, y, CONTENT_W, HEADER_H).fill(VERDE_DARK)
  let cx = x0
  cols.forEach(col => {
    const hasNewline = col.label.includes('\n')
    const fs = hasNewline ? 6 : 7.5
    const ty = hasNewline ? y + 2 : y + 5
    doc.fillColor('#FFFFFF').fontSize(fs).font('Helvetica-Bold')
      .text(col.label, cx + 2, ty, { width: col.w - 4, align: col.align, lineBreak: true })
    cx += col.w
  })
  cx = x0
  cols.forEach(col => {
    doc.moveTo(cx, y).lineTo(cx, y + HEADER_H).strokeColor('#5BAD73').lineWidth(0.5).stroke()
    cx += col.w
  })
  doc.moveTo(cx, y).lineTo(cx, y + HEADER_H).strokeColor('#5BAD73').lineWidth(0.5).stroke()
  doc.rect(x0, y, CONTENT_W, HEADER_H).strokeColor(GRIS_BORDE).lineWidth(0.5).stroke()
  y += HEADER_H

  const ROW_H = 28
  asistentes.forEach((ast, i) => {
    const rowBg = i % 2 === 0 ? '#FFFFFF' : GRIS_FILA
    doc.rect(x0, y, CONTENT_W, ROW_H).fill(rowBg).strokeColor(GRIS_BORDE).lineWidth(0.3).stroke()
    cx = x0
    doc.fillColor('#1A202C').fontSize(8).font('Helvetica-Bold')
    doc.text(String(indexOffset + i + 1), cx + 2, y + 10, { width: cols[0].w - 4, align: 'center', lineBreak: false })
    cx += cols[0].w
    const cedula = ast.no_cedula ?? ast.numero_documento ?? ''
    doc.text(cedula, cx + 2, y + 10, { width: cols[1].w - 4, align: 'center', lineBreak: false })
    cx += cols[1].w
    const nombre = ast.nombre_completo ?? ast.nombre_trabajador ?? ''
    doc.text(nombre, cx + 2, y + 10, { width: cols[2].w - 4, align: 'left', lineBreak: false, ellipsis: true })
    cx += cols[2].w
    const cargo = ast.cargo ?? ast.cargo_empresa ?? ''
    doc.text(cargo, cx + 2, y + 10, { width: cols[3].w - 4, align: 'left', lineBreak: false, ellipsis: true })
    cx += cols[3].w
    doc.text(ast.telefono ?? '', cx + 2, y + 10, { width: cols[4].w - 4, align: 'center', lineBreak: false })
    cx += cols[4].w
    doc.text(ast.correo_externo ?? '', cx + 2, y + 10, { width: cols[5].w - 4, align: 'left', lineBreak: false, ellipsis: true })
    cx += cols[5].w
    const firmaDataUrl = ast.firma_digital
    if (firmaDataUrl && firmaDataUrl.startsWith('data:image/')) {
      try {
        const buf = Buffer.from(firmaDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        doc.image(buf, cx + 2, y + 2, { width: cols[6].w - 4, height: ROW_H - 4 })
      } catch { /* imagen inválida */ }
    }
    doc.rect(cx, y, cols[6].w, ROW_H).strokeColor(GRIS_BORDE).lineWidth(0.3).stroke()
    cx = x0
    cols.forEach(col => {
      doc.moveTo(cx, y).lineTo(cx, y + ROW_H).strokeColor(GRIS_BORDE).lineWidth(0.3).stroke()
      cx += col.w
    })
    doc.moveTo(cx, y).lineTo(cx, y + ROW_H).strokeColor(GRIS_BORDE).lineWidth(0.3).stroke()
    y += ROW_H
  })

  doc.moveTo(x0, y).lineTo(x0 + CONTENT_W, y).strokeColor(GRIS_BORDE).lineWidth(0.5).stroke()
  return y
}

/** Dibuja el bloque de firmas de verificación al pie de la página. */
function drawFirmasVerificacion(
  doc: PDFKit.PDFDocument,
  startY: number,
  firmaCapacitador?: string,
  firmaDirector?: string
): void {
  const x0 = MARGIN
  const hasSigs = !!(firmaCapacitador || firmaDirector)
  const SIG_H  = 28
  const BOX_H  = hasSigs ? 68 : 40
  const availableY = PAGE_H - MARGIN - BOX_H - 2
  const y = startY < availableY ? startY + 5 : availableY

  const COL_W = CONTENT_W / 2
  const FIRMA_LINE_W = 150

  doc.rect(x0, y - 2, CONTENT_W, BOX_H).fillAndStroke(VERDE_LIGHT, GRIS_BORDE)
  doc.fillColor('#1A202C').fontSize(8).font('Helvetica-Bold')
    .text('FIRMAS DE VERIFICACIÓN:', x0 + 4, y + 2, { lineBreak: false })

  const lineY  = hasSigs ? y + SIG_H + 10 : y + 28
  const labelY = lineY + 3

  const line1X = x0 + (COL_W - FIRMA_LINE_W) / 2
  if (firmaCapacitador && firmaCapacitador.startsWith('data:image/')) {
    try {
      const buf = Buffer.from(firmaCapacitador.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      doc.image(buf, line1X, y + 2, { width: FIRMA_LINE_W, height: SIG_H })
    } catch { /* imagen inválida */ }
  }
  doc.moveTo(line1X, lineY).lineTo(line1X + FIRMA_LINE_W, lineY)
    .strokeColor(VERDE).lineWidth(0.7).stroke()
  doc.fillColor('#1A202C').fontSize(7.5).font('Helvetica-Bold')
    .text('CAPACITADOR U ORGANIZADOR', line1X, labelY, { width: FIRMA_LINE_W, align: 'center' })

  const line2X = x0 + COL_W + (COL_W - FIRMA_LINE_W) / 2
  if (firmaDirector && firmaDirector.startsWith('data:image/')) {
    try {
      const buf = Buffer.from(firmaDirector.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      doc.image(buf, line2X, y + 2, { width: FIRMA_LINE_W, height: SIG_H })
    } catch { /* imagen inválida */ }
  }
  doc.moveTo(line2X, lineY).lineTo(line2X + FIRMA_LINE_W, lineY)
    .strokeColor(VERDE).lineWidth(0.7).stroke()
  doc.fillColor('#1A202C').fontSize(7.5).font('Helvetica-Bold')
    .text('DIRECTOR O RESPONSABLE DEL ÁREA', line2X, labelY, { width: FIRMA_LINE_W, align: 'center' })
}
