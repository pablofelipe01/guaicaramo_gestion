import { NextRequest, NextResponse } from 'next/server'
import { calcularIndicadoresTrimestre, actualizarIndicador, obtenerIndicadorPorTrimestre, TRIMESTRES_CAP } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { trimestre, analisis, ...resto } = body

  if (!trimestre || !(TRIMESTRES_CAP as readonly string[]).includes(trimestre))
    return NextResponse.json({ message: `trimestre inválido. Opciones: ${TRIMESTRES_CAP.join(', ')}` }, { status: 400 })

  // Si viene analisis o campos manuales, hacer upsert directo sin recalcular
  if (analisis !== undefined || Object.keys(resto).length > 0) {
    const existing = await obtenerIndicadorPorTrimestre(trimestre)
    if (existing) {
      const record = await actualizarIndicador(existing.id, { analisis, ...resto })
      return NextResponse.json({ record })
    }
  }

  const record = await calcularIndicadoresTrimestre(trimestre)
  if (analisis !== undefined) {
    const updated = await actualizarIndicador(record.id, { analisis })
    return NextResponse.json({ record: updated })
  }
  return NextResponse.json({ record })
}
