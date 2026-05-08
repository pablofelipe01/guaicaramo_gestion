/**
 * @file lib/pdf/evaluacion-cap.ts
 * PDF GH-FO-14 — Evaluación de Eficacia de la Capacitación.
 * Replica el formato oficial: dos copias del formulario en una página A4 portrait.
 */
import 'server-only'
import { jsPDF } from 'jspdf'
import * as fs   from 'fs'
import * as path from 'path'
import type { CapEvaluacionFields, CapPlantillaFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Trunca `text` para que su ancho no supere `maxW` mm con la fuente activa */
function fitText(doc: jsPDF, text: string, maxW: number): string {
  if (!text) return ''
  if (doc.getTextWidth(text) <= maxW) return text
  let t = text
  while (t.length > 1 && doc.getTextWidth(t + '\u2026') > maxW) t = t.slice(0, -1)
  return t + '\u2026'
}

function fmtFecha(iso?: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function parseopciones(json: string): string[] {
  try { return JSON.parse(json) as string[] } catch { return [] }
}

function trunc(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

interface LogoInfo { data: string; ratio: number }

function getLogoInfo(): LogoInfo {
  try {
    const buf   = fs.readFileSync(path.join(process.cwd(), 'public', 'guaicaramo.png'))
    const w     = buf.readUInt32BE(16)
    const h     = buf.readUInt32BE(20)
    const ratio = h > 0 ? w / h : 3.0
    return { data: `data:image/png;base64,${buf.toString('base64')}`, ratio }
  } catch {
    return { data: '', ratio: 3.0 }
  }
}

// ─── drawCopy ────────────────────────────────────────────────────────────────
/**
 * Dibuja una copia completa del formulario GH-FO-14.
 * @param ox  origen X en mm
 * @param oy  origen Y en mm
 * @param cW  ancho de la copia en mm
 */
function drawCopy(
  doc:   jsPDF,
  ox:    number,
  oy:    number,
  cW:    number,
  f:     CapEvaluacionFields,
  p:     CapPlantillaFields,
  logo:  LogoInfo,
): void {
  const iX   = ox + 3          // x con padding interior
  const iW   = cW - 6          // ancho interior
  const half = cW / 2          // mitad para 2 columnas en campos de control
  let y      = oy

  // ── ENCABEZADO (tabla con 3 celdas) ────────────────────────────────────────
  const hH    = 24
  const logoW = 40             // celda logo más ancha
  const metaW = 44             // celda metadatos
  const titW  = cW - logoW - metaW

  doc.setDrawColor(0)
  doc.setLineWidth(0.4)
  doc.rect(ox, y, cW, hH)
  doc.line(ox + logoW,        y, ox + logoW,        y + hH)
  doc.line(ox + logoW + titW, y, ox + logoW + titW, y + hH)

  // Logo — aspect ratio real (leído del PNG)
  if (logo.data) {
    try {
      const maxW = logoW - 4
      const maxH = hH - 4
      let lW = maxW
      let lH = lW / logo.ratio
      if (lH > maxH) { lH = maxH; lW = lH * logo.ratio }
      const lX = ox + (logoW - lW) / 2
      const lY = y  + (hH   - lH) / 2
      doc.addImage(logo.data, 'PNG', lX, lY, lW, lH)
    } catch { /* skip */ }
  }

  // Celda título
  const tx = ox + logoW
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0)
  doc.text('EVALUACI\u00d3N EFICACIA DE LA', tx + titW / 2, y + 9,  { align: 'center' })
  doc.text('CAPACITACI\u00d3N',              tx + titW / 2, y + 16, { align: 'center' })

  // Celda metadatos
  const mx = ox + logoW + titW + 2
  const mr = ox + cW - 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text('C\u00f3digo:',          mx, y + 5);    doc.text('GH-FO-14',  mr, y + 5,    { align: 'right' })
  doc.text('Versi\u00f3n:',         mx, y + 9);    doc.text('7',         mr, y + 9,    { align: 'right' })
  doc.text('Tipo:',             mx, y + 13);   doc.text('Formato',   mr, y + 13,   { align: 'right' })
  doc.text('Implementaci\u00f3n:', mx, y + 17);   doc.text('28/03/2025',mr, y + 17,   { align: 'right' })

  y += hH + 2

  // ── OBJETIVO ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(8)
  doc.setTextColor(0)
  const objLines = doc.splitTextToSize(
    'Objetivo: Identificar la eficacia y los conocimientos adquiridos en la capacitaci\u00f3n recibida',
    iW,
  )
  doc.text(objLines, iX, y + 4)
  y += objLines.length * 4.5 + 5

  // ── CAMPOS DE CONTROL ────────────────────────────────────────────────────────
  // Cada fila: etiqueta en negrita + valor ajustado + línea subrayado completo
  const fH   = 7.5
  const Lend = ox + half - 3   // límite derecho col izquierda
  const Rend = ox + cW         // límite derecho col derecha
  const Rsep = ox + half + 1   // inicio texto col derecha

  doc.setFontSize(8.5)
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.3)
  doc.setTextColor(0)

  // helper para dibujar una fila de campo
  const campo = (
    lbl: string, val: string, x1: number, x2: number,
  ) => {
    doc.setFont('helvetica', 'bold')
    const lW = doc.getTextWidth(lbl + ' ')
    doc.text(lbl, x1, y)
    doc.setFont('helvetica', 'normal')
    doc.text(fitText(doc, val, x2 - x1 - lW - 1), x1 + lW, y)
    doc.line(x1, y + 1, x2, y + 1)
  }

  // Fila 1
  campo('Fecha:',        fmtFecha(f.fecha),          iX,    Lend)
  campo('Tema:',         f.tema ?? '',               Rsep,  Rend)
  y += fH
  // Fila 2
  campo('Trabajador:',   f.nombre_trabajador ?? '',  iX,    Lend)
  campo('\u00c1rea:',    f.area ?? '',               Rsep,  Rend)
  y += fH
  // Fila 3
  campo('Capacitador:',  f.nombre_capacitador ?? '', iX,    Lend)
  campo('Entidad:',      f.entidad ?? '',            Rsep,  Rend)
  y += fH + 4

  // ── INSTRUCCIÓN ──────────────────────────────────────────────────────────────
  doc.setDrawColor(0)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(50, 50, 50)
  const instrLines = doc.splitTextToSize(
    'Marque con una X la respuesta correcta en cada pregunta. Cada pregunta tiene un valor de 2.5 puntos.',
    iW,
  )
  doc.text(instrLines, iX, y + 3)
  y += instrLines.length * 4.5 + 5
  doc.setTextColor(0)

  // ── PREGUNTAS 1–3 (selección múltiple) ───────────────────────────────────────
  // Orden en GH-FO-14: pregunta_2 → Q1, pregunta_3 → Q2, pregunta_4 → Q3
  const letras = ['A', 'B', 'C', 'D']
  const mcQs = [
    { num: 1, texto: p.pregunta_2_texto ?? '', opciones: parseopciones(p.pregunta_2_opciones ?? '[]'), respuesta: f.respuesta_2 },
    { num: 2, texto: p.pregunta_3_texto ?? '', opciones: parseopciones(p.pregunta_3_opciones ?? '[]'), respuesta: f.respuesta_3 },
    { num: 3, texto: p.pregunta_4_texto ?? '', opciones: parseopciones(p.pregunta_4_opciones ?? '[]'), respuesta: f.respuesta_4 },
  ]

  // Columnas dentro de cada opción — distancias fijas para evitar solapamientos:
  //  [iX]──"A."──[iX+5]──gap──[cirX=iX+10]──gap──[iX+16]──texto──[iX+iW]
  const circR   = 2.6
  const colLtr  = iX           // letra "A."
  const colCirX = iX + 10      // centro del círculo (borde izq = iX+7.4 > fin letra)
  const colTxt  = iX + 16      // texto (borde der círculo = iX+12.6, gap 3.4mm)
  const opMaxW  = iW - 16      // ancho máximo para texto de opción
  const rowH    = 7.5          // alto de cada fila de opción (≥ 2×circR + margen)
  const qLineH  = 5.5          // interlineado para el enunciado de la pregunta

  for (const q of mcQs) {
    // Enunciado subrayado
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0)
    const qLines = doc.splitTextToSize(`${q.num}. \u00bf${q.texto}?`, iW)
    doc.text(qLines, iX, y)
    doc.setDrawColor(0)
    doc.setLineWidth(0.2)
    for (let li = 0; li < qLines.length; li++) {
      const lw = doc.getTextWidth(qLines[li])
      doc.line(iX, y + 1 + li * qLineH, iX + lw, y + 1 + li * qLineH)
    }
    y += qLines.length * qLineH + 3

    // Opciones
    doc.setFontSize(8.5)
    for (let i = 0; i < Math.min(q.opciones.length, 4); i++) {
      const opcion  = q.opciones[i]
      const marcada = q.respuesta === opcion
      const midY    = y + rowH / 2       // centro vertical de esta fila
      const cy      = midY + 1           // centro del círculo alineado con la línea base del texto

      // Letra en negrita
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      doc.text(`${letras[i]}.`, colLtr, midY + 1.5)

      // Círculo
      doc.setLineWidth(0.3)
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(0)
      doc.circle(colCirX, cy, circR, 'FD')

      if (marcada) {
        doc.setLineWidth(0.7)
        doc.line(colCirX - 1.7, cy - 1.7, colCirX + 1.7, cy + 1.7)
        doc.line(colCirX + 1.7, cy - 1.7, colCirX - 1.7, cy + 1.7)
        doc.setLineWidth(0.3)
      }

      // Texto de la opción — con splitTextToSize para manejar texto largo
      doc.setFont('helvetica', 'normal')
      const optLines = doc.splitTextToSize(opcion, opMaxW)
      // 1 línea → centrada verticalmente; varias → arrancan desde y+2
      doc.text(optLines, colTxt, optLines.length === 1 ? midY + 1.5 : y + 3.5)

      y += rowH
    }
    y += 5   // separación entre preguntas
  }

  // ── PREGUNTA 4 (respuesta abierta) ────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0)
  // Evitar doble ¿ / doble ?
  const q4Raw   = (p.pregunta_1_texto ?? '').replace(/^\u00bf/, '').replace(/\?$/, '')
  const q4Label = q4Raw
    ? `4. \u00bf${q4Raw}?`
    : '4. \u00bfC\u00f3mo aplicar\u00eda estos conocimientos en su trabajo y/o a nivel personal?'
  const q4Lines = doc.splitTextToSize(q4Label, iW)
  doc.text(q4Lines, iX, y)
  y += q4Lines.length * 5.5 + 2

  // Caja de respuesta abierta
  const boxH = 22
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(ox, y, cW, boxH)
  if (f.respuesta_1) {
    doc.setFontSize(8)
    const rLines = doc.splitTextToSize(f.respuesta_1, iW)
    doc.text(rLines.slice(0, 4), iX, y + 5)
  }
  y += boxH + 4

  // ── FIRMA + CALIFICACIÓN ─────────────────────────────────────────────────────
  const secH   = 28
  const divX   = ox + cW * 0.64
  const scoreW = 16
  const scoreX = ox + cW - scoreW - 3

  // — Col izquierda: firma —
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0)
  doc.text('Firma del trabajador:', iX, y + 5)
  // Línea de firma
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.line(iX, y + secH - 3, divX - 4, y + secH - 3)
  // Imagen de firma
  if (f.firma_base64) {
    try {
      const imgData = f.firma_base64.startsWith('data:')
        ? f.firma_base64
        : `data:image/png;base64,${f.firma_base64}`
      const fw = divX - iX - 5
      const fh = secH - 10
      doc.addImage(imgData, 'PNG', iX, y + 7, fw, fh)
    } catch { /* skip */ }
  }

  // — Col derecha: calificación —
  const calX = divX + 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0)
  doc.text('Calificaci\u00f3n',      calX, y + 5)
  doc.text('del capacitador', calX, y + 9.5)
  // Solo la caja del número, sin borde exterior
  doc.setLineWidth(0.4)
  doc.rect(scoreX, y + 1, scoreW, scoreW)
  const puntaje = (f as CapEvaluacionFields & { puntaje?: number }).puntaje
  if (puntaje != null) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(0)
    doc.text(puntaje.toFixed(1), scoreX + scoreW / 2, y + 1 + scoreW * 0.68, { align: 'center' })
  }
  y += secH + 3

  // ── NOTA PIE ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(50, 50, 50)
  doc.text(
    'La evaluaci\u00f3n se aprueba con un puntaje igual o superior a 7.5 puntos.',
    iX, y,
  )
}

// ─── export principal ────────────────────────────────────────────────────────

export async function generarEvaluacionPDF(
  evaluacion: AirtableRecord<CapEvaluacionFields>,
  plantilla:  AirtableRecord<CapPlantillaFields>,
): Promise<Buffer> {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const f    = evaluacion.fields
  const p    = plantilla.fields
  const logo = getLogoInfo()

  // Una sola copia a página completa (margen 10 mm a cada lado)
  drawCopy(doc, 10, 8, 190, f, p, logo)

  return Buffer.from(doc.output('arraybuffer'))
}
