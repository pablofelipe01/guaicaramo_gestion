'use client'

import { useAuth } from '@/hooks/useAuth'
import {
  tienePermiso,
  modulosVisibles,
  puedeAdministrarUsuarios,
  puedeAccederInfraestructura,
  type PermisosUsuario,
} from '@/types/usuarios'

/**
 * Hook para verificar permisos del usuario autenticado.
 *
 * Fuente de verdad: tabla ROLES en Airtable (sincronizada en PERMISOS_POR_ROL).
 *
 * - Superadmin  (Nivel 1): acceso total + infraestructura + todos los usuarios.
 * - Administrador (Nivel 2): módulos SG-SST + gestión de usuarios. Sin Backup.
 * - Operativo   (Nivel 3): módulos operativos SG-SST. Sin admin de usuarios ni Backup.
 */
export function usePermissions() {
  const { user } = useAuth()
  const rol = (user?.role ?? 'operativo').toLowerCase()

  return {
    /** Rol normalizado del usuario autenticado. */
    rol,

    /**
     * Verdadero si el usuario tiene el permiso indicado en el módulo dado.
     * @example puede('Backup', 'leer') → false para 'administrador'
     */
    puede(modulo: string, accion: keyof PermisosUsuario): boolean {
      return tienePermiso(rol, modulo, accion)
    },

    /** Lista de módulos que el usuario puede ver (al menos permisos de lectura). */
    modulosVisibles(): string[] {
      return modulosVisibles(rol)
    },

    /** Verdadero si puede gestionar usuarios (crear, editar, cambiar estado). */
    adminUsuarios: puedeAdministrarUsuarios(rol),

    /** Verdadero si puede acceder a Backup e infraestructura. Solo superadmin. */
    infraestructura: puedeAccederInfraestructura(rol),

    /** Verdadero si es superadmin. */
    esSuperadmin: rol === 'superadmin',

    /** Verdadero si es administrador o superadmin. */
    esAdmin: rol === 'superadmin' || rol === 'administrador',
  }
}
