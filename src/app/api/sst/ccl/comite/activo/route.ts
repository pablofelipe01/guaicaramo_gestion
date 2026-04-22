import { NextRequest, NextResponse } from 'next/server'
import { obtenerComiteActivo, listarIntegrantes } from '@/lib/sst/ccl'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const verified = await verifyToken(token)
    if (!verified) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    
    const comite = await obtenerComiteActivo()
    if (!comite) return NextResponse.json({ comite: null, integrantes: [] })
    
    const integrantes = await listarIntegrantes(comite.id)
    return NextResponse.json({ comite, integrantes })
  } catch (error) {
    console.error('Error en GET /api/sst/ccl/comite/activo:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}
