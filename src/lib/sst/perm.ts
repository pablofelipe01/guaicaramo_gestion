import 'server-only'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'
import type { PermTipoFields, PermPermisoFields, PermTrabajadorFields } from '@/types/sst/perm'

const T_TIPOS = 'sst_perm_tipos'
const T_PERMISOS = 'sst_perm_permisos'
const T_TRABAJADORES = 'sst_perm_trabajadores'

export async function listarTipos() {
  return listRecords<PermTipoFields>(T_TIPOS, { filterByFormula: `{Estado}='activo'` })
}

export async function listarPermisos(estado?: string) {
  const formula = estado ? `{Estado}='${estado}'` : undefined
  return listRecords<PermPermisoFields>(T_PERMISOS, { filterByFormula: formula, sort: [{ field: 'Fecha Inicio', direction: 'desc' }] })
}

export async function crearPermiso(fields: Omit<PermPermisoFields, 'Creado En'>) {
  const records = await createRecords<PermPermisoFields>(T_PERMISOS, [
    { fields: { ...fields, Estado: 'borrador', 'Creado En': new Date().toISOString() } },
  ])
  return records[0]
}

export async function actualizarPermiso(id: string, fields: Partial<PermPermisoFields>) {
  return updateRecord<PermPermisoFields>(T_PERMISOS, id, fields)
}

export async function listarTrabajadoresPermiso(permisoId: string) {
  return listRecords<PermTrabajadorFields>(T_TRABAJADORES, { filterByFormula: `{Permiso ID}='${permisoId}'` })
}

export async function agregarTrabajadorPermiso(fields: PermTrabajadorFields) {
  const records = await createRecords<PermTrabajadorFields>(T_TRABAJADORES, [{ fields }])
  return records[0]
}

export async function verificarPrerrequisitos(permisoId: string): Promise<{ habilitado: boolean; bloqueos: string[] }> {
  const { records: trabajadores } = await listarTrabajadoresPermiso(permisoId)
  const bloqueos: string[] = []
  for (const t of trabajadores) {
    if (!t.fields['EPPs Verificados']) bloqueos.push(`${t.fields['Trabajador Nombre']}: EPPs no verificados`)
    if (t.fields['Restricciones Medicas']) bloqueos.push(`${t.fields['Trabajador Nombre']}: tiene restricciones médicas`)
  }
  return { habilitado: bloqueos.length === 0, bloqueos }
}
