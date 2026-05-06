/**
 * Script: aplica requireRole a todos los route handlers SST que
 * aún usan el patrón manual `verifyToken(token)` inline.
 *
 * Reglas de roles por módulo:
 * - Módulos de escritura crítica (incidentes, ipvr, permisos): coordinador_sst + gerencia
 * - Módulos de consulta general (indicadores, inspecciones, acciones): todos los roles SST
 * - El resto: coordinador_sst + administrador como mínimo
 *
 * Para el MVP se usa "todos los roles SST" en lectura y
 * "coordinador_sst + administrador" en escritura.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join('c:', 'Users', 'sneid', 'OneDrive', 'Documentos', 'GUAICARAMO_PROYECTO', 'guaicaramo_gestion');
const API_DIR = path.join(BASE, 'src', 'app', 'api', 'sst');

const SST_ROLES = "['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador']";
const WRITE_ROLES = "['coordinador_sst', 'administrador']";

function findRouteFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findRouteFiles(full));
    else if (entry.name === 'route.ts') results.push(full);
  }
  return results;
}

const OLD_IMPORT = "import { verifyToken } from '@/lib/auth'";
const NEW_IMPORT = "import { requireRole } from '@/lib/auth/middleware'";

// Pattern: the old manual token check used in GET handlers
const OLD_GET_GUARD = /const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n  if \(!token \|\| !\(await verifyToken\(token\)\)\) return NextResponse\.json\(\{ message: 'No autorizado' \}, \{ status: 401 \}\)/g;
const NEW_GET_GUARD = `const auth = await requireRole(request, ...SST_ROLES)
  if ('error' in auth) return auth.error`;

// Pattern for POST where token is also used to get user info
const OLD_POST_GUARD_SIMPLE = /const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n  if \(!token \|\| !\(await verifyToken\(token\)\)\) return NextResponse\.json\(\{ message: 'No autorizado' \}, \{ status: 401 \}\)/g;

const SST_ROLES_CONST = "  const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const\n";

const allRoutes = findRouteFiles(API_DIR);
let modified = 0;

for (const fp of allRoutes) {
  let src = fs.readFileSync(fp, 'utf8');

  // Skip files already migrated to requireRole
  if (src.includes("requireRole")) continue;
  // Skip files without old verifyToken pattern
  if (!src.includes("import { verifyToken } from '@/lib/auth'")) continue;

  const before = src;

  // 1. Replace import
  src = src.replace(OLD_IMPORT, NEW_IMPORT);

  // 2. Add SST_ROLES constant before first export async function
  if (!src.includes('SST_ROLES')) {
    src = src.replace(
      /(export async function (GET|POST|PUT|DELETE|PATCH))/,
      SST_ROLES_CONST + '$1'
    );
  }

  // 3. Replace GET-style guard (simple token check)
  src = src.replace(OLD_GET_GUARD, NEW_GET_GUARD);

  // 4. For POST with usuario extraction:
  // Pattern: "const token = ...  \n  const usuario = token ? await verifyToken(token) : null\n  if (!usuario) return ..."
  src = src.replace(
    /const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n  const usuario = token \? await verifyToken\(token\) : null\n  if \(!usuario\) return NextResponse\.json\(\{ message: 'No autorizado' \}, \{ status: 401 \}\)/g,
    `const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n  const usuario = auth.user`
  );

  // 5. Replace remaining simple guards (in sub-functions)
  src = src.replace(
    /const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n    if \(!token \|\| !\(await verifyToken\(token\)\)\) return NextResponse\.json\(\{ message: 'No autorizado' \}, \{ status: 401 \}\)/g,
    `const auth = await requireRole(request, ...SST_ROLES)\n    if ('error' in auth) return auth.error`
  );

  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    modified++;
    const rel = fp.replace(BASE + path.sep, '').replace(/\\/g, '/');
    console.log('OK:', rel);
  }
}

console.log('\nTotal rutas actualizadas:', modified);
console.log('Rutas ya migradas (omitidas):', allRoutes.filter(f => {
  const s = fs.readFileSync(f, 'utf8');
  return s.includes('requireRole');
}).length);
