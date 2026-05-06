import { NextRequest, NextResponse } from 'next/server'
import { obtenerComiteActivo, listarIntegrantes } from '@/lib/sst/ccl'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  try {
      const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

    
    const comite = await obtenerComiteActivo()
    if (!comite) return NextResponse.json({ comite: null, integrantes: [] })
    
    const integrantes = await listarIntegrantes(comite.id)
    return NextResponse.json({ comite, integrantes })
  } catch (error) {
    console.error('Error en GET /api/sst/ccl/comite/activo:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
