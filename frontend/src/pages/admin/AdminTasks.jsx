import React, { useEffect, useState } from 'react'
import {
  getAdminTasks, createTask, updateTask, deleteTask, getUsers, getDataTypes,
  getAdminAssignmentLetters, uploadAssignmentLetter, deleteAssignmentLetter, downloadAdminAssignmentLetter
} from '../../api'

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

  // Tabs state: 'tasks' (flat list) | 'contributors' (grouped by who hasn't submitted) | 'letters'
  const [activeTab, setActiveTab] = useState('tasks')

  const [assignmentLetters, setAssignmentLetters] = useState([])
  const [uploadingLetter, setUploadingLetter] = useState(false)
  const [letterError, setLetterError] = useState('')

  const fetchAll = async () => {
    try {
      const [tasksRes, usersRes, dtRes, lettersRes] = await Promise.all([
        getAdminTasks(),
        getUsers(),
        getDataTypes(),
        getAdminAssignmentLetters()
      ])
      setTasks(tasksRes.data)
      setContributors(usersRes.data.filter((u) => u.role === 'contributor'))
      setDataTypes(dtRes.data)
      setAssignmentLetters(lettersRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleUploadLetter = async (title, file) => {
    if (!file) return
    setUploadingLetter(true)
    setLetterError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('task_title', title)
      await uploadAssignmentLetter(fd)
      fetchAll()
    } catch (err) {
      setLetterError(err.response?.data?.error || 'Gagal mengupload surat permintaan data')
    } finally {
      setUploadingLetter(false)
    }
  }

  const handleDeleteLetter = async (id) => {
    if (!window.confirm('Hapus surat permintaan data ini?')) return
    try {
      await deleteAssignmentLetter(id)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus surat permintaan data')
    }
  }

  const handleDownloadLetter = async (letter) => {
    try {
      const res = await downloadAdminAssignmentLetter(letter.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', letter.original_filename)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal mengunduh surat permintaan data')
    }
  }

  const getUniqueTaskTitles = () => {
    const titles = new Set()
    tasks.forEach(t => {
      if (t.title) titles.add(t.title)
    })
    return Array.from(titles)
  }

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

  const handleSendWaReminder = (task) => {
    let phone = task.assignee_whatsapp || ''
    if (!phone) {
      alert(`Kontributor ${task.assignee_username} belum memiliki nomor WhatsApp terdaftar. Silakan tambahkan di menu Kelola Pengguna.`)
      return
    }

    // Normalisasi nomor wa
    phone = phone.replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    } else if (phone.startsWith('8')) {
      phone = '62' + phone
    }

    // Cari tugas pending/revision
    const pendingTasks = tasks.filter(t => 
      t.assigned_to === task.assigned_to && 
      (t.status === 'pending' || t.status === 'revision')
    )

    let message = `*PENGUMPULAN DATA BPS KABUPATEN SIJUNJUNG*\n`
    message += `Assalamualaikum Wr.Wb. \n`
    message += `Yth. Bapak/Ibu *${task.assignee_username}*, Mohon izin mengingatkan untuk pengisian permintaan data dari BPS Kabupaten Sijunjung pada aplikasi SEJATI BPS Kabupaten Sijunjung. Berikut rincian tugas Anda yang belum dikirim:\n`
    
    pendingTasks.forEach((t, index) => {
      const deadlineStr = t.deadline 
        ? new Date(t.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Tanpa deadline'
      message += `${index + 1}. *${t.title} - ${t.data_type_name || ''}* (Batas: ${deadlineStr})\n`
    })

    message += `Silakan akses aplikasi melalui link SEJATI berikut: https://sejati-sijunjung.vercel.app/\n`
    message += `Terima kasih atas kerja samanya.\n\n`
    message += `Akun Login:\n`
    message += `Username: *${task.assignee_username}*\n`
    message += `Password: *${task.assignee_password_plain || '—'}*\n\n`
    message += `Terima Kasih banyak Bapak/Ibu atas kontribusinya.`

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  // Get contributors with pending/revision tasks
  const getContributorsWithPendingTasks = () => {
    const groups = {}
    tasks.forEach(t => {
      if (t.status === 'pending' || t.status === 'revision') {
        const matchSearch = t.assignee_username.toLowerCase().includes(search.toLowerCase()) ||
                            t.title.toLowerCase().includes(search.toLowerCase())
        if (!matchSearch && search) return

        if (!groups[t.assigned_to]) {
          groups[t.assigned_to] = {
            id: t.assigned_to,
            username: t.assignee_username,
            whatsapp: t.assignee_whatsapp,
            pending_tasks: []
          }
        }
        groups[t.assigned_to].pending_tasks.push(t)
      }
    })
    return Object.values(groups)
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

  const contributorsWithPending = getContributorsWithPendingTasks()

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Manajemen Tugas</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Buat, tugaskan, dan pantau status kontributor pengumpulan data</p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter', sans-serif" }}
        >
          <i className="bi bi-plus-lg"></i> Buat Tugas
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20, gap: 20 }}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            background: 'none', border: 'none',
            borderBottom: activeTab === 'tasks' ? `2px solid ${ACCENT}` : '2px solid transparent',
            color: activeTab === 'tasks' ? '#1a1f2e' : '#6b7280',
            fontWeight: 600, paddingBottom: 10, cursor: 'pointer', fontSize: 13,
            fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s'
          }}
        >
          <i className="bi bi-list-task me-2"></i>Daftar Tugas
        </button>
        <button
          onClick={() => setActiveTab('contributors')}
          style={{
            background: 'none', border: 'none',
            borderBottom: activeTab === 'contributors' ? `2px solid ${ACCENT}` : '2px solid transparent',
            color: activeTab === 'contributors' ? '#1a1f2e' : '#6b7280',
            fontWeight: 600, paddingBottom: 10, cursor: 'pointer', fontSize: 13,
            fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s'
          }}
        >
          <i className="bi bi-person-exclamation me-2"></i>Belum Kirim Data ({contributorsWithPending.length})
        </button>
        <button
          onClick={() => setActiveTab('letters')}
          style={{
            background: 'none', border: 'none',
            borderBottom: activeTab === 'letters' ? `2px solid ${ACCENT}` : '2px solid transparent',
            color: activeTab === 'letters' ? '#1a1f2e' : '#6b7280',
            fontWeight: 600, paddingBottom: 10, cursor: 'pointer', fontSize: 13,
            fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s'
          }}
        >
          <i className="bi bi-file-earmark-text me-2"></i>Surat Permintaan Data
        </button>
      </div>

      {/* Tab Content 1: Flat Tasks List */}
      {activeTab === 'tasks' && (
        <>
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
                    <th style={{ ...thStyle('120px'), textAlign: 'center' }}>Aksi</th>
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
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: '#374151', fontSize: 12, fontWeight: 500 }}>{t.assignee_username}</span>
                              {t.assignee_whatsapp && (
                                <span style={{ color: '#16a34a', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <i className="bi bi-whatsapp"></i>{t.assignee_whatsapp}
                                </span>
                              )}
                            </div>
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
        </>
      )}

      {/* Tab Content 2: Grouped Contributors with Pending/Revision Tasks */}
      {activeTab === 'contributors' && (
        <>
          {/* Quick search */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff', maxWidth: 450 }}>
              <span style={{ padding: '0 12px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}><i className="bi bi-search"></i></span>
              <input style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }} placeholder="Cari nama dinas atau tugas..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            </div>
          ) : contributorsWithPending.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0', color: '#16a34a', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.8 }}></i>
              Luar biasa! Semua kontributor sudah menyelesaikan dan mengirimkan data tugas mereka.
            </div>
          ) : (
            <div className="row g-3">
              {contributorsWithPending.map(c => (
                <div key={c.id} className="col-md-6">
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h6 style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="bi bi-person-fill" style={{ color: '#3b82f6', fontSize: 12 }}></i>
                          </div>
                          {c.username}
                        </h6>
                        {c.whatsapp ? (
                          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="bi bi-whatsapp"></i> {c.whatsapp}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
                            <i className="bi bi-exclamation-triangle-fill"></i> No WA belum terdaftar
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSendWaReminder(c.pending_tasks[0])}
                        disabled={!c.whatsapp}
                        style={{
                          background: c.whatsapp ? '#f0fdf4' : '#f9fafb',
                          border: `1px solid ${c.whatsapp ? '#bbf7d0' : '#e5e7eb'}`,
                          color: c.whatsapp ? '#16a34a' : '#9ca3af',
                          borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          cursor: c.whatsapp ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif"
                        }}
                      >
                        <i className="bi bi-whatsapp"></i> Kirim WA
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid #f9f9f9', paddingTop: 10, flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Tugas Belum Dikirim ({c.pending_tasks.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {c.pending_tasks.map(t => {
                          const isRev = t.status === 'revision'
                          return (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', borderRadius: 8, padding: '8px 12px', border: '1px solid #f3f4f6' }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{t.title}</span>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{
                                  background: isRev ? '#fef2f2' : '#fff7ed',
                                  border: `1px solid ${isRev ? '#fecaca' : '#fed7aa'}`,
                                  color: isRev ? '#dc2626' : '#f5a623',
                                  borderRadius: 12, padding: '2px 8px', fontSize: 10, fontWeight: 600
                                }}>
                                  {isRev ? 'Revisi' : 'Menunggu'}
                                </span>
                                {t.deadline && (
                                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                                    Batas: {new Date(t.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content 3: Assignment Letters */}
      {activeTab === 'letters' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '24px 20px' }}>
          <h5 style={{ fontWeight: 700, fontSize: 16, color: '#1a1f2e', marginBottom: 6 }}>Manajemen Surat Permintaan Data</h5>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Upload dan kelola surat permintaan data (format PDF) berdasarkan judul kegiatan/tugas</p>
          
          {letterError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              <i className="bi bi-exclamation-triangle me-2"></i>{letterError}
            </div>
          )}

          {getUniqueTaskTitles().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#9ca3af', fontSize: 13 }}>
              <i className="bi bi-file-earmark-text" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.35 }}></i>
              Belum ada judul tugas yang dibuat. Buat tugas terlebih dahulu.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle text-start" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '40%', padding: '10px 16px' }}>Judul Kegiatan / Tugas</th>
                    <th style={{ width: '35%', padding: '10px 16px' }}>File Surat Permintaan Data (PDF)</th>
                    <th style={{ width: '25%', padding: '10px 16px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {getUniqueTaskTitles().map(title => {
                    const letter = assignmentLetters.find(l => l.task_title === title)
                    return (
                      <tr key={title}>
                        <td style={{ fontWeight: 600, color: '#1a1f2e', padding: '12px 16px' }}>{title}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {letter ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 500 }}>
                              <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: 16, color: '#ef4444' }}></i>
                              <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={letter.original_filename}>
                                {letter.original_filename}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Belum diupload</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                            {letter ? (
                              <>
                                <button
                                  onClick={() => handleDownloadLetter(letter)}
                                  className="btn btn-sm btn-outline-success"
                                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <i className="bi bi-download"></i> Unduh
                                </button>
                                <button
                                  onClick={() => handleDeleteLetter(letter.id)}
                                  className="btn btn-sm btn-outline-danger"
                                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <i className="bi bi-trash"></i> Hapus
                                </button>
                              </>
                            ) : (
                              <label style={{
                                margin: 0, padding: '5px 12px', background: '#eff6ff',
                                border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 6,
                                cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                              }}>
                                <i className="bi bi-upload"></i> Upload PDF
                                <input
                                  type="file"
                                  accept=".pdf"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    const file = e.target.files[0]
                                    if (file) {
                                      handleUploadLetter(title, file)
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>{editTask ? 'Edit Tugas' : 'Buat Tugas Baru'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JUDUL TUGAS <span style={{ color: '#dc2626' }}>*</span></label>
                  <input className="form-control" required placeholder="contoh: Data Kemiskinan Triwulan I" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>DESKRIPSI TUGAS</label>
                  <textarea className="form-control" rows={3} placeholder="Penjelasan singkat mengenai data yang perlu dikumpulkan..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JENIS DATA / TEMPLATE <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" required value={form.data_type_id} onChange={e => setForm({ ...form, data_type_id: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                    <option value="">Pilih jenis data...</option>
                    {dataTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>TUGASKAN KEPADA <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" required value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                    <option value="">Pilih kontributor...</option>
                    {contributors.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>BATAS WAKTU (DEADLINE)</label>
                  <input className="form-control" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: saving ? 0.8 : 1 }}>
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
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 400, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626', fontSize: 18 }}></i>
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
