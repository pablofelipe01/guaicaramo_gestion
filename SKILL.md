---
name: guaicaramo-design-system
description: >
  Sistema de diseño visual para el aplicativo Guaicaramo SG-SST. Define la paleta de 3 colores,
  botones, badges, inputs, cards, tablas, sidebar, íconos, animaciones y reglas de responsive.

  Usar este skill SIEMPRE que el usuario pida:
  - Crear, diseñar o rediseñar cualquier módulo, vista, componente o página del aplicativo Guaicaramo
  - Generar prompts para Copilot que incluyan especificaciones de diseño
  - Aplicar estilos, colores o animaciones a componentes existentes
  - Crear dashboards, cronogramas, formularios, tablas o cards para cualquier módulo SST
  - Definir la apariencia de botones, badges, inputs o cualquier elemento de interfaz
  - Revisar o corregir inconsistencias visuales entre módulos

  También usar cuando el usuario diga frases como:
  "diseña el módulo", "hazlo más estético", "aplica el diseño", "ponle los colores del sistema",
  "mejora la interfaz", "crea el componente visual", "diseño dinámico", "intuitivo",
  "que se vea profesional", "aplica la paleta", "estiliza esto",
  o cuando mencione cualquier módulo de Guaicaramo (capacitaciones, incidentes, inspecciones,
  permisos, EPPs, evaluación inicial, plan de trabajo, etc.) en contexto de diseño o frontend.
---

# Guaicaramo Design System

Sistema de diseño para el aplicativo Guaicaramo SG-SST.
Todos los módulos, vistas y componentes del aplicativo deben seguir estas reglas.

## Stack técnico

- Next.js 16.2.4, React 19, TypeScript 5, TailwindCSS v4
- Íconos: lucide-react
- Animaciones: framer-motion (preferido) o CSS transitions
- Gráficos: Chart.js
- Base de datos: Airtable vía REST API

---

## Paleta de 3 colores

| Rol | Nombre | Hex | Proporción | Uso |
|---|---|---|---|---|
| Principal | Verde SST | `#0B5B2D` oscuro / `#166534` medio / `#4ADE80` claro | 20% | Botones primarios, sidebar, ítems activos, logo, confirmaciones, estados positivos |
| Superficie | Blanco verdoso | `#FFFFFF` / `#F8FAF9` / `#F1F5F3` | 70% | Fondos, cards, formularios, áreas de contenido, espacio para respirar |
| Contraste | Grafito oscuro | `#0F172A` / `#1A2332` / `#334155` | 10% | Texto principal, sidebar fondo, tooltips, headers dark, datos duros |

**Regla de oro:** El naranja y rojo SOLO aparecen cuando los datos lo exigen (alerta, vencido, crítico). Nunca como decoración.

### Semáforo SST (colores funcionales)

| Estado | Color | Hex | Cuándo aparece |
|---|---|---|---|
| Cumple | Verde | `#166534` | KPI ≥ 80%, estado completado |
| En riesgo | Ámbar | `#D97706` | KPI 60–79%, alertas moderadas |
| Crítico | Rojo | `#DC3545` | KPI < 60%, vencidos, peligro |

### Variables CSS

Declararlas en `globals.css`. Ver archivo completo en `references/color_tokens.md`.

---

## Componentes

Todas las especificaciones detalladas están en `references/components.md`. Resumen rápido:

### Botones (4 variantes)

| Variante | Fondo | Texto | Cuándo |
|---|---|---|---|
| Primario | `#0B5B2D` | blanco | Guardar, crear, confirmar |
| Secundario | transparente + borde `#166534` | `#166534` | Ver, exportar, acciones secundarias |
| Peligro | `rgba(220,53,69,0.08)` + borde rojo | `#DC3545` | Cancelar, eliminar |
| Ghost | `var(--sst-dark-100)` | gris | Filtros, acciones terciarias |

Estilo compartido: `padding: 8px 18px`, `border-radius: 10px`, `font-size: 13px`, `font-weight: 500`.
Hover: `translateY(-1px)`. Click: `scale(0.97)`.

### Badges de estado

Patrón: pill con dot circular 6px + texto.
`padding: 3px 10px`, `border-radius: 20px`, `font-size: 11px`.
Fondo: color del estado al 8% opacidad. Texto: color sólido del estado.

Estados: Completado (verde), Programado (azul `#2563EB`), En ejecución (verde + Loader animado),
En riesgo (ámbar), Vencido (rojo), Reprogramado (púrpura `#7C3AED`), Cancelado (gris `#6B7280`).

### Badges de categoría temática

Mismo patrón de pill con dot, pero con colores de categoría:
- Alturas: `#E85D30`, Vial: `#FF8C42`, Biológico: `#1D9E75`
- Físico/Químico: `#3B8BD4`, Psicosocial: `#7C3AED`, Ergonomía: `#64748B`

### Inputs y formularios

`border-radius: 10px`, `border: 1.5px solid var(--sst-dark-300)`, `padding: 9px 14px`.
Focus: borde `#166534` + ring `rgba(22,101,52,0.1)`.
Error: borde `#DC3545` + ring rojo.

### Cards

`border-radius: 12px`, `border: 0.5px solid`, borde superior 4px con color del módulo/estado.
Hover: `translateY(-2px)` + sombra `0 4px 16px rgba(0,0,0,0.06)`.

