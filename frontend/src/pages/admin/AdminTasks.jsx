import React, { useEffect, useState } from 'react'
import { getAdminTasks, createTask, updateTask, deleteTask, getUsers, getDataTypes } from '../../api'

const emptyForm = {
  title: '',
  description: '',
  data_type_id: '',
  assigned_to: '',
  deadline: '',
}

const STATUS_LABEL = {
  pending: { label: 'Menunggu', color: 'warning' },
  submitted: { label: 'Dikirim', color: 'primary' },
  revision: { label: 'Revisi', color: 'danger' },
  approved: { label: 'Disetujui', color: 'success' },
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState([])
  const [contributors, setContributors] = useState([])
  const [dataTypes, setDataTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // task object
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    try {
      const [tasksRes, usersRes, dtRes] = await Promise.all([
        getAdminTasks(),
        getUsers(),
        getDataTypes(),
      ])
      setTasks(tasksRes.data)
      setContributors(usersRes.data.filter((u) => u.role === 'contributor'))
      setDataTypes(dtRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setEditTask(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (t) => {
    setEditTask(t)
    setForm({
      title: t.title,
      description: t.description || '',
      data_type_id: t.data_type_id,
      assigned_to: t.assigned_to,
      deadline: t.deadline ? t.deadline.slice(0, 10) : '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        data_type_id: parseInt(form.data_type_id),
        assigned_to: parseInt(form.assigned_to),
        deadline: form.deadline || null,
      }
      if (editTask) {
        await updateTask(editTask.id, payload)
      } else {
        await createTask(payload)
      }
      setShowModal(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeStatus = async (task, status) => {
    try {
      await updateTask(task.id, { status })
      fetchAll()
    } catch {
      alert('Gagal mengubah status')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteTask(deleteConfirm.id)
      setDeleteConfirm(null)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus tugas')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = tasks.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignee_username || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Manajemen Tugas</h4>
          <p className="text-muted small mb-0">Buat dan tugaskan pekerjaan kepada kontributor</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i> Buat Tugas
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  className="form-control"
                  placeholder="Cari judul tugas atau kontributor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-center gap-3">
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <span key={k} className="small text-muted">
                  <span className={`badge bg-${v.color} me-1`}>{tasks.filter((t) => t.status === k).length}</span>
                  {v.label}
                </span>
              ))}
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
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Judul Tugas</th>
                    <th>Jenis Data</th>
                    <th>Kontributor</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        Tidak ada tugas ditemukan
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t, i) => {
                      const s = STATUS_LABEL[t.status] || { label: t.status, color: 'secondary' }
                      const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'approved'
                      return (
                        <tr key={t.id}>
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <div className="fw-semibold">{t.title}</div>
                            {t.description && (
                              <div className="text-muted" style={{ fontSize: 12 }}>
                                {t.description.slice(0, 60)}{t.description.length > 60 ? '...' : ''}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {t.data_type_name || '-'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <i className="bi bi-person-circle text-primary"></i>
                              {t.assignee_username}
                            </div>
                          </td>
                          <td>
                            <span className={`badge bg-${s.color}`}>{s.label}</span>
                          </td>
                          <td>
                            {t.deadline ? (
                              <span className={isOverdue ? 'text-danger fw-semibold' : 'text-muted'}>
                                {isOverdue && <i className="bi bi-exclamation-triangle me-1"></i>}
                                {new Date(t.deadline).toLocaleDateString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                data-bs-toggle="dropdown"
                              >
                                Aksi
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <button className="dropdown-item" onClick={() => openEdit(t)}>
                                    <i className="bi bi-pencil me-2 text-primary"></i>Edit
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                                  t.status !== k && (
                                    <li key={k}>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => handleChangeStatus(t, k)}
                                      >
                                        <span className={`badge bg-${v.color} me-2`}>{v.label}</span>
                                        Ubah ke {v.label}
                                      </button>
                                    </li>
                                  )
                                ))}
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button
                                    className="dropdown-item text-danger"
                                    onClick={() => setDeleteConfirm(t)}
                                  >
                                    <i className="bi bi-trash me-2"></i>Hapus Tugas
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editTask ? 'Edit Tugas' : 'Buat Tugas Baru'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small py-2">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Judul Tugas <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      placeholder="contoh: Pengumpulan Data Penduduk RT 01"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Deskripsi</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Instruksi atau keterangan tambahan..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Jenis Data <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.data_type_id}
                      onChange={(e) => setForm({ ...form, data_type_id: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih jenis data --</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Kontributor <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.assigned_to}
                      onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih kontributor --</option>
                      {contributors.map((c) => (
                        <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
                      ))}
                    </select>
                    {contributors.length === 0 && (
                      <div className="form-text text-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Belum ada kontributor. Tambahkan di menu Pengguna terlebih dahulu.
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Deadline</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1" /> Menyimpan...</>
                      : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-trash me-2"></i>Hapus Tugas
                </h5>
                <button className="btn-close" onClick={() => setDeleteConfirm(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-3">Yakin ingin menghapus tugas ini?</p>
                <div className="border rounded p-3 bg-light small">
                  <div className="fw-semibold">{deleteConfirm.title}</div>
                  <div className="text-muted mt-1">
                    <i className="bi bi-person me-1"></i>{deleteConfirm.assignee_username}
                    <span className="mx-2">•</span>
                    <span className={`badge bg-${STATUS_LABEL[deleteConfirm.status]?.color || 'secondary'}`}>
                      {STATUS_LABEL[deleteConfirm.status]?.label || deleteConfirm.status}
                    </span>
                  </div>
                </div>
                <div className="alert alert-warning small mt-3 mb-0 py-2">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Semua submission yang terkait tugas ini juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting
                    ? <><span className="spinner-border spinner-border-sm me-1" />Menghapus...</>
                    : <><i className="bi bi-trash me-1"></i>Ya, Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
