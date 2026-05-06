/**
 * Script: corrección de route handlers con verifyToken residual.
 * Estos archivos ya tienen `requireRole` importado pero los guards
 * no fueron reemplazados por el script anterior.
 *
 * Acciones:
 * 1. Corrige la indentación de la constante SST_ROLES
 * 2. Reemplaza los patrones verifyToken restantes (incluyendo try/catch)
 * 3. Elimina el import de verifyToken si ya no se usa
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join('c:', 'Users', 'sneid', 'OneDrive', 'Documentos', 'GUAICARAMO_PROYECTO', 'guaicaramo_gestion');

const targets = [
  'src/app/api/sst/acciones/route.ts',
  'src/app/api/sst/auditorias/route.ts',
  'src/app/api/sst/cambios/route.ts',
  'src/app/api/sst/capacitaciones/route.ts',
  'src/app/api/sst/contratistas/route.ts',
  'src/app/api/sst/documentos/route.ts',
  'src/app/api/sst/epps/route.ts',
  'src/app/api/sst/estandares/route.ts',
  'src/app/api/sst/evaluaciones/route.ts',
  'src/app/api/sst/incidentes/route.ts',
  'src/app/api/sst/indicadores/route.ts',
  'src/app/api/sst/inspecciones/route.ts',
  'src/app/api/sst/permisos/route.ts',
  'src/app/api/sst/planes/route.ts',
  'src/app/api/sst/presupuestos/route.ts',
];

const SST_ROLES_MODULE = "const SST_ROLES = ['coordinador_sst', 'jefe_area', 'gerencia', 'auditor', 'medico', 'administrador'] as const\n";

function processFile(fp) {
  let src = fs.readFileSync(fp, 'utf8');
  const original = src;

  // 1. Fix SST_ROLES indentation (remove leading 2 spaces from the const line)
  src = src.replace(
    /^  const SST_ROLES = \['coordinador_sst'.*\] as const\n/m,
    SST_ROLES_MODULE
  );

  // 2. Remove old verifyToken import if present
  src = src.replace(/import \{ verifyToken \} from '@\/lib\/auth'\n?/g, '');

  // 3. Replace simple guard pattern (no try/catch, single line guard)
  // Pattern: "  const token = ...\n  if (!token ...) return..."
  src = src.replace(
    /  const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n  if \(!token \|\| !\(await verifyToken\(token\)\)\) return NextResponse\.json\(\{ message: 'No autorizado' \}, \{ status: 401 \}\)\n/g,
    '  const auth = await requireRole(request, ...SST_ROLES)\n  if (\'error\' in auth) return auth.error\n'
  );

  // 4. Replace pattern with usuario extraction
  // Pattern: "  const token = ...\n  const usuario = token ? await verifyToken... : null\n  if (!usuario)..."
  src = src.replace(
    /  const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n  const usuario = token \? await verifyToken\(token\) : null\n  if \(!usuario\) return NextResponse\.json\(\{ message: 'No autorizado' \}, \{ status: 401 \}\)\n/g,
    '  const auth = await requireRole(request, ...SST_ROLES)\n  if (\'error\' in auth) return auth.error\n  const usuario = auth.user\n'
  );

  // 5. Replace pattern where token is extracted but used inline with verifyToken
  // e.g. "const token = ...\nreturn verifyToken(token)"
  // (for files like usuarios that may have this)
  src = src.replace(
    /  const token = request\.headers\.get\('authorization'\)\?\.replace\('Bearer ', ''\)\n  return verifyToken\(token\)/g,
    '  const auth = await requireRole(request, ...SST_ROLES)\n  if (\'error\' in auth) return auth.error'
  );

  if (src !== original) {
    fs.writeFileSync(fp, src, 'utf8');
    return true;
  }
  return false;
}

let fixed = 0;
for (const rel of targets) {
  const fp = path.join(BASE, rel);
  if (!fs.existsSync(fp)) { console.log('NOT FOUND:', rel); continue; }

  if (processFile(fp)) {
    fixed++;
    console.log('FIXED:', rel);
  } else {
    console.log('UNCHANGED (needs manual review):', rel);
  }
}
console.log('\nTotal fixed:', fixed);
