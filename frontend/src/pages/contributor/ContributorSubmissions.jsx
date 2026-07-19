import React, { useEffect, useState } from 'react'
import { getMySubmissions } from '../../api'

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
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Riwayat Pengiriman</h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Semua file yang pernah kamu kirimkan beserta statusnya</p>
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
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#', 'Tugas', 'Status', 'Dikirim', 'Ditinjau', 'Catatan'].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const st = STATUS_MAP[s.status] || { label: s.status, colorHex: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'bi-circle' }
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                      <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1a1f2e' }}>{s.task_title}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.colorHex, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          <i className={`bi ${st.icon} me-1`}></i>{st.label}
                        </span>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>
                        {s.submitted_at ? s.submitted_at.slice(0, 10).split('-').reverse().join('/') : '-'}
                      </td>
                      <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>
                        {s.reviewed_at ? s.reviewed_at.slice(0, 10).split('-').reverse().join('/') : '-'}
                      </td>
                      <td style={{ padding: '11px 20px' }}>
                        {s.status === 'revision' && s.revision_notes ? (
                          <button
                            onClick={() => setDetailSub(s)}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif" }}
                          >
                            <i className="bi bi-eye"></i>Lihat Catatan
                          </button>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
