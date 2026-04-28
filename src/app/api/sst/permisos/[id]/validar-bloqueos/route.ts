import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getRecord, listRecords } from '@/lib/airtable-client'
import { semaforoContratista } from '@/lib/sst/cont'
import type { PermPermisoFields, PermTrabajadorFields } from '@/types/sst/perm'

const T_PERMISOS = 'sst_perm_permisos'
const T_TRABAJADORES = 'sst_perm_trabajadores'

type Ctx = { params: Promise<{ id: string }> }

interface BloqueoResultado {
  bloqueado: boolean
  razones: string[]
  detalles: {
    eppsVencidos: string[]
    semaforoContratista: 'verde' | 'amarillo' | 'rojo' | null
    restriccionesMedicas: string[]
    trabajadoresSinHabilitar: string[]
  }
}

/**
 * GET /api/sst/permisos/[id]/validar-bloqueos
 *
 * Verifica los 3 bloqueos automáticos antes de habilitar la aprobación:
 * 1. EPPs de trabajadores no verificados o vencidos
 * 2. Contratista con semáforo ROJO (documentos vencidos)
 * 3. Trabajadores con restricciones médicas incompatibles
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params

  try {
    const permiso = await getRecord<PermPermisoFields>(T_PERMISOS, id)
    const p = permiso.fields

    const { records: trabajadores } = await listRecords<PermTrabajadorFields>(
      T_TRABAJADORES,
      { filterByFormula: `{Permiso ID}='${id}'` }
    )

    const razones: string[] = []
    const eppsVencidos: string[] = []
    const restriccionesMedicas: string[] = []
    const trabajadoresSinHabilitar: string[] = []

    // ── BLOQUEO 1: EPPs sin verificar ────────────────────────────────────────
    for (const t of trabajadores) {
      const nombre = t.fields['Trabajador Nombre'] ?? t.fields['Trabajador ID']
      if (!t.fields['EPPs Verificados']) {
        eppsVencidos.push(nombre)
      }
      if (!t.fields['Competencias Verificadas']) {
        trabajadoresSinHabilitar.push(`${nombre} (competencias no verificadas)`)
      }
    }

    if (eppsVencidos.length > 0) {
      razones.push(`EPPs no verificados: ${eppsVencidos.join(', ')}`)
    }
    if (trabajadoresSinHabilitar.length > 0) {
      razones.push(`Competencias sin verificar: ${trabajadoresSinHabilitar.join(', ')}`)
    }

    // ── BLOQUEO 2: Semáforo contratista ──────────────────────────────────────
    let colorSemaforo: 'verde' | 'amarillo' | 'rojo' | null = null
    if (p['Contratista ID']) {
      const semaforo = await semaforoContratista(p['Contratista ID'])
      colorSemaforo = semaforo.color
      if (semaforo.color === 'rojo') {
        razones.push(
          `Contratista con semáforo ROJO — Documentos vencidos: ${semaforo.vencidos}, trabajadores sin inducción: ${semaforo.sinInduccion}`
        )
      }
    }

    // ── BLOQUEO 3: Restricciones médicas ────────────────────────────────────
    for (const t of trabajadores) {
      if (t.fields['Restricciones Medicas']) {
        const nombre = t.fields['Trabajador Nombre'] ?? t.fields['Trabajador ID']
        restriccionesMedicas.push(`${nombre}: ${t.fields['Restricciones Medicas']}`)
      }
    }

    if (restriccionesMedicas.length > 0) {
      razones.push(`Restricciones médicas incompatibles: ${restriccionesMedicas.join(' | ')}`)
    }

    const resultado: BloqueoResultado = {
      bloqueado: razones.length > 0,
      razones,
      detalles: {
        eppsVencidos,
        semaforoContratista: colorSemaforo,
        restriccionesMedicas,
        trabajadoresSinHabilitar,
      },
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error validando bloqueos de permiso:', error)
    return NextResponse.json(
      { message: 'Error al validar bloqueos del permiso' },
      { status: 500 }
    )
  }
}
