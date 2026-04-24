'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  Pencil,
  KeyRound,
  UserCheck,
  UserX,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Usuario {
  id: string
  email: string
  name: string
  estado: string
  rol: string
  fechaCreacion: string
}

type ModalTipo = 'crear' | 'editar' | 'reset' | null

const ROLES: { value: string; label: string }[] = [
  { value: 'coordinador_sst', label: 'Coordinador SST' },
  { value: 'jefe_area', label: 'Jefe de Área' },
  { value: 'trabajador', label: 'Trabajador' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'contratista', label: 'Contratista' },
  { value: 'medico_ocupacional', label: 'Médico Ocupacional' },
]

const ROL_LABELS: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
)

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const activo = estado === 'activo'
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
      ].join(' ')}
    >
      {activo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RolBadge({ rol }: { rol: string }) {
  const colors: Record<string, string> = {
    coordinador_sst: 'bg-blue-100 text-blue-700',
    jefe_area: 'bg-purple-100 text-purple-700',
    gerencia: 'bg-indigo-100 text-indigo-700',
    auditor: 'bg-yellow-100 text-yellow-700',
    medico_ocupacional: 'bg-teal-100 text-teal-700',
    trabajador: 'bg-gray-100 text-gray-600',
    contratista: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={['inline-block px-2 py-0.5 rounded text-xs font-medium', colors[rol] ?? 'bg-gray-100 text-gray-600'].join(' ')}>
      {ROL_LABELS[rol] ?? rol}
    </span>
  )
}

// ─── Modal genérico ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Alerta ───────────────────────────────────────────────────────────────────

function Alerta({ tipo, mensaje }: { tipo: 'ok' | 'error'; mensaje: string }) {
  return (
    <div
      className={[
        'flex items-center gap-2 px-4 py-3 rounded-lg text-sm',
        tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
      ].join(' ')}
    >
      {tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {mensaje}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null)

  // Formulario crear
  const [crearForm, setCrearForm] = useState({ name: '', email: '', password: '', rol: 'coordinador_sst' })
  const [crearLoading, setCrearLoading] = useState(false)

  // Formulario editar
  const [editarForm, setEditarForm] = useState({ name: '', rol: '' })
  const [editarLoading, setEditarLoading] = useState(false)

  // Formulario reset
  const [resetPassword, setResetPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const token = () => localStorage.getItem('authToken') ?? ''

  const mostrarAlerta = (tipo: 'ok' | 'error', mensaje: string) => {
    setAlerta({ tipo, mensaje })
    setTimeout(() => setAlerta(null), 4000)
  }

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (data.success) setUsuarios(data.users)
    } catch {
      mostrarAlerta('error', 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  // Filtro
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusqueda =
      !busqueda ||
      u.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = !filtroRol || u.rol === filtroRol
    const matchEstado = !filtroEstado || u.estado === filtroEstado
    return matchBusqueda && matchRol && matchEstado
  })

  // ─── Acciones ───────────────────────────────────────────────────────────────

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setCrearLoading(true)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(crearForm),
      })
      const data = await res.json()
      if (data.success) {
        setUsuarios((prev) => [...prev, data.user])
        setModalTipo(null)
        setCrearForm({ name: '', email: '', password: '', rol: 'coordinador_sst' })
        mostrarAlerta('ok', 'Usuario creado correctamente')
      } else {
        mostrarAlerta('error', data.message)
      }
    } catch {
      mostrarAlerta('error', 'Error al crear usuario')
    } finally {
      setCrearLoading(false)
    }
  }

  const abrirEditar = (u: Usuario) => {
    setUsuarioSeleccionado(u)
    setEditarForm({ name: u.name, rol: u.rol })
    setModalTipo('editar')
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioSeleccionado) return
    setEditarLoading(true)
    try {
      const res = await fetch(`/api/usuarios/${usuarioSeleccionado.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editarForm),
      })
      const data = await res.json()
      if (data.success) {
        setUsuarios((prev) => prev.map((u) => (u.id === data.user.id ? { ...u, ...data.user } : u)))
        setModalTipo(null)
        mostrarAlerta('ok', 'Usuario actualizado correctamente')
      } else {
        mostrarAlerta('error', data.message)
      }
    } catch {
      mostrarAlerta('error', 'Error al actualizar usuario')
    } finally {
      setEditarLoading(false)
    }
  }

  const toggleEstado = async (u: Usuario) => {
    const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (data.success) {
        setUsuarios((prev) => prev.map((usr) => (usr.id === u.id ? { ...usr, estado: nuevoEstado } : usr)))
        mostrarAlerta('ok', `Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`)
      } else {
        mostrarAlerta('error', data.message)
      }
    } catch {
      mostrarAlerta('error', 'Error al cambiar estado')
    }
  }

  const abrirReset = (u: Usuario) => {
    setUsuarioSeleccionado(u)
    setResetPassword('')
    setModalTipo('reset')
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioSeleccionado) return
    setResetLoading(true)
    try {
      const res = await fetch(`/api/usuarios/${usuarioSeleccionado.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setModalTipo(null)
        mostrarAlerta('ok', 'Contraseña actualizada correctamente')
      } else {
        mostrarAlerta('error', data.message)
      }
    } catch {
      mostrarAlerta('error', 'Error al actualizar contraseña')
    } finally {
      setResetLoading(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500">Administra los accesos al sistema SG-SST</p>
          </div>
        </div>
        <button
          onClick={() => setModalTipo('crear')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Alerta global */}
      {alerta && <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando usuarios...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Users className="w-8 h-8" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Rol</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Creación</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3"><RolBadge rol={u.rol} /></td>
                  <td className="px-5 py-3"><EstadoBadge estado={u.estado} /></td>
                  <td className="px-5 py-3 text-gray-500">{u.fechaCreacion || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditar(u)}
                        title="Editar"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => abrirReset(u)}
                        title="Cambiar contraseña"
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleEstado(u)}
                        title={u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        className={[
                          'p-1.5 rounded transition-colors',
                          u.estado === 'activo'
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50',
                        ].join(' ')}
                      >
                        {u.estado === 'activo' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs text-gray-400 text-right">
          {usuariosFiltrados.length} de {usuarios.length} usuarios
        </p>
      )}

      {/* ── Modal: Crear usuario ────────────────────────────────────────────── */}
      {modalTipo === 'crear' && (
        <Modal title="Nuevo usuario" onClose={() => setModalTipo(null)}>
          <form onSubmit={handleCrear} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                required
                minLength={3}
                value={crearForm.name}
                onChange={(e) => setCrearForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. María López"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={crearForm.email}
                onChange={(e) => setCrearForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@guaicaramo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
              <input
                type="password"
                required
                minLength={8}
                value={crearForm.password}
                onChange={(e) => setCrearForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={crearForm.rol}
                onChange={(e) => setCrearForm((f) => ({ ...f, rol: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalTipo(null)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={crearLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {crearLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear usuario
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Editar usuario ───────────────────────────────────────────── */}
      {modalTipo === 'editar' && usuarioSeleccionado && (
        <Modal title="Editar usuario" onClose={() => setModalTipo(null)}>
          <p className="text-sm text-gray-500 mb-4">{usuarioSeleccionado.email}</p>
          <form onSubmit={handleEditar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                required
                minLength={3}
                value={editarForm.name}
                onChange={(e) => setEditarForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={editarForm.rol}
                onChange={(e) => setEditarForm((f) => ({ ...f, rol: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalTipo(null)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editarLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editarLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Reset contraseña ─────────────────────────────────────────── */}
      {modalTipo === 'reset' && usuarioSeleccionado && (
        <Modal title="Cambiar contraseña" onClose={() => setModalTipo(null)}>
          <p className="text-sm text-gray-500 mb-4">
            Nueva contraseña para <strong>{usuarioSeleccionado.name || usuarioSeleccionado.email}</strong>
          </p>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalTipo(null)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Actualizar contraseña
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
