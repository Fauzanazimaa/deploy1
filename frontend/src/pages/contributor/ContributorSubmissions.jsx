import React, { useEffect, useState } from 'react'
import { getMySubmissions, downloadContributorSubmission, previewContributorSubmission } from '../../api'
import { ExcelGrid } from '../admin/AdminDataSchema'

const ACCENT = '#f5a623'

const STATUS_MAP = {
  pending:  { label: 'Menunggu Verifikasi', colorHex: ACCENT,    bg: '#fff7ed', border: '#fed7aa', icon: 'bi-hourglass-split' },
  approved: { label: 'Disetujui',           colorHex: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: 'bi-check-circle-fill' },
  revision: { label: 'Perlu Revisi',        colorHex: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: 'bi-exclamation-triangle-fill' },
}

export default function ContributorSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [detailSub, setDetailSub] = useState(null)

  // Preview states
  const [previewModal, setPreviewModal] = useState(null)
  const [previewGrid, setPreviewGrid] = useState([])
  const [previewHeaders, setPreviewHeaders] = useState(1)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const fetchSubmissions = () => {
    setLoading(true)
    getMySubmissions()
      .then(res => setSubmissions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleDownload = async (sub) => {
    try {
      const res = await downloadContributorSubmission(sub.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `submission_${sub.id}_${sub.task_title.replace(/\s+/g, '_')}.xlsx`)
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
    setPreviewGrid([])
    setPreviewHeaders(1)
    setPreviewError('')
    setPreviewLoading(true)
    try {
      const res = await previewContributorSubmission(sub.id)
      setPreviewGrid(res.data.grid || [])
      setPreviewHeaders(res.data.num_header_rows || 1)
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Gagal memuat preview data')
    } finally {
      setPreviewLoading(false)
    }
  }

  const filtered = submissions.filter(s =>
    filterStatus === 'all' || s.status === filterStatus
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Riwayat Pengiriman</h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Semua data dan file yang pernah kamu kirimkan beserta statusnya</p>
      </div>

      {/* Filter pills */}
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
          Semua <span style={{ background: filterStatus === 'all' ? 'rgba(255,255,255,0.2)' : '#f3f4f6', color: filterStatus === 'all' ? '#fff' : '#374151', borderRadius: 10, padding: '0 6px', marginLeft: 4, fontSize: 11 }}>{submissions.length}</span>
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
            <span style={{ background: filterStatus === k ? v.colorHex + '20' : '#f3f4f6', color: filterStatus === k ? v.colorHex : '#374151', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>
              {submissions.filter(s => s.status === k).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>
          <i className="bi bi-inbox" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
          Belum ada riwayat pengiriman.
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((s) => {
              const st = STATUS_MAP[s.status] || { label: s.status, colorHex: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'bi-circle' }
              return (
                <div key={s.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', display: 'block' }}>{s.task_title}</span>
                      {s.data_type_name && (
                        <span style={{ color: '#6b7280', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="bi bi-file-earmark-spreadsheet" style={{ color: '#9ca3af', fontSize: 10 }}></i>
                          {s.data_type_name}
                        </span>
                      )}
                    </div>
                    <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.colorHex, borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                      <i className={`bi ${st.icon} me-1`}></i>{st.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', flexWrap: 'wrap', marginBottom: 12 }}>
                    <span><i className="bi bi-send me-1"></i>Dikirim: {s.submitted_at ? s.submitted_at.slice(0,10).split('-').reverse().join('/') : '-'}</span>
                    <span><i className="bi bi-check-circle me-1"></i>Ditinjau: {s.reviewed_at ? s.reviewed_at.slice(0,10).split('-').reverse().join('/') : '-'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => handlePreview(s)}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif" }}>
                      <i className="bi bi-eye"></i>Preview Data
                    </button>
                    <button onClick={() => handleDownload(s)}
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif" }}>
                      <i className="bi bi-download"></i>Unduh Excel
                    </button>
                    {s.status === 'revision' && s.revision_notes && (
                      <button onClick={() => setDetailSub(s)}
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif" }}>
                        <i className="bi bi-exclamation-triangle"></i>Catatan Revisi
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="d-none d-md-block" style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {['#', 'Tugas', 'Status', 'Dikirim', 'Ditinjau', 'Aksi'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const st = STATUS_MAP[s.status] || { label: s.status, colorHex: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'bi-circle' }
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                        <td style={{ padding: '10px 16px', color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{s.task_title}</div>
                          {s.data_type_name && (
                            <div style={{ color: '#6b7280', fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="bi bi-file-earmark-spreadsheet" style={{ color: '#9ca3af' }}></i>
                              {s.data_type_name}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.colorHex, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <i className={`bi ${st.icon} me-1`}></i>{st.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: 12 }}>{s.submitted_at ? s.submitted_at.slice(0,10).split('-').reverse().join('/') : '-'}</td>
                        <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: 12 }}>{s.reviewed_at ? s.reviewed_at.slice(0,10).split('-').reverse().join('/') : '-'}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => handlePreview(s)} title="Preview Data" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '5px 10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button onClick={() => handleDownload(s)} title="Unduh Excel" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 7, padding: '5px 10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <i className="bi bi-download"></i>
                            </button>
                            {s.status === 'revision' && s.revision_notes && (
                              <button onClick={() => setDetailSub(s)} title="Lihat Catatan" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '5px 10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <i className="bi bi-exclamation-triangle"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-eye" style={{ color: '#3b82f6' }}></i>Preview Data Terkirim
                </div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>
                  {previewModal.task_title}
                  {!previewLoading && !previewError && previewGrid.length > 0 && <> &bull; <strong>{previewGrid.length}</strong> baris data</>}
                </div>
              </div>
              <button onClick={() => setPreviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {previewLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }}></div>
                  <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>Memuat data...</div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : previewError ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>{previewError}
                </div>
              ) : (
                <ExcelGrid grid={previewGrid} numHeaderRows={previewHeaders} maxHeight={440} />
              )}
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button onClick={() => handleDownload(previewModal)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}><i className="bi bi-download"></i>Unduh Excel</button>
              <button onClick={() => setPreviewModal(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Revision modal */}
      {detailSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626', fontSize: 18 }}></i>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>Catatan Revisi</span>
              <button
                onClick={() => setDetailSub(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, display: 'flex', alignItems: 'center' }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                <strong>Tugas:</strong> {detailSub.task_title} &bull; Dikirim {detailSub.submitted_at ? detailSub.submitted_at.slice(0, 10).split('-').reverse().join('/') : '-'}
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626', fontSize: 18, flexShrink: 0, marginTop: 1 }}></i>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#dc2626', marginBottom: 6 }}>Catatan dari Admin:</div>
                  <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-line' }}>{detailSub.revision_notes}</div>
                </div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#3b82f6' }}>
                <i className="bi bi-info-circle me-2"></i>
                Silakan perbaiki data sesuai catatan di atas, lalu upload ulang di halaman <strong>Tugas Saya</strong>.
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDetailSub(null)}
                style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.table-row-hover:hover { background: #fafafa; }`}</style>
    </div>
  )
}
