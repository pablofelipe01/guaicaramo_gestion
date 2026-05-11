'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULES = [
  { phase: 'P', phaseLabel: 'Planear', phaseColor: '#4A86BE', color: '#4A86BE', title: 'Evaluación Inicial', desc: 'Diagnóstico Res. 0312 con puntaje y plan de cierre.' },
  { phase: 'P', phaseLabel: 'Planear', phaseColor: '#4A86BE', color: '#4A86BE', title: 'Matriz IPVR', desc: 'Identificación de peligros y valoración de riesgos.' },
  { phase: 'H', phaseLabel: 'Hacer',   phaseColor: '#22C55E', color: '#22C55E', title: 'Gestión de Incidentes', desc: 'Reporte, investigación y trazabilidad completa.' },
  { phase: 'H', phaseLabel: 'Hacer',   phaseColor: '#22C55E', color: '#22C55E', title: 'Capacitaciones', desc: 'Plan anual, QR de asistencia y certificados PDF.' },
  { phase: 'H', phaseLabel: 'Hacer',   phaseColor: '#22C55E', color: '#22C55E', title: 'Permisos de Trabajo', desc: 'Alturas, espacios confinados y trabajos en caliente.' },
  { phase: 'V', phaseLabel: 'Verificar',phaseColor: '#FF8C42', color: '#FF8C42', title: 'Inspecciones', desc: 'Checklists por área, hallazgos y plan de acción.' },
  { phase: 'V', phaseLabel: 'Verificar',phaseColor: '#FF8C42', color: '#FF8C42', title: 'Indicadores SST', desc: 'KPIs en tiempo real con alertas por umbral.' },
  { phase: 'V', phaseLabel: 'Verificar',phaseColor: '#FF8C42', color: '#FF8C42', title: 'Auditorías', desc: 'Internas y externas con cronograma y hallazgos.' },
  { phase: 'A', phaseLabel: 'Actuar',  phaseColor: '#4ADE80', color: '#4ADE80', title: 'Acciones Correctivas', desc: 'Causa raíz, responsable, plazo y evidencia de cierre.' },
  { phase: 'A', phaseLabel: 'Actuar',  phaseColor: '#4ADE80', color: '#4ADE80', title: 'COPASST · CCL', desc: 'Conformación, reuniones, actas y votaciones.' },
  { phase: 'A', phaseLabel: 'Actuar',  phaseColor: '#4ADE80', color: '#4ADE80', title: 'Revisión Gerencial', desc: 'Resumen ejecutivo y compromisos del comité.' },
  { phase: 'H', phaseLabel: 'Hacer',   phaseColor: '#22C55E', color: '#22C55E', title: 'EPP · Dotación', desc: 'Entrega, reposición y firma digital del trabajador.' },
]

const PROBLEMS = [
  { n: '01', title: 'Reportes manuales repetidos', desc: 'Horas perdidas armando lo mismo cada semana.' },
  { n: '02', title: 'Información fragmentada', desc: 'Datos atrapados entre sedes, Excel y carpetas físicas.' },
  { n: '03', title: 'Decisiones a destiempo', desc: 'Los indicadores llegan cuando ya pasó el turno.' },
  { n: '04', title: 'Dependencia de una sola persona', desc: 'Si no está, todo el flujo se detiene.' },
  { n: '05', title: 'Seguimiento que cuesta más que ejecutar', desc: 'Capacitar, firmar y archivar consume el día.' },
]
const SOLUTIONS = [
  { title: 'Automatización del trabajo repetitivo', desc: 'Menos errores, más tiempo para lo que importa.' },
  { title: 'Una sola fuente de verdad', desc: 'Toda la operación accesible desde cualquier dispositivo.' },
  { title: 'Indicadores en tiempo real', desc: 'Decisiones con datos vivos, no históricos.' },
  { title: 'Procesos que cualquiera ejecuta', desc: 'Estandarización que vuelve al equipo intercambiable y resiliente.' },
  { title: 'Aprendizaje continuo', desc: 'Cada acción se convierte en datos para el próximo turno.' },
]

