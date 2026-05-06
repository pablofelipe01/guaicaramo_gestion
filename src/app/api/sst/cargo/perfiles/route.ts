import { NextRequest, NextResponse } from 'next/server'
import { listarPerfiles, crearPerfil } from '@/lib/sst/cargo'
import { requireRole } from '@/lib/auth/middleware'

  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  try {

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
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const usuario = auth.user

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
