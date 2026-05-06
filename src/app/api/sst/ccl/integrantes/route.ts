import { NextRequest, NextResponse } from 'next/server'
import { crearIntegrante } from '@/lib/sst/ccl'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function POST(request: NextRequest) {
    const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  
  const body = await request.json()
  
  // Validar campos requeridos
  if (!body['Comite ID'] || !body['Nombre Completo'] || !body.Rol) {
    return NextResponse.json({ 
      message: 'Comite ID, Nombre Completo y Rol son requeridos' 
    }, { status: 400 })
  }
  
  // Validar que Rol sea válido
  const rolesValidos = ['presidente', 'secretario', 'rep_empleador', 'rep_trabajador', 'suplente']
  if (!rolesValidos.includes(body.Rol)) {
    return NextResponse.json({ 
      message: `Rol inválido. Válidos: ${rolesValidos.join(', ')}` 
    }, { status: 400 })
  }
  
  try {
    const record = await crearIntegrante({
      ...body,
      'Fecha Posesion': body['Fecha Posesion'] || new Date().toISOString().split('T')[0]
    })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear integrante'
    return NextResponse.json({ message }, { status: 500 })
  }
}
