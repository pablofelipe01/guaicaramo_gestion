import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { IpvrRegistroFields } from '@/types/sst/ipvr'
import { crearAccion } from '@/lib/sst/ac'

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

/**
 * Si el registro IPVR tiene Nivel de Intervención I (NR ≥ 600),
 * crea automáticamente una acción correctiva de prioridad crítica.
 * Se llama después de crear o actualizar un registro IPVR.
 */
export async function crearAccionSiNivelI(
  registroId: string,
  registro: IpvrRegistroFields
): Promise<void> {
  if (registro['Nivel Intervencion'] !== 'I') return

  const en7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  await crearAccion({
    Titulo: `IPVR — Riesgo Nivel I: ${registro['Descripcion Peligro']?.slice(0, 60) ?? 'Sin descripción'}`,
    Tipo: 'correctiva',
    Origen: 'ipvr',
    'Origen ID': registroId,
    Descripcion: `RIESGO CRÍTICO (NR=${registro.NR}): ${registro['Descripcion Peligro']} — Área: ${registro.Area} — Proceso: ${registro['Proceso Actividad']}. Requiere intervención inmediata.`,
    Prioridad: 'critica',
    Estado: 'pendiente',
    'Fecha Limite': en7dias,
    'Responsable Nombre': registro.Area,
  })
}

