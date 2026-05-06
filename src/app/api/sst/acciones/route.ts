import { NextRequest, NextResponse } from 'next/server'
import { listarAcciones, crearAccion, alertasAcciones, estadisticasAcciones } from '@/lib/sst/ac'
import { requireRole } from '@/lib/auth/middleware'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

const ESTADOS_ACCION = ['pendiente', 'en_proceso', 'ejecutada', 'verificada', 'cerrada', 'vencida', 'reabierta'] as const
const ORIGENES_ACCION = ['auditoria', 'inspeccion', 'investigacion_at', 'ipvr', 'otro'] as const
const TIPOS_ACCION = ['correctiva', 'preventiva', 'mejora'] as const
const PRIORIDADES_ACCION = ['baja', 'media', 'alta', 'critica'] as const

type EstadoAcParsed = typeof ESTADOS_ACCION[number]
type OrigenAcParsed = typeof ORIGENES_ACCION[number]

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const { searchParams } = new URL(request.url)
  const vista = searchParams.get('vista')
  if (vista === 'alertas') return NextResponse.json(await alertasAcciones())
  if (vista === 'estadisticas') return NextResponse.json(await estadisticasAcciones())
  const estadoRaw = searchParams.get('estado')
  const origenRaw = searchParams.get('origen')
  const estado: EstadoAcParsed | undefined = ESTADOS_ACCION.includes(estadoRaw as EstadoAcParsed)
    ? (estadoRaw as EstadoAcParsed) : undefined
  const origen: OrigenAcParsed | undefined = ORIGENES_ACCION.includes(origenRaw as OrigenAcParsed)
    ? (origenRaw as OrigenAcParsed) : undefined
  return NextResponse.json(await listarAcciones(estado, origen))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error
  const body = await request.json()
  if (!body.Titulo || !body.Tipo || !body.Origen || !body.Prioridad || !body['Fecha Limite'])
    return NextResponse.json({ message: 'Titulo, Tipo, Origen, Prioridad y Fecha Limite son requeridos' }, { status: 400 })
  if (!TIPOS_ACCION.includes(body.Tipo))
    return NextResponse.json({ message: `Tipo inválido. Valores: ${TIPOS_ACCION.join(', ')}` }, { status: 400 })
  if (!ORIGENES_ACCION.includes(body.Origen))
    return NextResponse.json({ message: `Origen inválido. Valores: ${ORIGENES_ACCION.join(', ')}` }, { status: 400 })
  if (!PRIORIDADES_ACCION.includes(body.Prioridad))
    return NextResponse.json({ message: `Prioridad inválida. Valores: ${PRIORIDADES_ACCION.join(', ')}` }, { status: 400 })
  return NextResponse.json({ record: await crearAccion(body) }, { status: 201 })
}
