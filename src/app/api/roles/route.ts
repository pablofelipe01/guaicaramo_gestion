import { NextRequest, NextResponse } from 'next/server'
import { listarRoles } from '@/lib/usuarios'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  try {
    const records = await listarRoles()
    return NextResponse.json({ records })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/roles] Error al listar roles:', msg)
    return NextResponse.json(
      { success: false, message: `Error al obtener roles: ${msg}` },
      { status: 500 }
    )
  }
}
