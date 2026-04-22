import { NextRequest, NextResponse } from 'next/server'
import { listarPerfiles, crearPerfil } from '@/lib/sst/cargo'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const soloActivos = request.nextUrl.searchParams.get('todos') !== 'true'
    const perfiles = await listarPerfiles(soloActivos)
    return NextResponse.json({ records: perfiles })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al obtener perfiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const usuario = token ? await verifyToken(token) : null
    if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { 'Nombre Cargo': nombre, Codigo, Area, 'Nivel Riesgo ARL': nivel, Descripcion } = body

    if (!nombre || !Codigo || !Area || !nivel) {
      return NextResponse.json({ message: 'Campos requeridos: Nombre Cargo, Codigo, Area, Nivel Riesgo ARL' }, { status: 400 })
    }

    const perfil = await crearPerfil(
      { 'Nombre Cargo': nombre, Codigo, Area, 'Nivel Riesgo ARL': nivel, Descripcion, Activo: true },
      usuario.name as string
    )
    return NextResponse.json({ record: perfil }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error al crear perfil' }, { status: 500 })
  }
}
