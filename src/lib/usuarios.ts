import 'server-only'
import bcrypt from 'bcrypt'
import { listRecords, getRecord, createRecords, updateRecord, deleteRecord } from '@/lib/airtable-client'
import type { UsuarioFields, RolFields, UsuarioNormalizado } from '@/types/usuarios'

const T_USUARIOS = process.env.AIRTABLE_TABLE_USERS ?? 'Usuarios'
const T_ROLES    = 'Roles'

interface AirtableSelect { id: string; name: string; color?: string }
interface AirtableLinked { id: string; name?: string }

function normalizarUsuario(record: { id: string; fields: UsuarioFields; createdTime: string }): UsuarioNormalizado {
  const estado = record.fields.Estado
  const estadoNombre = typeof estado === 'object' && estado !== null
    ? (estado as AirtableSelect).name
    : (estado as string | undefined) ?? 'Activo'

  const rol = record.fields.Rol
  let rolNombre = ''
  let rolId = ''
  if (Array.isArray(rol) && rol.length > 0) {
    const first = rol[0]
    if (typeof first === 'object' && first !== null) {
      rolNombre = (first as AirtableLinked).name ?? ''
      rolId = (first as AirtableLinked).id ?? ''
    } else {
      rolId = first as string
    }
  }

  return {
    id: record.id,
    nombre: record.fields['Nombre Completo'],
    email: record.fields.Email,
    estado: estadoNombre,
    rol: rolNombre,
    rolId,
    forzarCambioClave: record.fields['Forzar Cambio Clave'] ?? false,
    fechaCreacion: record.createdTime,
  }
}

export async function listarUsuarios(): Promise<UsuarioNormalizado[]> {
  const { records } = await listRecords<UsuarioFields>(T_USUARIOS, {
    sort: [{ field: 'Nombre Completo', direction: 'asc' }],
  })
  return records.map(normalizarUsuario)
}

export async function obtenerUsuario(id: string): Promise<UsuarioNormalizado> {
  const record = await getRecord<UsuarioFields>(T_USUARIOS, id)
  return normalizarUsuario(record)
}

export async function crearUsuario(data: {
  nombre: string
  email: string
  password: string
  rolId?: string
}) {
  const hash = await bcrypt.hash(data.password, 12)
  const fields: Partial<UsuarioFields> = {
    'Nombre Completo': data.nombre,
    Email: data.email,
    'Password Hash': hash,
    'Forzar Cambio Clave': true,
    'Fecha Creacion': new Date().toISOString(),
  }
  if (data.rolId) {
    fields.Rol = [data.rolId]
  }
  const [record] = await createRecords<UsuarioFields>(T_USUARIOS, [{ fields }])
  return normalizarUsuario(record)
}

export async function actualizarUsuario(id: string, data: {
  nombre?: string
  rolId?: string
}) {
  const fields: Partial<UsuarioFields> = {}
  if (data.nombre) fields['Nombre Completo'] = data.nombre
  if (data.rolId !== undefined) fields.Rol = data.rolId ? [data.rolId] : []
  const record = await updateRecord<UsuarioFields>(T_USUARIOS, id, fields)
  return normalizarUsuario(record)
}

export async function cambiarEstado(id: string, activo: boolean): Promise<UsuarioNormalizado> {
  const record = await updateRecord<UsuarioFields>(T_USUARIOS, id, {
    Estado: activo ? 'Activo' : 'Inactivo',
  } as Partial<UsuarioFields>)
  return normalizarUsuario(record)
}

export async function resetearPassword(id: string, nuevaPassword: string): Promise<void> {
  const hash = await bcrypt.hash(nuevaPassword, 12)
  await updateRecord<UsuarioFields>(T_USUARIOS, id, {
    'Password Hash': hash,
    'Forzar Cambio Clave': true,
  })
}

export async function eliminarUsuario(id: string): Promise<void> {
  await deleteRecord(T_USUARIOS, id)
}

export async function listarRoles() {
  const { records } = await listRecords<RolFields>(T_ROLES, {
    sort: [{ field: 'Nombre', direction: 'asc' }],
  })
  return records
}