### Tablas

Header: fondo `var(--sst-dark-100)`, texto 11px uppercase con letter-spacing, sticky top.
Hover fila: fondo verde sutil + `border-left: 3px solid #22C55E` animado.
Responsive <768px: las tablas se convierten en cards apiladas.

---

## Íconos — lucide-react

Tamaños: 18px sidebar, 16px tablas/badges, 20px headers, 14px dentro de botones.
Stroke-width: 1.5 (general) o 2 (botones/headers).
Color: hereda del texto, nunca un color fijo hardcoded.

Asignación por módulo: ver tabla completa en `references/components.md`.

Resumen: BookOpen (Capacitaciones), AlertTriangle (Incidentes), ClipboardCheck (Inspecciones),
ShieldCheck (Permisos), HardHat (EPPs), Target (Plan trabajo), HeartPulse (Eval. médicas),
BarChart3 (Indicadores), Wrench (Acciones correctivas), SearchCheck (Auditorías).

---

## Sidebar

Fondo: gradiente vertical `#0B2E1A` → `#081F10`.
Ancho: 260px expandido / 64px colapsado.
Transición: 300ms cubic-bezier(0.4, 0, 0.2, 1).

**Logo:** cuadrado redondeado 32px, fondo `#166534`, "G" en `#4ADE80`.
Texto "Guaicaramo" blanco 13px bold + "SG-SST" `#4ADE80` 9px uppercase.

**Fases PHVA** (separadores de grupo):
- Font: 9px, uppercase, letter-spacing 0.1em, monospace
- Dot 5px + texto del color de la fase con opacity 80%
- Planear: `#60A5FA`, Hacer: `#4ADE80`, Verificar: `#FBBF24`, Actuar: `#F87171`

**Ítems:**
- Inactivo: `rgba(255,255,255,0.55)`, 12px
- Hover: fondo `rgba(255,255,255,0.05)`, texto 80%
- Activo: fondo `rgba(74,222,128,0.1)`, borde izquierdo `2px solid #4ADE80`, texto blanco, ícono `#4ADE80`

**Footer:** fondo `#081F10`, avatar circular 24px con iniciales, nombre 11px, rol `#4ADE80` 9px.

**Responsive:**
- ≥1024px: fijo expandido
- 768–1023px: colapsado
- <768px: drawer con overlay `rgba(0,0,0,0.5)` + blur

---

## Animaciones

| Interacción | Especificación |
|---|---|
| Carga | Skeleton shimmer pulsante gris |
| Entrada cards/filas | Stagger fadeIn + translateY(8px→0), delay 40ms |
| Hover card | translateY(-2px) + sombra, 200ms |
| Hover fila tabla | Border-left verde 0→3px, 150ms |
| Click botón | scale(0.97), 100ms |
| Filtro cambia | Crossfade opacity 0.5→1, 200ms |
| Toast éxito | Desde arriba, fondo `#166534`, 3s y desaparece |
| Toast error | Desde arriba, fondo `#DC3545`, botón reintentar |
| Números KPI | countUp 0→valor, 800ms ease-out |
| Modal | overlay blur + scale 0.95→1, 150ms |
| Navegación páginas | fade + translateY(4px→0), 200ms (framer-motion) |

---

## Tipografía

| Uso | Tamaño | Peso |
|---|---|---|
| Header sección | 16px | 500 |
| Título card | 14px | 500 |
| Texto tabla | 13px | 400 |
| Label formulario | 12px | 500 |
| Texto secundario | 12px | 400 |
| Badges/pills | 11px | 500 |
| PHVA sidebar | 9px | 500, uppercase, monospace |

Font: Inter si importado, sino system stack (-apple-system, BlinkMacSystemFont).

---

## Reglas generales

1. No gradientes en contenido principal — solo sidebar
2. No sombras decorativas — solo funcionales en hover
3. Border-radius: 10px botones/inputs, 12px cards, 20px pills
4. Borders: siempre 0.5px solid con colores del sistema
5. Espaciado: 8px, 12px, 16px, 24px — no valores arbitrarios
6. Accesibilidad: focus-visible ring verde, aria-labels, contraste WCAG AA
7. Empty states: ícono módulo 48px al 40% + título + CTA
8. Loading: skeleton shimmer, no spinners en página completa
9. Responsive mobile-first: tablas → cards apiladas en <768px
10. Consistencia: diseñar una vez, reutilizar en todos los módulos

---

## Cómo usar este skill

### Al generar prompts para Copilot

Insertar las variables CSS de `references/color_tokens.md` al inicio del prompt, seguido de
las specs del componente específico que se va a construir sacadas de `references/components.md`.

### Al crear componentes React directamente

1. Leer `references/color_tokens.md` para las variables CSS
2. Leer `references/components.md` para las specs del componente
3. Aplicar las reglas generales de esta SKILL.md
4. Seguir la paleta de 3 colores y la proporción 70/20/10

### Al revisar diseño existente

Comparar contra las specs de este skill. Los problemas más comunes:
- Colores fuera de paleta
- Botones sin variante definida
- Badges sin dot de color
- Tablas sin hover animado
- Cards sin borde superior de color
- Inputs sin focus verde
