/**
 * Crea la tabla `sst_cap_asistencias` en Airtable con todos sus campos.
 *
 * Uso:
 *   node scripts/create-table-asistencias.js
 *
 * Requiere en .env.local:
 *   AIRTABLE_API_KEY  — Personal Access Token con scopes: schema.bases:read, schema.bases:write
 *   AIRTABLE_BASE_ID  — ID de la base (appXXXXXXXXXXXXXX)
 */

const fs   = require('fs')
const path = require('path')

// ── Leer .env.local manualmente (sin dependencia de dotenv) ──────────────────
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌  No se encontró .env.local en la raíz del proyecto.')
  process.exit(1)
}

const envVars = {}
fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const idx = trimmed.indexOf('=')
    if (idx === -1) return
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    envVars[key] = val
  })

const API_KEY = envVars['AIRTABLE_API_KEY']
const BASE_ID = envVars['AIRTABLE_BASE_ID']

if (!API_KEY || !BASE_ID) {
  console.error('❌  Faltan AIRTABLE_API_KEY o AIRTABLE_BASE_ID en .env.local')
  process.exit(1)
}

// ── Definición de la tabla ────────────────────────────────────────────────────
//
// Airtable crea automáticamente el campo primario "Name" (singleLineText).
// Lo reutilizamos como `nombre_trabajador`.
//
// Documentación: https://airtable.com/developers/web/api/create-table

const TABLE_NAME = 'sst_cap_asistencias'

const TABLE_DEF = {
  name: TABLE_NAME,
  description: 'Registro de asistentes individuales a cada ejecución (registro) de una capacitación SST. Las firmas digitales se almacenan cifradas con AES-256-GCM.',
  fields: [
    // ── Campo primario (requerido por Airtable) ──────────────────────────────
    {
      name: 'nombre_trabajador',
      type: 'singleLineText',
      description: 'Nombre completo del trabajador asistente (campo primario de la tabla)',
    },
    // ── Campos de referencia ─────────────────────────────────────────────────
    {
      name: 'registro_id',
      type: 'singleLineText',
      description: 'ID del registro de ejecución (sst_cap_registros) al que pertenece esta asistencia',
    },
    // ── Datos de identificación del trabajador ───────────────────────────────
    {
      name: 'cedula',
      type: 'singleLineText',
      description: 'Número de cédula del trabajador',
    },
    {
      name: 'cargo',
      type: 'singleLineText',
      description: 'Cargo del trabajador al momento de la capacitación',
    },
    {
      name: 'area',
      type: 'singleLineText',
      description: 'Área o departamento del trabajador',
    },
    // ── Asistencia y evaluación ──────────────────────────────────────────────
    {
      name: 'asistio',
      type: 'checkbox',
      description: 'Indica si el trabajador efectivamente asistió a la sesión',
      options: {
        icon: 'check',
        color: 'greenBright',
      },
    },
    {
      name: 'nota_evaluacion',
      type: 'number',
      description: 'Nota obtenida en la evaluación de la capacitación (0–100)',
      options: {
        precision: 1,
      },
    },
    {
      name: 'fecha_firma',
      type: 'date',
      description: 'Fecha en que se registró la firma digital',
      options: {
        dateFormat: {
          name: 'iso',
        },
      },
    },
    // ── Firma digital cifrada ─────────────────────────────────────────────────
    {
      name: 'firma_encriptada',
      type: 'multilineText',
      description: 'Firma digital cifrada con AES-256-GCM. Formato: aes256gcm.{iv_b64}.{tag_b64}.{cipher_b64}. NUNCA exponer este campo en APIs públicas.',
    },
    // ── Metadatos de auditoría ────────────────────────────────────────────────
    {
      name: 'firma_url',
      type: 'url',
      description: 'URL pública de la firma subida a storage externo (S3/GCS) — uso futuro',
    },
    {
      name: 'creado_en',
      type: 'dateTime',
      description: 'Timestamp de creación del registro',
      options: {
        dateFormat: { name: 'iso' },
        timeFormat: { name: '24hour' },
        timeZone:   'America/Bogota',
      },
    },
  ],
}

// ── Verificar si la tabla ya existe ──────────────────────────────────────────
async function obtenerTablas() {
  const resp = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Error al listar tablas (${resp.status}): ${txt}`)
  }
  const data = await resp.json()
  return data.tables
}

async function crearTabla() {
  const resp = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(TABLE_DEF),
  })

  const data = await resp.json()
  if (!resp.ok) {
    throw new Error(`Error al crear tabla (${resp.status}): ${JSON.stringify(data, null, 2)}`)
  }
  return data
}

// ── Main ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log(`\n📋  Verificando base ${BASE_ID}...\n`)

  let tablas
  try {
    tablas = await obtenerTablas()
  } catch (err) {
    console.error('❌  No se pudo conectar con la API de Airtable.')
    console.error('    Verifica que el token tenga los scopes: schema.bases:read, schema.bases:write')
    console.error(`    Detalle: ${err.message}`)
    process.exit(1)
  }

  const existente = tablas.find(t => t.name === TABLE_NAME)
  if (existente) {
    console.log(`✅  La tabla "${TABLE_NAME}" ya existe (id: ${existente.id}).`)
    console.log('\n   Campos actuales:')
    existente.fields.forEach(f => console.log(`     • ${f.name} [${f.type}]`))
    console.log('\n   No se realizaron cambios. Si necesitas agregar campos usa la UI de Airtable.')
    return
  }

  console.log(`🔧  Creando tabla "${TABLE_NAME}"...\n`)

  let result
  try {
    result = await crearTabla()
  } catch (err) {
    console.error(`❌  ${err.message}`)
    console.error('\n   Posibles causas:')
    console.error('   • El token no tiene el scope schema.bases:write')
    console.error('   • El BASE_ID es incorrecto')
    process.exit(1)
  }

  console.log(`✅  Tabla creada exitosamente!\n`)
  console.log(`   ID de tabla : ${result.id}`)
  console.log(`   Nombre      : ${result.name}`)
  console.log('\n   Campos creados:')
  result.fields.forEach(f => console.log(`     • ${f.name} [${f.type}]`))
  console.log('\n   Recuerda: la clave FIRMA_ENCRYPTION_KEY del .env.local es necesaria')
  console.log('   para cifrar y descifrar las firmas. Guárdala en un vault seguro.\n')
})()
