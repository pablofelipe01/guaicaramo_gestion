import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { generarFURATpdf } from '@/lib/pdf/furat'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/sst/incidentes/[id]/generar-furat
 * Genera y descarga el PDF FURAT del incidente especificado.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  try {
    const pdfBuffer = await generarFURATpdf(id)

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="FURAT-${id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error('Error generando FURAT:', error)
    return NextResponse.json(
      { message: 'Error generando el PDF del FURAT' },
      { status: 500 }
    )
  }
}