const PHVA = [
  { letter: 'P', bg: '#2C5F8D', title: 'PLANEAR', desc: 'Evaluación inicial · Matriz IPVR · Plan de trabajo anual' },
  { letter: 'H', bg: '#166534', title: 'HACER',   desc: 'Capacitaciones · Incidentes · Permisos de trabajo · EPP' },
  { letter: 'V', bg: '#FF8C42', title: 'VERIFICAR',desc: 'Inspecciones · Indicadores SST · Auditorías' },
  { letter: 'A', bg: '#22C55E', color: '#052E16', title: 'ACTUAR', desc: 'Acciones correctivas · COPASST · Revisión gerencial' },
]

const PILARES = [
  { icon: '♥', title: 'Cuidar a las personas', desc: 'Cada herramienta nace pensando en quien la usa. Menos formularios, más tiempo para estar cerca del equipo.', tag: 'Pilar 01 · Bienestar', even: false },
  { icon: '↗', title: 'Crecer con datos', desc: 'Indicadores en vivo que convierten cada turno en aprendizaje. Decisiones con evidencia, no con intuición.', tag: 'Pilar 02 · Mejora continua', even: true },
  { icon: '⚬', title: 'Conectar equipos', desc: 'Operación, HSE, gerencia y campo en la misma pantalla. Una sola fuente de verdad para todos los frentes.', tag: 'Pilar 03 · Tecnología', even: false },
  { icon: '◷', title: 'Anticipar el riesgo', desc: 'Alertas tempranas y trazabilidad completa. Actuar antes del incidente, no después del informe.', tag: 'Pilar 04 · Prevención', even: true },
]

