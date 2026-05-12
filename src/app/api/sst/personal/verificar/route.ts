/**
 * GET /api/sst/personal/verificar?cedula=12345678
 *
 * Endpoint PÚBLICO — no requiere autenticación (se usa desde el formulario QR).
 *
 * Busca un empleado activo en `sst_personal` por número de documento/cédula y
 * devuelve sus datos básicos de identificación (nunca datos sensibles como
 * salario, diagnósticos, etc.).
 *
 * Respuesta 200:
 *   {
 *     encontrado: true,
 *     nombre:                    string,
 *     cargo:                     string | null,
 *     descripcion_unidad_negocio: string | null,
 *     numero_documento:          string
 *   }
 *
 * Respuesta 200 (no encontrado):
 *   { encontrado: false }
 */
import { NextRequest, NextResponse } from 'next/server'
import { listRecords } from '@/lib/airtable-client'

interface PersonalFields {
  numero_documento?: string
  nombre_empleado?: string
  descripcion_cargo?: string
  descripcion_unidad_negocio?: string
  estado?: string
}

/** Deduce el nombre completo desde los campos disponibles del registro. */
function resolverNombre(f: PersonalFields): string {
  return (f.nombre_empleado ?? '').trim()
}

export async function GET(request: NextRequest) {
  const cedula = request.nextUrl.searchParams.get('cedula')?.trim()
  if (!cedula) {
    return NextResponse.json({ message: 'cedula es requerida' }, { status: 400 })
  }

  // Sanitizar: solo dígitos para evitar inyección de fórmulas Airtable
  if (!/^\d{1,12}$/.test(cedula)) {
    return NextResponse.json({ encontrado: false })
  }

  try {
    const { records } = await listRecords<PersonalFields>('sst_personal', {
      filterByFormula: `AND({numero_documento}='${cedula}', {estado}='Activo')`,
      maxRecords: 1,
      fields: [
        'numero_documento',
        'nombre_empleado',
        'descripcion_cargo',
        'descripcion_unidad_negocio',
        'estado',
      ],
    })

    if (records.length === 0) {
      return NextResponse.json({ encontrado: false })
    }

    const f = records[0].fields
    return NextResponse.json({
      encontrado: true,
      nombre: resolverNombre(f),
      cargo: f.descripcion_cargo ?? null,
      descripcion_unidad_negocio: f.descripcion_unidad_negocio ?? null,
      numero_documento: cedula,
    })
  } catch (e) {
    console.error('[GET /api/sst/personal/verificar]', e)
    // En caso de error de BD devolver no encontrado (nunca bloquear el flujo de firma)
    return NextResponse.json({ encontrado: false })
  }
}
