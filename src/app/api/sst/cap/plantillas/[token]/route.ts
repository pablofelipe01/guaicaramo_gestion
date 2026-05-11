/**
 * @file route.ts
 * Ruta PÚBLICA: GET /api/sst/cap/plantillas/[token]
 *
 * Devuelve los datos de la plantilla + contexto de la capacitación para
 * pre-rellenar el formulario público de evaluación. NO requiere autenticación.
 * Las respuestas correctas NO se incluyen para evitar trampas en cliente.
 * Si la plantilla tiene `id_capacitacion`, también devuelve datos del registro
 * de ejecución (fecha, tema, facilitador, lugar) para auto-completar el form.
 */
import { NextRequest, NextResponse } from 'next/server'
import { obtenerContextoDesdeToken } from '@/lib/sst/cap-evaluaciones'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token || !/^[0-9a-f-]{8,36}$/i.test(token))
    return NextResponse.json({ message: 'Token inválido' }, { status: 400 })

  try {
    const { plantilla, contexto } = await obtenerContextoDesdeToken(token)

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

    return NextResponse.json({ plantilla: publica, capacitacion: contexto })
  } catch (e) {
    console.error('[GET /api/sst/cap/plantillas/[token]]', e)
    const msg = e instanceof Error ? e.message : 'Error interno del servidor'
    const status = msg.includes('inválido') || msg.includes('inactiva') ? 404 : 500
    return NextResponse.json({ message: msg }, { status })
  }
}
