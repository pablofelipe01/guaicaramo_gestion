'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, ArrowLeft } from 'lucide-react'
import { getAuthHeaders } from '@/lib/client/authFetch'

// ── Paleta corporativa ────────────────────────────────────────────────────────
const G_DARK    = '#166534'
const G_MAIN    = '#28A745'
const G_LABEL   = '#dcfce7'
const G_BORDER  = '#86efac'
const G_POLICY  = '#f0fdf4'
const G_HEADER  = '#16a34a'
const G_ROW_ALT = '#f0fdf4'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoEvento = 'CAPACITACIÓN' | 'CHARLA' | 'INDUCCIÓN' | 'REUNIÓN' | 'RECREACIÓN Y DEPORTE'
type PlanCap    = 'SI' | 'NO' | 'N/A'

interface FilaAsistente {
  cedula:   string
  nombre:   string
  telefono: string
  cargo:    string
  correo:   string
  firmaUrl: string | null
}

const TIPOS_EVENTO: TipoEvento[] = [
  'CAPACITACIÓN', 'CHARLA', 'INDUCCIÓN', 'REUNIÓN', 'RECREACIÓN Y DEPORTE',
]
const TOTAL_FILAS = 20
const filaVacia = (): FilaAsistente =>
  ({ cedula: '', nombre: '', telefono: '', cargo: '', correo: '', firmaUrl: null })

