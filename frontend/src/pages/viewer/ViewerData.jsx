import React, { useEffect, useState } from 'react'
import { getApprovedData, getViewerDataTypes, exportViewerData } from '../../api'

const ACCENT = '#f5a623'

export default function ViewerData() {
  const [dataTypes, setDataTypes] = useState([])
  const [selectedDT, setSelectedDT] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [viewMode, setViewMode] = useState('cards')
  const [detailEntry, setDetailEntry] = useState(null)

  const fetchDataTypes = async () => {
    try { const res = await getViewerDataTypes(); setDataTypes(res.data) }
    catch (e) { console.error(e) }
  }

  const fetchData = async (dtId) => {
    setLoading(true)
    try {
      const res = await getApprovedData(dtId === 'all' ? null : parseInt(dtId))
      setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDataTypes(); fetchData('all') }, [])

  const handleFilterChange = (dtId) => { setSelectedDT(dtId); fetchData(dtId) }

  const handleExport = async () => {
    if (selectedDT === 'all') return alert('Pilih jenis data terlebih dahulu untuk export')
    setExporting(true)
    try {
      const res = await exportViewerData({ data_type_id: parseInt(selectedDT) })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const dt = dataTypes.find(d => d.id === parseInt(selectedDT))
      link.setAttribute('download', `export_${dt?.name || 'data'}_${new Date().toISOString().slice(0,10)}.xlsx`)
      document.body.appendChild(link); link.click(); link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) { alert('Gagal export data'); console.error(err) }
    finally { setExporting(false) }
  }

  const manualEntries = data?.manual_entries || []
  const approvedSubmissions = data?.approved_submissions || []
  const totalData = manualEntries.length + approvedSubmissions.length
  const canExport = !exporting && selectedDT !== 'all' && totalData > 0

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Data Terkini</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Data yang sudah diverifikasi dan dapat digunakan</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setViewMode('cards')} title="Tampilan Kartu"
            style={{ background: viewMode==='cards' ? ACCENT : '#fff', border: `1px solid ${viewMode==='cards' ? ACCENT : '#e5e7eb'}`, color: viewMode==='cards' ? '#fff' : '#374151', borderRadius: 8, padding: '7px 12px', fontSize: 14, cursor: 'pointer' }}>
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
          <button onClick={() => setViewMode('table')} title="Tampilan Tabel"
            style={{ background: viewMode==='table' ? ACCENT : '#fff', border: `1px solid ${viewMode==='table' ? ACCENT : '#e5e7eb'}`, color: viewMode==='table' ? '#fff' : '#374151', borderRadius: 8, padding: '7px 12px', fontSize: 14, cursor: 'pointer' }}>
            <i className="bi bi-table"></i>
          </button>
          <button onClick={handleExport} disabled={!canExport}
            style={{ background: canExport ? ACCENT : '#e5e7eb', border: 'none', color: canExport ? '#fff' : '#9ca3af', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: canExport ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}>
            {exporting ? <><span className="spinner-border spinner-border-sm" style={{ width:14,height:14,borderWidth:2 }}/>Exporting...</> : <><i className="bi bi-download"></i>Export Excel</>}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <select className="form-select" value={selectedDT} onChange={e => handleFilterChange(e.target.value)} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
              <option value="all">Semua Jenis Data</option>
              {dataTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
          </div>
          <div className="col-md-8" style={{ display: 'flex', gap: 20, fontSize: 13, color: '#6b7280', flexWrap: 'wrap', alignItems: 'center' }}>
            <span><i className="bi bi-collection me-1" style={{ color: ACCENT }}></i><strong>{totalData}</strong> total</span>
            <span><i className="bi bi-pencil-square me-1" style={{ color: '#3b82f6' }}></i><strong>{manualEntries.length}</strong> entri manual</span>
            <span><i className="bi bi-inbox me-1" style={{ color: ACCENT }}></i><strong>{approvedSubmissions.length}</strong> file disetujui</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : totalData === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0' }}>
          <i className="bi bi-inbox" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 12 }}></i>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
            {selectedDT === 'all' ? 'Belum ada data yang tersedia.' : 'Tidak ada data untuk jenis data ini.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="row g-3">
          {manualEntries.map(entry => (
            <div className="col-md-6 col-lg-4" key={`m-${entry.id}`}>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    <i className="bi bi-pencil-square me-1"></i>Entri Manual
                  </span>
                  <button onClick={() => setDetailEntry(entry)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '4px 8px', fontSize: 13, cursor: 'pointer' }}>
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
                <h6 style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', margin: '0 0 8px' }}>{entry.data_type_name}</h6>
                <div style={{ fontSize: 12, color: '#6b7280', flex: 1, marginBottom: 10 }}>
                  {Object.entries(entry.data || {}).slice(0, 2).map(([k, v]) => (
                    <div key={k}><strong style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</strong> {v || '-'}</div>
                  ))}
                  {Object.keys(entry.data || {}).length > 2 && (
                    <div style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 2 }}>+{Object.keys(entry.data).length - 2} field lainnya</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 'auto' }}>
                  <i className="bi bi-person-circle me-1"></i>{entry.entered_by_username} &bull; {new Date(entry.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          ))}
          {approvedSubmissions.map(sub => (
            <div className="col-md-6 col-lg-4" key={`s-${sub.id}`}>
              <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', height: '100%', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    <i className="bi bi-check-circle-fill me-1"></i>Data Disetujui
                  </span>
                </div>
                <h6 style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', margin: '0 0 8px' }}>{sub.task_title}</h6>
                <div style={{ fontSize: 12, color: '#6b7280', flex: 1, marginBottom: 10 }}>
                  <div><strong>Kontributor:</strong> {sub.contributor_username}</div>
                  <div><strong>Dikirim:</strong> {new Date(sub.submitted_at).toLocaleDateString('id-ID')}</div>
                  <div><strong>Disetujui:</strong> {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString('id-ID') : '-'}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 7, padding: '6px 10px', fontSize: 11, color: '#6b7280', marginTop: 'auto' }}>
                  <i className="bi bi-info-circle me-1"></i>Detail data tersedia di file upload asli
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#','Sumber','Jenis Data','Info','Tanggal','Aksi'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {manualEntries.map((entry, i) => (
                  <tr key={`m-${entry.id}`} style={{ borderBottom: '1px solid #f9f9f9' }} className="tr-hover">
                    <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '11px 20px' }}>
                      <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        <i className="bi bi-pencil-square me-1"></i>Entri Manual
                      </span>
                    </td>
                    <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1a1f2e' }}>{entry.data_type_name}</td>
                    <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{Object.keys(entry.data || {}).length} field</td>
                    <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{new Date(entry.created_at).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '11px 20px' }}>
                      <button onClick={() => setDetailEntry(entry)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                        <i className="bi bi-eye"></i>Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {approvedSubmissions.map((sub, i) => (
                  <tr key={`s-${sub.id}`} style={{ borderBottom: '1px solid #f9f9f9', background: '#f9fffe' }} className="tr-hover">
                    <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>{manualEntries.length + i + 1}</td>
                    <td style={{ padding: '11px 20px' }}>
                      <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        <i className="bi bi-check-circle-fill me-1"></i>Disetujui
                      </span>
                    </td>
                    <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1a1f2e' }}>{sub.task_title}</td>
                    <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{sub.contributor_username}</td>
                    <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>File upload</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 540, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Detail Data</span>
              <button onClick={() => setDetailEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{detailEntry.data_type_name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Diinput oleh <strong>{detailEntry.entered_by_username}</strong> &bull; {new Date(detailEntry.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <tr>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '35%' }}>Field</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detailEntry.data || {}).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#1a1f2e', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '9px 14px', color: '#374151' }}>{v ?? <span style={{ color: '#9ca3af' }}>-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailEntry(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.tr-hover:hover{background:#fafafa!important}`}</style>
    </div>
  )
}
