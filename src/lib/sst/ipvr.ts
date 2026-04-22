import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { IpvrRegistroFields } from '@/types/sst/ipvr'

const T_REGISTROS = 'sst_ipvr_registros'

function nivelIntervencion(nr: number): 'I' | 'II' | 'III' | 'IV' {
  if (nr >= 600) return 'I'
  if (nr >= 150) return 'II'
  if (nr >= 40) return 'III'
  return 'IV'
}

export async function listarRegistros(area?: string) {
  const formula = area ? `AND({Area}='${area}',{Estado}='activo')` : `{Estado}='activo'`
  return listRecords<IpvrRegistroFields>(T_REGISTROS, { filterByFormula: formula })
}

export async function crearRegistro(fields: Omit<IpvrRegistroFields, 'Creado En' | 'NP' | 'NR' | 'Nivel Intervencion'> & { ND: number; NE: number; NC: number }) {
  const NP = fields.ND * fields.NE
  const NR = NP * fields.NC
  const records = await createRecords<IpvrRegistroFields>(T_REGISTROS, [
    {
      fields: {
        ...fields,
        NP,
        NR,
        'Nivel Intervencion': nivelIntervencion(NR),
        Estado: 'activo',
        'Creado En': new Date().toISOString(),
      },
    },
  ])
  return records[0]
}

export async function actualizarRegistro(id: string, fields: Partial<IpvrRegistroFields>) {
  if (fields.ND !== undefined && fields.NE !== undefined && fields.NC !== undefined) {
    fields.NP = fields.ND * fields.NE
    fields.NR = fields.NP * fields.NC
    fields['Nivel Intervencion'] = nivelIntervencion(fields.NR)
  }
  return updateRecord<IpvrRegistroFields>(T_REGISTROS, id, fields)
}

export async function registrosNivelI() {
  return listRecords<IpvrRegistroFields>(T_REGISTROS, {
    filterByFormula: `AND({Nivel Intervencion}='I',{Estado}='activo')`,
  })
}
