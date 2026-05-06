const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/casos-medicos/page.tsx',
  'src/app/dashboard/presupuesto/page.tsx',
  'src/app/dashboard/indicadores/page.tsx',
  'src/app/dashboard/capacitaciones/[id]/page.tsx',
  'src/app/dashboard/plan-trabajo/page.tsx',
  'src/app/dashboard/capacitaciones/registro/page.tsx',
  'src/app/dashboard/permisos-trabajo/page.tsx',
  'src/app/dashboard/capacitaciones/programacion/page.tsx',
  'src/app/dashboard/capacitaciones/page.tsx',
  'src/app/dashboard/perfiles-cargo/page.tsx',
  'src/app/dashboard/matriz-legal/page.tsx',
  'src/app/dashboard/incidentes/page.tsx',
  'src/app/dashboard/capacitaciones/indicadores/page.tsx',
  'src/app/dashboard/gestion-cambio/page.tsx',
  'src/app/dashboard/ipvr/page.tsx',
  'src/app/dashboard/evaluaciones-medicas/page.tsx',
  'src/app/dashboard/evaluacion-inicial/page.tsx',
  'src/app/dashboard/documentos/page.tsx',
  'src/app/dashboard/epps/page.tsx',
  'src/app/dashboard/inspecciones/page.tsx',
  'src/app/dashboard/contratistas/page.tsx',
  'src/app/dashboard/comite-convivencia/page.tsx',
  'src/app/dashboard/acciones-correctivas/page.tsx',
  'src/components/sst/ComiteCasosList.tsx',
  'src/components/sst/capacitaciones/CronogramaCelda.tsx',
  'src/components/sst/capacitaciones/CronogramaActionSheet.tsx',
];

const BASE = path.join('c:', 'Users', 'sneid', 'OneDrive', 'Documentos', 'GUAICARAMO_PROYECTO', 'guaicaramo_gestion');
const IMPORT_LINE = "import { getAuthHeaders } from '@/lib/client/authFetch'";

// Matches the authHeaders function with any indentation
const fnRegex = /[ \t]*function authHeaders\(\) \{[\s\S]*?\}\n?/g;

let modified = 0;
for (const rel of files) {
  const fp = path.join(BASE, rel);
  if (!fs.existsSync(fp)) { console.log('SKIP (not found):', rel); continue; }

  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('function authHeaders()')) { console.log('SKIP (no match):', rel); continue; }

  // 1. Remove authHeaders function definition
  src = src.replace(fnRegex, '');

  // 2. Replace all calls
  src = src.replace(/authHeaders\(\)/g, 'getAuthHeaders()');

  // 3. Add import after last import line (if not already present)
  if (!src.includes(IMPORT_LINE)) {
    const lines = src.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImportIdx = i;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, IMPORT_LINE);
      src = lines.join('\n');
    }
  }

  fs.writeFileSync(fp, src, 'utf8');
  modified++;
  console.log('OK:', rel);
}
console.log('\nTotal modificados:', modified);
