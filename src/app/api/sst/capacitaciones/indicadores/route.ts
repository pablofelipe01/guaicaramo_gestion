import { NextRequest, NextResponse } from 'next/server'
import { listarIndicadores } from '@/lib/sst/cap'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  const records = await listarIndicadores()
  return NextResponse.json({ records })
}
