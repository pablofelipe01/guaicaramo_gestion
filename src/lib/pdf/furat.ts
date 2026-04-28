import 'server-only'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRecord, listRecords } from '@/lib/airtable-client'
import type { IncIncidenteFields, IncInvestigacionFields } from '@/types/sst/inc'

const T_INCIDENTES = 'sst_incidentes'
const T_INVESTIGACIONES = 'sst_inc_investigaciones'

function formatFecha(iso?: string): string {
  if (!iso) return 'No registrado'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    accidente_trabajo: 'Accidente de Trabajo',
    incidente: 'Incidente',
    enfermedad_laboral: 'Enfermedad Laboral',
  }
  return map[tipo] ?? tipo
}

/**
 * Genera el PDF del Formulario Único de Registro de Accidentes de Trabajo (FURAT).
 * Incluye datos del incidente + datos de la investigación si existe.
 */
export async function generarFURATpdf(incidenteId: string): Promise<Buffer> {
  // 1. Obtener datos
  const incidente = await getRecord<IncIncidenteFields>(T_INCIDENTES, incidenteId)
  const f = incidente.fields

  const { records: investigaciones } = await listRecords<IncInvestigacionFields>(
    T_INVESTIGACIONES,
    { filterByFormula: `{Incidente ID}='${incidenteId}'`, maxRecords: 1 }
  )
  const inv = investigaciones[0]?.fields ?? null

  // 2. Crear documento
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margen = 14

  // ─── ENCABEZADO ───────────────────────────────────────────────────────────
  doc.setFillColor(31, 78, 121)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('FORMULARIO ÚNICO DE REGISTRO DE ACCIDENTES DE TRABAJO', pageW / 2, 10, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('FURAT — Decreto 1530/1996 y Resolución 0312/2019', pageW / 2, 17, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Número y estado
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Referencia: ${incidenteId}`, margen, 28)
  doc.text(`Tipo: ${tipoLabel(f.Tipo)}`, pageW / 2, 28, { align: 'center' })
  doc.text(`Estado: ${(f.Estado ?? '').toUpperCase()}`, pageW - margen, 28, { align: 'right' })

  let y = 34

  // ─── SECCIÓN 1: DATOS DEL TRABAJADOR ──────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('1. DATOS DEL TRABAJADOR', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 245, 250], textColor: [0, 0, 0], fontStyle: 'bold' },
    body: [
      [
        { content: 'Nombre completo', styles: { fontStyle: 'bold' } },
        f['Trabajador Nombre'] ?? 'No registrado',
        { content: 'Área de trabajo', styles: { fontStyle: 'bold' } },
        f.Area ?? 'No registrado',
      ],
    ],
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 65 }, 2: { cellWidth: 35 }, 3: { cellWidth: 45 } },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ─── SECCIÓN 2: DATOS DEL ACCIDENTE ───────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('2. DATOS DEL ACCIDENTE / INCIDENTE', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    body: [
      [
        { content: 'Fecha de ocurrencia', styles: { fontStyle: 'bold' } },
        formatFecha(f['Fecha Ocurrencia']),
        { content: 'Hora', styles: { fontStyle: 'bold' } },
        f['Hora Ocurrencia'] ?? 'No registrada',
        { content: 'Tipo de evento', styles: { fontStyle: 'bold' } },
        tipoLabel(f.Tipo),
      ],
      [
        { content: 'Parte del cuerpo afectada', styles: { fontStyle: 'bold' } },
        { content: f['Parte Cuerpo Afectada'] ?? 'No especificado', colSpan: 3 },
        { content: 'Días de incapacidad', styles: { fontStyle: 'bold' } },
        f['Dias Perdidos'] != null ? String(f['Dias Perdidos']) : '0',
      ],
    ],
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 30 },
      2: { cellWidth: 18 },
      3: { cellWidth: 25 },
      4: { cellWidth: 40 },
      5: { cellWidth: 25 },
    },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ─── SECCIÓN 3: DESCRIPCIÓN DEL EVENTO ────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('3. DESCRIPCIÓN DEL EVENTO', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [
      [{ content: f.Descripcion ?? 'Sin descripción registrada' }],
    ],
    columnStyles: { 0: { cellWidth: pageW - margen * 2 } },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ─── SECCIÓN 4: INVESTIGACIÓN (si existe) ─────────────────────────────────
  if (inv) {
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(220, 230, 241)
    doc.rect(margen, y, pageW - margen * 2, 6, 'F')
    doc.text('4. INVESTIGACIÓN DEL ACCIDENTE', margen + 2, y + 4.5)
    y += 8

    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      body: [
        [
          { content: 'Metodología', styles: { fontStyle: 'bold' } },
          inv.Metodologia?.replace(/_/g, ' ').toUpperCase() ?? 'No definida',
          { content: 'Investigador', styles: { fontStyle: 'bold' } },
          inv['Investigador Nombre'] ?? 'No asignado',
          { content: 'Fecha cierre', styles: { fontStyle: 'bold' } },
          formatFecha(inv['Fecha Cierre']),
        ],
        [
          { content: 'Causas inmediatas', styles: { fontStyle: 'bold' } },
          { content: inv['Causas Inmediatas'] ?? 'No registrado', colSpan: 5 },
        ],
        [
          { content: 'Causas básicas', styles: { fontStyle: 'bold' } },
          { content: inv['Causas Basicas'] ?? 'No registrado', colSpan: 5 },
        ],
        [
          { content: 'Conclusiones', styles: { fontStyle: 'bold' } },
          { content: inv.Conclusiones ?? 'Sin conclusiones', colSpan: 5 },
        ],
      ],
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22 },
        5: { cellWidth: 30 },
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  }

  // ─── SECCIÓN 5: FIRMAS ────────────────────────────────────────────────────
  // Verificar si hay espacio suficiente, si no, nueva página
  if (y > 240) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('5. FIRMAS', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 8 },
    body: [
      [
        { content: 'Firma del Trabajador\n\n\n________________________', styles: { halign: 'center' } },
        { content: 'Firma del Jefe Inmediato\n\n\n________________________', styles: { halign: 'center' } },
        { content: 'Coordinador SST\n\n\n________________________', styles: { halign: 'center' } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: (pageW - margen * 2) / 3 },
      1: { cellWidth: (pageW - margen * 2) / 3 },
      2: { cellWidth: (pageW - margen * 2) / 3 },
    },
  })

  // ─── PIE DE PÁGINA ─────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(130, 130, 130)
    doc.text(
      `Generado: ${new Date().toLocaleString('es-CO')} | Guaicaramo SG-SST | Página ${i} de ${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    )
    doc.setTextColor(0, 0, 0)
  }

  // 3. Retornar como Buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
