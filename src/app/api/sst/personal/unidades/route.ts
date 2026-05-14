/**
 * GET /api/sst/personal/unidades
 *
 * Retorna las unidades de negocio distintas de la tabla sst_personal
 * junto con el conteo de empleados en cada una.
 *
 * Respuesta:
 *   {
 *     unidades: { nombre: string; total: number }[]
 *     total_personal: number
 *   }
 */
import { NextRequest, NextResponse } from 'next/server'
import { listRecords } from '@/lib/airtable-client'
import { requireRole } from '@/lib/auth/middleware'

// Nunca cachear: los datos cambian en Airtable sin aviso al servidor
export const dynamic = 'force-dynamic'

const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const

interface PersonalFields {
  nombre_completo?: string
  area?: string
}

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error

  try {
    // Paginación completa: Airtable devuelve máx 100 registros por página
    let offset: string | undefined
    const conteo: Record<string, number> = {}
    let totalPersonal = 0

    do {
      const { records, offset: nextOffset } = await listRecords<PersonalFields>(
        'sst_personal',
        {
          fields: ['nombre_completo', 'area'],
          pageSize: 100,
          offset,
        }
      )

      for (const r of records) {
        const unidad = r.fields.area?.trim()
        if (unidad) {
          conteo[unidad] = (conteo[unidad] ?? 0) + 1
          totalPersonal++
        }
      }

      offset = nextOffset
    } while (offset)

    const unidades = Object.entries(conteo)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({ unidades, total_personal: totalPersonal })
  } catch (e) {
    console.error('[GET /api/sst/personal/unidades]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
