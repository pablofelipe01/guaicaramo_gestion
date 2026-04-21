@AGENTS.md
# Contexto del Proyecto — SG-SST Guaicaramo

> Este archivo es el contexto completo del proyecto para Claude en VS Code (`.claude/CLAUDE.md`).
> Contiene toda la información arquitectural, convenciones y especificaciones de los 22 módulos del sistema.

---

## 1. Descripción general del proyecto

**Cliente:** Guaicaramo — empresa de gran tamaño con múltiples áreas operativas.

**Sistema:** Aplicación web + móvil para la gestión del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), basada en el ciclo **PHVA** (Planear, Hacer, Verificar, Actuar).

**Marco normativo colombiano:**
- Decreto 1072 de 2015 (Decreto Único Reglamentario del Sector Trabajo)
- Resolución 0312 de 2019 (Estándares mínimos del SG-SST)
- GTC-45 (Guía para la identificación de peligros y valoración de riesgos)
- Resolución 2346 de 2007 (Evaluaciones médicas ocupacionales)
- Resolución 652 y 1356 de 2012 (Comité de Convivencia Laboral)
- Decreto 1530 de 1996 (Investigación de accidentes)
- Código Sustantivo del Trabajo (CST)

**Repositorio Trello:** [https://trello.com/b/tzUXurWR/guaicaramo](https://trello.com/b/tzUXurWR/guaicaramo)

---

## 2. Arquitectura general

### Principios de diseño
- **Cada módulo tiene su propio prefijo de tabla** — nunca comparte tablas con otro módulo.
- **Ningún módulo escribe directamente en tablas de otro** — toda comunicación es vía endpoints o eventos internos.
- **Las URLs de archivos** se almacenan como `VARCHAR(500)`, nunca binarios en la BD. El storage es externo (S3, GCS o similar).
- **FK a `users`** para todos los actores (trabajadores, responsables, aprobadores) — nunca duplicar datos de personas.
- **Conservación Documental es el repositorio central** — todos los módulos suben archivos vía `POST /api/sst/documentos`.

### Prefijos de tabla por módulo

| Módulo | Prefijo |
|---|---|
| Evaluación inicial | `sst_eval_` |
| Plan de trabajo anual | `sst_plan_` |
| Comité de convivencia | `sst_ccl_` |
| Capacitaciones | `sst_cap_` |
| Presupuesto | `sst_ppto_` |
| Matriz legal | `sst_legal_` |
| Gestión del cambio | `sst_cambio_` |
| Conservación documental | `sst_doc_` |
| Contratistas | `sst_cont_` |
| Evaluaciones médicas | `sst_med_` |
| Perfiles de cargo | `sst_cargo_` |
| Seguimiento casos médicos | `sst_caso_` |
| Investigación incidentes/AT | `sst_inc_` |
| Matriz IPVR | `sst_ipvr_` |
| Inspecciones | `sst_insp_` |
| EPPs y dotación | `sst_epp_` |
| Permisos de trabajo | `sst_perm_` |
| Indicadores | `sst_ind_` |
| Auditorías | `sst_aud_` |
| Acciones correctivas | `sst_ac_` |

### Regla de oro de integraciones
```
MÓDULO A  ──[GET /api/modulo-b/recurso]──>  MÓDULO B   ✅
MÓDULO A  ──[INSERT INTO tabla_b]────────>  MÓDULO B   ❌
```

---

## 3. Estructura del sistema por ciclo PHVA

### 🔵 PLANEAR (9 módulos)

#### 3.1 Módulo de evaluación inicial del SG-SST
**Prefijo:** `sst_eval_` | **Fecha límite:** 13 mayo 2026

Diagnóstico del cumplimiento frente a la Resolución 0312 organizados por ciclo PHVA. Genera informe de brechas como línea base del plan de trabajo anual.

**Tablas:**
- `sst_eval_evaluaciones` — evaluaciones con puntaje y nivel (crítico/moderado/aceptable)
- `sst_eval_estandares` — catálogo de estándares Res. 0312 con peso porcentual
- `sst_eval_respuestas` — respuestas por estándar (cumple/no_cumple/parcial) con evidencia

**Endpoints principales:**
```
GET    /api/sst/evaluaciones
POST   /api/sst/evaluaciones
PUT    /api/sst/evaluaciones/:id/cerrar     → calcula puntaje automáticamente
GET    /api/sst/evaluaciones/:id/informe    → PDF de brechas
POST   /api/sst/evaluaciones/:id/respuestas
```

**Integra con:** Plan de trabajo (lee evaluación vía FK), Conservación Documental (sube evidencias).

---

#### 3.2 Módulo de plan de trabajo anual del SG-SST
**Prefijo:** `sst_plan_` | **Fecha límite:** 13 mayo 2026

Construcción y seguimiento del plan anual vinculado a brechas de evaluación inicial. Control de cumplimiento por actividad, responsable y recurso.

**Tablas:**
- `sst_plan_planes` — plan anual vinculado a evaluación inicial
- `sst_plan_actividades` — actividades con responsable, mes, ciclo PHVA, costo y % avance

**Endpoints principales:**
```
GET    /api/sst/planes
POST   /api/sst/planes
POST   /api/sst/planes/:id/actividades
PUT    /api/sst/actividades/:id
GET    /api/sst/planes/:id/dashboard        → % cumplimiento por categoría
GET    /api/sst/planes/:id/exportar         → PDF/Excel
```

**Integra con:** Evaluación inicial (FK), Presupuesto (lee costos), Indicadores (consume dashboard).

---

#### 3.3 Módulo de gestión del comité de convivencia laboral
**Prefijo:** `sst_ccl_` | **Fecha límite:** 13 mayo 2026

Gestión del Comité de Convivencia Laboral: conformación, reuniones bimestrales, actas, compromisos y casos confidenciales de convivencia (Res. 652 y 1356/2012).

**Tablas:**
- `sst_ccl_comites` — comité con vigencia de 2 años
- `sst_ccl_integrantes` — roles: presidente, secretario, rep. empleador, rep. trabajador
- `sst_ccl_reuniones` — ordinarias y extraordinarias con acta
- `sst_ccl_compromisos` — seguimiento a compromisos de cada reunión
- `sst_ccl_casos` — casos confidenciales de convivencia

**Endpoints principales:**
```
GET    /api/sst/ccl/comite/activo
POST   /api/sst/ccl/reuniones
POST   /api/sst/ccl/reuniones/:id/compromisos
POST   /api/sst/ccl/casos                   → acceso restringido
```

**Alerta clave:** 30 días antes del vencimiento de la vigencia del comité.

---

#### 3.4 Módulo de programa de capacitación anual en SST
**Prefijo:** `sst_cap_` | **Fecha límite:** 13 mayo 2026

Planeación, ejecución y control del programa anual de capacitaciones con registro de asistencia (firma digital) y evaluación de efectividad.

**Tablas:**
- `sst_cap_programas` — programa anual
- `sst_cap_capacitaciones` — sesiones con tipo (inducción/reinducción/periódica/específica)
- `sst_cap_poblacion` — segmentación por cargo, área o todos
- `sst_cap_asistencias` — asistencia por trabajador con firma_url y nota de evaluación

**Endpoints principales:**
```
POST   /api/sst/capacitaciones/:id/asistencias
GET    /api/sst/capacitaciones/cobertura    → % por cargo/área/temática
GET    /api/sst/capacitaciones/:id/reporte  → PDF con validez legal
```

---

#### 3.5 Módulo de presupuesto y seguimiento financiero del SG-SST
**Prefijo:** `sst_ppto_` | **Fecha límite:** 13 mayo 2026

Planeación y seguimiento del presupuesto anual del SG-SST por rubros categorizados (EPPs, capacitación, médico, consultoría, infraestructura).

**Tablas:**
- `sst_ppto_presupuestos` — presupuesto anual vinculado al plan
- `sst_ppto_rubros` — rubros categorizados por tipo de gasto
- `sst_ppto_ejecuciones` — gastos ejecutados con soporte documental

**Alertas:** Sobrejecución >80% y subejecución <50% por rubro.

---

#### 3.6 Módulo de matriz legal y cumplimiento de requisitos SST
**Prefijo:** `sst_legal_` | **Fecha límite:** 13 mayo 2026

Gestión de requisitos legales aplicables (Decreto 1072, Res. 0312, etc.) con estado de cumplimiento, evidencias y exportación para entes de control.

**Tablas:**
- `sst_legal_requisitos` — catálogo maestro de normas y obligaciones
- `sst_legal_cumplimientos` — estado por requisito con evidencia y próxima revisión

**Integra con:** Auditorías (lee alertas de incumplimiento como hallazgos).

---

#### 3.7 Módulo de gestión del cambio en el SG-SST
**Prefijo:** `sst_cambio_` | **Fecha límite:** 13 mayo 2026

Identificación, evaluación y aprobación de cambios organizacionales/tecnológicos que puedan generar nuevos peligros. Flujo: solicitante → coordinador SST → gerencia.

**Tablas:**
- `sst_cambio_cambios` — cambios con tipo ENUM(organizacional/tecnologico/proceso/infraestructura/otro)
- `sst_cambio_aprobaciones` — decisiones del flujo de aprobación
- `sst_cambio_controles` — controles implementados con evidencia

**Integra con:** IPVR (notifica cuando requiere análisis de riesgo), Acciones Correctivas (crea acciones si hay controles pendientes).

---

#### 3.8 Módulo de conservación documental del SG-SST ⭐ TRANSVERSAL
**Prefijo:** `sst_doc_` | **Fecha límite:** 13 mayo 2026

**Repositorio central de todos los documentos del sistema.** Todos los módulos escriben aquí vía `POST /api/sst/documentos` — nunca acceso directo a storage desde otros módulos.

**Tablas:**
- `sst_doc_documentos` — documentos con tipo, módulo_origen, versión y URL
- `sst_doc_trd` — Tabla de Retención Documental con años_retencion y disposición final
- `sst_doc_accesos` — control de acceso por rol

**Endpoints principales:**
```
POST   /api/sst/documentos                  → único punto de entrada para todos los módulos
GET    /api/sst/documentos                  → búsqueda por módulo, tipo, área, fecha
GET    /api/sst/documentos/alertas/retencion → documentos próximos a vencer retención
```

**Versionado:** Actualizar un documento crea nueva versión conservando la anterior.

---

#### 3.9 Módulo de gestión de contratistas en el SG-SST
**Prefijo:** `sst_cont_` | **Fecha límite:** 13 mayo 2026

Gestión de requisitos SST de contratistas: documentos (ARL, EPS, pensión, SGSST), semáforo de cumplimiento, inducción del personal y seguimiento durante el contrato.

**Tablas:**
- `sst_cont_contratistas` — empresas contratistas (no son usuarios del sistema)
- `sst_cont_contratos` — contratos con área de trabajo y supervisor
- `sst_cont_documentos` — documentos vigentes/vencidos del contratista
- `sst_cont_trabajadores` — personal del contratista con control de inducción

**Endpoint crítico:** `GET /api/sst/contratistas/:id/semaforo` — consultado por Permisos de Trabajo antes de emitir un permiso. Si es rojo → permiso bloqueado.

---

### 🟢 HACER (8 módulos)

#### 3.10 Módulo de evaluaciones médicas ocupacionales
**Prefijo:** `sst_med_` | **Fecha límite:** 13 mayo 2026

Gestión del ciclo de evaluaciones médicas: ingreso, periódicas, retiro, post-incapacidad y cambio de cargo (Res. 2346/2007).

**Tabla principal:** `sst_med_evaluaciones`
- `aptitud` ENUM: `apto | apto_con_restricciones | no_apto`
- `tipo` ENUM: `ingreso | periodico | retiro | post_incapacidad | cambio_cargo`
- **Confidencialidad:** Solo coordinador SST y médico ven el concepto. Jefe de área solo ve restricciones.

**Integra con:**
- Perfiles de Cargo → periodicidad de exámenes
- Seguimiento Casos Médicos → cuando aptitud = `apto_con_restricciones` crea caso automáticamente
- Permisos de Trabajo → verifica restricciones antes de aprobar permiso

---

#### 3.11 Módulo de perfiles de cargo con requisitos SST
**Prefijo:** `sst_cargo_` | **Fecha límite:** 13 mayo 2026

**Fuente de verdad** para peligros, EPPs obligatorios, exámenes médicos y capacitaciones por cargo. Los demás módulos solo leen.

**Tablas:**
- `sst_cargo_perfiles` — perfil con nivel_riesgo ARL (1-5) y vinculo a cargo de nómina/RRHH
- `sst_cargo_peligros` — peligros específicos del cargo
- `sst_cargo_epps` — EPPs obligatorios con frecuencia de reposición
- `sst_cargo_examenes` — tipos de examen y periodicidad en meses

---

#### 3.12 Módulo de seguimiento a casos médicos laborales
**Prefijo:** `sst_caso_` | **Fecha límite:** 13 mayo 2026

Seguimiento de trabajadores con restricciones, enfermedades laborales en calificación o incapacidades prolongadas. **Datos confidenciales.**

**Tablas:**
- `sst_caso_casos` — tipo ENUM: `restriccion | reubicacion | calificacion_el | incapacidad_prolongada`
- `sst_caso_seguimientos` — notas de evolución periódicas
- `sst_caso_calificaciones` — proceso ante ARL, junta_regional, junta_nacional con % PCL

---

#### 3.13 Módulo de investigación de incidentes y accidentes de trabajo
**Prefijo:** `sst_inc_` | **Fecha límite:** 13 mayo 2026

Reporte inmediato (móvil/web), investigación con árbol de causas o 5 porqués, generación automática de FURAT y estadísticas de accidentalidad.

**Tablas:**
- `sst_inc_incidentes` — tipo ENUM: `incidente | accidente_trabajo | enfermedad_laboral`
- `sst_inc_investigaciones` — metodología ENUM: `arbol_causas | cinco_porques | taproot | otro`

**Indicadores calculados:** IF, IS, ILT, ILAT por período y área.

**Integra con:** Acciones Correctivas (crea acciones al cerrar investigación), Seguimiento Casos Médicos (crea caso si hay incapacidad), Indicadores (consume estadísticas).

---

#### 3.14 Módulo de matriz de identificación de peligros y valoración de riesgos (IPVR)
**Prefijo:** `sst_ipvr_` | **Fecha límite:** 13 mayo 2026

**Fuente de verdad de peligros y riesgos.** Metodología GTC-45 con valoración cuantitativa automática.

**Tabla principal:** `sst_ipvr_registros`
- Campos de valoración: `nd` (Nivel Deficiencia), `ne` (Exposición), `np = nd×ne` (Probabilidad), `nc` (Consecuencia), `nr = np×nc` (Riesgo)
- `nivel_intervencion` ENUM: `I | II | III | IV`
- Riesgos **Nivel I** → alerta automática + acción correctiva

---

#### 3.15 Módulo de inspecciones de seguridad
**Prefijo:** `sst_insp_` | **Fecha límite:** 13 mayo 2026

Listas de chequeo configurables, ejecución desde móvil con registro fotográfico, hallazgos con responsable y cierre aprobado por coordinador SST.

**Tablas:**
- `sst_insp_tipos` — tipos configurables de inspección
- `sst_insp_checklist_items` — ítems con flag `critico`
- `sst_insp_inspecciones` — inspecciones programadas/realizadas
- `sst_insp_respuestas` — respuesta por ítem
- `sst_insp_hallazgos` — criticidad ENUM: `baja | media | alta | critica`; hallazgos `alta/critica` → acción correctiva automática

---

#### 3.16 Módulo de entrega y control de EPPs y dotación
**Prefijo:** `sst_epp_` | **Fecha límite:** 13 mayo 2026

Trazabilidad completa de entrega de EPPs con firma digital. Control de inventario, vida útil y periodicidad de dotación (cada 4 meses según CST).

**Tablas:**
- `sst_epp_catalogo` — tipo ENUM: `epp | dotacion`
- `sst_epp_inventario` — stock por talla/referencia
- `sst_epp_entregas` — motivo ENUM: `ingreso | reposicion | deterioro | perdida | dotacion_periodica`

**Alerta:** EPPs próximos a vencer con 15 días de anticipación.

---

#### 3.17 Módulo de permisos de trabajo — actividades de alto riesgo
**Prefijo:** `sst_perm_` | **Fecha límite:** 13 mayo 2026

Emisión, aprobación y cierre de permisos para alturas, espacios confinados, trabajo en caliente, LOTO y excavaciones. Verificación automática de prerrequisitos antes de habilitar aprobación.

**Tablas:**
- `sst_perm_tipos` — tipos configurables con flag `requiere_aprobacion_gerencia`
- `sst_perm_permisos` — estado ENUM: `borrador | pendiente_aprobacion | aprobado | rechazado | en_ejecucion | cerrado | vencido`
- `sst_perm_trabajadores` — verificación de EPPs y competencias por trabajador

**Bloqueos automáticos:**
- EPPs del trabajador vencidos → permiso bloqueado
- Contratista con semáforo rojo → permiso bloqueado
- Trabajador con restricción médica incompatible → permiso bloqueado

**Flujo de firmas:** Solicitante → Coordinador SST → Gerencia (si aplica)

---

### 🟡 VERIFICAR (2 módulos)

#### 3.18 Módulo de indicadores y dashboard del SG-SST
**Prefijo:** `sst_ind_` | **Fecha límite:** 6 mayo 2026

**Módulo 100% de solo lectura.** Calcula y visualiza indicadores del SG-SST con semáforo vs. meta. Cachea resultados en snapshots.

**Tablas:**
- `sst_ind_indicadores` — indicadores con fórmula, meta, unidad y frecuencia
- `sst_ind_snapshots` — valores calculados por período con flag `cumple_meta`

**Indicadores mínimos Res. 0312:**

| Indicador | Fórmula | Fuente |
|---|---|---|
| IF (Frecuencia AT) | (N° AT × 240.000) / HHT | `sst_inc_incidentes` |
| IS (Severidad AT) | (Días perdidos × 240.000) / HHT | `sst_inc_incidentes` |
| ILT (Incidencia EL) | (N° EL × 100) / N° trabajadores | `sst_inc_incidentes` |
| Cobertura capacitaciones | (Capacitados / Total) × 100 | `sst_cap_asistencias` |
| Cumplimiento plan anual | (Actividades cerradas / Total) × 100 | `sst_plan_actividades` |
| Ejecución presupuestal | (Ejecutado / Presupuestado) × 100 | `sst_ppto_ejecuciones` |
| Cierre acciones correctivas | (Cerradas a tiempo / Total) × 100 | `sst_ac_acciones` |
| Inspecciones realizadas | (Realizadas / Programadas) × 100 | `sst_insp_inspecciones` |

---

#### 3.19 Módulo de auditorías internas y externas del SG-SST
**Prefijo:** `sst_aud_` | **Fecha límite:** 6 mayo 2026

Planeación y ejecución de auditorías con listas de verificación configurables por estándar. Clasifica hallazgos en no conformidades mayor/menor/observación.

**Tablas:**
- `sst_aud_auditorias` — tipo ENUM: `interna | externa`
- `sst_aud_items` — ítems de verificación configurables por estándar
- `sst_aud_evaluaciones` — resultado ENUM: `conforme | no_conforme_mayor | no_conforme_menor | observacion | no_aplica`
- `sst_aud_no_conformidades` — con FK a `sst_ac_acciones` una vez generada la acción

**Al cerrar auditoría:** las no conformidades crean automáticamente acciones correctivas vía `POST /api/sst/acciones` con `origen = 'auditoria'`.

---

### 🔴 ACTUAR (1 módulo)

#### 3.20 Módulo de acciones correctivas, preventivas y de mejora
**Prefijo:** `sst_ac_` | **Fecha límite:** 6 mayo 2026

**Hub central de mejora continua.** Recibe acciones de todos los módulos vía `POST /api/sst/acciones`. Gestiona el ciclo completo hasta la verificación de eficacia.

**Tablas:**
- `sst_ac_acciones`:
  - `tipo` ENUM: `correctiva | preventiva | mejora`
  - `origen` ENUM: `auditoria | inspeccion | investigacion_at | ipvr | otro`
  - `prioridad` ENUM: `baja | media | alta | critica`
  - `estado` ENUM: `pendiente | en_proceso | ejecutada | verificada | cerrada | vencida | reabierta`
- `sst_ac_seguimientos` — notas de avance periódicas

**Flujo de cierre:** Ejecutada (responsable) → Verificada (coordinador SST confirma eficacia) → Cerrada

**Regla crítica:** La verificación de eficacia es **obligatoria** antes del cierre definitivo.

---

## 4. Mapa de integraciones entre módulos

```
Evaluación Inicial ──FK──────────────────> Plan de Trabajo
Plan de Trabajo ──lectura──────────────> Presupuesto
Plan de Trabajo ──lectura──────────────> Indicadores

Perfiles de Cargo ──lectura────────────> Evaluaciones Médicas (periodicidad)
Perfiles de Cargo ──lectura────────────> EPPs (EPPs obligatorios)
Perfiles de Cargo ──lectura────────────> Capacitaciones (población objetivo)

IPVR ──Nivel I──[POST /acciones]───────> Acciones Correctivas
IPVR ──notificación────────────────────> Gestión del Cambio

Inspecciones ──alta/crítica────────────> Acciones Correctivas
Auditorías ──no conformidades──────────> Acciones Correctivas
Investigación AT ──cierre──────────────> Acciones Correctivas
Gestión del Cambio ──controles────────> Acciones Correctivas

Evaluaciones Médicas ──restricción─────> Seguimiento Casos Médicos
Investigación AT ──incapacidad─────────> Seguimiento Casos Médicos

Contratistas ──semáforo────────────────> Permisos de Trabajo (bloqueo)
EPPs ──vigencia────────────────────────> Permisos de Trabajo (bloqueo)
Evaluaciones Médicas ──restricción─────> Permisos de Trabajo (bloqueo)

Todos los módulos ──[POST /documentos]─> Conservación Documental ⭐

Incidentes ──estadísticas──────────────> Indicadores
Capacitaciones ──cobertura─────────────> Indicadores
Plan de Trabajo ──dashboard────────────> Indicadores
Presupuesto ──ejecución────────────────> Indicadores
Acciones Correctivas ──eficacia────────> Indicadores
Inspecciones ──estadísticas────────────> Indicadores

Matriz Legal ──alertas─────────────────> Auditorías (como hallazgos)
```

---

## 5. Convenciones de código

### Nomenclatura de tablas
- Siempre con prefijo del módulo: `sst_[modulo]_[entidad]`
- Plural para tablas de registros: `sst_inc_incidentes`, `sst_cap_asistencias`
- Singular para catálogos maestros: `sst_epp_catalogo`, `sst_doc_trd`

### Tipos de datos estándar
- `id` → `UUID PK` siempre
- Claves foráneas → `UUID FK → tabla_referenciada required/nullable`
- Enumeraciones → `ENUM('valor1','valor2')` — siempre documentar valores posibles
- URLs de archivos → `VARCHAR(500) nullable`
- Porcentajes → `INTEGER` (0–100) o `DECIMAL(5,2)`
- Valores monetarios → `DECIMAL(14,2)`
- Timestamps de creación → `TIMESTAMP required`
- Fechas → `DATE`; Fecha+hora → `DATETIME`

### Convención de endpoints
```
GET    /api/sst/{modulo}                    → listar con filtros opcionales
POST   /api/sst/{modulo}                    → crear registro
GET    /api/sst/{modulo}/:id               → detalle
PUT    /api/sst/{modulo}/:id               → actualizar
PUT    /api/sst/{modulo}/:id/{acción}      → transiciones de estado (aprobar, cerrar, etc.)
GET    /api/sst/{modulo}/alertas           → registros que requieren atención
GET    /api/sst/{modulo}/estadisticas      → métricas agregadas
GET    /api/sst/{modulo}/:id/exportar      → PDF o Excel
```

### Alertas — tiempos estándar
- Documentos de contratistas vencidos o próximos → 30 días
- Exámenes médicos vencidos o próximos → 30 días
- Vigencia del Comité de Convivencia → 30 días
- EPPs próximos a vencer → 15 días
- Actividades del plan próximas a vencer → notificación al responsable

---

## 6. Roles de usuario del sistema

| Rol | Acceso principal |
|---|---|
| Coordinador SST | Acceso total al sistema |
| Jefe de área | Su área, restricciones médicas (sin diagnóstico), hallazgos de inspección |
| Trabajador | Sus evaluaciones médicas (solo aptitud), historial de EPPs, capacitaciones |
| Gerencia | Dashboards, indicadores, reportes ejecutivos, aprobación de permisos especiales |
| Auditor | Módulo de auditorías, acceso de solo lectura a todos los módulos |
| Contratista | Formulario externo de carga de documentos (sin login de empleado) |
| Médico ocupacional | Evaluaciones médicas completas, casos médicos |

**Datos confidenciales:**
- Conceptos médicos completos → solo coordinador SST y médico ocupacional
- Restricciones laborales → también jefe de área del trabajador
- Casos de convivencia laboral → solo integrantes del comité y coordinador SST

---

## 7. Stack tecnológico (por confirmar con el equipo)

> El stack no ha sido definido formalmente. Las especificaciones técnicas de las tarjetas son agnósticas al framework pero asumen:
> - Base de datos relacional con soporte de UUID como PK
> - Storage externo para archivos (S3, GCS o similar)
> - API REST como mecanismo principal de comunicación entre módulos
> - Soporte móvil para módulos de campo (inspecciones, permisos, incidentes)
> - Generación de PDF para informes, FURAT, permisos y reportes

---

## 8. Estado del proyecto

| Fase | Estado |
|---|---|
| Levantamiento de requerimientos | ✅ Completado |
| Especificación técnica de los 22 módulos | ✅ Completado |
| Definición de arquitectura e integraciones | ✅ Completado |
| Priorización del MVP | ⏳ Pendiente |
| Desarrollo | ⏳ No iniciado |

**Todas las tarjetas en Trello tienen estado actual:** `Sin avance previo. El desarrollador debe verificar si existe estructura parcial antes de iniciar.`

---

## 9. Instrucciones para Claude en VS Code

Cuando trabajes en este proyecto:

1. **Nunca crear tablas sin prefijo** del módulo correspondiente.
2. **Nunca escribir directamente en tablas de otro módulo** — usa el endpoint del módulo dueño.
3. **Siempre referenciar por FK** a la tabla `users` para actores humanos.
4. **Los archivos se suben vía** `POST /api/sst/documentos` — nunca almacenar binarios en BD.
5. **Antes de crear una tabla nueva**, verificar si ya existe una en el esquema.
6. **Las alertas automáticas** son parte del contrato funcional de cada módulo — implementarlas.
7. **El FURAT** (módulo de incidentes) debe generarse automáticamente en PDF al cerrar una investigación.
8. **Los permisos de trabajo** verifican 3 condiciones antes de habilitarse para aprobación: EPPs vigentes, semáforo contratista verde, sin restricciones médicas incompatibles.
9. **La verificación de eficacia** de acciones correctivas es obligatoria antes del cierre.
10. **Los datos médicos confidenciales** nunca se exponen a jefes de área — solo restricciones laborales.