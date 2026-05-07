/**
 * @file route.ts
 * GET   /api/sst/capacitaciones/reportes/[id]  — detalle completo (incluye firmas)
 * PATCH /api/sst/capacitaciones/reportes/[id]  — guardar firma de capacitador o director
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { obtenerReporte, actualizarFirmaReporte } from '@/lib/sst/reportes'
import type { CapReporteFields } from '@/types/sst/reportes'

type Ctx = { params: Promise<{ id: string }> }

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'administrador'] as const

/** Devuelve el reporte con todos los campos, incluyendo firmas y encabezado parseado. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const record = await obtenerReporte(id)

  return NextResponse.json({
    ...record,
    fields: {
      ...record.fields,
      datos_encabezado_parsed: record.fields.datos_encabezado
        ? JSON.parse(record.fields.datos_encabezado)
        : {},
    },
  })
}

/**
 * Guarda la firma de capacitador o director.
 * Body puede traer:
 *   { firma_capacitador: string, nombre_firmante_cap: string }
 *   — ó —
 *   { firma_director: string,    nombre_firmante_dir: string }
 *
 * Recalcula el estado (pendiente / parcial / completo) automáticamente.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'coordinador_sst', 'jefe_area', 'gerencia', 'administrador')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const body = await request.json() as Partial<CapReporteFields>

  // Validar que la firma sea un data URL válido
  if (body.firma_capacitador && !body.firma_capacitador.startsWith('data:image/'))
    return NextResponse.json({ message: 'firma_capacitador debe ser un data URL de imagen' }, { status: 400 })
  if (body.firma_director && !body.firma_director.startsWith('data:image/'))
    return NextResponse.json({ message: 'firma_director debe ser un data URL de imagen' }, { status: 400 })

  // Leer estado actual para calcular nuevo estado correctamente
  const actual = await obtenerReporte(id)
  const camposActuales = actual.fields

  // Agregar timestamp de firma
  const ahora = new Date().toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const camposFirma: Partial<CapReporteFields> = { ...body }
  if (body.firma_capacitador) camposFirma.fecha_firma_cap = ahora
  if (body.firma_director)    camposFirma.fecha_firma_dir = ahora

  const record = await actualizarFirmaReporte(id, camposFirma, camposActuales)
  return NextResponse.json({ record })
}
