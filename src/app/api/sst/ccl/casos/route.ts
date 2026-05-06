import { NextRequest, NextResponse } from 'next/server'
import { listarCasos, crearCaso } from '@/lib/sst/ccl'
import { requireRole } from '@/lib/auth/middleware'

// Casos de convivencia son confidenciales — solo integrantes del comité y coordinador
const ROLES_CCL = ['coordinador_sst', 'administrador'] as const

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...ROLES_CCL)
  if ('error' in auth) return auth.error
  const comiteId = request.nextUrl.searchParams.get('comiteId') ?? undefined
  return NextResponse.json(await listarCasos(comiteId))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...ROLES_CCL)
  if ('error' in auth) return auth.error
  const { user } = auth
  const body = await request.json()
  return NextResponse.json({
    record: await crearCaso({
      ...body,
      Estado: 'abierto',
      Confidencial: true,
      'Fecha Apertura': new Date().toISOString().split('T')[0],
      'Registrado Por': user.name,
    }),
  }, { status: 201 })
}
