/**
 * Renombra los campos de `sst_cap_asistencias` en Airtable:
 *   cedula  → numero_documento
 *   cargo   → cargo_empresa
 *   area    → telefono
 *
 * Uso:
 *   node scripts/rename-asistencias-fields.js
 *
 * Requiere en .env.local:
 *   AIRTABLE_API_KEY  — Personal Access Token con scopes: schema.bases:read, schema.bases:write
 *   AIRTABLE_BASE_ID  — ID de la base (appXXXXXXXXXXXXXX)
 */

const fs   = require('fs')
const path = require('path')

// ── Leer .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌  No se encontró .env.local en la raíz del proyecto.')
  process.exit(1)
}
const envVars = {}
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const idx = trimmed.indexOf('=')
  if (idx === -1) return
  envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
})

const API_KEY = envVars['AIRTABLE_API_KEY']
const BASE_ID = envVars['AIRTABLE_BASE_ID']

if (!API_KEY || !BASE_ID) {
  console.error('❌  Faltan AIRTABLE_API_KEY o AIRTABLE_BASE_ID en .env.local')
  process.exit(1)
}

const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

// Mapa: nombre actual en Airtable → nombre nuevo
const RENAMES = {
  cedula: 'numero_documento',
  cargo:  'cargo_empresa',
  area:   'telefono',
}

async function main() {
  // 1. Obtener el listado de tablas de la base para encontrar sst_cap_asistencias
  console.log('🔍 Obteniendo esquema de la base…')
  const schemaRes = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: HEADERS,
  })
  if (!schemaRes.ok) {
    const body = await schemaRes.text()
    console.error(`❌  Error al obtener esquema: ${schemaRes.status} — ${body}`)
    process.exit(1)
  }
  const schema = await schemaRes.json()

  const table = schema.tables.find(t => t.name === 'sst_cap_asistencias')
  if (!table) {
    console.error('❌  No se encontró la tabla sst_cap_asistencias en la base.')
    process.exit(1)
  }

  console.log(`✅ Tabla encontrada: ${table.name} (${table.id})`)

  // 2. Para cada campo que hay que renombrar, buscar su ID y hacer PATCH
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const field = table.fields.find(f => f.name === oldName)

    if (!field) {
      // Verificar si ya fue renombrado en una ejecución anterior
      const alreadyRenamed = table.fields.find(f => f.name === newName)
      if (alreadyRenamed) {
        console.log(`⏩ "${newName}" ya existe, se omite.`)
      } else {
        console.warn(`⚠️  Campo "${oldName}" no encontrado en la tabla. Se omite.`)
      }
      continue
    }

    console.log(`🔄 Renombrando "${oldName}" → "${newName}" (id: ${field.id})…`)

    const patchRes = await fetch(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${table.id}/fields/${field.id}`,
      {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ name: newName }),
      }
    )

    if (!patchRes.ok) {
      const body = await patchRes.text()
      console.error(`❌  Error al renombrar "${oldName}": ${patchRes.status} — ${body}`)
    } else {
      console.log(`✅ "${oldName}" → "${newName}" ✓`)
    }
  }

  console.log('\n🎉 Proceso completado.')
}

main().catch(err => {
  console.error('❌  Error inesperado:', err)
  process.exit(1)
})
