'use client'

import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const revealEls = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const delay = el.dataset.delay || '0'
          el.style.transitionDelay = delay + 'ms'
          el.classList.add('visible')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    revealEls.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    function animateCount(el: HTMLElement, end: number, duration = 1500) {
      const prefix = el.dataset.prefix || ''
      const suffix = el.dataset.suffix || ''
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) { el.textContent = prefix + end + suffix; return }
      const t0 = performance.now()
      function frame(now: number) {
        const p = Math.min(1, (now - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        const val = Math.round(eased * end)
        el.textContent = prefix + val + suffix
        if (p < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }
    const kpiIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const end = +(el.dataset.count || '0')
          animateCount(el, end, 1600)
          kpiIo.unobserve(entry.target)
        }
      })
    }, { threshold: 0.5 })
    document.querySelectorAll<HTMLElement>('.kpi-number[data-count]').forEach(el => kpiIo.observe(el))
    return () => kpiIo.disconnect()
  }, [])

  return (
    <>
      <style>{CSS}</style>

      {/* ===== NAVBAR ===== */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="Navegación principal">
        <div className="container nav-inner">
          <a href="#top" className="logo" aria-label="Guaicaramo, inicio">
            <img src="/guaicaramo-logo.png" alt="Guaicaramo" style={{ height: 42, width: 'auto', display: 'block' }} />
          </a>
          <div className="nav-links">
            <a href="#procesos">Procesos</a>
            <a href="#modulos">Módulos</a>
            <a href="#phva">Ciclo PHVA</a>
            <a href="#nosotros">Nosotros</a>
          </div>
          <a href="/auth" className="nav-cta">Iniciar sesión →</a>
          <button
            className="nav-toggle"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ===== MOBILE MENU ===== */}
      <aside className={`mobile-menu${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
        <button
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 8 }}
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <a href="#procesos" onClick={() => setMobileOpen(false)}>Procesos</a>
        <a href="#modulos" onClick={() => setMobileOpen(false)}>Módulos</a>
        <a href="#phva" onClick={() => setMobileOpen(false)}>Ciclo PHVA</a>
        <a href="#nosotros" onClick={() => setMobileOpen(false)}>Nosotros</a>
        <a href="/auth" onClick={() => setMobileOpen(false)} style={{ marginTop: 20, background: '#4ADE80', color: '#052E16', textAlign: 'center', borderRadius: 6, fontWeight: 700 }}>
          Iniciar sesión →
        </a>
      </aside>

      <main id="top">
        {/* ===== HERO ===== */}
        <section className="hero" aria-label="Hero">
          <div className="hero-orbs">
            <div className="hero-conic"></div>
            <div className="hero-grid"></div>
            <div className="hero-beam"></div>
            <div className="hero-rings" aria-hidden="true"></div>
            <div className="hero-particles" aria-hidden="true">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
          <div className="glow-overlay"></div>

          <div className="container hero-inner">
            <span className="badge"><span className="dot"></span>Guaicaramo · SG-SST · Tecnología que cuida</span>
            <h1>
              <span className="line line-1">Cuidamos a quienes</span>
              <span className="line line-2">mueven Guaicaramo.</span>
            </h1>
            <p className="hero-sub">
              La plataforma SG-SST de Guaicaramo: tecnología hecha para que cada trabajador llegue seguro, vuelva a casa sano y todo el equipo crezca con respaldo.
            </p>
            <div className="hero-stats">
              <span>Res. <b>0312</b></span>
              <span className="sep"></span>
              <span>Decreto <b>1072/15</b></span>
              <span className="sep"></span>
              <span><b>ISO</b> 45001</span>
            </div>
            <div className="hero-ctas">
              <a href="/auth" className="btn btn-primary btn-large">Iniciar sesión <span className="arrow">→</span></a>
            </div>
          </div>

          <div className="scroll-indicator" aria-hidden="true">
            <span>Scroll</span>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none"><path d="M1 1 L9 8 L17 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none"><path d="M1 1 L9 8 L17 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <section className="trust" aria-label="Alineación normativa">
          <div className="container trust-inner">
            <span className="trust-label">Alineado con</span>
            <div className="trust-logos">
              <span className="trust-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 L4 6 V13 C4 17 7.5 20.5 12 22 C16.5 20.5 20 17 20 13 V6 Z"/></svg>
                ARL · SURA
              </span>
              <span className="trust-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 21 V19 C5 16 8 14 12 14 C16 14 19 16 19 19 V21"/></svg>
                SENA
              </span>
              <span className="trust-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21 H21 M5 21 V10 L12 5 L19 10 V21"/></svg>
                MinTrabajo
              </span>
              <span className="trust-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12 L11 14 L15 10"/><circle cx="12" cy="12" r="9"/></svg>
                ISO 45001
              </span>
              <span className="trust-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                Decreto 1072
              </span>
              <span className="trust-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7 H20 M4 12 H20 M4 17 H14"/></svg>
                GTC-45
              </span>
            </div>
          </div>
        </section>

        {/* ===== PROBLEMA / SOLUCIÓN ===== */}
        <section className="problem-solution" id="procesos" aria-label="Problema y solución">
          <div className="container">
            <div className="section-header scroll-reveal">
              <p className="eyebrow">Antes / Después</p>
              <h2>Del papel al pulso digital.</h2>
              <p className="lead">La diferencia entre administrar la seguridad y vivirla todos los días junto al equipo.</p>
            </div>

            <div className="ps-stage scroll-reveal">
              {/* ANTES */}
              <div className="ps-panel before">
                <span className="ps-tag"><span className="dot"></span>Antes · Operación manual</span>
                <h2 className="ps-heading">Procesos que <em>frenan</em><br/>al equipo.</h2>
                <ul className="ps-items">
                  {[
                    { n: '01', title: 'Reportes manuales repetidos', desc: 'Horas perdidas armando lo mismo cada semana.' },
                    { n: '02', title: 'Información fragmentada', desc: 'Datos atrapados entre sedes, Excel y carpetas físicas.' },
                    { n: '03', title: 'Decisiones a destiempo', desc: 'Los indicadores llegan cuando ya pasó el turno.' },
                    { n: '04', title: 'Dependencia de una sola persona', desc: 'Si no está, todo el flujo se detiene.' },
                    { n: '05', title: 'Seguimiento que cuesta más que ejecutar', desc: 'Capacitar, firmar y archivar consume el día.' },
                  ].map(item => (
                    <li key={item.n} className="ps-item">
                      <div className="ps-icon">{item.n}</div>
                      <div className="ps-item-text">
                        <div className="ps-item-title">{item.title}</div>
                        <div className="ps-item-desc">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* BRIDGE */}
              <div className="ps-bridge" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12 H19"/><path d="M13 6 L19 12 L13 18"/>
                </svg>
              </div>

              {/* DESPUÉS */}
              <div className="ps-panel after">
                <span className="ps-tag"><span className="dot"></span>Con Guaicaramo · Operación viva</span>
                <h2 className="ps-heading">Procesos que <em>impulsan</em><br/>al equipo.</h2>
                <ul className="ps-items">
                  {[
                    { title: 'Automatización del trabajo repetitivo', desc: 'Menos errores, más tiempo para lo que importa.' },
                    { title: 'Una sola fuente de verdad', desc: 'Toda la operación accesible desde cualquier dispositivo.' },
                    { title: 'Indicadores en tiempo real', desc: 'Decisiones con datos vivos, no históricos.' },
                    { title: 'Procesos que cualquiera ejecuta', desc: 'Estandarización que vuelve al equipo intercambiable y resiliente.' },
                    { title: 'Aprendizaje continuo', desc: 'Cada acción se convierte en datos para el próximo turno.' },
                  ].map((item, i) => (
                    <li key={i} className="ps-item">
                      <div className="ps-icon">✓</div>
                      <div className="ps-item-text">
                        <div className="ps-item-title">{item.title}</div>
                        <div className="ps-item-desc">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FOOT STATS */}
            <div className="ps-footstats scroll-reveal">
              <div className="ps-stat">
                <div className="ps-stat-num">−68%</div>
                <div className="ps-stat-divider"></div>
                <div className="ps-stat-label">Tiempo en reportes y trámites manuales</div>
              </div>
              <div className="ps-stat">
                <div className="ps-stat-num">×3</div>
                <div className="ps-stat-divider"></div>
                <div className="ps-stat-label">Velocidad para detectar y cerrar hallazgos</div>
              </div>
              <div className="ps-stat">
                <div className="ps-stat-num">100%</div>
                <div className="ps-stat-divider"></div>
                <div className="ps-stat-label">Trazabilidad de cada acción del equipo</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== MÓDULOS ===== */}
        <section className="modules" id="modulos" aria-label="Módulos">
          <div className="container">
            <div className="section-header scroll-reveal">
              <p className="eyebrow">22 módulos · 1 ecosistema</p>
              <h2><span className="accent">22 módulos.</span> Una sola misión: cuidar al equipo.</h2>
              <p className="lead">Cada herramienta conecta personas, datos y decisiones. Menos formularios, más tiempo para cuidar.</p>
            </div>
            <div className="modules-grid">
              {[
                { phase: 'p', label: 'Planear', stroke: '#4A86BE', title: 'Evaluación Inicial', desc: 'Diagnóstico Res. 0312 con puntaje y plan de cierre.', delay: 0,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#4A86BE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="20" height="24" rx="2"/><path d="M11 4 V2 H21 V4"/><line x1="11" y1="12" x2="22" y2="12"/><line x1="11" y1="17" x2="22" y2="17"/><line x1="11" y1="22" x2="18" y2="22"/></svg> },
                { phase: 'p', label: 'Planear', stroke: '#4A86BE', title: 'Matriz IPVR', desc: 'Identificación de peligros y valoración de riesgos.', delay: 80,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#4A86BE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 26 H28"/><rect x="6" y="14" width="4" height="12"/><rect x="14" y="8" width="4" height="18"/><rect x="22" y="18" width="4" height="8"/></svg> },
                { phase: 'h', label: 'Hacer', stroke: '#22C55E', title: 'Gestión de Incidentes', desc: 'Reporte, investigación y trazabilidad completa.', delay: 160,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4 L28 26 H4 Z"/><line x1="16" y1="13" x2="16" y2="19"/><circle cx="16" cy="22.5" r="1" fill="currentColor"/></svg> },
                { phase: 'h', label: 'Hacer', stroke: '#22C55E', title: 'Capacitaciones', desc: 'Plan anual, QR de asistencia y certificados PDF.', delay: 240,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4 L29 11 L16 18 L3 11 Z"/><path d="M8 14 V22 C8 22 11 26 16 26 C21 26 24 22 24 22 V14"/></svg> },
                { phase: 'h', label: 'Hacer', stroke: '#22C55E', title: 'Permisos de Trabajo', desc: 'Alturas, espacios confinados y trabajos en caliente.', delay: 320,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="6" width="22" height="20" rx="2"/><line x1="5" y1="12" x2="27" y2="12"/><path d="M9 18 L14 23 L23 14"/></svg> },
                { phase: 'v', label: 'Verificar', stroke: '#FF8C42', title: 'Inspecciones', desc: 'Checklists por área, hallazgos y plan de acción.', delay: 400,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#FF8C42" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="14" r="8"/><line x1="20" y1="20" x2="27" y2="27"/></svg> },
                { phase: 'v', label: 'Verificar', stroke: '#FF8C42', title: 'Indicadores SST', desc: 'KPIs en tiempo real con alertas por umbral.', delay: 480,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#FF8C42" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="24" height="24" rx="2"/><line x1="10" y1="22" x2="10" y2="14"/><line x1="16" y1="22" x2="16" y2="10"/><line x1="22" y1="22" x2="22" y2="17"/></svg> },
                { phase: 'v', label: 'Verificar', stroke: '#FF8C42', title: 'Auditorías', desc: 'Internas y externas con cronograma y hallazgos.', delay: 560,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#FF8C42" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6 H26 V10 L20 16 L26 22 V26 H6 V22 L12 16 L6 10 Z"/></svg> },
                { phase: 'a', label: 'Actuar', stroke: '#4ADE80', title: 'Acciones Correctivas', desc: 'Causa raíz, responsable, plazo y evidencia de cierre.', delay: 640,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="12"/><path d="M10 16 L14 20 L22 12"/></svg> },
                { phase: 'a', label: 'Actuar', stroke: '#4ADE80', title: 'COPASST · CCL', desc: 'Conformación, reuniones, actas y votaciones.', delay: 720,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="4"/><circle cx="22" cy="13" r="3"/><path d="M3 27 C3 22 7 19 11 19 C15 19 19 22 19 27"/><path d="M17 27 C17 23 19 21 22 21 C25 21 28 23 28 26"/></svg> },
                { phase: 'a', label: 'Actuar', stroke: '#4ADE80', title: 'Revisión Gerencial', desc: 'Resumen ejecutivo y compromisos del comité.', delay: 800,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3 L27 9 V23 L16 29 L5 23 V9 Z"/><circle cx="16" cy="16" r="4"/></svg> },
                { phase: 'h', label: 'Hacer', stroke: '#22C55E', title: 'EPP · Dotación', desc: 'Entrega, reposición y firma digital del trabajador.', delay: 880,
                  icon: <svg className="mod-icon" viewBox="0 0 32 32" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="10" width="20" height="16" rx="2"/><path d="M10 10 V6 C10 4 12 3 16 3 C20 3 22 4 22 6 V10"/><circle cx="16" cy="17" r="1.5" fill="currentColor"/><line x1="16" y1="19" x2="16" y2="22"/></svg> },
              ].map((mod, i) => (
                <article key={i} className="mod-card scroll-reveal" data-delay={mod.delay}>
                  <span className={`mod-phase ${mod.phase}`}>{mod.label}</span>
                  {mod.icon}
                  <h4>{mod.title}</h4>
                  <p>{mod.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== KPIs ===== */}
        <section className="kpis" aria-label="Métricas clave">
          <div className="container">
            <div className="kpis-grid">
              <div className="kpi">
                <div className="kpi-number" data-count="22">22</div>
                <div className="kpi-label">Módulos SST activos</div>
              </div>
              <div className="kpi">
                <div className="kpi-number" data-count="100">100</div>
                <div className="kpi-label">% Trazabilidad completa</div>
              </div>
              <div className="kpi">
                <div className="kpi-number" data-count="68">68</div>
                <div className="kpi-label">% Menos tiempo en trámites</div>
              </div>
              <div className="kpi">
                <div className="kpi-number" data-count="3">3</div>
                <div className="kpi-label">× Velocidad cerrando hallazgos</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURE — CAPACITACIONES ===== */}
        <section className="feature" aria-label="Módulo de capacitaciones">
          <div className="container">
            <div className="feature-grid">
              <div className="scroll-reveal-left">
                <span className="badge"><span className="dot"></span>Módulo destacado</span>
                <h2>Capacitaciones que <span className="accent">certifican</span> y trazan.</h2>
                <p className="lead">
                  Desde el plan anual hasta la firma digital del trabajador. Todo en un solo flujo, sin papel.
                </p>
                <ol className="steps">
                  {[
                    'Define el plan de capacitación anual con temas, fechas y responsables.',
                    'Comparte el código QR: el trabajador firma desde su celular.',
                    'El sistema registra asistencia, genera el acta y emite el certificado PDF.',
                    'Los indicadores se actualizan automáticamente en el dashboard.',
                  ].map((step, i) => (
                    <li key={i}>
                      <span className="num">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <a href="/auth" className="btn btn-primary">Explorar capacitaciones <span className="arrow">→</span></a>
              </div>

              {/* MOCKUP */}
              <div className="mockup-wrap scroll-reveal-right">
                <div className="mockup">
                  <div className="mockup-top">
                    <div className="dots"><i></i><i></i><i></i></div>
                    <span className="title">Capacitación · Seguridad en Alturas</span>
                    <span className="pill-live"><span className="dot"></span>En curso</span>
                  </div>
                  <div className="mockup-body">
                    <div className="progress-row">
                      {['Creada', 'Convocada', 'En curso', 'Cerrada'].map((step, i) => (
                        <div key={i} className={`progress-step${i < 2 ? ' done' : i === 2 ? ' current' : ''}`}>
                          <div className="bar"></div>
                          <span className="lbl">{step}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span className="cover-pill">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        8 asistentes registrados
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>14 may 2026</span>
                    </div>
                    <div className="att-list">
                      {[
                        { initials: 'JM', cls: 'av-1', name: 'Jorge Medina', role: 'Operario · TUR-A', ok: true },
                        { initials: 'AL', cls: 'av-2', name: 'Ana López', role: 'Supervisora · TUR-B', ok: true },
                        { initials: 'CR', cls: 'av-3', name: 'Carlos Ruiz', role: 'Contratista · EXT', ok: false },
                      ].map((att, i) => (
                        <div key={i} className="att-row">
                          <div className={`att-avatar ${att.cls}`}>{att.initials}</div>
                          <div className="att-name">
                            {att.name}
                            <small>{att.role}</small>
                          </div>
                          <span className={`pill-status ${att.ok ? 'pill-ok' : 'pill-no'}`}>{att.ok ? 'Firmó' : 'Pendiente'}</span>
                          <span className="sign-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 L9 17 L4 12"/></svg>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mockup-foot">
                    <span>3 / 8 firmados</span>
                    <span style={{ color: '#22C55E' }}>● Acta en tiempo real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PHVA ===== */}
        <section className="phva" id="phva" aria-label="Ciclo PHVA">
          <div className="container">
            <div className="section-header scroll-reveal" style={{ marginBottom: 48 }}>
              <p className="eyebrow">Visión tecnológica · Mejora continua</p>
              <h2>El ciclo <span style={{ color: 'var(--verde-300)' }}>PHVA</span> al ritmo de Guaicaramo.</h2>
              <p className="lead">Planear con datos, hacer con foco, verificar en tiempo real y actuar para que cada persona avance con la empresa.</p>
            </div>

            <div className="phva-grid">
              {/* SVG DIAGRAM */}
              <div className="phva-svg-wrap scroll-reveal-left">
                <svg className="phva-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <g className="quad">
                    <path d="M 200 200 L 200 50 A 150 150 0 0 1 350 200 Z" fill="#2C5F8D" opacity="0.85"/>
                    <text x="275" y="135" fill="#fff" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">P</text>
                    <text x="275" y="155" fill="#fff" fontFamily="Sora, sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">PLANEAR</text>
                  </g>
                  <g className="quad">
                    <path d="M 200 200 L 350 200 A 150 150 0 0 1 200 350 Z" fill="#166534" opacity="0.85"/>
                    <text x="275" y="270" fill="#fff" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">H</text>
                    <text x="275" y="290" fill="#fff" fontFamily="Sora, sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">HACER</text>
                  </g>
                  <g className="quad">
                    <path d="M 200 200 L 200 350 A 150 150 0 0 1 50 200 Z" fill="#FF8C42" opacity="0.85"/>
                    <text x="125" y="280" fill="#fff" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">V</text>
                    <text x="125" y="300" fill="#fff" fontFamily="Sora, sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">VERIFICAR</text>
                  </g>
                  <g className="quad">
                    <path d="M 200 200 L 50 200 A 150 150 0 0 1 200 50 Z" fill="#22C55E" opacity="0.85"/>
                    <text x="125" y="135" fill="#052E16" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">A</text>
                    <text x="125" y="155" fill="#052E16" fontFamily="Sora, sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">ACTUAR</text>
                  </g>
                  <line x1="200" y1="50" x2="200" y2="350" stroke="rgba(5,46,22,0.8)" strokeWidth="2"/>
                  <line x1="50" y1="200" x2="350" y2="200" stroke="rgba(5,46,22,0.8)" strokeWidth="2"/>
                  <g fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" filter="url(#glow)">
                    <path d="M 360 200 A 160 160 0 0 1 355 215"/>
                    <polygon points="355,215 350,205 360,210" fill="#4ADE80" stroke="none"/>
                  </g>
                  <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(74,222,128,0.25)" strokeWidth="1"/>
                  <circle cx="200" cy="200" r="64" fill="#052E16" stroke="rgba(74,222,128,0.3)" strokeWidth="1"/>
                </svg>
                <div className="phva-center">
                  <div className="core">
                    <span>Ciclo</span>
                    <b>PHVA</b>
                  </div>
                </div>
              </div>

              {/* LEGEND */}
              <div className="phva-legend">
                {[
                  { letter: 'P', cls: 'p', title: 'PLANEAR', desc: 'Evaluación inicial · Matriz IPVR · Plan de trabajo anual', delay: 0 },
                  { letter: 'H', cls: 'h', title: 'HACER',   desc: 'Capacitaciones · Incidentes · Permisos de trabajo · EPP', delay: 80 },
                  { letter: 'V', cls: 'v', title: 'VERIFICAR',desc: 'Inspecciones · Indicadores SST · Auditorías', delay: 160 },
                  { letter: 'A', cls: 'a', title: 'ACTUAR',  desc: 'Acciones correctivas · COPASST · Revisión gerencial', delay: 240 },
                ].map(item => (
                  <div key={item.cls} className="phva-item scroll-reveal-right" data-delay={item.delay}>
                    <div className={`phva-letter ${item.cls}`}>{item.letter}</div>
                    <div className="phva-text">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIAL / NORMATIVA ===== */}
        <section className="testimonial" id="nosotros" aria-label="Normativa y testimonio">
          <div className="container">
            <div className="test-grid">
              {/* LEFT: pilares */}
              <div className="scroll-reveal-left" style={{ textAlign: 'center' }}>
                <p className="eyebrow" style={{ color: 'var(--verde-300)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Visión Guaicaramo
                </p>
                <h2 style={{ color: 'var(--verde-900)' }}>
                  Tecnología que cuida.<br/><span style={{ color: 'var(--naranja-600)' }}>Personas</span> que <span style={{ color: 'var(--verde-600)' }}>crecen.</span>
                </h2>
                <p style={{ margin: '16px auto 0', fontSize: 16, color: 'var(--gris-700)', maxWidth: 500 }}>
                  Cada módulo nace de una creencia simple: la mejor inversión de Guaicaramo es su gente. Por eso digitalizamos procesos para liberar tiempo, anticipar riesgos y construir una cultura donde cuidar es parte del trabajo, no un trámite aparte.
                </p>
                <div className="norm-cards">
                  {[
                    {
                      title: 'Cuidar a las personas',
                      desc: 'Cada herramienta nace pensando en quien la usa. Menos formularios, más tiempo para estar cerca del equipo.',
                      tag: 'Pilar 01 · Bienestar',
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21 C12 21 4 16 4 10 C4 6 7 4 9.5 4 C11 4 12 5 12 5 C12 5 13 4 14.5 4 C17 4 20 6 20 10 C20 16 12 21 12 21 Z"/></svg>,
                    },
                    {
                      title: 'Crecer con datos',
                      desc: 'Indicadores en vivo que convierten cada turno en aprendizaje. Decisiones con evidencia, no con intuición.',
                      tag: 'Pilar 02 · Mejora continua',
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20 L9 14 L13 18 L21 8"/><polyline points="15 8 21 8 21 14"/></svg>,
                    },
                    {
                      title: 'Conectar equipos',
                      desc: 'Operación, HSE, gerencia y campo en la misma pantalla. Una sola fuente de verdad para todos los frentes.',
                      tag: 'Pilar 03 · Tecnología',
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><line x1="8.5" y1="11" x2="15.5" y2="7.5"/><line x1="8.5" y1="13" x2="15.5" y2="16.5"/></svg>,
                    },
                    {
                      title: 'Anticipar el riesgo',
                      desc: 'Alertas tempranas y trazabilidad completa. Actuar antes del incidente, no después del informe.',
                      tag: 'Pilar 04 · Prevención',
                      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>,
                    },
                  ].map((card, i) => (
                    <div key={i} className="norm-card">
                      <div className="nc-icon">{card.icon}</div>
                      <b>{card.title}</b>
                      <p>{card.desc}</p>
                      <span className="nc-tag">{card.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: quote */}
              <div className="quote-wrap scroll-reveal-right">
                <div className="quote-mark" aria-hidden="true">&ldquo;</div>
                <p className="quote-text">
                  Pasamos de carpetas físicas y Excel a tener todo en tiempo real. El COPASST ahora puede acceder a los indicadores desde el celular.
                </p>
                <div className="quote-meta">
                  <div className="avatar">RS</div>
                  <div>
                    <b>Responsable SST</b>
                    <span>Equipo Guaicaramo · Operaciones</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer aria-label="Pie de página">
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="foot-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <img src="/guaicaramo-logo.png" alt="Guaicaramo" style={{ height: 64, width: 'auto', display: 'block' }} />
              <p style={{ maxWidth: 520, margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                Sistema de Gestión de Seguridad y Salud en el Trabajo. Tecnología al servicio de las personas que hacen posible Guaicaramo.
              </p>
            </div>
            <div className="foot-bottom" style={{ justifyContent: 'center', marginTop: 40 }}>
              <small>© 2026 Guaicaramo · SG-SST · Cuidar es parte del trabajo</small>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --verde-900:#052E16; --verde-800:#0B5B2D; --verde-700:#166534;
    --verde-600:#15803D; --verde-500:#1A9C4A; --verde-400:#22C55E;
    --verde-300:#4ADE80; --verde-200:#86EFAC; --verde-100:#DCFCE7;
    --verde-50:#F0FDF4;
    --blanco:#FFFFFF; --superficie:#F8FAFB;
    --gris-100:#F1F5F9; --gris-200:#E2E8F0; --gris-400:#94A3B8;
    --gris-700:#334155; --gris-900:#0F172A;
    --azul:#2C5F8D; --azul-claro:#4A86BE;
    --naranja-700:#C2410C; --naranja-600:#EA580C; --naranja-500:#FF8C42;
    --naranja-400:#FB923C; --naranja-300:#FDBA74; --naranja-100:#FFEDD5;
    --naranja:#FF8C42; --rojo:#DC3545;
    --crema:#FAF7F2; --crema-100:#F5EFE6; --crema-200:#EFE6D6;
    --grad-hero:linear-gradient(135deg,#052E16 0%,#0B5B2D 40%,#166534 100%);
    --grad-orange:linear-gradient(135deg,#FF8C42 0%,#EA580C 100%);
  }

  *, *::before, *::after { box-sizing: border-box; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }

  .container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 32px; }
  section { position: relative; overflow: hidden; }

  h1, h2, h3, h4 { font-family: 'Sora', sans-serif; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin: 0; }
  h1 { font-size: clamp(42px, 6.5vw, 78px); }
  h2 { font-size: clamp(34px, 4.4vw, 54px); }
  h3 { font-size: clamp(22px, 2vw, 28px); letter-spacing: -0.02em; }
  p  { margin: 0; }
  .mono { font-family: 'JetBrains Mono', monospace; font-weight: 500; }

  .badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Sora', sans-serif; font-weight: 600; font-size: 11px;
    letter-spacing: 0.06em; text-transform: uppercase;
    padding: 7px 14px; border-radius: 999px;
    border: 1px solid rgba(74,222,128,0.3);
    background: rgba(34,197,94,0.08); color: var(--verde-200);
  }
  .badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--verde-300); box-shadow: 0 0 12px var(--verde-300); animation: pulse 2.5s ease-in-out infinite; }

  .btn {
    position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 15px 30px; border-radius: 999px;
    font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: -0.005em;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
    white-space: nowrap; overflow: hidden; isolation: isolate; cursor: pointer;
  }
  .btn > * { position: relative; z-index: 2; }
  .btn::before {
    content: ''; position: absolute; inset: 0; z-index: 1;
    background: linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.45) 50%,transparent 70%);
    transform: translateX(-120%); transition: transform 0.7s cubic-bezier(.4,0,.2,1); pointer-events: none;
  }
  .btn:hover::before { transform: translateX(120%); }
  .btn .arrow { display: inline-block; transition: transform 0.3s cubic-bezier(.34,1.56,.64,1); font-weight: 800; }
  .btn:hover .arrow { transform: translateX(4px); }

  .btn-primary {
    background: linear-gradient(135deg,#4ADE80 0%,#22C55E 60%,#16A34A 100%);
    color: var(--verde-900);
    box-shadow: 0 6px 20px rgba(34,197,94,0.32), 0 1px 0 rgba(255,255,255,0.5) inset;
  }
  .btn-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 14px 36px rgba(34,197,94,0.48), 0 0 0 4px rgba(74,222,128,0.18); }

  .btn-secondary {
    border: 1.5px solid rgba(74,222,128,0.5); color: var(--verde-200);
    background: rgba(5,46,22,0.4); backdrop-filter: blur(6px);
  }
  .btn-secondary:hover { border-color: var(--verde-300); color: var(--blanco); transform: translateY(-3px) scale(1.02); }

  .btn-large { padding: 18px 40px; font-size: 17px; }

  /* KEYFRAMES */
  @keyframes fadeInUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeInDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slowSpin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes pulse      { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.85); } }
  @keyframes chevronBounce { 0%,100% { transform:translateY(0); opacity:0.5; } 50% { transform:translateY(6px); opacity:1; } }
  @keyframes shimmer    { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes conicSpin  { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes beamSweep  { 0% { transform:translateX(-30%) rotate(8deg); opacity:0; } 30% { opacity:1; } 70% { opacity:1; } 100% { transform:translateX(280%) rotate(8deg); opacity:0; } }
  @keyframes gridDrift  { from { background-position:0 0,0 0; } to { background-position:64px 64px,64px 64px; } }
  @keyframes particleRise { 0% { transform:translateY(0) translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:0.8; } 100% { transform:translateY(-110vh) translateX(40px); opacity:0; } }
  @keyframes ringSpin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes glowPulse  { 0%,100% { opacity:0.6; transform:translateX(-50%) scale(1); } 50% { opacity:1; transform:translateX(-50%) scale(1.1); } }
  @keyframes shineSweep { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes bridgePulse {
    0%,100% { box-shadow:0 12px 40px rgba(34,197,94,0.4),0 0 0 8px rgba(250,247,242,1),0 0 0 9px rgba(34,197,94,0.2); }
    50%      { box-shadow:0 12px 40px rgba(34,197,94,0.6),0 0 0 8px rgba(250,247,242,1),0 0 0 18px rgba(34,197,94,0.0); }
  }

  /* SCROLL REVEAL */
  .scroll-reveal { opacity:0; transform:translateY(24px); transition:opacity 0.7s ease, transform 0.7s ease; }
  .scroll-reveal.visible { opacity:1; transform:translateY(0); }
  .scroll-reveal-left { opacity:0; transform:translateX(-32px); transition:opacity 0.6s ease, transform 0.6s ease; }
  .scroll-reveal-left.visible { opacity:1; transform:translateX(0); }
  .scroll-reveal-right { opacity:0; transform:translateX(32px); transition:opacity 0.6s ease, transform 0.6s ease; }
  .scroll-reveal-right.visible { opacity:1; transform:translateX(0); }

  /* NAVBAR */
  nav.navbar {
    position:fixed; top:0; left:0; right:0; z-index:1000;
    padding:18px 0; transition:all 0.4s ease;
    background:transparent; border-bottom:1px solid transparent;
  }
  nav.navbar.scrolled {
    background:rgba(5,46,22,0.92); backdrop-filter:blur(16px);
    border-bottom-color:rgba(74,222,128,0.12); padding:12px 0;
  }
  .nav-inner { display:flex; align-items:center; justify-content:space-between; gap:32px; }
  .logo { display:inline-flex; align-items:center; gap:10px; font-weight:800; font-size:18px; letter-spacing:-0.02em; }
  .nav-links { display:flex; align-items:center; gap:32px; }
  .nav-links a { font-size:14px; font-weight:500; color:rgba(255,255,255,0.75); position:relative; padding:4px 0; transition:color 0.2s ease; }
  .nav-links a::after { content:''; position:absolute; left:0; bottom:-2px; height:1.5px; width:0; background:var(--verde-300); transition:width 0.3s ease; }
  .nav-links a:hover { color:var(--blanco); }
  .nav-links a:hover::after { width:100%; }
  .nav-cta {
    background:linear-gradient(135deg,#4ADE80 0%,#22C55E 60%,#16A34A 100%);
    color:var(--verde-900); padding:11px 22px; border-radius:999px;
    overflow:hidden; isolation:isolate;
    box-shadow:0 4px 14px rgba(34,197,94,0.28),0 1px 0 rgba(255,255,255,0.4) inset;
    font-weight:700; font-size:14px; transition:all 0.25s ease;
  }
  .nav-cta:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 10px 24px rgba(34,197,94,0.45),0 0 0 3px rgba(74,222,128,0.18); }
  .nav-toggle { display:none; padding:6px; }

  .mobile-menu {
    display:none; position:fixed; top:0; right:0; bottom:0;
    width:min(320px,80vw);
    background:rgba(5,46,22,0.98); backdrop-filter:blur(20px);
    padding:80px 28px 28px; transform:translateX(100%);
    transition:transform 0.35s ease; z-index:999;
    border-left:1px solid rgba(74,222,128,0.15);
    flex-direction:column; gap:4px;
  }
  .mobile-menu.open { transform:translateX(0); display:flex; }
  .mobile-menu a { display:block; padding:14px 0; font-size:18px; border-bottom:1px solid rgba(74,222,128,0.1); color:var(--blanco); font-weight:500; transition:color 0.2s; }
  .mobile-menu a:hover { color:var(--verde-300); }

  /* HERO */
  .hero {
    position:relative; min-height:100vh;
    display:flex; align-items:center; justify-content:center;
    background:#04210F; padding:140px 0 80px;
    font-family:'Sora',system-ui,sans-serif; color:#fff;
  }
  .hero-orbs { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
  .hero-conic {
    position:absolute; inset:-20%;
    background:conic-gradient(from 0deg at 50% 50%,rgba(34,197,94,0.18) 0deg,rgba(11,91,45,0.0) 60deg,rgba(255,140,66,0.22) 140deg,rgba(5,46,22,0.0) 220deg,rgba(74,222,128,0.14) 300deg,rgba(34,197,94,0.18) 360deg);
    filter:blur(70px); animation:conicSpin 24s linear infinite; will-change:transform;
  }
  .hero-beam {
    position:absolute; top:-10%; left:-30%; width:60%; height:140%;
    background:linear-gradient(100deg,transparent 0%,rgba(255,237,213,0.04) 40%,rgba(253,186,116,0.12) 50%,rgba(255,237,213,0.04) 60%,transparent 100%);
    transform:rotate(8deg); animation:beamSweep 9s ease-in-out infinite; mix-blend-mode:screen;
  }
  .hero-grid {
    position:absolute; inset:-10%;
    background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);
    background-size:64px 64px;
    mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,#000 30%,transparent 80%);
    -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,#000 30%,transparent 80%);
    animation:gridDrift 30s linear infinite;
  }
  .hero-particles { position:absolute; inset:0; }
  .hero-particles i {
    position:absolute; width:3px; height:3px; border-radius:50%;
    background:rgba(255,255,255,0.7); box-shadow:0 0 8px currentColor; will-change:transform,opacity;
  }
  .hero-particles i:nth-child(1) { left:10%; top:80%; color:#4ADE80; animation:particleRise 14s linear infinite; }
  .hero-particles i:nth-child(2) { left:25%; top:90%; color:#FDBA74; animation:particleRise 18s linear 2s infinite; }
  .hero-particles i:nth-child(3) { left:42%; top:85%; color:#fff; animation:particleRise 12s linear 4s infinite; }
  .hero-particles i:nth-child(4) { left:58%; top:95%; color:#FF8C42; animation:particleRise 20s linear 1s infinite; }
  .hero-particles i:nth-child(5) { left:72%; top:88%; color:#86EFAC; animation:particleRise 15s linear 6s infinite; }
  .hero-particles i:nth-child(6) { left:85%; top:92%; color:#fff; animation:particleRise 17s linear 3s infinite; }
  .hero-particles i:nth-child(7) { left:18%; top:70%; color:#FDBA74; animation:particleRise 13s linear 5s infinite; }
  .hero-particles i:nth-child(8) { left:90%; top:75%; color:#4ADE80; animation:particleRise 19s linear 0s infinite; }
  .hero-particles i:nth-child(9) { left:50%; top:60%; color:#FF8C42; animation:particleRise 16s linear 7s infinite; }
  .hero-particles i:nth-child(10){ left:33%; top:78%; color:#fff; animation:particleRise 11s linear 2.5s infinite; }
  .hero-rings {
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
    width:1100px; height:1100px; pointer-events:none; opacity:0.5;
  }
  .hero-rings::before, .hero-rings::after {
    content:''; position:absolute; inset:0; border-radius:50%;
    border:1px dashed rgba(74,222,128,0.18); animation:ringSpin 60s linear infinite;
  }
  .hero-rings::after { inset:18%; border-color:rgba(253,186,116,0.18); animation:ringSpin 40s linear reverse infinite; }
  .glow-overlay {
    position:absolute; top:0; left:50%; transform:translateX(-50%);
    width:900px; height:500px;
    background:radial-gradient(ellipse 70% 60% at center,rgba(253,186,116,0.10) 0%,rgba(74,222,128,0.10) 40%,transparent 70%);
    pointer-events:none; animation:glowPulse 6s ease-in-out infinite;
  }
  .hero-inner { position:relative; z-index:2; text-align:center; max-width:920px; margin:0 auto; }
  .hero .badge { opacity:0; animation:fadeInDown 0.6s ease 0s forwards; }
  .hero h1 { margin-top:28px; }
  .hero h1 .line { display:block; opacity:0; }
  .hero h1 .line-1 { animation:fadeInUp 0.7s ease 0.1s forwards; }
  .hero h1 .line-2 {
    animation:fadeInUp 0.7s ease 0.25s forwards, shineSweep 5s ease-in-out 1s infinite;
    background:linear-gradient(120deg,#22C55E 0%,#FDBA74 35%,#FFFFFF 50%,#FDBA74 65%,#4ADE80 100%);
    background-size:250% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  }
  .hero-sub {
    margin-top:24px; font-size:clamp(17px,1.6vw,20px); line-height:1.6;
    color:var(--verde-200); max-width:620px; margin-left:auto; margin-right:auto;
    opacity:0; animation:fadeInUp 0.6s ease 0.4s forwards;
  }
  .hero-stats {
    margin-top:36px; display:inline-flex; align-items:center; gap:14px;
    padding:12px 22px; border-radius:999px;
    border:1px solid rgba(74,222,128,0.2); background:rgba(5,46,22,0.5); backdrop-filter:blur(8px);
    font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--verde-100);
    opacity:0; animation:fadeInUp 0.6s ease 0.55s forwards;
  }
  .hero-stats .sep { width:4px; height:4px; border-radius:50%; background:var(--naranja-400); opacity:0.7; }
  .hero-stats b { color:var(--naranja-300); font-weight:500; }
  .hero-ctas { margin-top:36px; display:flex; gap:14px; justify-content:center; flex-wrap:wrap; opacity:0; animation:fadeInUp 0.6s ease 0.7s forwards; }
  .scroll-indicator {
    position:absolute; bottom:28px; left:50%; transform:translateX(-50%); z-index:2;
    display:flex; flex-direction:column; align-items:center; gap:4px;
    color:var(--verde-300); font-size:11px; letter-spacing:0.15em; text-transform:uppercase;
    opacity:0; animation:fadeInUp 0.6s ease 1s forwards;
  }
  .scroll-indicator svg { animation:chevronBounce 2s ease infinite; }
  .scroll-indicator svg:nth-child(2) { animation-delay:0.25s; margin-top:-10px; }

  /* TRUST */
  .trust {
    background:var(--verde-800);
    border-top:1px solid rgba(74,222,128,0.2); border-bottom:1px solid rgba(74,222,128,0.2);
    min-height:88px; display:flex; align-items:center; overflow:hidden; padding:16px 0;
  }
  .trust-inner { display:flex; align-items:center; justify-content:center; gap:48px; width:100%; flex-wrap:wrap; row-gap:12px; }
  .trust-label { font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.5); white-space:nowrap; }
  .trust-logos { display:flex; align-items:center; justify-content:center; gap:40px; flex-wrap:wrap; row-gap:12px; }
  .trust-chip {
    display:inline-flex; align-items:center; gap:10px;
    color:rgba(255,255,255,0.55); font-weight:600; font-size:13px;
    letter-spacing:0.04em; transition:color 0.3s ease;
  }
  .trust-chip:hover { color:rgba(255,255,255,0.9); }
  .trust-chip svg { opacity:0.8; }

  /* PROBLEM-SOLUTION */
  .problem-solution {
    background:linear-gradient(180deg,#FAF7F2 0%,#F0E9DD 100%);
    color:var(--gris-900); padding:140px 0 160px; overflow:hidden; position:relative;
  }
  .problem-solution::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(ellipse 600px 400px at 15% 30%,rgba(220,53,69,0.08) 0%,transparent 60%),radial-gradient(ellipse 600px 400px at 85% 70%,rgba(34,197,94,0.12) 0%,transparent 60%);
    pointer-events:none;
  }
  .problem-solution::after {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(15,23,42,0.05) 1px,transparent 1px);
    background-size:28px 28px; opacity:0.45; pointer-events:none;
  }
  .problem-solution .container { position:relative; z-index:1; }
  .section-header { text-align:center; margin-bottom:64px; max-width:760px; margin-left:auto; margin-right:auto; }
  .section-header p.eyebrow { font-size:13px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:12px; color:var(--verde-300); }
  .problem-solution .section-header p.eyebrow { color:var(--naranja-600); }
  .problem-solution .section-header h2 { color:var(--verde-900); }
  .section-header .lead { margin-top:20px; font-size:18px; color:rgba(255,255,255,0.7); }
  .problem-solution .section-header .lead { color:var(--gris-700); }

  .ps-stage {
    position:relative; display:grid; grid-template-columns:1fr 1fr;
    border-radius:28px; overflow:hidden;
    box-shadow:0 40px 80px -20px rgba(5,46,22,0.25),0 8px 24px rgba(5,46,22,0.08);
  }
  .ps-panel { padding:56px 48px; position:relative; min-height:560px; }
  .ps-panel.before { background:linear-gradient(155deg,#2B1614 0%,#1F0F0E 100%); color:#fff; }
  .ps-panel.before::before {
    content:''; position:absolute; inset:0;
    background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);
    background-size:24px 24px; pointer-events:none;
    mask-image:radial-gradient(ellipse at top right,black,transparent 70%);
  }
  .ps-panel.after { background:linear-gradient(155deg,#0B5B2D 0%,#052E16 100%); color:#fff; }
  .ps-panel.after::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(ellipse 600px 400px at 80% 20%,rgba(74,222,128,0.25) 0%,transparent 60%);
    pointer-events:none;
  }
  .ps-tag {
    display:inline-flex; align-items:center; gap:8px;
    font-family:'Sora',sans-serif; font-size:11px; letter-spacing:0.14em;
    text-transform:uppercase; font-weight:700; padding:8px 14px; border-radius:999px;
    margin-bottom:24px; position:relative; z-index:1;
  }
  .ps-panel.before .ps-tag { background:rgba(220,53,69,0.18); color:#FCA5A5; border:1px solid rgba(220,53,69,0.4); }
  .ps-panel.after  .ps-tag { background:rgba(74,222,128,0.18); color:#86EFAC; border:1px solid rgba(74,222,128,0.4); }
  .ps-tag .dot { width:8px; height:8px; border-radius:50%; }
  .ps-panel.before .ps-tag .dot { background:#DC3545; box-shadow:0 0 8px #DC3545; }
  .ps-panel.after  .ps-tag .dot { background:#4ADE80; box-shadow:0 0 12px #4ADE80; animation:pulse 2s ease-in-out infinite; }
  .ps-heading { font-family:'Sora',sans-serif; font-weight:800; font-size:38px; line-height:1.05; letter-spacing:-0.03em; margin-bottom:36px; position:relative; z-index:1; color:#fff; }
  .ps-panel.before .ps-heading em { font-style:normal; color:#FCA5A5; }
  .ps-panel.after  .ps-heading em { font-style:normal; color:#4ADE80; }
  .ps-items { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:18px; position:relative; z-index:1; }
  .ps-item {
    display:flex; gap:16px; align-items:flex-start;
    padding:16px 18px; border-radius:12px;
    transition:all 0.35s cubic-bezier(.34,1.56,.64,1); cursor:default;
  }
  .ps-panel.before .ps-item { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); }
  .ps-panel.after  .ps-item { background:rgba(255,255,255,0.06); border:1px solid rgba(74,222,128,0.18); }
  .ps-panel.before .ps-item:hover { background:rgba(220,53,69,0.12); border-color:rgba(220,53,69,0.4); transform:translateX(-3px); }
  .ps-panel.after  .ps-item:hover { background:rgba(34,197,94,0.18); border-color:rgba(74,222,128,0.6); transform:translateX(3px); box-shadow:0 8px 24px rgba(34,197,94,0.2); }
  .ps-icon {
    flex:0 0 36px; height:36px; border-radius:10px;
    display:grid; place-items:center; font-weight:700; font-size:14px;
    transition:transform 0.35s cubic-bezier(.34,1.56,.64,1);
  }
  .ps-panel.before .ps-icon { background:rgba(220,53,69,0.2); color:#FCA5A5; border:1px solid rgba(220,53,69,0.35); }
  .ps-panel.after  .ps-icon { background:linear-gradient(135deg,#22C55E,#15803D); color:#fff; box-shadow:0 4px 12px rgba(34,197,94,0.4); }
  .ps-panel.before .ps-item:hover .ps-icon { transform:rotate(-15deg) scale(1.1); }
  .ps-panel.after  .ps-item:hover .ps-icon { transform:rotate(15deg) scale(1.1); }
  .ps-item-text { flex:1; }
  .ps-item-title { font-family:'Sora',sans-serif; font-weight:600; font-size:15px; line-height:1.35; margin-bottom:4px; color:#fff; }
  .ps-item-desc  { font-size:13px; line-height:1.5; color:rgba(255,255,255,0.65); }
  .ps-bridge {
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:3;
    width:88px; height:88px; border-radius:50%;
    background:linear-gradient(135deg,#FF8C42 0%,#22C55E 100%);
    display:grid; place-items:center;
    box-shadow:0 12px 40px rgba(34,197,94,0.4),0 0 0 8px rgba(250,247,242,1),0 0 0 9px rgba(34,197,94,0.2);
    animation:bridgePulse 2.4s ease-in-out infinite;
  }
  .ps-footstats { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:48px; }
  .ps-stat {
    background:#fff; border-radius:16px; padding:24px 28px;
    border:1px solid rgba(15,23,42,0.06);
    box-shadow:0 4px 16px rgba(15,23,42,0.04);
    display:flex; align-items:center; gap:18px;
  }
  .ps-stat-num { font-family:'JetBrains Mono',monospace; font-size:32px; font-weight:500; color:var(--verde-700); line-height:1; }
  .ps-stat-label { font-size:13px; color:var(--gris-700); line-height:1.4; }
  .ps-stat-divider { width:1px; height:32px; background:rgba(15,23,42,0.1); }

  /* MODULES */
  .modules { background:var(--verde-800); padding:120px 0; }
  .modules .section-header { color:#fff; }
  .modules .section-header p.eyebrow { color:var(--verde-300); }
  .modules .section-header .lead { color:rgba(255,255,255,0.7); }
  .modules .section-header h2 .accent { color:var(--verde-300); }
  .modules-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
  .mod-card {
    background:rgba(5,46,22,0.6); border:0.5px solid rgba(74,222,128,0.2);
    border-radius:12px; padding:22px 18px; backdrop-filter:blur(8px);
    transition:all 0.3s ease; display:flex; flex-direction:column; gap:12px; min-height:168px;
  }
  .mod-card:hover {
    border-color:rgba(74,222,128,0.6); background:rgba(22,101,52,0.5);
    transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.3),0 0 0 1px rgba(74,222,128,0.15);
  }
  .mod-phase {
    align-self:flex-start; font-family:'Sora',sans-serif;
    font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
    padding:3px 8px; border-radius:4px;
  }
  .mod-phase.p { background:rgba(44,95,141,0.2); color:var(--azul-claro); }
  .mod-phase.h { background:rgba(22,101,52,0.4); color:var(--verde-300); }
  .mod-phase.v { background:rgba(255,140,66,0.18); color:var(--naranja); }
  .mod-phase.a { background:rgba(34,197,94,0.2); color:var(--verde-300); }
  .mod-icon { width:32px; height:32px; }
  .mod-card h4 { font-size:14px; font-weight:600; letter-spacing:-0.01em; color:var(--blanco); line-height:1.3; }
  .mod-card p  { font-size:12px; color:rgba(255,255,255,0.5); line-height:1.5; }

  /* KPIS */
  .kpis { background:var(--grad-hero); padding:100px 0; position:relative; }
  .kpis::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(74,222,128,0.12) 1px,transparent 1px); background-size:32px 32px; opacity:0.5; pointer-events:none; }
  .kpis-grid { display:grid; grid-template-columns:repeat(4,1fr); text-align:center; position:relative; }
  .kpi { padding:20px; position:relative; }
  .kpi+.kpi::before { content:''; position:absolute; left:0; top:25%; bottom:25%; width:1px; background:rgba(74,222,128,0.2); }
  .kpi-number { font-family:'JetBrains Mono',monospace; font-size:clamp(40px,5.5vw,64px); font-weight:500; color:var(--verde-300); line-height:1; letter-spacing:-0.02em; }
  .kpi:nth-child(2) .kpi-number { color:var(--blanco); }
  .kpi:nth-child(3) .kpi-number { color:var(--naranja-300); }
  .kpi:nth-child(4) .kpi-number { color:var(--blanco); }
  .kpi-label { margin-top:14px; font-size:13px; color:rgba(255,255,255,0.6); letter-spacing:0.08em; text-transform:uppercase; font-weight:500; }

  /* FEATURE */
  .feature { background:var(--verde-800); padding:120px 0; }
  .feature-grid { display:grid; grid-template-columns:1fr 1.05fr; gap:64px; align-items:center; }
  .feature .badge { margin-bottom:0; }
  .feature h2 { margin-top:18px; margin-bottom:22px; color:#fff; }
  .feature h2 .accent { color:var(--verde-300); }
  .feature .lead { color:rgba(255,255,255,0.7); font-size:16px; line-height:1.7; margin-bottom:28px; max-width:440px; }
  .steps { list-style:none; padding:0 0 0 22px; margin:0 0 32px; border-left:2px solid rgba(74,222,128,0.3); display:flex; flex-direction:column; gap:14px; }
  .steps li { font-size:14.5px; line-height:1.5; color:rgba(255,255,255,0.85); display:flex; gap:14px; align-items:flex-start; }
  .steps li .num {
    flex:0 0 24px; height:24px; border-radius:50%;
    background:rgba(34,197,94,0.15); border:1px solid rgba(74,222,128,0.4);
    color:var(--verde-300); font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500;
    display:grid; place-items:center; margin-left:-34px;
  }
  .mockup-wrap { perspective:1400px; }
  .mockup {
    border-radius:16px; border:1px solid rgba(74,222,128,0.3);
    background:var(--superficie);
    box-shadow:0 24px 64px rgba(0,0,0,0.4),0 0 0 1px rgba(74,222,128,0.1);
    transform:perspective(1200px) rotateY(-8deg) rotateX(2deg);
    transition:transform 0.6s cubic-bezier(.2,.7,.2,1); overflow:hidden; color:var(--gris-900);
  }
  .mockup:hover { transform:perspective(1200px) rotateY(-2deg) rotateX(0deg); }
  .mockup-top {
    background:var(--verde-900); color:var(--blanco);
    padding:12px 16px; display:flex; align-items:center; gap:12px;
    border-bottom:1px solid rgba(74,222,128,0.15);
  }
  .mockup-top .dots { display:flex; gap:6px; }
  .mockup-top .dots i { width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,0.18); }
  .mockup-top .title { font-size:12px; font-weight:500; color:rgba(255,255,255,0.85); }
  .mockup-top .pill-live { margin-left:auto; font-size:10px; font-family:'JetBrains Mono',monospace; color:var(--verde-300); display:inline-flex; align-items:center; gap:6px; }
  .mockup-top .pill-live .dot { width:6px; height:6px; border-radius:50%; background:var(--verde-300); box-shadow:0 0 8px var(--verde-300); animation:pulse 2s ease infinite; }
  .mockup-body { padding:20px 22px; background:var(--blanco); }
  .progress-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:22px; }
  .progress-step { text-align:center; position:relative; padding-top:24px; }
  .progress-step .bar { position:absolute; top:8px; left:0; right:0; height:3px; background:var(--gris-200); border-radius:2px; }
  .progress-step.done .bar { background:var(--verde-500); }
  .progress-step.current .bar { background:linear-gradient(90deg,var(--verde-500) 60%,var(--gris-200) 60%); }
  .progress-step .lbl { font-size:10.5px; color:var(--gris-700); font-weight:600; }
  .progress-step.done .lbl { color:var(--verde-600); }
  .progress-step.current .lbl { color:var(--gris-900); }
  .cover-pill { display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:999px; background:var(--verde-100); color:var(--verde-700); font-size:11px; font-weight:600; letter-spacing:0.04em; }
  .att-list { margin-top:14px; display:flex; flex-direction:column; gap:6px; }
  .att-row { display:grid; grid-template-columns:36px 1fr auto auto; gap:12px; align-items:center; padding:10px 12px; border-radius:8px; background:var(--gris-100); border:1px solid var(--gris-200); }
  .att-avatar { width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-size:11px; font-weight:700; color:var(--blanco); font-family:'Sora',sans-serif; }
  .av-1 { background:linear-gradient(135deg,#166534,#22C55E); }
  .av-2 { background:linear-gradient(135deg,#2C5F8D,#4A86BE); }
  .av-3 { background:linear-gradient(135deg,#FF8C42,#DC3545); }
  .att-name { font-size:13px; font-weight:600; color:var(--gris-900); }
  .att-name small { display:block; font-size:11px; font-weight:400; color:var(--gris-400); font-family:'JetBrains Mono',monospace; }
  .pill-status { font-size:10px; padding:3px 9px; border-radius:4px; font-weight:700; letter-spacing:0.05em; }
  .pill-ok { background:var(--verde-100); color:var(--verde-700); }
  .pill-no { background:#FEE2E2; color:#B91C1C; }
  .sign-icon { color:var(--verde-600); }
  .mockup-foot { display:flex; align-items:center; justify-content:space-between; padding:14px 22px; border-top:1px solid var(--gris-200); background:var(--gris-100); font-size:11px; color:var(--gris-700); font-family:'JetBrains Mono',monospace; }

  /* PHVA */
  .phva { background:var(--verde-900); padding:120px 0; color:#fff; }
  .phva .section-header .lead { color:rgba(255,255,255,0.7); }
  .phva-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
  .phva-svg-wrap { display:grid; place-items:center; position:relative; }
  .phva-svg { width:100%; max-width:440px; aspect-ratio:1; animation:slowSpin 80s linear infinite; }
  .phva-svg .quad { transition:transform 0.35s ease; transform-origin:200px 200px; cursor:pointer; }
  .phva-svg .quad:hover { transform:scale(1.04); }
  .phva-center { position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; }
  .phva-center .core {
    width:120px; height:120px; border-radius:50%; background:var(--verde-900);
    border:1px solid rgba(74,222,128,0.3); display:grid; place-items:center;
    font-family:'Sora',sans-serif; text-align:center;
    box-shadow:0 0 32px rgba(34,197,94,0.2),inset 0 0 32px rgba(34,197,94,0.05);
  }
  .phva-center .core span { display:block; font-size:11px; letter-spacing:0.16em; color:var(--verde-300); text-transform:uppercase; font-weight:600; }
  .phva-center .core b { display:block; font-size:22px; font-weight:800; letter-spacing:-0.02em; color:var(--blanco); margin-top:4px; }
  .phva-legend { display:flex; flex-direction:column; gap:14px; }
  .phva-item { display:grid; grid-template-columns:56px 1fr; gap:18px; padding:18px; border-radius:12px; border:1px solid rgba(74,222,128,0.12); background:rgba(5,46,22,0.5); transition:all 0.25s ease; cursor:default; }
  .phva-item:hover { border-color:rgba(74,222,128,0.35); transform:translateX(4px); background:rgba(22,101,52,0.4); }
  .phva-letter { width:56px; height:56px; border-radius:12px; display:grid; place-items:center; font-family:'Sora',sans-serif; font-weight:800; font-size:22px; color:var(--blanco); letter-spacing:-0.04em; }
  .phva-letter.p { background:var(--azul); }
  .phva-letter.h { background:var(--verde-700); }
  .phva-letter.v { background:var(--naranja); }
  .phva-letter.a { background:var(--verde-400); color:var(--verde-900); }
  .phva-text h4 { font-size:14px; font-weight:700; color:var(--blanco); margin-bottom:4px; letter-spacing:0.02em; }
  .phva-text p  { font-size:13px; color:rgba(255,255,255,0.65); line-height:1.5; }

  /* TESTIMONIAL */
  .testimonial { background:var(--crema); color:var(--gris-900); padding:120px 0; position:relative; }
  .testimonial::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(15,23,42,0.05) 1px,transparent 1px); background-size:32px 32px; opacity:0.5; pointer-events:none; }
  .testimonial .container { position:relative; }
  .test-grid { display:grid; grid-template-columns:1fr 1.1fr; gap:64px; }
  .norm-cards { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:36px; max-width:720px; margin-left:auto; margin-right:auto; }
  .norm-card {
    position:relative;
    background:linear-gradient(160deg,#166534 0%,#0B5B2D 60%,#052E16 100%);
    border:1px solid rgba(74,222,128,0.3); border-radius:16px;
    padding:22px 22px 24px; overflow:hidden; text-align:left;
    transition:transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease, border-color 0.35s ease;
  }
  .norm-card::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(circle at 0% 0%,rgba(74,222,128,0.18) 0%,transparent 55%);
    pointer-events:none; opacity:0.6; transition:opacity 0.35s ease;
  }
  .norm-card::after {
    content:''; position:absolute; right:-30px; bottom:-30px; width:120px; height:120px;
    background:radial-gradient(circle,rgba(253,186,116,0.14) 0%,transparent 70%);
    pointer-events:none; transition:transform 0.5s ease;
  }
  .norm-card:hover { transform:translateY(-6px); border-color:rgba(74,222,128,0.45); box-shadow:0 20px 40px rgba(0,0,0,0.35),0 0 0 1px rgba(74,222,128,0.12); }
  .norm-card:hover::after { transform:scale(1.4); }
  .norm-card:nth-child(even) { background:linear-gradient(160deg,#C2410C 0%,#7C2D12 60%,#431407 100%); border-color:rgba(253,186,116,0.35); }
  .norm-card:nth-child(even):hover { border-color:rgba(253,186,116,0.5); }
  .nc-icon { width:44px; height:44px; border-radius:12px; display:grid; place-items:center; background:rgba(74,222,128,0.25); color:#BBF7D0; margin-bottom:14px; border:1px solid rgba(74,222,128,0.5); position:relative; z-index:2; }
  .norm-card:nth-child(even) .nc-icon { background:rgba(253,186,116,0.25); color:#FED7AA; border-color:rgba(253,186,116,0.5); }
  .norm-card b { display:block; font-size:16px; font-weight:700; color:#fff; letter-spacing:-0.01em; margin-bottom:8px; position:relative; z-index:2; }
  .norm-card p { font-size:13.5px; color:rgba(255,255,255,0.88) !important; line-height:1.6; margin:0; position:relative; z-index:2; }
  .nc-tag { display:inline-block; margin-top:12px; font-family:'JetBrains Mono',monospace; font-size:10px; color:#BBF7D0; letter-spacing:0.1em; text-transform:uppercase; position:relative; z-index:2; }
  .norm-card:nth-child(even) .nc-tag { color:#FED7AA; }
  .quote-wrap { position:relative; padding:48px 36px; border-radius:16px; background:var(--blanco); border:1px solid rgba(15,23,42,0.06); overflow:hidden; box-shadow:0 12px 40px rgba(15,23,42,0.08); }
  .quote-wrap::after { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:var(--grad-orange); }
  .quote-mark { position:absolute; top:-30px; left:16px; font-family:'Sora',sans-serif; font-size:220px; font-weight:800; color:var(--naranja-500); opacity:0.12; line-height:1; pointer-events:none; }
  .quote-text { position:relative; font-size:22px; line-height:1.5; font-style:italic; color:var(--verde-900) !important; font-weight:400; letter-spacing:-0.01em; }
  .quote-meta { position:relative; margin-top:24px; display:flex; align-items:center; gap:12px; font-size:13px; color:var(--gris-700) !important; }
  .quote-meta .avatar { width:36px; height:36px; border-radius:50%; background:var(--grad-orange); display:grid; place-items:center; color:var(--blanco); font-weight:700; font-size:13px; }
  .quote-meta b { color:var(--verde-900); font-weight:700; display:block; }

  /* FOOTER */
  footer { background:var(--verde-900); padding:64px 0 28px; border-top:1px solid rgba(74,222,128,0.12); color:#fff; }
  .foot-bottom { border-top:1px solid rgba(74,222,128,0.1); padding-top:24px; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
  .foot-bottom small { font-size:12px; color:rgba(255,255,255,0.4); }

  /* RESPONSIVE */
  @media (max-width:1023px) {
    .modules-grid  { grid-template-columns:repeat(3,1fr); }
    .ps-stage      { grid-template-columns:1fr; }
    .ps-bridge     { left:50%; top:auto; bottom:-44px; transform:translateX(-50%) rotate(90deg); }
    .ps-panel.before { min-height:auto; }
    .ps-footstats  { grid-template-columns:1fr; }
    .kpis-grid     { grid-template-columns:repeat(2,1fr); }
    .kpi:nth-child(3)::before { display:none; }
    .feature-grid  { grid-template-columns:1fr; gap:48px; }
    .phva-grid     { grid-template-columns:1fr; gap:48px; }
    .test-grid     { grid-template-columns:1fr; gap:48px; }
    .foot-grid     { grid-template-columns:1fr 1fr; }
    .nav-links, .nav-cta { display:none; }
    .nav-toggle    { display:grid; place-items:center; }
  }
  @media (max-width:767px) {
    .container     { padding:0 20px; }
    .hero          { padding:120px 0 100px; min-height:auto; }
    h1             { font-size:38px !important; }
    .modules-grid  { grid-template-columns:repeat(2,1fr); }
    .kpis-grid     { grid-template-columns:repeat(2,1fr); gap:32px 0; }
    .kpi::before   { display:none !important; }
    .mockup        { transform:none !important; }
    .mockup:hover  { transform:none !important; }
    .norm-cards    { grid-template-columns:1fr; }
    .problem-solution, .modules, .feature, .phva, .testimonial, .kpis { padding:80px 0; }
    .trust-inner   { gap:24px; }
    .trust-logos   { gap:20px; }
    .quote-text    { font-size:18px; }
    .ps-heading    { font-size:28px; }
    .ps-panel      { padding:32px 24px; }
    .phva-svg-wrap { display:none; }
  }

  @media (prefers-reduced-motion:reduce) {
    *, *::before, *::after { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; }
    .scroll-reveal, .scroll-reveal-left, .scroll-reveal-right { opacity:1 !important; transform:none !important; }
    .hero .badge, .hero h1 .line, .hero-sub, .hero-stats, .hero-ctas, .scroll-indicator { opacity:1 !important; }
    .phva-svg { animation:none !important; }
  }
`
