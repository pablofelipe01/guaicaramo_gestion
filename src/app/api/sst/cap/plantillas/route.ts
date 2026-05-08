/**
 * @file route.ts
 * Ruta: GET /api/sst/cap/plantillas   → Listar plantillas (admin)
 *       POST /api/sst/cap/plantillas  → Crear plantilla con preguntas
 */
import { NextRequest, NextResponse } from 'next/server'
import { listarPlantillas, crearPlantilla } from '@/lib/sst/cap-evaluaciones'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'gerencia', 'administrador'] as const

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  const soloActivas = request.nextUrl.searchParams.get('activas') === 'true'
  const records = await listarPlantillas(soloActivas)
  return NextResponse.json({ records })
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    const requeridos = [
      'nombre_capacitacion',
      'pregunta_1_texto',
      'pregunta_2_texto', 'pregunta_2_opciones', 'pregunta_2_correcta',
      'pregunta_3_texto', 'pregunta_3_opciones', 'pregunta_3_correcta',
      'pregunta_4_texto', 'pregunta_4_opciones', 'pregunta_4_correcta',
    ]
    const faltantes = requeridos.filter(k => !body[k])
    if (faltantes.length > 0)
      return NextResponse.json(
        { message: `Campos requeridos faltantes: ${faltantes.join(', ')}` },
        { status: 400 }
      )

    // Validar que las opciones sean JSON válido
    for (const campo of ['pregunta_2_opciones', 'pregunta_3_opciones', 'pregunta_4_opciones']) {
      try { JSON.parse(body[campo]) } catch {
        return NextResponse.json({ message: `${campo} debe ser un JSON array válido` }, { status: 400 })
      }
    }

    const record = await crearPlantilla(body)
    return NextResponse.json({ record }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/sst/cap/plantillas]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
