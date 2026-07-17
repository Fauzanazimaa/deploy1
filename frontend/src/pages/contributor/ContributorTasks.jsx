import React, { useEffect, useState, useRef } from 'react'
import { getMyTasks, downloadTemplate, submitTask } from '../../api'

const ACCENT = '#f5a623'

const STATUS_MAP = {
  pending:   { label: 'Belum Upload',  color: 'warning',  colorHex: ACCENT,    border: '#fed7aa', icon: 'bi-clock',                    bg: '#fff7ed' },
  submitted: { label: 'Diverifikasi', color: 'primary',  colorHex: '#3b82f6', border: '#bfdbfe', icon: 'bi-hourglass-split',           bg: '#eff6ff' },
  revision:  { label: 'Perlu Revisi', color: 'danger',   colorHex: '#dc2626', border: '#fecaca', icon: 'bi-exclamation-triangle-fill', bg: '#fef2f2' },
  approved:  { label: 'Disetujui',    color: 'success',  colorHex: '#16a34a', border: '#bbf7d0', icon: 'bi-check-circle-fill',         bg: '#f0fdf4' },
}

function RevisionNote({ notes }) {
  return (
    <div className="alert alert-danger d-flex gap-3 align-items-start py-3 mt-3 mb-0">
      <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0 mt-1"></i>
      <div>
        <div className="fw-semibold mb-1 small">Catatan Revisi dari Admin:</div>
        <div className="small" style={{ whiteSpace: 'pre-line' }}>{notes}</div>
      </div>
    </div>
  )
}

function TaskCard({ task, onUpload }) {
  const s = STATUS_MAP[task.status] || { label: task.status, color: 'secondary', colorHex: '#6b7280', border: '#e5e7eb', icon: 'bi-circle', bg: '#f9f9f9' }
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved'
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadTemplate(task.data_type_id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `template_${task.data_type_name || task.id}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Template belum tersedia untuk jenis data ini. Hubungi admin.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      await submitTask(task.id, formData)
      setShowUpload(false)
      setSelectedFile(null)
      onUpload()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengupload file')
    } finally {
      setUploading(false)
    }
  }

  const canUpload = task.status === 'pending' || task.status === 'revision'

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        borderLeft: `4px solid ${s.colorHex}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: 12,
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          {/* Left */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.colorHex, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                <i className={`bi ${s.icon} me-1`}></i>{s.label}
              </span>
              {isOverdue && (
                <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  <i className="bi bi-exclamation-circle me-1"></i>Terlambat
                </span>
              )}
            </div>
            <h5 style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e', marginBottom: 6 }}>{task.title}</h5>
            {task.description && (
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>{task.description}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#6b7280' }}>
              <span><i className="bi bi-grid-3x3-gap me-1"></i><strong>Jenis Data:</strong> {task.data_type_name || '-'}</span>
              <span style={{ color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 600 : 400 }}>
                <i className="bi bi-calendar-event me-1"></i>
                <strong>Deadline:</strong>{' '}
                {task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak ada'}
              </span>
              <span><i className="bi bi-person me-1"></i><strong>Ditugaskan oleh:</strong> {task.creator_username || 'Admin'}</span>
            </div>
            {task.status === 'revision' && task.latest_submission?.revision_notes && (
              <RevisionNote notes={task.latest_submission.revision_notes} />
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleDownloadTemplate}
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}
            >
              <i className="bi bi-download"></i>Unduh Template
            </button>
            {canUpload && (
              <button
                onClick={() => setShowUpload(v => !v)}
                style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}
              >
                <i className="bi bi-upload"></i>
                {task.status === 'revision' ? 'Upload Ulang' : 'Upload Data'}
              </button>
            )}
            {task.status === 'approved' && (
              <button disabled style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}>
                <i className="bi bi-check2-all"></i>Selesai
              </button>
            )}
          </div>
        </div>

        {/* Upload form */}
        {showUpload && canUpload && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 8, background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#374151', marginBottom: 10 }}>
              <i className="bi bi-cloud-upload me-1" style={{ color: ACCENT }}></i>
              Upload File Data{task.status === 'revision' ? ' (Revisi)' : ''}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="file"
                className="form-control form-control-sm"
                accept=".xlsx,.xls,.csv"
                ref={fileRef}
                onChange={e => setSelectedFile(e.target.files[0])}
                required
                style={{ maxWidth: 300, fontSize: 12 }}
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif", opacity: uploading || !selectedFile ? 0.7 : 1 }}
              >
                {uploading ? <><span className="spinner-border spinner-border-sm me-1" />Mengupload...</> : <><i className="bi bi-send"></i>Kirim</>}
              </button>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Batal
              </button>
            </form>
            <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 6 }}>Format yang didukung: .xlsx, .xls, .csv</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContributorTasks() {
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await getMyTasks()
      setTasks(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const filtered = tasks.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.data_type_name || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = Object.fromEntries(
    Object.keys(STATUS_MAP).map(k => [k, tasks.filter(t => t.status === k).length])
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Tugas Saya</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Daftar semua tugas pengumpulan data yang ditugaskan kepadamu</p>
        </div>
        <button
          onClick={fetchTasks}
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{
            background: filterStatus === 'all' ? '#1a1f2e' : '#fff',
            border: `1px solid ${filterStatus === 'all' ? '#1a1f2e' : '#e5e7eb'}`,
            color: filterStatus === 'all' ? '#fff' : '#6b7280',
            borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}
        >
          Semua <span style={{ background: filterStatus === 'all' ? 'rgba(255,255,255,0.2)' : '#f3f4f6', color: filterStatus === 'all' ? '#fff' : '#374151', borderRadius: 10, padding: '0 6px', marginLeft: 4, fontSize: 11 }}>{tasks.length}</span>
        </button>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilterStatus(k)}
            style={{
              background: filterStatus === k ? v.bg : '#fff',
              border: `1px solid ${filterStatus === k ? v.border : '#e5e7eb'}`,
              color: filterStatus === k ? v.colorHex : '#6b7280',
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif",
            }}
          >
            <i className={`bi ${v.icon}`}></i>{v.label}
            <span style={{ background: filterStatus === k ? v.colorHex + '20' : '#f3f4f6', color: filterStatus === k ? v.colorHex : '#374151', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff', maxWidth: 400 }}>
          <span style={{ padding: '0 12px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}>
            <i className="bi bi-search"></i>
          </span>
          <input
            style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }}
            placeholder="Cari tugas atau jenis data..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
          <i className="bi bi-clipboard2" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
          {filterStatus === 'all' ? 'Belum ada tugas yang diberikan.' : `Tidak ada tugas dengan status "${STATUS_MAP[filterStatus]?.label}".`}
        </div>
      ) : (
        filtered.map(task => (
          <TaskCard key={task.id} task={task} onUpload={fetchTasks} />
        ))
      )}
    </div>
  )
}
