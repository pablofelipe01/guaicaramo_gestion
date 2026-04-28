import 'server-only'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRecord, listRecords } from '@/lib/airtable-client'
import type { PermPermisoFields, PermTrabajadorFields } from '@/types/sst/perm'

const T_PERMISOS = 'sst_perm_permisos'
const T_TRABAJADORES = 'sst_perm_trabajadores'

function formatFecha(iso?: string): string {
  if (!iso) return 'No registrado'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLOR_ESTADO: Record<string, [number, number, number]> = {
  borrador: [180, 180, 180],
  pendiente_aprobacion: [255, 193, 7],
  aprobado: [40, 167, 69],
  rechazado: [220, 53, 69],
  en_ejecucion: [0, 123, 255],
  cerrado: [108, 117, 125],
  vencido: [255, 99, 71],
}

/**
 * Genera el PDF del Permiso de Trabajo para actividades de alto riesgo.
 */
export async function generarPermisoPDF(permisoId: string): Promise<Buffer> {
  const permiso = await getRecord<PermPermisoFields>(T_PERMISOS, permisoId)
  const p = permiso.fields

  const { records: trabajadoresRec } = await listRecords<PermTrabajadorFields>(
    T_TRABAJADORES,
    { filterByFormula: `{Permiso ID}='${permisoId}'` }
  )

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margen = 14

  // ─── ENCABEZADO ───────────────────────────────────────────────────────────
  doc.setFillColor(31, 78, 121)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('PERMISO DE TRABAJO — ACTIVIDADES DE ALTO RIESGO', pageW / 2, 10, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Guaicaramo SG-SST | Decreto 1072/2015 — Art. 2.2.4.6.10', pageW / 2, 17, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Referencia y estado
  const estadoColor = COLOR_ESTADO[p.Estado] ?? [128, 128, 128]
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Ref: ${permisoId}`, margen, 28)
  doc.setFillColor(...estadoColor)
  doc.roundedRect(pageW - margen - 40, 24, 40, 7, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(p.Estado.toUpperCase().replace(/_/g, ' '), pageW - margen - 20, 29, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  let y = 36

  // ─── SECCIÓN 1: DATOS DEL PERMISO ─────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('1. DATOS DEL PERMISO', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    body: [
      [
        { content: 'Área de trabajo', styles: { fontStyle: 'bold' } },
        p.Area,
        { content: 'Fecha inicio', styles: { fontStyle: 'bold' } },
        formatFecha(p['Fecha Inicio']),
        { content: 'Fecha fin', styles: { fontStyle: 'bold' } },
        formatFecha(p['Fecha Fin']),
      ],
      [
        { content: 'Solicitante', styles: { fontStyle: 'bold' } },
        p['Solicitante Nombre'] ?? 'No asignado',
        { content: 'Tipo de permiso', styles: { fontStyle: 'bold' } },
        p['Tipo Nombre'] ?? 'No especificado',
        { content: 'Contratista ID', styles: { fontStyle: 'bold' } },
        p['Contratista ID'] ?? 'Empleado directo',
      ],
    ],
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 34 },
      2: { cellWidth: 22 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 30 },
    },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ─── SECCIÓN 2: DESCRIPCIÓN DE LA TAREA ───────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('2. DESCRIPCIÓN DE LA TAREA', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    body: [[{ content: p['Tarea Descripcion'] ?? 'Sin descripción' }]],
    columnStyles: { 0: { cellWidth: pageW - margen * 2 } },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ─── SECCIÓN 3: TRABAJADORES HABILITADOS ──────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('3. TRABAJADORES HABILITADOS', margen + 2, y + 4.5)
  y += 8

  const trabRows = trabajadoresRec.length > 0
    ? trabajadoresRec.map(t => [
        t.fields['Trabajador Nombre'] ?? t.fields['Trabajador ID'],
        t.fields['EPPs Verificados'] ? '✓ Verificado' : '✗ Pendiente',
        t.fields['Competencias Verificadas'] ? '✓ Verificado' : '✗ Pendiente',
        t.fields['Restricciones Medicas'] ?? 'Sin restricciones',
        t.fields.Habilitado ? '✓ HABILITADO' : '✗ NO HABILITADO',
      ])
    : [['Sin trabajadores registrados', '', '', '', '']]

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    head: [['Nombre', 'EPPs', 'Competencias', 'Restricciones Médicas', 'Estado']],
    headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255] },
    body: trabRows,
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25 },
      2: { cellWidth: 28 },
      3: { cellWidth: 50 },
      4: { cellWidth: 28 },
    },
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ─── SECCIÓN 4: OBSERVACIONES ─────────────────────────────────────────────
  if (p.Observaciones) {
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(220, 230, 241)
    doc.rect(margen, y, pageW - margen * 2, 6, 'F')
    doc.text('4. OBSERVACIONES', margen + 2, y + 4.5)
    y += 8

    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      body: [[{ content: p.Observaciones }]],
      columnStyles: { 0: { cellWidth: pageW - margen * 2 } },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  }

  // ─── SECCIÓN 5: FIRMAS ────────────────────────────────────────────────────
  if (y > 235) { doc.addPage(); y = 20 }

  doc.setFont('helvetica', 'bold')
  doc.setFillColor(220, 230, 241)
  doc.rect(margen, y, pageW - margen * 2, 6, 'F')
  doc.text('5. FIRMAS DE APROBACIÓN', margen + 2, y + 4.5)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 8 },
    body: [
      [
        { content: 'Solicitante\n\n\n________________________', styles: { halign: 'center' } },
        { content: 'Coordinador SST\n\n\n________________________', styles: { halign: 'center' } },
        { content: 'Gerencia\n(si aplica)\n\n________________________', styles: { halign: 'center' } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: (pageW - margen * 2) / 3 },
      1: { cellWidth: (pageW - margen * 2) / 3 },
      2: { cellWidth: (pageW - margen * 2) / 3 },
    },
  })

  // Pie de página
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

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