// ── Componente formulario ─────────────────────────────────────────────────────
function ControlAsistenciaForm() {
  const searchParams = useSearchParams()
  const registroId   = searchParams.get('registroId')

  const [tipoEvento, setTipoEvento]   = useState<TipoEvento | null>(null)
  const [convocados, setConvocados]   = useState('')
  const [fecha, setFecha]             = useState('')
  const [duracion, setDuracion]       = useState('')
  const [lugar, setLugar]             = useState('')
  const [capacitador, setCapacitador] = useState('')
  const [tema, setTema]               = useState('')
  const [planCap, setPlanCap]         = useState<PlanCap | null>(null)
  const [objetivo, setObjetivo]       = useState('')
  const [contenido, setContenido]     = useState('')
  const [filas, setFilas]             = useState<FilaAsistente[]>(
    Array.from({ length: TOTAL_FILAS }, filaVacia)
  )
  const [loading, setLoading] = useState(false)

  const setFilaField = (i: number, field: keyof FilaAsistente, value: string) =>
    setFilas(prev => {
      const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c
    })

  useEffect(() => {
    if (!registroId) return
    setLoading(true)
    const headers = getAuthHeaders()
    Promise.all([
      fetch(`/api/sst/capacitaciones/registros/${registroId}`, { headers }),
      fetch(`/api/sst/capacitaciones/registros/${registroId}/asistencias-firma`, { headers }),
    ])
      .then(async ([regRes, asisRes]) => {
        if (regRes.ok) {
          const { record } = await regRes.json()
          const reg = record?.fields ?? {}
          if (reg.fecha_ejecucion) setFecha(reg.fecha_ejecucion)
          if (reg.duracion_horas)  setDuracion(String(reg.duracion_horas))
          if (reg.lugar)           setLugar(reg.lugar)
          if (reg.facilitador)     setCapacitador(reg.facilitador)
          if (reg.convocados)      setConvocados(String(reg.convocados))
          if (reg.actividad_tema)  setTema(reg.actividad_tema)
        }
        if (asisRes.ok) {
          const { records = [] } = await asisRes.json()
          const nuevas = Array.from({ length: TOTAL_FILAS }, filaVacia)
          ;(records as {
            fields: {
              numero_documento?: string
              nombre_trabajador?: string
              telefono?: string
              cargo_empresa?: string
              firma_data_url?: string | null
            }
          }[]).slice(0, TOTAL_FILAS).forEach((r, i) => {
            nuevas[i] = {
              cedula:   r.fields.numero_documento  ?? '',
              nombre:   r.fields.nombre_trabajador ?? '',
              telefono: r.fields.telefono          ?? '',
              cargo:    r.fields.cargo_empresa     ?? '',
              correo:   '',
              firmaUrl: r.fields.firma_data_url    ?? null,
            }
          })
          setFilas(nuevas)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${G_MAIN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <>
      {/* ── Barra de acciones ── */}
      <div
        id="action-bar"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: G_DARK, borderBottom: `3px solid ${G_MAIN}`,
          padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#bbf7d0', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Volver
        </button>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
          CONTROL DE ASISTENCIA — GH-FO-1 v13
        </span>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: G_MAIN, color: 'white', fontWeight: 700,
            padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 14, boxShadow: `0 2px 8px rgba(22,101,52,0.4)`,
          }}
        >
          <Download style={{ width: 16, height: 16 }} /> Descargar PDF
        </button>
      </div>

      {/* ── Área de previsualización ── */}
      <div style={{ background: '#e5e7eb', minHeight: '100vh', padding: '24px 16px' }}>
        <div
          id="control-asistencia"
          style={{
            background: 'white', margin: '0 auto',
            width: '210mm', minHeight: '297mm',
            fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt',
            padding: '6mm 8mm', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28mm' }} />
              <col />
              <col style={{ width: '38mm' }} />
            </colgroup>
            <tbody>

              {/* ── FILA 1: Logo | Título | Metadatos ── */}
              <tr>
                <td rowSpan={2} style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div style={{
                    width: '22mm', height: '14mm', margin: '0 auto',
                    background: `linear-gradient(135deg,${G_DARK},${G_MAIN})`,
                    borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '7pt', textAlign: 'center', lineHeight: 1.2,
                  }}>
                    GUAI<br />CARAMO
                  </div>
                  <div style={{ fontSize: '6pt', color: '#555', marginTop: '1mm' }}>GUAICARAMO</div>
                </td>
                <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', letterSpacing: 0.5, padding: '3mm 4mm', verticalAlign: 'middle' }}>
                  CONTROL DE ASISTENCIA
                </td>
                <td style={{ border: '1px solid #000', fontSize: '7pt', padding: '2mm', verticalAlign: 'top', lineHeight: 1.6 }}>
                  <div><b>Código:</b> GH-FO-1</div>
                  <div><b>Versión:</b> 13</div>
                  <div><b>Tipo Documento:</b> Formato</div>
                  <div><b>Implementación:</b> 01/08/2022</div>
                </td>
              </tr>

              {/* ── FILA 2: Tipo de evento + # Convocados ── */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '1.5mm 2mm' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', flexWrap: 'wrap', fontSize: '8pt' }}>
                    {TIPOS_EVENTO.map(tipo => (
                      <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '1mm', cursor: 'pointer', userSelect: 'none' }}>
                        <span
                          onClick={() => setTipoEvento(tipoEvento === tipo ? null : tipo)}
                          style={{
                            display: 'inline-block', width: '3.5mm', height: '3.5mm',
                            border: `1px solid ${tipoEvento === tipo ? G_DARK : '#000'}`,
                            background: tipoEvento === tipo ? G_MAIN : 'white',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        />
                        {tipo}
                      </label>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.5mm', fontWeight: 'bold', fontSize: '8pt' }}>
                      # CONVOCADOS:
                      <input type="number" value={convocados} onChange={e => setConvocados(e.target.value)}
                        style={{ border: 'none', borderBottom: `1px solid ${G_DARK}`, width: '14mm', outline: 'none', fontSize: '8pt', textAlign: 'center', background: 'transparent' }} />
                    </div>
                  </div>
                </td>
              </tr>

              {/* ── FILA 3: Fecha | Duración | Lugar | Capacitador ── */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK }}>FECHA:</td>
                        <td style={{ padding: '1.5mm 2mm', borderRight: `1px solid ${G_BORDER}`, width: '24mm' }}>
                          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', width: '100%' }} />
                        </td>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK }}>DURACIÓN (Horas):</td>
                        <td style={{ padding: '1.5mm 2mm', borderRight: `1px solid ${G_BORDER}`, width: '12mm' }}>
                          <input type="number" value={duracion} onChange={e => setDuracion(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', width: '100%' }} />
                        </td>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK }}>LUGAR DEL EVENTO:</td>
                        <td style={{ padding: '1.5mm 2mm', borderRight: `1px solid ${G_BORDER}` }}>
                          <input type="text" value={lugar} onChange={e => setLugar(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', width: '100%' }} />
                        </td>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK }}>CAPACITADOR U ORGANIZADOR:</td>
                        <td style={{ padding: '1.5mm 2mm' }}>
                          <input type="text" value={capacitador} onChange={e => setCapacitador(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', width: '100%' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* ── FILA 4: Tema + Plan de capacitación ── */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK, width: '26mm' }}>TEMA PRINCIPAL:</td>
                        <td style={{ padding: '1.5mm 2mm', borderRight: `1px solid ${G_BORDER}` }}>
                          <input type="text" value={tema} onChange={e => setTema(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', width: '100%' }} />
                        </td>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK }}>PLAN DE CAPACITACIÓN:</td>
                        <td style={{ padding: '1.5mm 2mm', width: '28mm' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', fontSize: '8pt' }}>
                            {(['SI', 'NO', 'N/A'] as const).map(op => (
                              <label key={op} style={{ display: 'flex', alignItems: 'center', gap: '1mm', cursor: 'pointer', userSelect: 'none' }}>
                                <span
                                  onClick={() => setPlanCap(planCap === op ? null : op)}
                                  style={{
                                    display: 'inline-block', width: '3.5mm', height: '3.5mm',
                                    border: `1px solid ${planCap === op ? G_DARK : '#000'}`,
                                    background: planCap === op ? G_MAIN : 'white',
                                    cursor: 'pointer', flexShrink: 0,
                                  }}
                                />
                                {op}
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* ── FILA 5: Objetivo ── */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK, width: '22mm' }}>OBJETIVO:</td>
                        <td style={{ padding: '1.5mm 2mm' }}>
                          <input type="text" value={objetivo} onChange={e => setObjetivo(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', width: '100%' }} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* ── FILA 6: Contenido ── */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ background: G_LABEL, padding: '1.5mm 2mm', fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap', borderRight: `1px solid ${G_BORDER}`, color: G_DARK, width: '22mm', verticalAlign: 'top', paddingTop: '3mm' }}>CONTENIDO:</td>
                        <td style={{ padding: '1.5mm 2mm' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1mm' }}>
                            {[0, 1, 2].map(line => {
                              const lineas = contenido.split('\n')
                              return (
                                <input key={line} type="text"
                                  value={lineas[line] ?? ''}
                                  onChange={e => {
                                    const ls = contenido.split('\n')
                                    while (ls.length <= line) ls.push('')
                                    ls[line] = e.target.value
                                    setContenido(ls.join('\n'))
                                  }}
                                  style={{ border: 'none', borderBottom: `1px solid ${G_BORDER}`, outline: 'none', fontSize: '8pt', width: '100%', background: 'transparent' }}
                                />
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* ── POLÍTICA DE DATOS ── */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '2mm 3mm', background: G_POLICY }}>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5mm', fontSize: '8pt', color: G_DARK }}>
                    Política de Tratamiento de Datos Personales
                  </div>
                  <div style={{ fontSize: '7pt', lineHeight: 1.4, color: '#374151' }}>
                    Autorizo de manera libre, voluntaria e informada a GUAICARAMO, para realizar el tratamiento de los datos personales
                    consignados en el presente formato, con el objetivo de dar cumplimiento a la legislación vigente en materia de
                    protección de datos personales, en especial la Ley 1581 de 2012, de igual forma la captura de imágenes por temas
                    de seguridad de la compañía.
                  </div>
                  <div style={{ fontSize: '7pt', marginTop: '1mm', lineHeight: 1.4, color: '#374151' }}>
                    La Política de Tratamiento de Datos Personales de GUAICARAMO se encuentra disponible para consulta en la página
                    web <b style={{ color: G_DARK }}>www.guaicaramo.com</b>
                  </div>
                </td>
              </tr>

              {/* ── TABLA DE ASISTENTES ── */}
              <tr>
                <td colSpan={3} style={{ padding: 0, border: '1px solid #000' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '6mm' }} />
                      <col style={{ width: '20mm' }} />
                      <col />
                      <col style={{ width: '22mm' }} />
                      <col style={{ width: '26mm' }} />
                      <col style={{ width: '28mm' }} />
                      <col style={{ width: '24mm' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: G_HEADER, color: 'white' }}>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center' }}>No.</th>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center' }}>No. CÉDULA</th>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center' }}>NOMBRE DEL ASISTENTE</th>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center', lineHeight: 1.3 }}>No. TELEFÓNICO<br />DE CONTACTO</th>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center' }}>CARGO O EMPRESA</th>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center', lineHeight: 1.3 }}>CORREO ELECTRÓNICO<br />(personal externo)</th>
                        <th style={{ border: `1px solid ${G_BORDER}`, padding: '2mm 1mm', fontSize: '7pt', textAlign: 'center' }}>FIRMA DEL ASISTENTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((fila, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : G_ROW_ALT, height: '7mm' }}>
                          <td style={{ border: '1px solid #d1d5db', padding: '0 1mm', textAlign: 'center', fontSize: '8pt', color: '#9ca3af' }}>{i + 1}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '0 0.5mm' }}>
                            <input type="text" value={fila.cedula} onChange={e => setFilaField(i, 'cedula', e.target.value)}
                              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', height: '6mm', padding: '0 0.5mm' }} />
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '0 0.5mm' }}>
                            <input type="text" value={fila.nombre} onChange={e => setFilaField(i, 'nombre', e.target.value)}
                              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', height: '6mm', fontWeight: fila.nombre ? '600' : 'normal', padding: '0 0.5mm' }} />
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '0 0.5mm' }}>
                            <input type="text" value={fila.telefono} onChange={e => setFilaField(i, 'telefono', e.target.value)}
                              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', height: '6mm', padding: '0 0.5mm' }} />
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '0 0.5mm' }}>
                            <input type="text" value={fila.cargo} onChange={e => setFilaField(i, 'cargo', e.target.value)}
                              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', height: '6mm', padding: '0 0.5mm' }} />
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '0 0.5mm' }}>
                            <input type="text" value={fila.correo} onChange={e => setFilaField(i, 'correo', e.target.value)}
                              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '8pt', background: 'transparent', height: '6mm', padding: '0 0.5mm' }} />
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '0.5mm', textAlign: 'center', verticalAlign: 'middle' }}>
                            {fila.firmaUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={fila.firmaUrl} alt="firma"
                                  style={{ maxHeight: '6mm', maxWidth: '22mm', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                              : <div style={{ height: '5mm', borderBottom: `1px solid ${G_BORDER}`, margin: '0 2mm' }} />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* ── FIRMAS DE VERIFICACIÓN ── */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '2mm 3mm', background: G_LABEL }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6mm', paddingTop: '12mm' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '8pt', color: G_DARK }}>FIRMAS DE VERIFICACIÓN:</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: `2px solid ${G_DARK}`, paddingTop: '1.5mm', fontSize: '7.5pt', fontWeight: 'bold', color: G_DARK }}>
                        CAPACITADOR U ORGANIZADOR
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: `2px solid ${G_DARK}`, paddingTop: '1.5mm', fontSize: '7.5pt', fontWeight: 'bold', color: G_DARK }}>
                        DIRECTOR O RESPONSABLE DEL ÁREA
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* ── Estilos de impresión ── */}
      <style>{`
        @media print {
          #action-bar { display: none !important; }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body > div {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #control-asistencia {
            width: 100% !important;
            min-height: unset !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 4mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          input {
            border: none !important;
            border-bottom: none !important;
            background: transparent !important;
            -webkit-appearance: none !important;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
        input:focus { background-color: #fef9c3 !important; }
      `}</style>
    </>
  )
}

// ── Export default con Suspense ───────────────────────────────────────────────
export default function NuevaAsistenciaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #28A745', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ControlAsistenciaForm />
    </Suspense>
  )
}
