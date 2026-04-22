import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { CasoCasoFields, CasoSeguimientoFields, CasoCalificacionFields } from '@/types/sst/caso'

const T_CASOS = 'sst_caso_casos'
const T_SEGUIMIENTOS = 'sst_caso_seguimientos'
const T_CALIFICACIONES = 'sst_caso_calificaciones'

export async function listarCasos(estado?: string) {
  const formula = estado ? `{Estado}='${estado}'` : undefined
  return listRecords<CasoCasoFields>(T_CASOS, { filterByFormula: formula, sort: [{ field: 'Fecha Apertura', direction: 'desc' }] })
}

export async function crearCaso(fields: Omit<CasoCasoFields, 'Creado En'>) {
  const records = await createRecords<CasoCasoFields>(T_CASOS, [
    {
      fields: {
        ...fields,
        Estado: 'activo',
        'Fecha Apertura': fields['Fecha Apertura'] ?? new Date().toISOString().split('T')[0],
        'Creado En': new Date().toISOString(),
      },
    },
  ])
  return records[0]
}

export async function actualizarCaso(id: string, fields: Partial<CasoCasoFields>) {
  return updateRecord<CasoCasoFields>(T_CASOS, id, fields)
}

export async function listarSeguimientos(casoId: string) {
  return listRecords<CasoSeguimientoFields>(T_SEGUIMIENTOS, {
    filterByFormula: `{Caso ID}='${casoId}'`,
    sort: [{ field: 'Fecha', direction: 'desc' }],
  })
}

export async function crearSeguimiento(fields: Omit<CasoSeguimientoFields, 'Creado En'>) {
  const records = await createRecords<CasoSeguimientoFields>(T_SEGUIMIENTOS, [
    {
      fields: {
        ...fields,
        'Creado En': new Date().toISOString(),
      },
    },
  ])
  return records[0]
}

export async function listarCalificaciones(casoId: string) {
  return listRecords<CasoCalificacionFields>(T_CALIFICACIONES, { filterByFormula: `{Caso ID}='${casoId}'` })
}

export async function crearCalificacion(fields: Omit<CasoCalificacionFields, 'Creado En'>) {
  const records = await createRecords<CasoCalificacionFields>(T_CALIFICACIONES, [
    {
      fields: {
        ...fields,
        'Creado En': new Date().toISOString(),
      },
    },
  ])
  return records[0]
}
