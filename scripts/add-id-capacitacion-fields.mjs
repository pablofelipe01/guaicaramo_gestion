/**
 * Agrega el campo `id_capacitacion` (singleLineText) a:
 *   - sst_cap_plantillas
 *   - sst_cap_evaluaciones
 *
 * Requiere las variables de entorno AIRTABLE_API_KEY y AIRTABLE_BASE_ID.
 * Uso: node scripts/add-id-capacitacion-fields.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Cargar .env.local manualmente ──────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '..', '.env.local')
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  console.warn('⚠  No se encontró .env.local — usando variables de entorno del sistema.')
}

const API_KEY = process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_BASE_ID

if (!API_KEY || !BASE_ID) {
  console.error('❌ Faltan variables AIRTABLE_API_KEY y/o AIRTABLE_BASE_ID')
  process.exit(1)
}

const TABLES_TARGET = ['sst_cap_plantillas', 'sst_cap_evaluaciones']
const FIELD_SPEC = {
  name: 'id_capacitacion',
  type: 'singleLineText',
  description: 'FK → sst_cap_registros.id — vincula la plantilla/evaluación a un registro de ejecución',
}

// ── 1. Obtener listado de tablas del base ──────────────────────────────────────
async function getTables() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Error al listar tablas (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.tables ?? []
}

// ── 2. Crear campo en una tabla ────────────────────────────────────────────────
async function createField(tableId, tableName) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}/fields`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(FIELD_SPEC),
  })
  const data = await res.json()
  if (!res.ok) {
    // Si el campo ya existe Airtable devuelve un error descriptivo
    const msg = data?.error?.message ?? JSON.stringify(data)
    if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
      console.log(`  ⚠  ${tableName}: campo 'id_capacitacion' ya existe — omitiendo.`)
    } else {
      throw new Error(`Error creando campo en ${tableName} (${res.status}): ${msg}`)
    }
  } else {
    console.log(`  ✅ ${tableName}: campo 'id_capacitacion' creado (id: ${data.id})`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
;(async () => {
  console.log(`\n🔧 Conectando a base: ${BASE_ID}\n`)

  const tables = await getTables()
  const tableMap = Object.fromEntries(tables.map(t => [t.name, t.id]))

  for (const tableName of TABLES_TARGET) {
    const tableId = tableMap[tableName]
    if (!tableId) {
      console.error(`  ❌ Tabla '${tableName}' no encontrada en el base.`)
      continue
    }
    await createField(tableId, tableName)
  }

  console.log('\n✔  Proceso completado.\n')
})()
