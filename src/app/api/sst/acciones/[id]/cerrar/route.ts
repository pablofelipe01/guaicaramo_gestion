import { NextRequest, NextResponse } from 'next/server'
import { cerrarAccion, listarAcciones } from '@/lib/sst/ac'
import { verifyToken } from '@/lib/auth'
import { listRecords } from '@/lib/airtable-client'
import type { AcAccionFields } from '@/types/sst/ac'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const { id } = await ctx.params
  const { records } = await listRecords<AcAccionFields>('sst_ac_acciones', {
    filterByFormula: `RECORD_ID()='${id}'`,
  })
  const accion = records[0]
  if (!accion) return NextResponse.json({ message: 'Acción no encontrada' }, { status: 404 })
  if (accion.fields.Estado !== 'verificada')
    return NextResponse.json({ message: 'La acción debe estar verificada antes de cerrar. La verificación de eficacia es obligatoria.' }, { status: 422 })
  return NextResponse.json({ record: await cerrarAccion(id) })
}
