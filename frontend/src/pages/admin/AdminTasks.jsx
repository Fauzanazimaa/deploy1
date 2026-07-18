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
  pending:   { label: 'Menunggu',  colorHex: '#f5a623', bg: '#fff7ed', border: '#fed7aa' },
  submitted: { label: 'Dikirim',  colorHex: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  revision:  { label: 'Revisi',   colorHex: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  approved:  { label: 'Disetujui',colorHex: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
}

const ACCENT = '#f5a623'

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
  const [deleteConfirm, setDeleteConfirm] = useState(null)
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

  const thStyle = (width) => ({
    padding: '10px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#9ca3af',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: width || 'auto',
    whiteSpace: 'nowrap',
  })

  const tdStyle = (extra = {}) => ({
    padding: '13px 16px',
    fontSize: 13,
    color: '#374151',
    verticalAlign: 'middle',
    ...extra,
  })

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Manajemen Tugas</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Buat dan tugaskan pekerjaan kepada kontributor</p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter', sans-serif" }}
        >
          <i className="bi bi-plus-lg"></i> Buat Tugas
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="row g-2">
          <div className="col-md-5">
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <span style={{ padding: '0 12px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}><i className="bi bi-search"></i></span>
              <input style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }} placeholder="Cari judul tugas atau kontributor..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }}>
              <option value="all">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-center gap-3">
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <span style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.colorHex, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{tasks.filter(t => t.status === k).length}</span>
                <span style={{ color: '#6b7280' }}>{v.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
            <i className="bi bi-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.35 }}></i>
            Tidak ada tugas ditemukan
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #f0f0f0' }}>
                <th style={thStyle('40px')}>#</th>
                <th style={thStyle()}>Jenis Data</th>
                <th style={thStyle('150px')}>Kontributor</th>
                <th style={thStyle('110px')}>Status</th>
                <th style={thStyle('110px')}>Deadline</th>
                <th style={{ ...thStyle('90px'), textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const s = STATUS_LABEL[t.status] || { label: t.status, colorHex: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
                const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'approved'
                return (
                  <tr key={t.id} className="task-row" style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle({ color: '#d1d5db', fontWeight: 600, fontSize: 11 })}>{i + 1}</td>
                    <td style={tdStyle()}>
                      <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{t.data_type_name || '—'}</div>
                      {t.description && (
                        <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{t.description.slice(0, 80)}{t.description.length > 80 ? '…' : ''}</div>
                      )}
                    </td>
                    <td style={tdStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="bi bi-person-fill" style={{ color: '#3b82f6', fontSize: 11 }}></i>
                        </div>
                        <span style={{ color: '#374151', fontSize: 12 }}>{t.assignee_username}</span>
                      </div>
                    </td>
                    <td style={tdStyle()}>
                      <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.colorHex, borderRadius: 20, padding: '3px 11px', fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                    </td>
                    <td style={tdStyle()}>
                      {t.deadline ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 600 : 400, fontSize: 12 }}>
                          {isOverdue && <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 12 }}></i>}
                          {new Date(t.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          onClick={() => openEdit(t)}
                          title="Edit tugas"
                          style={{ width: 30, height: 30, border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                        >
                          <i className="bi bi-pencil" style={{ color: '#3b82f6', fontSize: 12 }}></i>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(t)}
                          title="Hapus tugas"
                          style={{ width: 30, height: 30, border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca' }}
                        >
                          <i className="bi bi-trash" style={{ color: '#dc2626', fontSize: 12 }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>{editTask ? 'Edit Tugas' : 'Buat Tugas Baru'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto' }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JUDUL TUGAS <span style={{ color: '#dc2626' }}>*</span></label>
                  <input style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="contoh: Pengumpulan Data Penduduk RT 01" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>DESKRIPSI</label>
                  <textarea style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif", resize: 'vertical' }} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Instruksi atau keterangan tambahan..." />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JENIS DATA <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" style={{ fontSize: 13 }} value={form.data_type_id} onChange={e => setForm({ ...form, data_type_id: e.target.value })} required>
                    <option value="">-- Pilih jenis data --</option>
                    {dataTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>KONTRIBUTOR <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" style={{ fontSize: 13 }} value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} required>
                    <option value="">-- Pilih kontributor --</option>
                    {contributors.map(c => <option key={c.id} value={c.id}>{c.username} ({c.email})</option>)}
                  </select>
                  {contributors.length === 0 && <div style={{ fontSize: 11, color: '#f5a623', marginTop: 4 }}><i className="bi bi-exclamation-triangle me-1"></i>Belum ada kontributor. Tambahkan di menu Pengguna.</div>}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>DEADLINE</label>
                  <input type="date" style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: saving ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 420, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-trash" style={{ color: '#dc2626', fontSize: 18 }}></i>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>Hapus Tugas</span>
              <button onClick={() => setDeleteConfirm(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 14 }}>Yakin ingin menghapus tugas ini?</p>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>
                <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{deleteConfirm.title}</div>
                <div style={{ color: '#6b7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-person"></i>{deleteConfirm.assignee_username}
                  <span style={{ background: STATUS_LABEL[deleteConfirm.status]?.bg, border: `1px solid ${STATUS_LABEL[deleteConfirm.status]?.border}`, color: STATUS_LABEL[deleteConfirm.status]?.colorHex, borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>{STATUS_LABEL[deleteConfirm.status]?.label || deleteConfirm.status}</span>
                </div>
              </div>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400e', marginTop: 12 }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Semua submission yang terkait juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
              </div>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Batal</button>
              <button onClick={handleDelete} disabled={deleting} style={{ background: '#dc2626', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: deleting ? 0.8 : 1 }}>
                {deleting ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />Menghapus...</> : <><i className="bi bi-trash"></i>Ya, Hapus</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .task-row:hover { background: #fafbff; }
        .task-row:hover .row-actions { opacity: 1; }
        .row-actions { opacity: 0; transition: opacity 0.15s; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
