import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { cerrarInvestigacionConAcciones } from '@/lib/sst/inc'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/sst/incidentes/[id]/investigaciones/cerrar
 * Cierra la investigación y activa automáticamente:
 * - Acciones correctivas por causas básicas/inmediatas
 * - Caso médico si hay días de incapacidad
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'coordinador_sst', 'administrador')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  try {
    await cerrarInvestigacionConAcciones(id)
    return NextResponse.json({
      message: 'Investigación cerrada. Acciones correctivas y casos médicos generados automáticamente.',
    })
  } catch (error) {
    console.error('Error cerrando investigación:', error)
    return NextResponse.json(
      { message: 'Error cerrando la investigación' },
      { status: 500 }
    )
  }
}
