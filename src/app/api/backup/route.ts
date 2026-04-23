import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { generarBackup, listarModulosDisponibles } from '@/lib/backup'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token)))
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ modulos: listarModulosDisponibles() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token)))
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const modulos: string[] | undefined = Array.isArray(body.modulos) ? body.modulos : undefined

  const payload = await generarBackup(modulos)

  const json = JSON.stringify(payload, null, 2)
  const fecha = new Date().toISOString().slice(0, 10)
  const nombre = `backup-sgsst-${fecha}.json`

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Content-Length': String(Buffer.byteLength(json, 'utf8')),
    },
  })
}
