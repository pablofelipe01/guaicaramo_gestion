import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { EppCatalogoFields, EppInventarioFields, EppEntregaFields } from '@/types/sst/epp'
import type { AirtableRecord } from '@/lib/airtable-client'

const T_CATALOGO = 'sst_epp_catalogo'
const T_INVENTARIO = 'sst_epp_inventario'
const T_ENTREGAS = 'sst_epp_entregas'

export async function listarCatalogo() {
  return listRecords<EppCatalogoFields>(T_CATALOGO, { filterByFormula: `{Estado}='activo'` })
}

export async function crearCatalogo(fields: EppCatalogoFields) {
  const records = await createRecords<EppCatalogoFields>(T_CATALOGO, [{ fields }])
  return records[0]
}

export async function listarInventario(catalogoId?: string) {
  const formula = catalogoId ? `{Catalogo ID}='${catalogoId}'` : undefined
  return listRecords<EppInventarioFields>(T_INVENTARIO, { filterByFormula: formula })
}

export async function actualizarInventario(id: string, fields: Partial<EppInventarioFields>) {
  return updateRecord<EppInventarioFields>(T_INVENTARIO, id, { ...fields, 'Fecha Actualizacion': new Date().toISOString().split('T')[0] })
}

export async function listarEntregas(trabajadorId?: string) {
  const formula = trabajadorId ? `{Trabajador ID}='${trabajadorId}'` : undefined
  return listRecords<EppEntregaFields>(T_ENTREGAS, { filterByFormula: formula, sort: [{ field: 'Fecha Entrega', direction: 'desc' }] })
}

export async function registrarEntrega(fields: Omit<EppEntregaFields, 'Creado En'>) {
  const records = await createRecords<EppEntregaFields>(T_ENTREGAS, [
    {
      fields: {
        ...fields,
        'Creado En': new Date().toISOString(),
      },
    },
  ])
  return records[0]
}

export async function alertasVencimiento(): Promise<{ mensaje: string; entrega: AirtableRecord<EppEntregaFields> }[]> {
  const hoy = new Date()
  const limite = new Date(hoy)
  limite.setDate(hoy.getDate() + 15)
  const { records } = await listRecords<EppEntregaFields>(T_ENTREGAS, {
    filterByFormula: `AND({Fecha Vencimiento}!='', IS_BEFORE({Fecha Vencimiento}, '${limite.toISOString().split('T')[0]}'))`,
  })
  return records.map(r => ({
    mensaje: `EPP "${r.fields['Catalogo Nombre']}" de ${r.fields['Trabajador Nombre']} vence el ${r.fields['Fecha Vencimiento']}`,
    entrega: r,
  }))
}
