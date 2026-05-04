export interface RolFields {
  'Nombre Rol': string
  Descripcion?: string
  Nivel?: number
  Activo?: boolean
  'Puede Leer'?: boolean
  'Puede Escribir'?: boolean
  'Puede Eliminar'?: boolean
  'Puede Administrar Usuarios'?: boolean
}

/**
 * Roles reconocidos por el sistema — deben coincidir con "Nombre Rol" en Airtable
 * (normalizado a minúsculas).
 */
export type RolSistema = 'superadmin' | 'administrador' | 'operativo'

/**
 * Devuelve el nivel de acceso de un rol.
 * Superadmin = 1 (máximo), Administrador = 2, Operativo = 3.
 */
export function nivelDeRol(rol: string): number {
  switch (rol.toLowerCase()) {
    case 'superadmin': return 1
    case 'administrador': return 2
    case 'operativo': return 3
    default: return 99
  }
}

/**
 * Verdadero si el rol puede administrar usuarios (crear, editar, cambiar estado).
 * Superadmin y Administrador sí; Operativo no.
 */
export function puedeAdministrarUsuarios(rol: string): boolean {
  const r = rol.toLowerCase()
  return r === 'superadmin' || r === 'administrador'
}

/**
 * Verdadero si el rol puede acceder a funciones de infraestructura
 * (Backup, configuración global). Solo Superadmin.
 */
export function puedeAccederInfraestructura(rol: string): boolean {
  return rol.toLowerCase() === 'superadmin'
}

interface AirtableSelect { id: string; name: string; color?: string }
interface AirtableLinked { id: string; name?: string }

export interface UsuarioFields {
  'Nombre Completo': string
  Email: string
  'Password Hash'?: string
  Estado?: AirtableSelect | string
  Rol?: AirtableLinked[] | string[]
  'Forzar Cambio Clave'?: boolean
  'Fecha Creacion'?: string
  Documento?: string
  Telefono?: string
  // computed helpers set by normalizarUsuario
  _estadoNombre?: string
  _rolNombre?: string
  _rolId?: string
}

export interface UsuarioNormalizado {
  id: string
  nombre: string
  email: string
  documento?: string
  telefono?: string
  estado: string
  rol: string
  rolId: string
  forzarCambioClave: boolean
  fechaCreacion?: string
}

export interface PermisosUsuario {
  leer: boolean
  escribir: boolean
  eliminar: boolean
}

export interface ModuloAcceso {
  modulo: string
  permisos: PermisosUsuario
}

const TOTAL: PermisosUsuario = { leer: true, escribir: true, eliminar: true }
const ESCRITURA: PermisosUsuario = { leer: true, escribir: true, eliminar: false }
const NINGUNO: PermisosUsuario = { leer: false, escribir: false, eliminar: false }

/** Módulos SG-SST operativos (PHVA) — excluye administración */
const MODULOS_OPERATIVOS = [
  'Evaluación Inicial', 'Plan de Trabajo Anual', 'Comité de Convivencia',
  'Capacitaciones', 'Presupuesto', 'Matriz Legal', 'Gestión del Cambio',
  'Conservación Documental', 'Contratistas', 'Evaluaciones Médicas',
  'Perfiles de Cargo', 'Seguimiento Casos Médicos', 'Investigación Incidentes',
  'Matriz IPVR', 'Inspecciones', 'EPPs y Dotación', 'Permisos de Trabajo',
  'Indicadores', 'Auditorías', 'Acciones Correctivas',
] as const

/** Todos los módulos incluyendo administración e infraestructura */
const TODOS_LOS_MODULOS = [
  ...MODULOS_OPERATIVOS,
  'Gestión de Usuarios',
  'Backup',
] as const

export type ModuloSistema = typeof TODOS_LOS_MODULOS[number]

function permisosPara(
  modulos: readonly string[],
  p: PermisosUsuario,
  overrides: Record<string, PermisosUsuario> = {}
): ModuloAcceso[] {
  return modulos.map((m) => ({ modulo: m, permisos: overrides[m] ?? p }))
}

/**
 * Permisos por rol — alineados con la tabla ROLES de Airtable:
 *
 * Superadmin  (Nivel 1): Acceso total al sistema. Infraestructura + todos los usuarios.
 * Administrador (Nivel 2): Todos los módulos SG-SST + gestión de usuarios operativos.
 *                          Sin acceso a Backup/infraestructura.
 * Operativo   (Nivel 3): Lectura, escritura y eliminación de registros operativos propios.
 *                          Sin gestión de usuarios ni backup.
 */
export const PERMISOS_POR_ROL: Record<string, ModuloAcceso[]> = {
  // Nivel 1: todo, incluido Backup e infraestructura
  superadmin: permisosPara(TODOS_LOS_MODULOS, TOTAL),

  // Nivel 2: todos los módulos SG-SST + administrar usuarios, SIN Backup
  administrador: permisosPara(TODOS_LOS_MODULOS, TOTAL, {
    Backup: NINGUNO,
  }),

  // Nivel 3: módulos operativos con lectura+escritura+eliminación, SIN admin
  operativo: permisosPara(TODOS_LOS_MODULOS, TOTAL, {
    'Gestión de Usuarios': NINGUNO,
    Backup: NINGUNO,
  }),
}

/**
 * Consulta si un rol tiene un permiso concreto sobre un módulo.
 * Uso: tienePermiso('operativo', 'Gestión de Usuarios', 'leer') → false
 */
export function tienePermiso(
  rol: string,
  modulo: string,
  accion: keyof PermisosUsuario
): boolean {
  const lista = PERMISOS_POR_ROL[rol.toLowerCase()] ?? []
  const entrada = lista.find((m) => m.modulo === modulo)
  return entrada?.permisos[accion] ?? false
}

/**
 * Devuelve todos los módulos a los que un rol tiene acceso de lectura.
 */
export function modulosVisibles(rol: string): string[] {
  const lista = PERMISOS_POR_ROL[rol.toLowerCase()] ?? []
  return lista.filter((m) => m.permisos.leer).map((m) => m.modulo)
}

// Re-export constante para uso externo
export { ESCRITURA as PERM_ESCRITURA, TOTAL as PERM_TOTAL, NINGUNO as PERM_NINGUNO }
