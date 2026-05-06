// fix-dynamic-routes.js
// Aplica requireRole a todas las rutas dinámicas [id] que aún usan verifyToken
const fs = require('fs')
const path = require('path')

const ROLES_LINE = `const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const\n`

function findFilesWithVerifyToken(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...findFilesWithVerifyToken(full))
    else if (entry.isFile() && entry.name === 'route.ts') {
      const src = fs.readFileSync(full, 'utf8')
      if (src.includes('verifyToken')) results.push(full)
    }
  }
  return results
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api', 'sst')
const files = findFilesWithVerifyToken(apiDir)
console.log(`Encontrados: ${files.length} archivos con verifyToken`)

let fixed = 0
let skipped = 0

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  
  // 1. Reemplazar import de verifyToken por requireRole (si no existe ya)
  if (!src.includes("from '@/lib/auth/middleware'")) {
    src = src.replace(
      /import\s*\{[^}]*verifyToken[^}]*\}\s*from\s*['"]@\/lib\/auth['"][^\n]*\n?/,
      `import { requireRole } from '@/lib/auth/middleware'\n`
    )
  } else {
    // Ya tiene requireRole import, solo remover la importación de verifyToken
    src = src.replace(
      /import\s*\{[^}]*verifyToken[^}]*\}\s*from\s*['"]@\/lib\/auth['"][^\n]*\n?/,
      ''
    )
  }
  
  // 2. Añadir SST_ROLES si no existe
  if (!src.includes('SST_ROLES') && !src.includes('ROLES_MEDICO') && !src.includes('ROLES_CCL')) {
    // Insertar después del último import
    const lastImportMatch = src.match(/^(import[^\n]+\n)+/m)
    if (lastImportMatch) {
      const lastImportEnd = src.lastIndexOf('\nimport ')
      const afterLastImport = src.indexOf('\n', lastImportEnd + 1) + 1
      src = src.slice(0, afterLastImport) + '\n' + ROLES_LINE + src.slice(afterLastImport)
    }
  }
  
  // 3. Reemplazar patrones de verifyToken
  // Pattern A: const token = await verifyToken(request) \n if (!token) return ...
  src = src.replace(
    /const\s+\w+\s*=\s*await\s+verifyToken\(request\)\s*\n\s*if\s*\(!\w+\)\s*return[^\n]+\n/g,
    `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n`
  )
  
  // Pattern B: const token = request.headers.get('authorization')?.replace('Bearer ', '') \n if (!token || !(await verifyToken(token))) return ...
  src = src.replace(
    /const\s+\w+\s*=\s*request\.headers\.get\([^)]+\)\??\.replace\([^)]+\)\s*\n\s*if\s*\(![^)]+verifyToken[^\n]+\n/g,
    `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n`
  )
  
  // Pattern C: two-line split — token extraction then separate verifyToken call
  // const token = request.headers.get(...)...  \n  if (!token) return ... \n  const verified = await verifyToken(token)\n  if (!verified) return ...
  src = src.replace(
    /const\s+\w+\s*=\s*request\.headers\.get\([^)]+\)[^\n]*\n\s*if\s*\(!\w+\)\s*return[^\n]+\n\s*\n?\s*const\s+\w+\s*=\s*await\s+verifyToken\([^)]+\)\s*\n\s*if\s*\(!\w+\)\s*return[^\n]+\n/g,
    `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n\n`
  )
  
  // Pattern D: catch-all — any line with verifyToken inside a handler, multi-line
  // Handles: const token = ...headers.get... \n if (!token || !(await verifyToken...)) return ...
  // Also handles: const verified = await verifyToken(token) \n if (!verified) return ...
  // Process function by function
  src = src.replace(
    /[ \t]*const \w+ = request\.headers\.get\([^)]+\)\??\.replace\([^)]+\)\n[ \t]*if \(!\w+.*verifyToken[^\n]+\n/g,
    `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n`
  )
  src = src.replace(
    /[ \t]*const \w+ = request\.headers\.get\([^)]+\)\??\.replace\([^)]+\)\n[ \t]*const \w+ = \w+ \? await verifyToken\(\w+\) : null\n[ \t]*if \(!\w+\)[^\n]+\n/g,
    `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n  const usuario = auth.user\n`
  )
  src = src.replace(
    /[ \t]*const \w+ = request\.headers\.get\([^)]+\)\??\.replace\([^)]+\)\n[ \t]*if \(!\w+\)[^\n]+\n[ \t]*\n?[ \t]*const \w+ = await verifyToken\(\w+\)\n[ \t]*if \(!\w+\)[^\n]+\n/g,
    `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n\n`
  )
  
  // Cleanup: referencias sueltas a verifyToken que puedan quedar
  src = src.replace(/^\s*const\s+\w+\s*=\s*await\s+verifyToken\(request[^)]*\)[^\n]*\n/gm, '')
  src = src.replace(/^\s*if\s*\(!\s*\w*[Tt]oken\s*\)\s*return[^\n]+\n/gm, '')
  
  // 4. Reemplazar uso de token.name/token.id → auth.user.name/auth.user.id  
  // token?.name → auth.user?.name
  src = src.replace(/\btoken\?\.name\b/g, 'auth.user?.name')
  src = src.replace(/\btoken\?\.id\b/g, 'auth.user?.id')
  src = src.replace(/\btoken\.name\b/g, 'auth.user.name')
  src = src.replace(/\btoken\.id\b/g, 'auth.user.id')
  src = src.replace(/\btoken\.rol\b/g, 'auth.user.rol')
  
  // Check if verifyToken still appears
  if (src.includes('verifyToken')) {
    console.log(`  MANUAL NEEDED: ${file}`)
    skipped++
    continue
  }
  
  fs.writeFileSync(file, src, 'utf8')
  fixed++
}

console.log(`\nFIXED: ${fixed} | MANUAL: ${skipped}`)
