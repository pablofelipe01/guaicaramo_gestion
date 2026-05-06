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

// The leftover pattern: a line ending with the return fragment, followed by closing brace line
// Matches: "`, 'Content-Type': 'application/json' }" on its own line (possibly with trailing space/LF)
// followed by "}" (possibly indented) on next line
// followed optionally by an empty line
const leftoverRegex = /`, 'Content-Type': 'application\/json' \}\r?\n[ \t]*\}\r?\n(\r?\n)?/g;

let fixed = 0;
for (const rel of files) {
  const fp = path.join(BASE, rel);
  if (!fs.existsSync(fp)) continue;

  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes(", 'Content-Type': 'application/json' }")) continue;

  const before = src;
  src = src.replace(leftoverRegex, '');

  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    fixed++;
    console.log('FIXED:', rel);
  } else {
    console.log('No leftover found:', rel);
  }
}
console.log('\nTotal cleaned:', fixed);