// ─── Hook: scroll-reveal ──────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.sr')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sr-visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useScrollReveal()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const phaseStyle = (phase: string) => {
    if (phase === 'P') return { background: 'rgba(44,95,141,0.2)', color: '#4A86BE' }
    if (phase === 'H') return { background: 'rgba(22,101,52,0.4)', color: '#22C55E' }
    if (phase === 'V') return { background: 'rgba(255,140,66,0.18)', color: '#FF8C42' }
    return { background: 'rgba(34,197,94,0.2)', color: '#4ADE80' }
  }

  return (
    <div style={{ fontFamily: "'Sora', system-ui, sans-serif", background: '#052E16', color: '#fff', overflowX: 'hidden' }}>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes conicSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes gridDrift  { from{background-position:0 0,0 0} to{background-position:64px 64px,64px 64px} }
        @keyframes particleRise { 0%{transform:translateY(0) translateX(0);opacity:0} 10%{opacity:1} 90%{opacity:.8} 100%{transform:translateY(-110vh) translateX(40px);opacity:0} }
        @keyframes ringSpin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes beamSweep  { 0%{transform:translateX(-30%) rotate(8deg);opacity:0} 30%{opacity:1} 70%{opacity:1} 100%{transform:translateX(280%) rotate(8deg);opacity:0} }
        @keyframes glowPulse  { 0%,100%{opacity:.6;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.1)} }
        @keyframes shineSweep { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes chevronBounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(6px);opacity:1} }
        @keyframes pulseDot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slowSpin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sr { opacity:0; transform:translateY(24px); transition:opacity .7s ease,transform .7s ease; }
        .sr-visible { opacity:1; transform:translateY(0); }
        .line-gradient {
          background: linear-gradient(120deg,#22C55E 0%,#FDBA74 35%,#FFFFFF 50%,#FDBA74 65%,#4ADE80 100%);
          background-size:250% 100%;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation: shineSweep 5s ease-in-out 1s infinite;
        }
        .mod-card { transition:all .3s ease; }
        .mod-card:hover { border-color:rgba(74,222,128,.6)!important; background:rgba(22,101,52,.5)!important; transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.3); }
        .ps-item { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
        .ps-item-before:hover { background:rgba(220,53,69,.12)!important; border-color:rgba(220,53,69,.4)!important; transform:translateX(-3px); }
        .ps-item-after:hover { background:rgba(34,197,94,.18)!important; border-color:rgba(74,222,128,.6)!important; transform:translateX(3px); box-shadow:0 8px 24px rgba(34,197,94,.2); }
        .phva-item { transition:all .25s ease; }
        .phva-item:hover { border-color:rgba(74,222,128,.35)!important; transform:translateX(4px); background:rgba(22,101,52,.4)!important; }
        .norm-card { transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .35s ease,border-color .35s ease; }
        .norm-card:hover { transform:translateY(-6px); border-color:rgba(74,222,128,.45)!important; box-shadow:0 20px 40px rgba(0,0,0,.35); }
        .nav-cta-btn:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 10px 24px rgba(34,197,94,.45); }
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
      `}</style>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '12px 0' : '18px 0',
        background: scrolled ? 'rgba(5,46,22,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : undefined,
        borderBottom: scrolled ? '1px solid rgba(74,222,128,0.12)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <a href="#top" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/guaicaramo-logo.png" alt="Guaicaramo" style={{ height: 40, width: 'auto', display: 'block' }} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden-mobile">
            {['#procesos','#modulos','#phva','#nosotros'].map((href, i) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color='#fff')} onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.75)')}>
                {['Procesos','Módulos','Ciclo PHVA','Nosotros'][i]}
              </a>
            ))}
          </div>
          <Link href="/auth" className="nav-cta-btn" style={{
            background: 'linear-gradient(135deg,#4ADE80 0%,#22C55E 60%,#16A34A 100%)',
            color: '#052E16', padding: '11px 22px', borderRadius: 999,
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(34,197,94,0.28)', transition: 'all .25s ease',
          }}>
            Iniciar sesión →
          </Link>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section id="top" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04210F', padding: '140px 0 80px', overflow: 'hidden' }}>
        {/* Animated conic */}
        <div style={{ position: 'absolute', inset: '-20%', background: 'conic-gradient(from 0deg at 50% 50%,rgba(34,197,94,.18) 0deg,rgba(11,91,45,.0) 60deg,rgba(255,140,66,.22) 140deg,rgba(5,46,22,.0) 220deg,rgba(74,222,128,.14) 300deg,rgba(34,197,94,.18) 360deg)', filter: 'blur(70px)', animation: 'conicSpin 24s linear infinite', pointerEvents: 'none' }} />
        {/* Drifting grid */}
        <div style={{ position: 'absolute', inset: '-10%', backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%,#000 30%,transparent 80%)', animation: 'gridDrift 30s linear infinite', pointerEvents: 'none' }} />
        {/* Beam */}
        <div style={{ position: 'absolute', top: '-10%', left: '-30%', width: '60%', height: '140%', background: 'linear-gradient(100deg,transparent 0%,rgba(255,237,213,.04) 40%,rgba(253,186,116,.12) 50%,rgba(255,237,213,.04) 60%,transparent 100%)', transform: 'rotate(8deg)', animation: 'beamSweep 9s ease-in-out infinite', mixBlendMode: 'screen', pointerEvents: 'none' }} />
        {/* Rings */}
        <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 1100, height: 1100, borderRadius: '50%', border: '1px dashed rgba(74,222,128,.18)', animation: 'ringSpin 60s linear infinite', opacity: .5, pointerEvents: 'none' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, background: 'radial-gradient(ellipse 70% 60% at center,rgba(253,186,116,.10) 0%,rgba(74,222,128,.10) 40%,transparent 70%)', pointerEvents: 'none', animation: 'glowPulse 6s ease-in-out infinite' }} />
        {/* Particles */}
        {[
          { left:'10%', delay:0, dur:14, color:'#4ADE80' }, { left:'25%', delay:2, dur:18, color:'#FDBA74' },
          { left:'42%', delay:4, dur:12, color:'#fff' },    { left:'58%', delay:1, dur:20, color:'#FF8C42' },
          { left:'72%', delay:6, dur:15, color:'#86EFAC' }, { left:'85%', delay:3, dur:17, color:'#fff' },
          { left:'18%', delay:5, dur:13, color:'#FDBA74' }, { left:'90%', delay:0, dur:19, color:'#4ADE80' },
        ].map((p, i) => (
          <div key={i} aria-hidden style={{ position: 'absolute', left: p.left, top: '80%', width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.7)', boxShadow: `0 0 8px ${p.color}`, animation: `particleRise ${p.dur}s linear ${p.delay}s infinite`, pointerEvents: 'none' }} />
        ))}

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 920, margin: '0 auto', padding: '0 24px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,.15)', border: '1px solid rgba(74,222,128,.3)', color: '#86EFAC', padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'pulseDot 2s ease-in-out infinite', display: 'inline-block' }} />
            Guaicaramo · SG-SST · Tecnología que cuida
          </span>
          <h1 style={{ marginTop: 0, fontSize: 'clamp(42px,6.5vw,78px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}>
            <span style={{ display: 'block' }}>Cuidamos a quienes</span>
            <span className="line-gradient" style={{ display: 'block' }}>mueven Guaicaramo.</span>
          </h1>
          <p style={{ marginTop: 24, fontSize: 'clamp(17px,1.6vw,20px)', lineHeight: 1.6, color: '#BBF7D0', maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            La plataforma SG-SST de Guaicaramo: tecnología hecha para que cada trabajador llegue seguro, vuelva a casa sano y todo el equipo crezca con respaldo.
          </p>
          <div style={{ marginTop: 36, display: 'inline-flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderRadius: 999, border: '1px solid rgba(74,222,128,.2)', background: 'rgba(5,46,22,.5)', backdropFilter: 'blur(8px)', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#D1FAE5' }}>
            <span>Decreto <b style={{ color: '#FDBA74' }}>1072</b></span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF8C42', opacity: .7, display: 'inline-block' }} />
            <span>Res. <b style={{ color: '#FDBA74' }}>0312</b></span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF8C42', opacity: .7, display: 'inline-block' }} />
            <span>ISO <b style={{ color: '#FDBA74' }}>45001</b></span>
          </div>
          <div style={{ marginTop: 36 }}>
            <Link href="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg,#4ADE80 0%,#22C55E 55%,#16A34A 100%)',
              color: '#052E16', padding: '18px 40px', borderRadius: 999,
              fontWeight: 700, fontSize: 17, textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(34,197,94,.45)', transition: 'all .25s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow='0 14px 36px rgba(34,197,94,.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 8px 28px rgba(34,197,94,.45)' }}
            >
              <span>→</span><span>Iniciar sesión</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div aria-hidden style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#4ADE80', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          <span>Scroll</span>
          <svg style={{ animation: 'chevronBounce 2s ease infinite' }} width="18" height="10" viewBox="0 0 18 10" fill="none"><path d="M1 1 L9 8 L17 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </section>

      {/* ══════════════ TRUST BAR ══════════════ */}
      <div style={{ background: '#0B5B2D', borderTop: '1px solid rgba(74,222,128,.2)', borderBottom: '1px solid rgba(74,222,128,.2)', height: 88, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 48, width: '100%', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>Alineado con</span>
          {['ARL · SURA','SENA','MinTrabajo','ISO 45001','Decreto 1072','GTC-45'].map(n => (
            <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.55)', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em' }}>{n}</span>
          ))}
        </div>
      </div>

      {/* ══════════════ PROBLEMA / SOLUCIÓN ══════════════ */}
      <section id="procesos" style={{ background: 'linear-gradient(180deg,#FAF7F2 0%,#F0E9DD 100%)', color: '#0F172A', padding: '140px 0 160px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(15,23,42,.05) 1px,transparent 1px)', backgroundSize: '28px 28px', opacity: .45, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div className="sr" style={{ textAlign: 'center', marginBottom: 64, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ color: '#EA580C', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Antes / Después</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#052E16' }}>Del papel al pulso digital.</h2>
            <p style={{ marginTop: 20, fontSize: 18, color: '#475569' }}>La diferencia entre administrar la seguridad y vivirla todos los días junto al equipo.</p>
          </div>

          <div className="sr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 80px -20px rgba(5,46,22,.25)' }}>
            {/* ANTES */}
            <div style={{ padding: '56px 48px', background: 'linear-gradient(155deg,#2B1614 0%,#1F0F0E 100%)', position: 'relative', minHeight: 500 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(220,53,69,.18)', color: '#FCA5A5', border: '1px solid rgba(220,53,69,.4)', padding: '8px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC3545', boxShadow: '0 0 8px #DC3545', display: 'inline-block' }} />
                Antes · Operación manual
              </span>
              <h3 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff', marginBottom: 36 }}>Procesos que <em style={{ fontStyle: 'normal', color: '#FCA5A5' }}>frenan</em><br/>al equipo.</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PROBLEMS.map(p => (
                  <li key={p.n} className="ps-item ps-item-before" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', cursor: 'default' }}>
                    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: 'rgba(220,53,69,.2)', border: '1px solid rgba(220,53,69,.35)', color: '#FCA5A5', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>{p.n}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 4 }}>{p.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>{p.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* DESPUÉS */}
            <div style={{ padding: '56px 48px', background: 'linear-gradient(155deg,#0B5B2D 0%,#052E16 100%)', position: 'relative', minHeight: 500 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,.18)', color: '#86EFAC', border: '1px solid rgba(74,222,128,.4)', padding: '8px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 12px #4ADE80', display: 'inline-block', animation: 'pulseDot 2s ease-in-out infinite' }} />
                Con Guaicaramo · Operación viva
              </span>
              <h3 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff', marginBottom: 36 }}>Procesos que <em style={{ fontStyle: 'normal', color: '#4ADE80' }}>impulsan</em><br/>al equipo.</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SOLUTIONS.map((s, i) => (
                  <li key={i} className="ps-item ps-item-after" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(74,222,128,.18)', cursor: 'default' }}>
                    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22C55E,#15803D)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(34,197,94,.4)' }}>✓</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Foot stats */}
          <div className="sr" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 48 }}>
            {[['−68%','Tiempo en reportes y trámites manuales'],['×3','Velocidad para detectar y cerrar hallazgos'],['100%','Trazabilidad de cada acción del equipo']].map(([n, l]) => (
              <div key={n} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid rgba(15,23,42,.06)', boxShadow: '0 4px 16px rgba(15,23,42,.04)', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, fontWeight: 500, color: '#166534', lineHeight: 1 }}>{n}</div>
                <div style={{ width: 1, height: 32, background: 'rgba(15,23,42,.1)' }} />
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ MÓDULOS ══════════════ */}
      <section id="modulos" style={{ background: '#0B5B2D', padding: '120px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="sr" style={{ textAlign: 'center', marginBottom: 64, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ color: '#4ADE80', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>12 módulos · 1 ecosistema</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.03em' }}><span style={{ color: '#4ADE80' }}>12 módulos.</span> Una sola misión: cuidar al equipo.</h2>
            <p style={{ marginTop: 20, fontSize: 18, color: 'rgba(255,255,255,.7)' }}>Cada herramienta conecta personas, datos y decisiones. Menos formularios, más tiempo para cuidar.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
            {MODULES.map((m, i) => (
              <div key={i} className="mod-card sr" style={{ background: 'rgba(5,46,22,.6)', border: '0.5px solid rgba(74,222,128,.2)', borderRadius: 12, padding: '22px 18px', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 168, cursor: 'default' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, ...phaseStyle(m.phase) }}>{m.phaseLabel}</span>
                <div style={{ fontSize: 22, color: m.color }}>◆</div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3, margin: 0 }}>{m.title}</h4>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ KPIs ══════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#052E16,#0B5B2D,#166534)', padding: '100px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(74,222,128,.12) 1px,transparent 1px)', backgroundSize: '32px 32px', opacity: .5, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center' }}>
            {[
              { n: '100%', label: 'Cumplimiento normativo Res. 0312', color: '#4ADE80' },
              { n: '22+',  label: 'Procesos SST digitalizados', color: '#fff' },
              { n: '0',    label: 'Incidentes sin trazabilidad', color: '#FDBA74' },
              { n: '24/7', label: 'Disponibilidad de la plataforma', color: '#fff' },
            ].map((k, i) => (
              <div key={i} style={{ padding: 20, position: 'relative', borderLeft: i > 0 ? '1px solid rgba(74,222,128,.2)' : undefined }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(40px,5.5vw,64px)', fontWeight: 500, color: k.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{k.n}</div>
                <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,.6)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PHVA ══════════════ */}
      <section id="phva" style={{ background: '#052E16', padding: '120px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="sr" style={{ textAlign: 'center', marginBottom: 48, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ color: '#4ADE80', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Visión tecnológica · Mejora continua</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.03em' }}>El ciclo <span style={{ color: '#4ADE80' }}>PHVA</span> al ritmo de Guaicaramo.</h2>
            <p style={{ marginTop: 20, fontSize: 18, color: 'rgba(255,255,255,.7)' }}>Planear con datos, hacer con foco, verificar en tiempo real y actuar para que cada persona avance con la empresa.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* SVG diagram */}
            <div className="sr" style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
              <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: 440, animation: 'slowSpin 80s linear infinite' }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M 200 200 L 200 50 A 150 150 0 0 1 350 200 Z" fill="#2C5F8D" opacity="0.85"/>
                <text x="275" y="135" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">P</text>
                <text x="275" y="155" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">PLANEAR</text>
                <path d="M 200 200 L 350 200 A 150 150 0 0 1 200 350 Z" fill="#166534" opacity="0.85"/>
                <text x="275" y="270" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">H</text>
                <text x="275" y="290" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">HACER</text>
                <path d="M 200 200 L 200 350 A 150 150 0 0 1 50 200 Z" fill="#FF8C42" opacity="0.85"/>
                <text x="125" y="280" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">V</text>
                <text x="125" y="300" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">VERIFICAR</text>
                <path d="M 200 200 L 50 200 A 150 150 0 0 1 200 50 Z" fill="#22C55E" opacity="0.85"/>
                <text x="125" y="135" fill="#052E16" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="22" textAnchor="middle" letterSpacing="-1">A</text>
                <text x="125" y="155" fill="#052E16" fontFamily="Sora,sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="2">ACTUAR</text>
                <line x1="200" y1="50" x2="200" y2="350" stroke="rgba(5,46,22,.8)" strokeWidth="2"/>
                <line x1="50" y1="200" x2="350" y2="200" stroke="rgba(5,46,22,.8)" strokeWidth="2"/>
                <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(74,222,128,.25)" strokeWidth="1"/>
                <circle cx="200" cy="200" r="64" fill="#052E16" stroke="rgba(74,222,128,.3)" strokeWidth="1"/>
                <text x="200" y="194" fill="#4ADE80" fontFamily="Sora,sans-serif" fontWeight="600" fontSize="9" textAnchor="middle" letterSpacing="3">Ciclo</text>
                <text x="200" y="212" fill="#fff" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="20" textAnchor="middle" letterSpacing="-1">PHVA</text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PHVA.map((p, i) => (
                <div key={i} className="phva-item sr" style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 18, padding: 18, borderRadius: 12, border: '1px solid rgba(74,222,128,.12)', background: 'rgba(5,46,22,.5)', cursor: 'default' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: p.bg, display: 'grid', placeItems: 'center', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: p.color || '#fff', letterSpacing: '-0.04em' }}>{p.letter}</div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '0.02em' }}>{p.title}</h4>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ NOSOTROS / PILARES ══════════════ */}
      <section id="nosotros" style={{ background: '#FAF7F2', color: '#0F172A', padding: '120px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(15,23,42,.05) 1px,transparent 1px)', backgroundSize: '32px 32px', opacity: .5, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 64 }}>
          <div className="sr" style={{ textAlign: 'center' }}>
            <p style={{ color: '#16A34A', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Visión Guaicaramo</p>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#052E16' }}>Tecnología que cuida.<br/><span style={{ color: '#16A34A' }}>Personas</span> que <span style={{ color: '#EA580C' }}>crecen.</span></h2>
            <p style={{ margin: '16px auto 0', fontSize: 16, color: '#475569', maxWidth: 500, lineHeight: 1.7 }}>Cada módulo nace de una creencia simple: la mejor inversión de Guaicaramo es su gente. Por eso digitalizamos procesos para liberar tiempo, anticipar riesgos y construir una cultura donde cuidar es parte del trabajo, no un trámite aparte.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 36 }}>
              {PILARES.map((p, i) => (
                <div key={i} className="norm-card" style={{ background: p.even ? 'linear-gradient(160deg,#C2410C 0%,#7C2D12 60%,#431407 100%)' : 'linear-gradient(160deg,#166534 0%,#0B5B2D 60%,#052E16 100%)', border: `1px solid ${p.even ? 'rgba(253,186,116,.35)' : 'rgba(74,222,128,.3)'}`, borderRadius: 16, padding: '22px 22px 24px', textAlign: 'left', overflow: 'hidden', cursor: 'default' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: p.even ? 'rgba(253,186,116,.25)' : 'rgba(74,222,128,.25)', border: `1px solid ${p.even ? 'rgba(253,186,116,.5)' : 'rgba(74,222,128,.5)'}`, display: 'grid', placeItems: 'center', marginBottom: 14, fontSize: 20, color: p.even ? '#FED7AA' : '#BBF7D0' }}>{p.icon}</div>
                  <b style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', marginBottom: 8 }}>{p.title}</b>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.88)', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                  <span style={{ display: 'inline-block', marginTop: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: p.even ? '#FED7AA' : '#BBF7D0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="sr" style={{ position: 'relative', padding: '48px 36px', borderRadius: 16, background: '#fff', border: '1px solid rgba(15,23,42,.06)', overflow: 'hidden', boxShadow: '0 12px 40px rgba(15,23,42,.08)', alignSelf: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#FF8C42,#EA580C)' }} />
            <div aria-hidden style={{ position: 'absolute', top: -30, left: 16, fontFamily: "'Sora',sans-serif", fontSize: 220, fontWeight: 800, color: '#FF8C42', opacity: .12, lineHeight: 1, pointerEvents: 'none' }}>"</div>
            <p style={{ position: 'relative', fontSize: 22, lineHeight: 1.5, fontStyle: 'italic', color: '#052E16', fontWeight: 400, letterSpacing: '-0.01em' }}>
              Pasamos de carpetas físicas y Excel a tener todo en tiempo real. El COPASST ahora puede acceder a los indicadores desde el celular.
            </p>
            <div style={{ position: 'relative', marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#475569' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FF8C42,#EA580C)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>RS</div>
              <div>
                <b style={{ color: '#052E16', fontWeight: 700, display: 'block' }}>Responsable SST</b>
                <span>Equipo Guaicaramo · Operaciones</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#052E16,#0B5B2D,#166534)', padding: '100px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(74,222,128,.12) 1px,transparent 1px)', backgroundSize: '32px 32px', opacity: .4, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <h2 className="sr" style={{ fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 18 }}>Tu equipo te espera.</h2>
          <p className="sr" style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', lineHeight: 1.6, maxWidth: 540, margin: '0 auto' }}>Accede al sistema de gestión SG-SST de Guaicaramo y empieza a cuidar a cada persona del equipo desde hoy.</p>
          <div className="sr" style={{ marginTop: 36 }}>
            <Link href="/auth" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg,#4ADE80 0%,#22C55E 55%,#16A34A 100%)',
              color: '#052E16', padding: '18px 40px', borderRadius: 999,
              fontWeight: 700, fontSize: 17, textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(34,197,94,.45)',
            }}>
              <span>→</span><span>Iniciar sesión</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: '#052E16', padding: '64px 0 28px', borderTop: '1px solid rgba(74,222,128,.12)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <img src="/guaicaramo-logo.png" alt="Guaicaramo" style={{ height: 56, width: 'auto', margin: '0 auto 18px', display: 'block' }} />
          <p style={{ maxWidth: 520, margin: '0 auto', fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>Sistema de Gestión de Seguridad y Salud en el Trabajo. Tecnología al servicio de las personas que hacen posible Guaicaramo.</p>
          <div style={{ borderTop: '1px solid rgba(74,222,128,.1)', paddingTop: 24, marginTop: 40 }}>
            <small style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>© 2026 Guaicaramo · SG-SST · Cuidar es parte del trabajo</small>
          </div>
        </div>
      </footer>
    </div>
  )
}
