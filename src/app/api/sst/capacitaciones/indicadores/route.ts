import { NextRequest, NextResponse } from 'next/server'
import { listarIndicadores } from '@/lib/sst/cap'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const records = await listarIndicadores()
  return NextResponse.json({ records })
}
