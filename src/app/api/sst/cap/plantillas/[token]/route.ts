/**
 * @file route.ts
 * Ruta PÚBLICA: GET /api/sst/cap/plantillas/[token]
 *
 * Devuelve los datos de la plantilla necesarios para renderizar el formulario
 * público de evaluación. NO requiere autenticación (acceso por QR).
 * Solo se exponen los campos que el trabajador necesita ver; las respuestas
 * correctas NO se incluyen en la respuesta para evitar trampas en cliente.
 */
import { NextRequest, NextResponse } from 'next/server'
import { obtenerPlantillaPorToken } from '@/lib/sst/cap-evaluaciones'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Validar formato UUID del token antes de consultar Airtable
  if (!token || !/^[0-9a-f-]{8,36}$/i.test(token))
    return NextResponse.json({ message: 'Token inválido' }, { status: 400 })

  try {
    const plantilla = await obtenerPlantillaPorToken(token)
    if (!plantilla)
      return NextResponse.json(
        { message: 'Plantilla no encontrada o inactiva' },
        { status: 404 }
      )

    // Devolver SOLO los campos que el trabajador necesita — omitir respuestas correctas
    const { fields: f } = plantilla
    const publica = {
      id: plantilla.id,
      nombre_capacitacion: f.nombre_capacitacion,
      pregunta_1_texto:    f.pregunta_1_texto,
      pregunta_2_texto:    f.pregunta_2_texto,
      pregunta_2_opciones: JSON.parse(f.pregunta_2_opciones ?? '[]') as string[],
      pregunta_3_texto:    f.pregunta_3_texto,
      pregunta_3_opciones: JSON.parse(f.pregunta_3_opciones ?? '[]') as string[],
      pregunta_4_texto:    f.pregunta_4_texto,
      pregunta_4_opciones: JSON.parse(f.pregunta_4_opciones ?? '[]') as string[],
      qr_token:            f.qr_token,
    }

    return NextResponse.json({ plantilla: publica })
  } catch (e) {
    console.error('[GET /api/sst/cap/plantillas/[token]]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
