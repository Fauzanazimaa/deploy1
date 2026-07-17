import React, { useEffect, useState } from 'react'
import { getMySubmissions } from '../../api'

const STATUS_MAP = {
  pending:  { label: 'Menunggu Verifikasi', color: 'warning', icon: 'bi-hourglass-split' },
  approved: { label: 'Disetujui',           color: 'success', icon: 'bi-check-circle-fill' },
  revision: { label: 'Perlu Revisi',        color: 'danger',  icon: 'bi-exclamation-triangle-fill' },
}

export default function ContributorSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [detailSub, setDetailSub] = useState(null)

  useEffect(() => {
    getMySubmissions()
      .then(res => setSubmissions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = submissions.filter(s =>
    filterStatus === 'all' || s.status === filterStatus
  )

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-0">Riwayat Pengiriman</h4>
        <p className="text-muted small mb-0">Semua file yang pernah kamu kirimkan beserta statusnya</p>
      </div>

      {/* Filter pills */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        <button
          className={`btn btn-sm ${filterStatus === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('all')}
        >
          Semua <span className="badge bg-white text-dark ms-1">{submissions.length}</span>
        </button>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button
            key={k}
            className={`btn btn-sm ${filterStatus === k ? `btn-${v.color}` : `btn-outline-${v.color}`}`}
            onClick={() => setFilterStatus(k)}
          >
            <i className={`bi ${v.icon} me-1`}></i>{v.label}
            <span className={`badge ms-1 ${filterStatus === k ? 'bg-white text-dark' : `bg-${v.color} text-white`}`}>
              {submissions.filter(s => s.status === k).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-inbox display-4 text-muted mb-3"></i>
          <p className="text-muted">Belum ada riwayat pengiriman.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Tugas</th>
                    <th>Status</th>
                    <th>Dikirim</th>
                    <th>Ditinjau</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const st = STATUS_MAP[s.status] || { label: s.status, color: 'secondary', icon: 'bi-circle' }
                    return (
                      <tr key={s.id}>
                        <td className="text-muted">{i + 1}</td>
                        <td className="fw-semibold">{s.task_title}</td>
                        <td>
                          <span className={`badge bg-${st.color}`}>
                            <i className={`bi ${st.icon} me-1`}></i>{st.label}
                          </span>
                        </td>
                        <td className="text-muted">
                          {new Date(s.submitted_at).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="text-muted">
                          {s.reviewed_at
                            ? new Date(s.reviewed_at).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })
                            : <span className="text-muted">-</span>}
                        </td>
                        <td>
                          {s.status === 'revision' && s.revision_notes ? (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDetailSub(s)}
                            >
                              <i className="bi bi-eye me-1"></i>Lihat Catatan
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revision detail modal */}
      {detailSub && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Catatan Revisi
                </h5>
                <button className="btn-close" onClick={() => setDetailSub(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 small text-muted">
                  <strong>Tugas:</strong> {detailSub.task_title} •{' '}
                  Dikirim {new Date(detailSub.submitted_at).toLocaleDateString('id-ID')}
                </div>
                <div className="alert alert-danger d-flex gap-3 align-items-start">
                  <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0 mt-1"></i>
                  <div>
                    <div className="fw-semibold mb-1 small">Catatan dari Admin:</div>
                    <div className="small" style={{ whiteSpace: 'pre-line' }}>
                      {detailSub.revision_notes}
                    </div>
                  </div>
                </div>
                <div className="alert alert-info small mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Silakan perbaiki data sesuai catatan di atas, lalu upload ulang di halaman <strong>Tugas Saya</strong>.
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary" onClick={() => setDetailSub(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
