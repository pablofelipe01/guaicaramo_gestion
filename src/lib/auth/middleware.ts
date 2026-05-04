import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import type { TokenPayload } from '@/lib/token'

export type RolSST =
  | 'coordinador_sst'
  | 'jefe_area'
  | 'trabajador'
  | 'gerencia'
  | 'auditor'
  | 'contratista'
  | 'medico'
  | 'administrador'
  | 'superadmin'
  | 'operativo'

/**
 * Roles de infraestructura — solo superadmin puede acceder a Backup y config global.
 * Administrador gestiona usuarios y módulos SG-SST, pero NO infraestructura.
 */
const ROLES_INFRAESTRUCTURA: RolSST[] = ['superadmin']

/**
 * Roles que pueden administrar usuarios (crear, editar, cambiar estado y rol).
 */
export const ROLES_ADMIN_USUARIOS: RolSST[] = ['superadmin', 'administrador']

/**
 * Extrae y verifica el JWT del encabezado Authorization.
 * Retorna el payload o null si el token es inválido o está ausente.
 */
export async function getUsuarioAutenticado(
  request: NextRequest
): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader
  if (!token) return null
  return verifyToken(token)
}

/**
 * Verifica autenticación y autorización por rol.
 *
 * Retorna `{ user }` si el usuario tiene uno de los roles permitidos.
 * Retorna `{ error: NextResponse }` con código 401 o 403 en caso contrario.
 *
 * Uso en routes:
 * ```ts
 * const auth = await requireRole(request, 'coordinador_sst', 'gerencia')
 * if ('error' in auth) return auth.error
 * const { user } = auth
 * ```
 */
export async function requireRole(
  request: NextRequest,
  ...allowedRoles: RolSST[]
): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const user = await getUsuarioAutenticado(request)

  if (!user) {
    return {
      error: NextResponse.json({ message: 'No autorizado' }, { status: 401 }),
    }
  }

  const rolUsuario = (user.role ?? 'operativo') as RolSST

  // superadmin tiene acceso a absolutamente todo
  if (rolUsuario === 'superadmin') {
    return { user }
  }

  // administrador tiene acceso a todos los módulos SST pero NO a infraestructura
  // Si allowedRoles contiene solo roles de infraestructura (no incluye 'administrador'),
  // y el usuario es administrador, se le deniega el acceso
  if (rolUsuario === 'administrador') {
    const soloInfraestructura =
      allowedRoles.length > 0 &&
      allowedRoles.every((r) => ROLES_INFRAESTRUCTURA.includes(r))
    if (soloInfraestructura) {
      return {
        error: NextResponse.json(
          { message: 'Acceso restringido a infraestructura', actual: rolUsuario },
          { status: 403 }
        ),
      }
    }
    return { user }
  }

  if (!allowedRoles.includes(rolUsuario)) {
    return {
      error: NextResponse.json(
        {
          message: 'Acceso denegado',
          requerido: allowedRoles,
          actual: rolUsuario,
        },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Solo verifica que el usuario esté autenticado (cualquier rol).
 * Equivalente a los guards actuales de los endpoints.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const user = await getUsuarioAutenticado(request)
  if (!user) {
    return {
      error: NextResponse.json({ message: 'No autorizado' }, { status: 401 }),
    }
  }
  return { user }
}
