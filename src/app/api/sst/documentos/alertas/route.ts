import { NextRequest, NextResponse } from 'next/server'
import { alertasRetencion } from '@/lib/sst/doc'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const alertas = await alertasRetencion()
    return NextResponse.json({ alertas })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener alertas' }, { status: 500 })
  }
}
