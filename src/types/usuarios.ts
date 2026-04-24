export interface RolFields {
  Nombre: string
  Descripcion?: string
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
  // computed helpers set by normalizarUsuario
  _estadoNombre?: string
  _rolNombre?: string
  _rolId?: string
}

export interface UsuarioNormalizado {
  id: string
  nombre: string
  email: string
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
const LECTURA: PermisosUsuario = { leer: true, escribir: false, eliminar: false }
const ESCRITURA: PermisosUsuario = { leer: true, escribir: true, eliminar: false }
const NINGUNO: PermisosUsuario = { leer: false, escribir: false, eliminar: false }

const MODULOS = [
  'Evaluación Inicial', 'Plan de Trabajo Anual', 'Comité de Convivencia',
  'Capacitaciones', 'Presupuesto', 'Matriz Legal', 'Gestión del Cambio',
  'Conservación Documental', 'Contratistas', 'Evaluaciones Médicas',
  'Perfiles de Cargo', 'Seguimiento Casos Médicos', 'Investigación Incidentes',
  'Matriz IPVR', 'Inspecciones', 'EPPs y Dotación', 'Permisos de Trabajo',
  'Indicadores', 'Auditorías', 'Acciones Correctivas', 'Gestión de Usuarios',
]

function permisosPara(p: PermisosUsuario): ModuloAcceso[] {
  return MODULOS.map((m) => ({ modulo: m, permisos: p }))
}

function permisosPersonalizados(mapa: Record<string, PermisosUsuario>): ModuloAcceso[] {
  return MODULOS.map((m) => ({ modulo: m, permisos: mapa[m] ?? LECTURA }))
}

export const PERMISOS_POR_ROL: Record<string, ModuloAcceso[]> = {
  coordinador_sst: permisosPara(TOTAL),
  gerencia: permisosPersonalizados({
    Indicadores: LECTURA,
    Auditorías: LECTURA,
    'Acciones Correctivas': ESCRITURA,
    'Plan de Trabajo Anual': LECTURA,
    Presupuesto: LECTURA,
    'Permisos de Trabajo': ESCRITURA,
    'Gestión de Usuarios': NINGUNO,
  }),
  jefe_area: permisosPersonalizados({
    Inspecciones: ESCRITURA,
    'Investigación Incidentes': ESCRITURA,
    Capacitaciones: LECTURA,
    'EPPs y Dotación': LECTURA,
    'Permisos de Trabajo': ESCRITURA,
    'Evaluaciones Médicas': LECTURA,
    'Perfiles de Cargo': LECTURA,
    Indicadores: LECTURA,
    'Gestión de Usuarios': NINGUNO,
  }),
  trabajador: permisosPersonalizados({
    'Evaluaciones Médicas': LECTURA,
    'EPPs y Dotación': LECTURA,
    Capacitaciones: LECTURA,
    'Gestión de Usuarios': NINGUNO,
  }),
  auditor: permisosPersonalizados({
    ...Object.fromEntries(MODULOS.map((m) => [m, LECTURA])),
    Auditorías: ESCRITURA,
    'Gestión de Usuarios': NINGUNO,
  }),
  medico_ocupacional: permisosPersonalizados({
    'Evaluaciones Médicas': TOTAL,
    'Seguimiento Casos Médicos': TOTAL,
    'Perfiles de Cargo': LECTURA,
    'Gestión de Usuarios': NINGUNO,
  }),
  contratista: permisosPersonalizados({
    'Conservación Documental': ESCRITURA,
    'Gestión de Usuarios': NINGUNO,
  }),
}
