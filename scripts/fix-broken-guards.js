// fix-broken-guards.js
// Arregla el patrón corrupto donde el guard quedó dentro del try{}
// Patrón erróneo:
//   try {
//       const auth = await requireRole(request, ...SST_ROLES)
//   if ('error' in auth) return auth.error
//       return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
//     }
//     const { id } = ...
//   } catch...
//
// Patrón correcto:
//   const auth = await requireRole(request, ...SST_ROLES)
//   if ('error' in auth) return auth.error
//   try {
//     const { id } = ...
//   } catch...

const fs = require('fs')
const path = require('path')

function findAllRoutes(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...findAllRoutes(full))
    else if (entry.isFile() && entry.name === 'route.ts') results.push(full)
  }
  return results
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api', 'sst')
const files = findAllRoutes(apiDir)

let fixed = 0

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  
  // Fix broken pattern: try {\n +guard\n +return 401\n  }\n  rest of try body\n} catch
  const brokenPattern = /(\nexport async function \w+[^{]+{)\n  try \{\n    [ \t]*(const auth = await requireRole\([^)]+\))\n  (if \('error' in auth\) return auth\.error)\n[ \t]*return NextResponse\.json\(\{ message: 'No autorizado' \}[^\n]*\n[ \t]*\}\n([\s\S]*?)  \} catch/g
  
  if (brokenPattern.test(src)) {
    src = src.replace(
      /(\nexport async function \w+[^{]+{)\n  try \{\n[ \t]*(const auth = await requireRole\([^)]+\))\n  (if \('error' in auth\) return auth\.error)\n[ \t]*return NextResponse\.json\(\{ message: 'No autorizado' \}[^\n]*\n[ \t]*\}\n([\s\S]*?)  \} catch/g,
      (match, funcHead, guardLine1, guardLine2, body) => {
        return `${funcHead}\n  ${guardLine1}\n  ${guardLine2}\n  try {\n${body}  } catch`
      }
    )
    fs.writeFileSync(file, src, 'utf8')
    fixed++
    console.log(`FIXED: ${file}`)
  }
}

console.log(`\nTotal fixed: ${fixed}`)
