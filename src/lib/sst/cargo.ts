import 'server-only'
import {
  listRecords,
  getRecord,
  createRecords,
  updateRecord,
  type AirtableRecord,
} from '@/lib/airtable-client'
import type {
  CargoPerfilFields,
  CargoPeligroFields,
  CargoEppFields,
  CargoExamenFields,
} from '@/types/sst/cargo'

const T_PERFILES = 'sst_cargo_perfiles'
const T_PELIGROS = 'sst_cargo_peligros'
const T_EPPS = 'sst_cargo_epps'
const T_EXAMENES = 'sst_cargo_examenes'

export async function listarPerfiles(soloActivos = true) {
  const filter = soloActivos ? 'Activo=1' : ''
  const { records } = await listRecords<CargoPerfilFields>(T_PERFILES, {
    filterByFormula: filter || undefined,
    sort: [{ field: 'Nombre Cargo', direction: 'asc' }],
  })
  return records
}

export async function obtenerPerfil(id: string): Promise<AirtableRecord<CargoPerfilFields>> {
  return getRecord<CargoPerfilFields>(T_PERFILES, id)
}

export async function crearPerfil(
  fields: Omit<CargoPerfilFields, 'Fecha Creacion'>,
  creadoPor: string
): Promise<AirtableRecord<CargoPerfilFields>> {
  const [record] = await createRecords<CargoPerfilFields>(T_PERFILES, [
    {
      fields: {
        ...fields,
        Activo: true,
        'Fecha Creacion': new Date().toISOString().split('T')[0],
        'Creado Por': creadoPor,
      },
    },
  ])
  return record
}

export async function actualizarPerfil(
  id: string,
  fields: Partial<CargoPerfilFields>
): Promise<AirtableRecord<CargoPerfilFields>> {
  return updateRecord<CargoPerfilFields>(T_PERFILES, id, fields)
}

export async function listarPeligrosDeCargo(cargoId: string) {
  const { records } = await listRecords<CargoPeligroFields>(T_PELIGROS, {
    filterByFormula: `{Cargo ID}="${cargoId}"`,
  })
  return records
}

export async function crearPeligro(
  fields: CargoPeligroFields
): Promise<AirtableRecord<CargoPeligroFields>> {
  const [record] = await createRecords<CargoPeligroFields>(T_PELIGROS, [{ fields }])
  return record
}

export async function listarEppsDeCargo(cargoId: string) {
  const { records } = await listRecords<CargoEppFields>(T_EPPS, {
    filterByFormula: `{Cargo ID}="${cargoId}"`,
  })
  return records
}

export async function crearEpp(
  fields: CargoEppFields
): Promise<AirtableRecord<CargoEppFields>> {
  const [record] = await createRecords<CargoEppFields>(T_EPPS, [{ fields }])
  return record
}

export async function listarExamenesDeCargo(cargoId: string) {
  const { records } = await listRecords<CargoExamenFields>(T_EXAMENES, {
    filterByFormula: `{Cargo ID}="${cargoId}"`,
  })
  return records
}

export async function crearExamen(
  fields: CargoExamenFields
): Promise<AirtableRecord<CargoExamenFields>> {
  const [record] = await createRecords<CargoExamenFields>(T_EXAMENES, [{ fields }])
  return record
}
