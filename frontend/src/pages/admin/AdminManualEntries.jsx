import React, { useEffect, useState } from 'react'
import { getManualEntries, createManualEntry, deleteManualEntry, getDataTypes } from '../../api'

export default function AdminManualEntries() {
  const [entries, setEntries] = useState([])
  const [dataTypes, setDataTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDT, setSelectedDT] = useState('')
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterDT, setFilterDT] = useState('all')
  const [detailEntry, setDetailEntry] = useState(null)

  const fetchAll = async () => {
    try {
      const [eRes, dtRes] = await Promise.all([getManualEntries(), getDataTypes()])
      setEntries(eRes.data)
      setDataTypes(dtRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const currentDT = dataTypes.find((dt) => dt.id === parseInt(selectedDT))

  const openCreate = () => {
    setSelectedDT('')
    setFormData({})
    setError('')
    setShowModal(true)
  }

  const handleDTChange = (dtId) => {
    setSelectedDT(dtId)
    setFormData({})
  }

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedDT) return setError('Pilih jenis data')
    setSaving(true)
    setError('')
    try {
      await createManualEntry({
        data_type_id: parseInt(selectedDT),
        data: formData,
      })
      setShowModal(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus entri ini?')) return
    try {
      await deleteManualEntry(id)
      fetchAll()
    } catch {
      alert('Gagal menghapus')
    }
  }

  const filtered = entries.filter((e) =>
    filterDT === 'all' || e.data_type_id === parseInt(filterDT)
  )

  const renderFieldInput = (field) => {
    const value = formData[field.name] || ''
    const common = {
      className: 'form-control form-control-sm',
      value,
      onChange: (e) => handleFieldChange(field.name, e.target.value),
      required: field.required,
      id: `field-${field.name}`,
    }
    switch (field.type) {
      case 'textarea':
        return <textarea {...common} rows={3} />
      case 'select':
        return (
          <select {...common} className="form-select form-select-sm">
            <option value="">-- Pilih --</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'date':
        return <input type="date" {...common} />
      case 'number':
        return <input type="number" {...common} />
      case 'email':
        return <input type="email" {...common} />
      default:
        return <input type="text" {...common} />
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Entri Data Manual</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Tambahkan data secara langsung tanpa melalui pengiriman file</p>
        </div>
        <button onClick={openCreate} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter',sans-serif" }}>
          <i className="bi bi-plus-lg"></i> Tambah Entri
        </button>
      </div>

      {/* Filter */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <select className="form-select" value={filterDT} onChange={(e) => setFilterDT(e.target.value)} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
              <option value="all">Semua Jenis Data</option>
              {dataTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
          </div>
          <div className="col-md-8" style={{ color: '#6b7280', fontSize: 13 }}>Menampilkan {filtered.length} entri</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f5a62330', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#','Jenis Data','Data','Diinput Oleh','Tanggal',''].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: h===''?'right':'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>Belum ada entri data manual</td></tr>
                ) : filtered.map((entry, i) => {
                  const dataKeys = Object.keys(entry.data || {})
                  const preview = dataKeys.slice(0, 2).map(k => `${k}: ${entry.data[k]}`).join(', ')
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="tr-hover">
                      <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <span style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{entry.data_type_name}</span>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#374151', maxWidth: 300 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {preview || <span style={{ color: '#9ca3af' }}>-</span>}
                          {dataKeys.length > 2 && <span style={{ color: '#9ca3af', marginLeft: 6, fontSize: 12 }}>+{dataKeys.length - 2} lainnya</span>}
                        </div>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#374151' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <i className="bi bi-shield-lock-fill" style={{ color: '#f5a623' }}></i>{entry.entered_by_username}
                        </div>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{new Date(entry.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}</td>
                      <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => setDetailEntry(entry)} title="Lihat Detail" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}><i className="bi bi-eye"></i></button>
                          <button onClick={() => handleDelete(entry.id)} title="Hapus" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
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

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Tambah Entri Data Manual</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 }}>{error}</div>}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JENIS DATA <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" value={selectedDT} onChange={(e) => handleDTChange(e.target.value)} required style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                    <option value="">-- Pilih jenis data --</option>
                    {dataTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                  </select>
                </div>
                {currentDT && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1f2e' }}>Isi Data</span>
                      <span style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{currentDT.name}</span>
                    </div>
                    {currentDT.fields_schema.length === 0 ? (
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>Jenis data ini belum memiliki field. Tambahkan di menu Jenis Data.</div>
                    ) : (
                      <div className="row g-3">
                        {currentDT.fields_schema.map((field) => (
                          <div className="col-md-6" key={field.name}>
                            <label htmlFor={`field-${field.name}`} style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, letterSpacing: 0.5 }}>
                              {(field.label || field.name).toUpperCase()}{field.required && <span style={{ color: '#dc2626' }}> *</span>}
                            </label>
                            {renderFieldInput(field)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving || !currentDT} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: (saving||!currentDT)?'not-allowed':'pointer', fontFamily: "'Inter',sans-serif", opacity: (saving||!currentDT)?0.7:1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width:14, height:14, borderWidth:2 }} />Menyimpan...</> : 'Simpan Entri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Detail Entri #{detailEntry.id}</span>
              <button onClick={() => setDetailEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                <strong>Jenis Data:</strong> {detailEntry.data_type_name} &bull; <strong>Diinput:</strong> {detailEntry.entered_by_username} &bull; {new Date(detailEntry.created_at).toLocaleString('id-ID')}
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <tr>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Field</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detailEntry.data || {}).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#1a1f2e', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '9px 14px', color: '#374151' }}>{v ?? '-'}</td>
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
      <style>{`.tr-hover:hover{background:#fafafa}`}</style>
    </div>
  )
}
