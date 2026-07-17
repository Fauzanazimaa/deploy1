import React, { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../../api'

const emptyForm = { username: '', email: '', password: '', role: 'contributor', is_active: true }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const fetchUsers = async () => {
    try {
      const res = await getUsers()
      setUsers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openCreate = () => {
    setEditUser(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ username: u.username, email: u.email, password: '', role: u.role, is_active: u.is_active })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editUser) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await updateUser(editUser.id, payload)
      } else {
        await createUser(form)
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Hapus pengguna "${u.username}"?`)) return
    try {
      await deleteUser(u.id)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus')
    }
  }

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status')
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const roleBadge = { admin: 'danger', contributor: 'primary', viewer: 'success' }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Kelola Pengguna</h4>
          <p className="text-muted small mb-0">Tambah, edit, dan kelola akun pengguna</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i> Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-search text-muted"></i></span>
                <input
                  className="form-control"
                  placeholder="Cari username atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="contributor">Contributor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-center">
              <span className="text-muted small">{filtered.length} pengguna ditemukan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Bergabung</th>
                    <th className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted py-4">Tidak ada pengguna</td></tr>
                  ) : (
                    filtered.map((u, i) => (
                      <tr key={u.id}>
                        <td className="text-muted small">{i + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-${roleBadge[u.role]} bg-opacity-10`}
                              style={{ width: 32, height: 32 }}
                            >
                              <i className={`bi bi-person-fill text-${roleBadge[u.role]} small`}></i>
                            </div>
                            <span className="fw-semibold">{u.username}</span>
                          </div>
                        </td>
                        <td className="text-muted small">{u.email}</td>
                        <td>
                          <span className={`badge bg-${roleBadge[u.role] || 'secondary'} text-capitalize`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {new Date(u.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <i className={`bi ${u.is_active ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(u)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(u)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small py-2">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Username <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Password {editUser ? '(kosongkan jika tidak diubah)' : <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editUser}
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Role <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="admin">Admin</option>
                        <option value="contributor">Contributor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Status</label>
                      <select
                        className="form-select"
                        value={form.is_active ? 'true' : 'false'}
                        onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                      >
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-1" /> Menyimpan...</> : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
