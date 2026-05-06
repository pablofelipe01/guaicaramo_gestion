/**
 * @file route.ts
 * Ruta: GET /api/sst/capacitaciones
 *       POST /api/sst/capacitaciones
 *
 * Gestión del catálogo de actividades del plan anual de capacitaciones.
 * Requiere autenticación con uno de los roles SST definidos en SST_ROLES.
 */
import { NextRequest, NextResponse } from 'next/server'
import { listarActividades, crearActividad } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

/** Roles con acceso al módulo de capacitaciones. */
const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

/**
 * Lista las actividades del plan anual con filtros opcionales de query string.
 *
 * @param request - Query params: `categoria`, `estado`, `responsable`.
 * @returns `{ records }` con array de actividades, o `{ error }` si no autorizado.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const { searchParams } = request.nextUrl
  const filtros = {
    categoria:   searchParams.get('categoria')   ?? undefined,
    estado:      searchParams.get('estado')      ?? undefined,
    responsable: searchParams.get('responsable') ?? undefined,
  }
  const records = await listarActividades(filtros)
  return NextResponse.json({ records })
}

/**
 * Crea una nueva actividad en el plan anual.
 * Requiere `tema` y `categoria` en el body.
 *
 * @param request - Body JSON con los campos `CapActividadFields`.
 * @returns `{ record }` con status 201, o error de validación (400) / servidor (500).
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    if (!body.tema || !body.categoria)
      return NextResponse.json({ message: 'tema y categoria son requeridos' }, { status: 400 })

    const record = await crearActividad(body)
    return NextResponse.json({ record }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/sst/capacitaciones]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error interno del servidor' }, { status: 500 })
  }
}
