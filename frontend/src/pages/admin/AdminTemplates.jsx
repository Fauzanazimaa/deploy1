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
    } catch {
      alert('Gagal mengunduh template')
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

  // Jenis data yang belum punya template
  const dtWithoutTemplate = dataTypes.filter((dt) => !templateByDT[dt.id])
  // Jenis data yang sudah punya template
  const dtWithTemplate = dataTypes.filter((dt) => templateByDT[dt.id])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Template Excel</h4>
          <p className="text-muted small mb-0">
            Satu template untuk setiap jenis data — upload baru akan menggantikan yang lama
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={() => { setError(''); setShowGenerateModal(true) }}>
            <i className="bi bi-magic me-1"></i> Generate Template
          </button>
          <button className="btn btn-primary" onClick={() => { setError(''); setShowUploadModal(true) }}>
            <i className="bi bi-upload me-1"></i> Upload Template
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="alert alert-warning alert-dismissible d-flex align-items-start gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill text-warning mt-1 flex-shrink-0"></i>
          <div>
            <strong>Tidak dapat dihapus</strong>
            <div className="small mt-1">{deleteError}</div>
          </div>
          <button type="button" className="btn-close ms-auto" onClick={() => setDeleteError('')} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : dataTypes.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-grid-3x3-gap display-4 text-muted mb-3"></i>
          <p className="text-muted">Belum ada jenis data. Tambahkan jenis data terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {/* Jenis data yang sudah punya template */}
          {dtWithTemplate.length > 0 && (
            <div className="mb-4">
              <h6 className="text-muted fw-semibold small text-uppercase mb-3">
                <i className="bi bi-check-circle-fill text-success me-1"></i>
                Sudah Ada Template ({dtWithTemplate.length})
              </h6>
              <div className="row g-3">
                {dtWithTemplate.map((dt) => {
                  const t = templateByDT[dt.id]
                  return (
                    <div className="col-md-6 col-lg-4" key={dt.id}>
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 48, height: 48, background: '#f0fdf4' }}
                            >
                              <i className="bi bi-file-earmark-spreadsheet-fill text-success fs-4"></i>
                            </div>
                            <div className="overflow-hidden flex-grow-1">
                              <div className="fw-semibold text-truncate" title={t.original_filename}>
                                {t.original_filename}
                              </div>
                              <div className="mt-1">
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 small">
                                  {dt.name}
                                </span>
                              </div>
                              <div className="small text-muted mt-1">
                                {new Date(t.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })} • <strong>{t.creator_username}</strong>
                              </div>
                              {dt.fields_schema && dt.fields_schema.length > 0 && (
                                <div className="mt-2 d-flex flex-wrap gap-1">
                                  {dt.fields_schema.slice(0, 4).map((f, i) => (
                                    <span key={i} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                                      {f.label || f.name}
                                      {f.required && <span className="text-danger ms-1">*</span>}
                                    </span>
                                  ))}
                                  {dt.fields_schema.length > 4 && (
                                    <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                                      +{dt.fields_schema.length - 4} lainnya
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 px-3">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-success flex-grow-1"
                              onClick={() => handleDownload(t)}
                            >
                              <i className="bi bi-download me-1"></i> Unduh
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="Ganti template"
                              onClick={() => {
                                setError('')
                                setUploadForm({ data_type_id: String(dt.id), file: null, sync_schema: true })
                                setShowUploadModal(true)
                              }}
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(t)}
                              title="Hapus template"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Jenis data yang belum punya template */}
          {dtWithoutTemplate.length > 0 && (
            <div>
              <h6 className="text-muted fw-semibold small text-uppercase mb-3">
                <i className="bi bi-exclamation-circle text-warning me-1"></i>
                Belum Ada Template ({dtWithoutTemplate.length})
              </h6>
              <div className="row g-3">
                {dtWithoutTemplate.map((dt) => (
                  <div className="col-md-6 col-lg-4" key={dt.id}>
                    <div className="card border-0 shadow-sm h-100 border-dashed" style={{ borderStyle: 'dashed !important', opacity: 0.8 }}>
                      <div className="card-body d-flex align-items-center gap-3">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 48, height: 48, background: '#fafafa' }}
                        >
                          <i className="bi bi-file-earmark-spreadsheet text-muted fs-4"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{dt.name}</div>
                          <div className="small text-muted">{dt.fields_schema?.length || 0} field terdefinisi</div>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 px-3">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary flex-grow-1"
                            onClick={() => {
                              setError('')
                              setUploadForm({ data_type_id: String(dt.id), file: null, sync_schema: true })
                              setShowUploadModal(true)
                            }}
                          >
                            <i className="bi bi-upload me-1"></i> Upload
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setError('')
                              setGenerateForm({ data_type_id: String(dt.id) })
                              setShowGenerateModal(true)
                            }}
                          >
                            <i className="bi bi-magic me-1"></i> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Upload Template Excel</h5>
                <button className="btn-close" onClick={() => setShowUploadModal(false)} />
              </div>
              <form onSubmit={handleUpload}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small py-2">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Jenis Data <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={uploadForm.data_type_id}
                      onChange={(e) => setUploadForm({ ...uploadForm, data_type_id: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih jenis data --</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.id}>
                          {dt.name}
                          {templateByDT[dt.id] ? ' (akan diganti)' : ''}
                        </option>
                      ))}
                    </select>
                    {uploadForm.data_type_id && templateByDT[parseInt(uploadForm.data_type_id)] && (
                      <div className="form-text text-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Template yang ada akan digantikan dengan file baru.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      File Excel <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".xlsx,.xls"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                      required
                    />
                    <div className="form-text">Format: .xlsx atau .xls</div>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="syncSchema"
                      checked={uploadForm.sync_schema}
                      onChange={(e) => setUploadForm({ ...uploadForm, sync_schema: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="syncSchema">
                      <strong>Sinkronisasi field schema</strong> dari header Excel
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        Header baris pertama file Excel akan dijadikan daftar field jenis data ini.
                      </div>
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1" />Mengupload...</>
                      : <><i className="bi bi-upload me-1"></i>Upload</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Generate Template dari Jenis Data</h5>
                <button className="btn-close" onClick={() => setShowGenerateModal(false)} />
              </div>
              <form onSubmit={handleGenerate}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small py-2">{error}</div>}
                  <p className="text-muted small">
                    Template Excel dibuat otomatis dari field yang sudah didefinisikan di jenis data.
                    Jika sudah ada template sebelumnya, akan digantikan.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Jenis Data <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={generateForm.data_type_id}
                      onChange={(e) => setGenerateForm({ data_type_id: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih jenis data --</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.id}>
                          {dt.name} ({dt.fields_schema?.length || 0} field)
                          {templateByDT[dt.id] ? ' — akan diganti' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {generateForm.data_type_id && dataTypes.find(d => d.id === parseInt(generateForm.data_type_id))?.fields_schema?.length === 0 && (
                    <div className="alert alert-warning small py-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Jenis data ini belum punya field. Tambahkan field di menu Jenis Data terlebih dahulu.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1" />Membuat...</>
                      : <><i className="bi bi-magic me-1"></i>Generate</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
