import React, { useEffect, useState, useRef } from 'react'
import { getMyTasks, downloadTemplate, submitTask } from '../../api'

const STATUS_MAP = {
  pending:   { label: 'Belum Upload',  color: 'warning',  icon: 'bi-clock',                    bg: '#fffbeb' },
  submitted: { label: 'Diverifikasi', color: 'primary',  icon: 'bi-hourglass-split',           bg: '#eff6ff' },
  revision:  { label: 'Perlu Revisi', color: 'danger',   icon: 'bi-exclamation-triangle-fill', bg: '#fef2f2' },
  approved:  { label: 'Disetujui',    color: 'success',  icon: 'bi-check-circle-fill',         bg: '#f0fdf4' },
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
  const s = STATUS_MAP[task.status] || { label: task.status, color: 'secondary', icon: 'bi-circle', bg: '#f9f9f9' }
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
    <div className="card border-0 shadow-sm mb-3" style={{ borderLeft: `4px solid var(--bs-${s.color}) !important` }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          {/* Left: info */}
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className={`badge bg-${s.color}`}>
                <i className={`bi ${s.icon} me-1`}></i>{s.label}
              </span>
              {isOverdue && (
                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger small">
                  <i className="bi bi-exclamation-circle me-1"></i>Terlambat
                </span>
              )}
            </div>
            <h5 className="fw-bold mb-1">{task.title}</h5>
            {task.description && (
              <p className="text-muted small mb-2">{task.description}</p>
            )}
            <div className="d-flex flex-wrap gap-3 small text-muted">
              <span>
                <i className="bi bi-grid-3x3-gap me-1"></i>
                <strong>Jenis Data:</strong> {task.data_type_name || '-'}
              </span>
              <span className={isOverdue ? 'text-danger fw-semibold' : ''}>
                <i className="bi bi-calendar-event me-1"></i>
                <strong>Deadline:</strong>{' '}
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Tidak ada'}
              </span>
              <span>
                <i className="bi bi-person me-1"></i>
                <strong>Ditugaskan oleh:</strong> {task.creator_username || 'Admin'}
              </span>
            </div>

            {/* Revision note */}
            {task.status === 'revision' && task.latest_submission?.revision_notes && (
              <RevisionNote notes={task.latest_submission.revision_notes} />
            )}
          </div>

          {/* Right: actions */}
          <div className="d-flex flex-column gap-2 flex-shrink-0">
            <button
              className="btn btn-sm btn-outline-success"
              onClick={handleDownloadTemplate}
            >
              <i className="bi bi-download me-1"></i>Unduh Template
            </button>
            {canUpload && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setShowUpload(v => !v)}
              >
                <i className="bi bi-upload me-1"></i>
                {task.status === 'revision' ? 'Upload Ulang' : 'Upload Data'}
              </button>
            )}
            {task.status === 'approved' && (
              <button className="btn btn-sm btn-success" disabled>
                <i className="bi bi-check2-all me-1"></i>Selesai
              </button>
            )}
          </div>
        </div>

        {/* Upload form */}
        {showUpload && canUpload && (
          <div className="mt-3 p-3 rounded" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <div className="fw-semibold small mb-2">
              <i className="bi bi-cloud-upload me-1 text-primary"></i>
              Upload File Data{task.status === 'revision' ? ' (Revisi)' : ''}
            </div>
            <form onSubmit={handleSubmit} className="d-flex align-items-center gap-2 flex-wrap">
              <input
                type="file"
                className="form-control form-control-sm"
                accept=".xlsx,.xls,.csv"
                ref={fileRef}
                onChange={e => setSelectedFile(e.target.files[0])}
                required
                style={{ maxWidth: 300 }}
              />
              <button type="submit" className="btn btn-sm btn-primary" disabled={uploading || !selectedFile}>
                {uploading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Mengupload...</>
                  : <><i className="bi bi-send me-1"></i>Kirim</>}
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowUpload(false)}>
                Batal
              </button>
            </form>
            <div className="text-muted mt-1" style={{ fontSize: 11 }}>
              Format yang didukung: .xlsx, .xls, .csv
            </div>
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Tugas Saya</h4>
          <p className="text-muted small mb-0">Daftar semua tugas pengumpulan data yang ditugaskan kepadamu</p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={fetchTasks}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* Status summary pills */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        <button
          className={`btn btn-sm ${filterStatus === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('all')}
        >
          Semua <span className="badge bg-white text-dark ms-1">{tasks.length}</span>
        </button>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button
            key={k}
            className={`btn btn-sm ${filterStatus === k ? `btn-${v.color}` : `btn-outline-${v.color}`}`}
            onClick={() => setFilterStatus(k)}
          >
            <i className={`bi ${v.icon} me-1`}></i>{v.label}
            <span className={`badge ms-1 ${filterStatus === k ? 'bg-white text-dark' : `bg-${v.color} text-white`}`}>
              {counts[k] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="input-group" style={{ maxWidth: 400 }}>
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            className="form-control"
            placeholder="Cari tugas atau jenis data..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-clipboard2 display-4 text-muted mb-3"></i>
          <p className="text-muted">
            {filterStatus === 'all' ? 'Belum ada tugas yang diberikan.' : `Tidak ada tugas dengan status "${STATUS_MAP[filterStatus]?.label}".`}
          </p>
        </div>
      ) : (
        filtered.map(task => (
          <TaskCard key={task.id} task={task} onUpload={fetchTasks} />
        ))
      )}
    </div>
  )
}
