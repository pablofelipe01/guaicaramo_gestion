import { NextRequest, NextResponse } from 'next/server'
import { listRecords } from '@/lib/airtable-client'

export async function GET(request: NextRequest) {
  const registroId = request.nextUrl.searchParams.get('rid') ?? 'recTEST'
  try {
    const { records } = await listRecords('sst_cap_asistencias', {
      filterByFormula: `{registro_id}='${registroId}'`,
      sort: [{ field: 'nombre_trabajador', direction: 'asc' }],
    })
    return NextResponse.json({ ok: true, total: records.length, records })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
