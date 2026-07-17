import React, { useEffect, useState } from 'react'
import {
  getSubmissions,
  approveSubmission,
  revisionSubmission,
  downloadSubmission,
} from '../../api'
import api from '../../api'

const STATUS_LABEL = {
  pending: { label: 'Menunggu', color: 'warning' },
  approved: { label: 'Disetujui', color: 'success' },
  revision: { label: 'Revisi', color: 'danger' },
}

// Komponen tabel preview data Excel
function PreviewTable({ rows, loading, error }) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary me-2" />
        <span className="text-muted small">Memuat data...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="alert alert-danger small py-2 mb-0">
        <i className="bi bi-exclamation-triangle me-1"></i>{error}
      </div>
    )
  }
  if (!rows || rows.length === 0) {
    return <p className="text-muted small text-center py-3 mb-0">Tidak ada data dalam file.</p>
  }

  const headers = Object.keys(rows[0])

  return (
    <div className="table-responsive border rounded" style={{ maxHeight: 380, overflowY: 'auto' }}>
      <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '0.78rem' }}>
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            <th className="text-center" style={{ width: 36 }}>#</th>
            {headers.map((h, i) => (
              <th key={i} style={{ whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td className="text-center text-muted">{ri + 1}</td>
              {headers.map((h, ci) => (
                <td key={ci}>
                  {row[h] !== null && row[h] !== undefined ? String(row[h]) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [revisionModal, setRevisionModal] = useState(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  // Preview state
  const [previewModal, setPreviewModal] = useState(null)   // submission object
  const [previewRows, setPreviewRows] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const fetchSubmissions = async () => {
    try {
      const res = await getSubmissions()
      setSubmissions(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubmissions() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Setujui pengiriman data ini?')) return
    setSaving(true)
    try {
      await approveSubmission(id)
      fetchSubmissions()
    } catch {
      alert('Gagal menyetujui')
    } finally {
      setSaving(false)
    }
  }

  const handleRevision = async (e) => {
    e.preventDefault()
    if (!revisionNotes.trim()) return
    setSaving(true)
    try {
      await revisionSubmission(revisionModal.id, { revision_notes: revisionNotes })
      setRevisionModal(null)
      setRevisionNotes('')
      fetchSubmissions()
    } catch {
      alert('Gagal mengirim catatan revisi')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (sub) => {
    try {
      const res = await downloadSubmission(sub.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `submission_${sub.id}_${sub.contributor_username}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengunduh file')
    }
  }

  const handlePreview = async (sub) => {
    setPreviewModal(sub)
    setPreviewRows([])
    setPreviewError('')
    setPreviewLoading(true)
    try {
      // Download file lalu kirim ke endpoint parse
      const dlRes = await downloadSubmission(sub.id)
      const blob = dlRes.data
      const formData = new FormData()
      formData.append('file', new File([blob], 'submission.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }))
      const parseRes = await api.post('/admin/submissions/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreviewRows(parseRes.data.rows || [])
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Gagal memuat preview data')
    } finally {
      setPreviewLoading(false)
    }
  }

  const filtered = submissions.filter((s) => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    const matchSearch =
      (s.contributor_username || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.task_title || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const pendingCount = submissions.filter((s) => s.status === 'pending').length

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Verifikasi Data</h4>
          <p className="text-muted small mb-0">Tinjau, setujui, atau minta revisi data yang dikirim kontributor</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge bg-warning text-dark fs-6 px-3 py-2">
            <i className="bi bi-clock me-1"></i>
            {pendingCount} menunggu verifikasi
          </span>
        )}
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
                  placeholder="Cari kontributor atau nama tugas..."
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
                  <span className={`badge bg-${v.color} me-1`}>
                    {submissions.filter((s) => s.status === k).length}
                  </span>
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
                    <th>Kontributor</th>
                    <th>Tugas</th>
                    <th>Status</th>
                    <th>Dikirim</th>
                    <th>Ditinjau</th>
                    <th className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        Tidak ada pengiriman ditemukan
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s, i) => {
                      const st = STATUS_LABEL[s.status] || { label: s.status, color: 'secondary' }
                      return (
                        <tr key={s.id}>
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: 30, height: 30, background: '#eff6ff' }}
                              >
                                <i className="bi bi-person-fill text-primary small"></i>
                              </div>
                              <span className="fw-semibold">{s.contributor_username}</span>
                            </div>
                          </td>
                          <td>{s.task_title}</td>
                          <td>
                            <div>
                              <span className={`badge bg-${st.color}`}>{st.label}</span>
                              {s.status === 'revision' && s.revision_notes && (
                                <button
                                  className="btn btn-link btn-sm p-0 ms-1 text-muted"
                                  title={s.revision_notes}
                                  onClick={() => setDetailModal(s)}
                                >
                                  <i className="bi bi-info-circle"></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="text-muted">
                            {new Date(s.submitted_at).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="text-muted">
                            {s.reviewed_at
                              ? new Date(s.reviewed_at).toLocaleString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })
                              : '-'}
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              {/* Tombol Preview */}
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handlePreview(s)}
                                title="Preview Data"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              {/* Tombol Download */}
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleDownload(s)}
                                title="Unduh File"
                              >
                                <i className="bi bi-download"></i>
                              </button>
                              {s.status === 'pending' && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleApprove(s.id)}
                                    disabled={saving}
                                    title="Setujui"
                                  >
                                    <i className="bi bi-check-lg"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => { setRevisionModal(s); setRevisionNotes('') }}
                                    title="Minta Revisi"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                </>
                              )}
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

      {/* Preview Modal */}
      {previewModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-eye me-2 text-info"></i>Preview Data
                  </h5>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-person me-1"></i>{previewModal.contributor_username}
                    <span className="mx-2">•</span>
                    <i className="bi bi-list-task me-1"></i>{previewModal.task_title}
                    {!previewLoading && !previewError && previewRows.length > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <strong>{previewRows.length}</strong> baris data
                      </>
                    )}
                  </div>
                </div>
                <button className="btn-close" onClick={() => setPreviewModal(null)} />
              </div>
              <div className="modal-body">
                <PreviewTable
                  rows={previewRows}
                  loading={previewLoading}
                  error={previewError}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handleDownload(previewModal)}
                >
                  <i className="bi bi-download me-1"></i>Unduh File
                </button>
                <button className="btn btn-secondary" onClick={() => setPreviewModal(null)}>
                  Tutup
                </button>
                {previewModal.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setPreviewModal(null)
                        setRevisionModal(previewModal)
                        setRevisionNotes('')
                      }}
                    >
                      <i className="bi bi-pencil-square me-1"></i>Minta Revisi
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setPreviewModal(null)
                        handleApprove(previewModal.id)
                      }}
                      disabled={saving}
                    >
                      <i className="bi bi-check-lg me-1"></i>Setujui
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-pencil-square me-2"></i>Catatan Revisi
                </h5>
                <button className="btn-close" onClick={() => setRevisionModal(null)} />
              </div>
              <form onSubmit={handleRevision}>
                <div className="modal-body pt-0">
                  <div className="alert alert-light border small mb-3">
                    <strong>Kontributor:</strong> {revisionModal.contributor_username}<br />
                    <strong>Tugas:</strong> {revisionModal.task_title}
                  </div>
                  <label className="form-label fw-semibold small">
                    Catatan untuk Kontributor <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Jelaskan apa yang perlu diperbaiki oleh kontributor..."
                    required
                  />
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setRevisionModal(null)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1" />Mengirim...</>
                      : <><i className="bi bi-send me-1"></i>Kirim Revisi</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Notes Modal */}
      {detailModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Catatan Revisi</h5>
                <button className="btn-close" onClick={() => setDetailModal(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-2 small text-muted">
                  <strong>Kontributor:</strong> {detailModal.contributor_username} •{' '}
                  <strong>Tugas:</strong> {detailModal.task_title}
                </div>
                <div className="alert alert-danger small">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {detailModal.revision_notes}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
