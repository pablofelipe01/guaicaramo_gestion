/**
 * Script: reemplaza guards verifyToken en archivos con CRLF y try/catch.
 * Trabaja línea a línea para evitar problemas con \r\n.
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

function processFile(fp) {
  const raw = fs.readFileSync(fp, 'utf8');
  // Normalize to LF for processing
  let src = raw.replace(/\r\n/g, '\n');
  const original = src;

  // Pattern A: simple guard
  // "  const token = request...'Bearer ', '')\n  if (!token || ...) return ... 401 })\n"
  const GUARD_A = `  const token = request.headers.get('authorization')?.replace('Bearer ', '')\n  if (!token || !(await verifyToken(token))) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })\n`;
  const REPLACE_A = `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n`;

  // Pattern B: guard with usuario extraction
  const GUARD_B = `  const token = request.headers.get('authorization')?.replace('Bearer ', '')\n  const usuario = token ? await verifyToken(token) : null\n  if (!usuario) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })\n`;
  const REPLACE_B = `  const auth = await requireRole(request, ...SST_ROLES)\n  if ('error' in auth) return auth.error\n  const usuario = auth.user\n`;

  // Pattern C: guard with verified
  const GUARD_C = `  const verified = await verifyToken(token)\n`;
  // These are harder - skip for now, handle separately

  while (src.includes(GUARD_A)) {
    src = src.replace(GUARD_A, REPLACE_A);
  }
  while (src.includes(GUARD_B)) {
    src = src.replace(GUARD_B, REPLACE_B);
  }

  // Also remove any stray "const token = ..." lines that are now orphaned
  // (before a try { block where the guard was just replaced, token var may remain)
  // These are rare - check manually

  // Remove verifyToken import if still present
  src = src.replace("import { verifyToken } from '@/lib/auth'\n", '');

  if (src !== original) {
    // Write back with original line endings if needed (keep LF for consistency)
    fs.writeFileSync(fp, src, 'utf8');
    return true;
  }
  return false;
}

let fixed = 0;
for (const rel of targets) {
  const fp = path.join(BASE, rel);
  if (!fs.existsSync(fp)) continue;
  if (processFile(fp)) {
    fixed++;
    console.log('FIXED:', rel);
  } else {
    console.log('UNCHANGED:', rel);
  }
}
console.log('\nFixed:', fixed);
