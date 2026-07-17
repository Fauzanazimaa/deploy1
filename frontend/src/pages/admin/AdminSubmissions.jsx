import React, { useEffect, useState } from 'react'
import { getSubmissions, approveSubmission, revisionSubmission, downloadSubmission } from '../../api'
import api from '../../api'

const STATUS_LABEL = {
  pending:  { label: 'Menunggu',  colorHex: '#f5a623', bg: '#fff7ed', border: '#fed7aa' },
  approved: { label: 'Disetujui', colorHex: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  revision: { label: 'Revisi',   colorHex: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}
const ACCENT = '#f5a623'

function PreviewTable({ rows, loading, error }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (error) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
      <i className="bi bi-exclamation-triangle me-2"></i>{error}
    </div>
  )
  if (!rows || rows.length === 0) return (
    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '24px 0' }}>Tidak ada data dalam file.</p>
  )
  const headers = Object.keys(rows[0])
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 380, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead style={{ position: 'sticky', top: 0, background: '#1a1f2e', zIndex: 1 }}>
          <tr>
            <th style={{ padding: '8px 12px', color: '#fff', fontWeight: 600, textAlign: 'center', width: 36 }}>#</th>
            {headers.map((h, i) => <th key={i} style={{ padding: '8px 12px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #f0f0f0', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '7px 12px', textAlign: 'center', color: '#9ca3af' }}>{ri + 1}</td>
              {headers.map((h, ci) => <td key={ci} style={{ padding: '7px 12px' }}>{row[h] !== null && row[h] !== undefined ? String(row[h]) : ''}</td>)}
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
  const [previewModal, setPreviewModal] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const fetchSubmissions = async () => {
    try { const res = await getSubmissions(); setSubmissions(res.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchSubmissions() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Setujui pengiriman data ini?')) return
    setSaving(true)
    try { await approveSubmission(id); fetchSubmissions() }
    catch { alert('Gagal menyetujui') }
    finally { setSaving(false) }
  }

  const handleRevision = async (e) => {
    e.preventDefault()
    if (!revisionNotes.trim()) return
    setSaving(true)
    try { await revisionSubmission(revisionModal.id, { revision_notes: revisionNotes }); setRevisionModal(null); setRevisionNotes(''); fetchSubmissions() }
    catch { alert('Gagal mengirim catatan revisi') }
    finally { setSaving(false) }
  }

  const handleDownload = async (sub) => {
    try {
      const res = await downloadSubmission(sub.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `submission_${sub.id}_${sub.contributor_username}.xlsx`)
      document.body.appendChild(link); link.click(); link.remove()
      window.URL.revokeObjectURL(url)
    } catch { alert('Gagal mengunduh file') }
  }

  const handlePreview = async (sub) => {
    setPreviewModal(sub); setPreviewRows([]); setPreviewError(''); setPreviewLoading(true)
    try {
      const dlRes = await downloadSubmission(sub.id)
      const formData = new FormData()
      formData.append('file', new File([dlRes.data], 'submission.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const parseRes = await api.post('/admin/submissions/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPreviewRows(parseRes.data.rows || [])
    } catch (err) { setPreviewError(err.response?.data?.error || 'Gagal memuat preview data') }
    finally { setPreviewLoading(false) }
  }

  const filtered = submissions.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    const matchSearch = (s.contributor_username || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.task_title || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })
  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Verifikasi Data</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Tinjau, setujui, atau minta revisi data yang dikirim kontributor</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: ACCENT, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-clock"></i> {pendingCount} menunggu verifikasi
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="row g-2">
          <div className="col-md-5">
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <span style={{ padding: '0 12px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}><i className="bi bi-search"></i></span>
              <input style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter',sans-serif" }} placeholder="Cari kontributor atau nama tugas..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 13, height: 38, fontFamily: "'Inter',sans-serif" }}>
              <option value="all">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-center gap-3">
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <span style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.colorHex, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{submissions.filter(s => s.status === k).length}</span>
                <span style={{ color: '#6b7280' }}>{v.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#','Kontributor','Tugas','Status','Dikirim','Ditinjau',''].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: h===''?'right':'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>Tidak ada pengiriman ditemukan</td></tr>
                ) : filtered.map((s, i) => {
                  const st = STATUS_LABEL[s.status] || { label: s.status, colorHex: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="tr-hover">
                      <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="bi bi-person-fill" style={{ color: '#3b82f6', fontSize: 13 }}></i>
                          </div>
                          <span style={{ fontWeight: 600, color: '#1a1f2e' }}>{s.contributor_username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#374151' }}>{s.task_title}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.colorHex, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                          {s.status === 'revision' && s.revision_notes && (
                            <button onClick={() => setDetailModal(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, fontSize: 14 }}><i className="bi bi-info-circle"></i></button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{new Date(s.submitted_at).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                      <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{s.reviewed_at ? new Date(s.reviewed_at).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'}</td>
                      <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handlePreview(s)} title="Preview" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}><i className="bi bi-eye"></i></button>
                          <button onClick={() => handleDownload(s)} title="Unduh" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}><i className="bi bi-download"></i></button>
                          {s.status === 'pending' && <>
                            <button onClick={() => handleApprove(s.id)} disabled={saving} title="Setujui" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}><i className="bi bi-check-lg"></i></button>
                            <button onClick={() => { setRevisionModal(s); setRevisionNotes('') }} title="Revisi" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}><i className="bi bi-pencil-square"></i></button>
                          </>}
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

      {/* Preview Modal */}
      {previewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-eye" style={{ color: '#3b82f6' }}></i>Preview Data
                </div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>
                  {previewModal.contributor_username} &bull; {previewModal.task_title}
                  {!previewLoading && !previewError && previewRows.length > 0 && <> &bull; <strong>{previewRows.length}</strong> baris</>}
                </div>
              </div>
              <button onClick={() => setPreviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              <PreviewTable rows={previewRows} loading={previewLoading} error={previewError} />
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button onClick={() => handleDownload(previewModal)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}><i className="bi bi-download"></i>Unduh File</button>
              <button onClick={() => setPreviewModal(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Tutup</button>
              {previewModal.status === 'pending' && <>
                <button onClick={() => { setPreviewModal(null); setRevisionModal(previewModal); setRevisionNotes('') }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}><i className="bi bi-pencil-square"></i>Minta Revisi</button>
                <button onClick={() => { setPreviewModal(null); handleApprove(previewModal.id) }} disabled={saving} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}><i className="bi bi-check-lg"></i>Setujui</button>
              </>}
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-pencil-square" style={{ color: '#dc2626', fontSize: 18 }}></i>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>Catatan Revisi</span>
              <button onClick={() => setRevisionModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleRevision}>
              <div style={{ padding: '20px' }}>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', fontSize: 13, marginBottom: 14, color: '#6b7280' }}>
                  <strong>Kontributor:</strong> {revisionModal.contributor_username}<br />
                  <strong>Tugas:</strong> {revisionModal.task_title}
                </div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>CATATAN UNTUK KONTRIBUTOR <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", resize: 'vertical' }} rows={4} value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)} placeholder="Jelaskan apa yang perlu diperbaiki..." required />
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setRevisionModal(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: '#dc2626', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving?'not-allowed':'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: saving?0.8:1 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width:14, height:14, borderWidth:2 }} />Mengirim...</> : <><i className="bi bi-send"></i>Kirim Revisi</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 420, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Catatan Revisi</span>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}><strong>Kontributor:</strong> {detailModal.contributor_username} &bull; <strong>Tugas:</strong> {detailModal.task_title}</div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#374151' }}>
                <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#dc2626' }}></i>{detailModal.revision_notes}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailModal(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.tr-hover:hover { background: #fafafa; }`}</style>
    </div>
  )
}
