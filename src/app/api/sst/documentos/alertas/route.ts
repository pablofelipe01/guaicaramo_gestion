import { NextRequest, NextResponse } from 'next/server'
import { alertasRetencion } from '@/lib/sst/doc'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {
    const alertas = await alertasRetencion()
    return NextResponse.json({ alertas })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener alertas' }, { status: 500 })
  }
}
