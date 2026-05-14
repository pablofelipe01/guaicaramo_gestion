/**
 * GET /api/sst/personal/por-unidad
 *
 * Retorna todos los trabajadores activos de sst_personal agrupados por área.
 * Usado por el selector jerárquico de "Dirigido a" en capacitaciones.
 *
 * Respuesta:
 *   {
 *     unidades: {
 *       nombre: string
 *       personas: { id: string; nombre: string; documento: string }[]
 *     }[]
 *   }
 */
import { NextRequest, NextResponse } from 'next/server'
import { listRecords } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

interface PersonalFields {
  numero_documento?: string
  nombre_completo?: string
  area?: string
}

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  try {
    let offset: string | undefined
    const grupos: Record<string, { id: string; nombre: string; documento: string }[]> = {}

    do {
      const { records, offset: nextOffset } = await listRecords<PersonalFields>(
        'sst_personal',
        {
          fields: ['numero_documento', 'nombre_completo', 'area'],
          pageSize: 100,
          offset,
        }
      )

      for (const r of records) {
        const area   = r.fields.area?.trim()
        const nombre = r.fields.nombre_completo?.trim()
        if (!area || !nombre) continue

        if (!grupos[area]) grupos[area] = []
        grupos[area].push({
          id:        r.id,
          nombre,
          documento: r.fields.numero_documento?.trim() ?? '',
        })
      }

      offset = nextOffset
    } while (offset)

    for (const area of Object.keys(grupos)) {
      grupos[area].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }

    const unidades = Object.entries(grupos)
      .map(([nombre, personas]) => ({ nombre, personas }))
      .sort((a, b) => b.personas.length - a.personas.length)

    return NextResponse.json({ unidades })
  } catch (e) {
    console.error('[GET /api/sst/personal/por-unidad]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
