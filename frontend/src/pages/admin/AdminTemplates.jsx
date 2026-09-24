import React, { useEffect, useState } from 'react'
import {
  getTemplates,
  getDataTypes,
  uploadTemplate,
  generateTemplate,
  downloadAdminTemplate,
  deleteTemplate,
} from '../../api'

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([])
  const [dataTypes, setDataTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({ data_type_id: '', file: null, sync_schema: true })
  const [generateForm, setGenerateForm] = useState({ data_type_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const fetchAll = async () => {
    try {
      const [tRes, dtRes] = await Promise.all([getTemplates(), getDataTypes()])
      setTemplates(tRes.data)
      setDataTypes(dtRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Buat map: data_type_id -> template (karena 1 per 1)
  const templateByDT = {}
  templates.forEach((t) => { templateByDT[t.data_type_id] = t })

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) return setError('Pilih file terlebih dahulu')
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('data_type_id', uploadForm.data_type_id)
      formData.append('sync_schema', uploadForm.sync_schema ? 'true' : 'false')
      await uploadTemplate(formData)
      setShowUploadModal(false)
      setUploadForm({ data_type_id: '', file: null, sync_schema: true })
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengupload template')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await generateTemplate({ data_type_id: parseInt(generateForm.data_type_id) })
      setShowGenerateModal(false)
      setGenerateForm({ data_type_id: '' })
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat template')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (template) => {
    try {
      const res = await downloadAdminTemplate(template.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', template.original_filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      if (err.response?.status !== 401) {
        alert('Gagal mengunduh template')
      }
    }
  }

  const handleDelete = async (t) => {
    if (!window.confirm(`Hapus template "${t.original_filename}"?\nTemplate yang baru bisa diupload kembali setelah ini.`)) return
    setDeleteError('')
    try {
      await deleteTemplate(t.id)
      fetchAll()
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal menghapus template'
      setDeleteError(msg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const searchLower = search.toLowerCase().trim()

  // Jenis data yang sudah punya template
  const dtWithTemplate = dataTypes.filter((dt) => templateByDT[dt.id])
  const filteredWithTemplate = dtWithTemplate.filter((dt) => {
    const t = templateByDT[dt.id]
    return (
      dt.name.toLowerCase().includes(searchLower) ||
      (t && t.original_filename && t.original_filename.toLowerCase().includes(searchLower)) ||
      (t && t.creator_username && t.creator_username.toLowerCase().includes(searchLower))
    )
  })

  // Jenis data yang belum punya template
  const dtWithoutTemplate = dataTypes.filter((dt) => !templateByDT[dt.id])
  const filteredWithoutTemplate = dtWithoutTemplate.filter((dt) => {
    return dt.name.toLowerCase().includes(searchLower)
  })

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Template Excel</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Satu template untuk setiap jenis data — upload baru akan menggantikan yang lama</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setError(''); setShowGenerateModal(true) }} style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}>
            <i className="bi bi-magic"></i> Generate Template
          </button>
          <button onClick={() => { setError(''); setShowUploadModal(true) }} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}>
            <i className="bi bi-upload"></i> Upload Template
          </button>
        </div>
      </div>

      {deleteError && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, fontSize: 13 }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f5a623', flexShrink: 0, marginTop: 1 }}></i>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#1a1f2e' }}>Tidak dapat dihapus</strong>
            <div style={{ color: '#6b7280', marginTop: 2, fontSize: 12 }}>{deleteError}</div>
          </div>
          <button onClick={() => setDeleteError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}><i className="bi bi-x"></i></button>
        </div>
      )}

      {/* Search Input Bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff', maxWidth: 450 }}>
          <span style={{ padding: '0 12px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}><i className="bi bi-search"></i></span>
          <input
            style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }}
            placeholder="Cari jenis data atau nama file template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #f5a62330', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : dataTypes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0' }}>
          <i className="bi bi-grid-3x3-gap" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 12 }}></i>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Belum ada jenis data. Tambahkan jenis data terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {/* Sudah ada template */}
          {filteredWithTemplate.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: 0.5 }}>
                <i className="bi bi-check-circle-fill" style={{ color: '#16a34a' }}></i>
                SUDAH ADA TEMPLATE ({filteredWithTemplate.length})
              </div>
              <div className="row g-3">
                {filteredWithTemplate.map((dt) => {
                  const t = templateByDT[dt.id]
                  return (
                    <div className="col-md-6 col-lg-4" key={dt.id}>
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 44, height: 44, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="bi bi-file-earmark-spreadsheet-fill" style={{ color: '#16a34a', fontSize: 20 }}></i>
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1f2e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={t.original_filename}>{t.original_filename}</div>
                              <div style={{ marginTop: 4 }}>
                                <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{dt.name}</span>
                              </div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                                {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; {t.creator_username}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 18px', display: 'flex', gap: 8 }}>
                          <button onClick={() => handleDownload(t)} style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 7, padding: '6px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                            <i className="bi bi-download"></i> Unduh
                          </button>
                          <button onClick={() => { setError(''); setUploadForm({ data_type_id: String(dt.id), file: null, sync_schema: true }); setShowUploadModal(true) }} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '6px 10px', fontSize: 14, cursor: 'pointer' }} title="Ganti template">
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                          <button onClick={() => handleDelete(t)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '6px 10px', fontSize: 14, cursor: 'pointer' }} title="Hapus template">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Belum ada template */}
          {filteredWithoutTemplate.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: 0.5 }}>
                <i className="bi bi-exclamation-circle" style={{ color: '#f5a623' }}></i>
                BELUM ADA TEMPLATE ({filteredWithoutTemplate.length})
              </div>
              <div className="row g-3">
                {filteredWithoutTemplate.map((dt) => (
                  <div className="col-md-6 col-lg-4" key={dt.id}>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px dashed #e5e7eb', overflow: 'hidden', opacity: 0.85 }}>
                      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="bi bi-file-earmark-spreadsheet" style={{ color: '#9ca3af', fontSize: 20 }}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1f2e' }}>{dt.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{dt.fields_schema?.length || 0} field terdefinisi</div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 18px', display: 'flex', gap: 8 }}>
                        <button onClick={() => { setError(''); setUploadForm({ data_type_id: String(dt.id), file: null, sync_schema: true }); setShowUploadModal(true) }}
                          style={{ flex: 1, background: '#f5a623', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                          <i className="bi bi-upload"></i> Upload
                        </button>
                        <button onClick={() => { setError(''); setGenerateForm({ data_type_id: String(dt.id) }); setShowGenerateModal(true) }}
                          style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                          <i className="bi bi-magic"></i> Generate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {search && filteredWithTemplate.length === 0 && filteredWithoutTemplate.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
              <i className="bi bi-search" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.35 }}></i>
              Tidak ditemukan template atau jenis data yang sesuai dengan "{search}".
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Upload Template Excel</span>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleUpload}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JENIS DATA <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" value={uploadForm.data_type_id} onChange={e => setUploadForm({ ...uploadForm, data_type_id: e.target.value })} required style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                    <option value="">-- Pilih jenis data --</option>
                    {dataTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}{templateByDT[dt.id] ? ' (akan diganti)' : ''}</option>)}
                  </select>
                  {uploadForm.data_type_id && templateByDT[parseInt(uploadForm.data_type_id)] && (
                    <div style={{ fontSize: 11, color: '#f5a623', marginTop: 4 }}><i className="bi bi-exclamation-triangle me-1"></i>Template yang ada akan digantikan dengan file baru.</div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>FILE EXCEL <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="file" className="form-control" accept=".xlsx,.xls" onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })} required style={{ fontSize: 13 }} />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Format: .xlsx atau .xls</div>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id="syncSchema" checked={uploadForm.sync_schema} onChange={e => setUploadForm({ ...uploadForm, sync_schema: e.target.checked })} />
                  </div>
                  <label htmlFor="syncSchema" style={{ fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                    <strong>Sinkronisasi kolom otomatis</strong>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>Header baris pertama file Excel akan dijadikan daftar kolom jenis data ini.</div>
                  </label>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowUploadModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving?'not-allowed':'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: saving?0.8:1 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width:14, height:14, borderWidth:2 }} />Mengupload...</> : <><i className="bi bi-upload"></i>Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 440, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Generate Template dari Jenis Data</span>
              <button onClick={() => setShowGenerateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleGenerate}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Template Excel dibuat otomatis dari kolom yang sudah didefinisikan. Jika sudah ada template sebelumnya, akan digantikan.</p>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JENIS DATA <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className="form-select" value={generateForm.data_type_id} onChange={e => setGenerateForm({ data_type_id: e.target.value })} required style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                    <option value="">-- Pilih jenis data --</option>
                    {dataTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name} ({dt.fields_schema?.length || 0} field){templateByDT[dt.id] ? ' — akan diganti' : ''}</option>)}
                  </select>
                </div>
                {generateForm.data_type_id && dataTypes.find(d => d.id === parseInt(generateForm.data_type_id))?.fields_schema?.length === 0 && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>Jenis data ini belum punya kolom. Tambahkan kolom di menu Jenis Data terlebih dahulu.
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving?'not-allowed':'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: saving?0.8:1 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width:14, height:14, borderWidth:2 }} />Membuat...</> : <><i className="bi bi-magic"></i>Generate</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
