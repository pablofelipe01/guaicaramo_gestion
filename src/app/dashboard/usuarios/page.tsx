'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Shield, Edit2, KeyRound, ToggleLeft, ToggleRight,
  Trash2, X, Loader2, CheckCircle2, AlertCircle, Eye,
} from 'lucide-react'
import type { UsuarioNormalizado, ModuloAcceso } from '@/types/usuarios'
import { PERMISOS_POR_ROL } from '@/types/usuarios'

interface Rol { id: string; fields: { Nombre: string } }

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

type ModalTipo = 'crear' | 'editar' | 'reset' | 'eliminar' | null

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioNormalizado[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null)
  const [seleccionado, setSeleccionado] = useState<UsuarioNormalizado | null>(null)
  const [viendoPermisos, setViendoPermisos] = useState<UsuarioNormalizado | null>(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [form, setForm] = useState({ nombre: '', email: '', password: '', rolId: '' })
  const [nuevaPassword, setNuevaPassword] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const [uRes, rRes] = await Promise.all([
      fetch('/api/usuarios', { headers: getHeaders() }),
      fetch('/api/roles', { headers: getHeaders() }),
    ])
    const uData = await uRes.json()
    const rData = await rRes.json()
    setUsuarios(uData.records ?? [])
    setRoles(rData.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function mostrarExito(msg: string) {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  function abrirModal(tipo: ModalTipo, usuario?: UsuarioNormalizado) {
    setError('')
    setSeleccionado(usuario ?? null)
    if (tipo === 'editar' && usuario) {
      setForm({ nombre: usuario.nombre, email: usuario.email, password: '', rolId: usuario.rolId })
    } else {
      setForm({ nombre: '', email: '', password: '', rolId: '' })
    }
    setNuevaPassword('')
    setModalTipo(tipo)
  }

  async function guardarCrear() {
    setError('')
    if (!form.nombre || !form.email || !form.password) { setError('Todos los campos son requeridos'); return }
    const res = await fetch('/api/usuarios', {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message); return }
    setModalTipo(null)
    mostrarExito('Usuario creado correctamente')
    cargar()
  }

  async function guardarEditar() {
    if (!seleccionado) return
    setError('')
    const res = await fetch(`/api/usuarios/${seleccionado.id}`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ nombre: form.nombre, rolId: form.rolId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message); return }
    setModalTipo(null)
    mostrarExito('Usuario actualizado')
    cargar()
  }

  async function guardarReset() {
    if (!seleccionado) return
    setError('')
    if (nuevaPassword.length < 8) { setError('Mínimo 8 caracteres'); return }
    const res = await fetch(`/api/usuarios/${seleccionado.id}/reset-password`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ nuevaPassword }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message); return }
    setModalTipo(null)
    mostrarExito('Contraseña restablecida')
  }

  async function toggleEstado(usuario: UsuarioNormalizado) {
    const activo = usuario.estado.toLowerCase() !== 'activo'
    await fetch(`/api/usuarios/${usuario.id}/estado`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ activo }),
    })
    cargar()
  }

  async function confirmarEliminar() {
    if (!seleccionado) return
    await fetch(`/api/usuarios/${seleccionado.id}`, { method: 'DELETE', headers: getHeaders() })
    setModalTipo(null)
    mostrarExito('Usuario eliminado')
    cargar()
  }

  const activos = usuarios.filter(u => u.estado.toLowerCase() === 'activo').length
  const inactivos = usuarios.length - activos
  const forzarCambio = usuarios.filter(u => u.forzarCambioClave).length

  const permisos: ModuloAcceso[] = viendoPermisos
    ? (PERMISOS_POR_ROL[viendoPermisos.rol.toLowerCase().replace(/ /g, '_')] ?? [])
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500">Administración de accesos al SG-SST</p>
          </div>
        </div>
        <button
          onClick={() => abrirModal('crear')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {exito && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {exito}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: usuarios.length, color: 'text-gray-900' },
          { label: 'Activos', value: activos, color: 'text-green-600' },
          { label: 'Inactivos', value: inactivos, color: 'text-red-500' },
          { label: 'Cambio clave pendiente', value: forzarCambio, color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={['text-2xl font-bold mt-1', color].join(' ')}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {u.rol || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={[
                      'px-2 py-0.5 rounded text-xs font-medium',
                      u.estado.toLowerCase() === 'activo'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600',
                    ].join(' ')}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViendoPermisos(u)} title="Ver permisos"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => abrirModal('editar', u)} title="Editar"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => abrirModal('reset', u)} title="Restablecer contraseña"
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleEstado(u)} title={u.estado.toLowerCase() === 'activo' ? 'Desactivar' : 'Activar'}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                        {u.estado.toLowerCase() === 'activo'
                          ? <ToggleRight className="w-3.5 h-3.5 text-green-500" />
                          : <ToggleLeft className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => abrirModal('eliminar', u)} title="Eliminar"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">Sin usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Panel de permisos */}
      {viendoPermisos && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-end" onClick={() => setViendoPermisos(null)}>
          <div className="bg-white w-80 h-full overflow-y-auto shadow-xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{viendoPermisos.nombre}</h3>
                <p className="text-xs text-gray-500">{viendoPermisos.rol || 'Sin rol'}</p>
              </div>
              <button onClick={() => setViendoPermisos(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-1 mb-4 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5" /> Matriz de permisos
            </div>
            {permisos.length === 0 ? (
              <p className="text-xs text-gray-400">Rol no reconocido o sin permisos definidos.</p>
            ) : (
              <div className="space-y-1">
                {permisos.map(({ modulo, permisos: p }) => (
                  <div key={modulo} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                    <span className="text-gray-700 truncate flex-1 mr-2">{modulo}</span>
                    <div className="flex gap-1 shrink-0">
                      {[['L', p.leer], ['E', p.escribir], ['X', p.eliminar]].map(([letra, activo]) => (
                        <span key={String(letra)} className={[
                          'w-5 h-5 rounded text-center font-bold leading-5',
                          activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-300',
                        ].join(' ')}>
                          {String(letra)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">L=Leer · E=Escribir · X=Eliminar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modales */}
      {modalTipo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            {modalTipo === 'crear' && (
              <>
                <h2 className="font-bold text-gray-900">Nuevo usuario</h2>
                {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <div className="space-y-3">
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre completo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contraseña (mín. 8 caracteres)" type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.rolId} onChange={e => setForm(f => ({ ...f, rolId: e.target.value }))}>
                    <option value="">Seleccionar rol</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.fields.Nombre}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setModalTipo(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancelar</button>
                  <button onClick={guardarCrear} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Crear</button>
                </div>
              </>
            )}

            {modalTipo === 'editar' && seleccionado && (
              <>
                <h2 className="font-bold text-gray-900">Editar usuario</h2>
                {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <div className="space-y-3">
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre completo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                  <p className="text-xs text-gray-400">Email: {seleccionado.email} (no editable)</p>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.rolId} onChange={e => setForm(f => ({ ...f, rolId: e.target.value }))}>
                    <option value="">Sin rol</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.fields.Nombre}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setModalTipo(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancelar</button>
                  <button onClick={guardarEditar} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                </div>
              </>
            )}

            {modalTipo === 'reset' && seleccionado && (
              <>
                <h2 className="font-bold text-gray-900">Restablecer contraseña</h2>
                <p className="text-sm text-gray-500">{seleccionado.nombre}</p>
                {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nueva contraseña (mín. 8 caracteres)" type="password"
                  value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} />
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setModalTipo(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancelar</button>
                  <button onClick={guardarReset} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">Restablecer</button>
                </div>
              </>
            )}

            {modalTipo === 'eliminar' && seleccionado && (
              <>
                <h2 className="font-bold text-gray-900">Eliminar usuario</h2>
                <p className="text-sm text-gray-600">
                  ¿Confirmas la eliminación de <strong>{seleccionado.nombre}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setModalTipo(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancelar</button>
                  <button onClick={confirmarEliminar} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
