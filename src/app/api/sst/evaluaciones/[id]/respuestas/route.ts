import { NextRequest, NextResponse } from 'next/server'
import { listarRespuestas, guardarRespuesta } from '@/lib/sst/eval'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { id } = await params
  const records = await listarRespuestas(id)
  return NextResponse.json({ records })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user
  const { id } = await params
  const body = await request.json()
  const record = await guardarRespuesta({
    ...body,
    'Evaluacion ID': id,
    'Respondido Por': usuario.name as string,
    'Fecha Respuesta': new Date().toISOString().split('T')[0],
  })
  return NextResponse.json({ record }, { status: 201 })
}
