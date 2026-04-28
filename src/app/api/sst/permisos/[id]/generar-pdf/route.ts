import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { generarPermisoPDF } from '@/lib/pdf/permiso'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/sst/permisos/[id]/generar-pdf
 * Genera y descarga el PDF del permiso de trabajo.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  try {
    const pdfBuffer = await generarPermisoPDF(id)

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PermisoTrabajo-${id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error('Error generando PDF de permiso:', error)
    return NextResponse.json(
      { message: 'Error generando el PDF del permiso' },
      { status: 500 }
    )
  }
}
