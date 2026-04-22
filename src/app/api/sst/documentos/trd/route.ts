import { NextRequest, NextResponse } from 'next/server'
import { listarTrd, crearEntradaTrd } from '@/lib/sst/doc'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const trd = await listarTrd()
    return NextResponse.json({ records: trd })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener TRD' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const entrada = await crearEntradaTrd(body)
    return NextResponse.json({ record: entrada }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear entrada TRD' }, { status: 500 })
  }
}
