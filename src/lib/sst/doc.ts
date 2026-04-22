import 'server-only'
import {
  listRecords,
  getRecord,
  createRecords,
  updateRecord,
  type AirtableRecord,
} from '@/lib/airtable-client'
import type { DocDocumentoFields, DocTrdFields, ModuloOrigen } from '@/types/sst/doc'

const T_DOCS = 'sst_doc_documentos'
const T_TRD = 'sst_doc_trd'

export interface FiltrosDoc {
  modulo?: ModuloOrigen
  estado?: 'vigente' | 'borrador' | 'obsoleto'
  busqueda?: string
}

export async function listarDocumentos(filtros?: FiltrosDoc) {
  const condiciones: string[] = []
  if (filtros?.modulo) condiciones.push(`{Modulo Origen}="${filtros.modulo}"`)
  if (filtros?.estado) condiciones.push(`{Estado}="${filtros.estado}"`)
  if (filtros?.busqueda) condiciones.push(`SEARCH("${filtros.busqueda}",{Nombre})>0`)

  const formula =
    condiciones.length > 1
      ? `AND(${condiciones.join(',')})`
      : condiciones[0] ?? ''

  const { records } = await listRecords<DocDocumentoFields>(T_DOCS, {
    filterByFormula: formula || undefined,
    sort: [{ field: 'Fecha Carga', direction: 'desc' }],
  })
  return records
}

export async function obtenerDocumento(id: string): Promise<AirtableRecord<DocDocumentoFields>> {
  return getRecord<DocDocumentoFields>(T_DOCS, id)
}

export async function subirDocumento(
  fields: Omit<DocDocumentoFields, 'Fecha Carga'>,
  cargadoPor: string
): Promise<AirtableRecord<DocDocumentoFields>> {
  const [record] = await createRecords<DocDocumentoFields>(T_DOCS, [
    {
      fields: {
        ...fields,
        Estado: fields.Estado ?? 'vigente',
        Version: fields.Version ?? '1.0',
        'Fecha Carga': new Date().toISOString().split('T')[0],
        'Cargado Por': cargadoPor,
      },
    },
  ])
  return record
}

export async function actualizarDocumento(
  id: string,
  fields: Partial<DocDocumentoFields>
): Promise<AirtableRecord<DocDocumentoFields>> {
  return updateRecord<DocDocumentoFields>(T_DOCS, id, fields)
}

export async function listarTrd() {
  const { records } = await listRecords<DocTrdFields>(T_TRD, {
    sort: [{ field: 'Serie', direction: 'asc' }],
  })
  return records
}

export async function crearEntradaTrd(
  fields: DocTrdFields
): Promise<AirtableRecord<DocTrdFields>> {
  const [record] = await createRecords<DocTrdFields>(T_TRD, [{ fields }])
  return record
}
