import React, { useEffect, useState } from 'react'
import { getApprovedData, getViewerDataTypes, exportViewerData } from '../../api'

export default function ViewerData() {
  const [dataTypes, setDataTypes] = useState([])
  const [selectedDT, setSelectedDT] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'
  const [detailEntry, setDetailEntry] = useState(null)

  const fetchDataTypes = async () => {
    try {
      const res = await getViewerDataTypes()
      setDataTypes(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchData = async (dtId) => {
    setLoading(true)
    try {
      const res = await getApprovedData(dtId === 'all' ? null : parseInt(dtId))
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDataTypes()
    fetchData('all')
  }, [])

  const handleFilterChange = (dtId) => {
    setSelectedDT(dtId)
    fetchData(dtId)
  }

  const handleExport = async () => {
    if (selectedDT === 'all') {
      alert('Pilih jenis data terlebih dahulu untuk export')
      return
    }
    setExporting(true)
    try {
      const res = await exportViewerData({ data_type_id: parseInt(selectedDT) })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const dt = dataTypes.find(d => d.id === parseInt(selectedDT))
      link.setAttribute('download', `export_${dt?.name || 'data'}_${new Date().toISOString().slice(0,10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal export data')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const manualEntries = data?.manual_entries || []
  const approvedSubmissions = data?.approved_submissions || []
  const totalData = manualEntries.length + approvedSubmissions.length

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0">Data Terkini</h4>
          <p className="text-muted small mb-0">Data yang sudah diverifikasi dan dapat digunakan</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('cards')}
            title="Tampilan Kartu"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('table')}
            title="Tampilan Tabel"
          >
            <i className="bi bi-table"></i>
          </button>
          <button 
            className="btn btn-sm btn-success"
            onClick={handleExport}
            disabled={exporting || selectedDT === 'all' || totalData === 0}
          >
            {exporting 
              ? <><span className="spinner-border spinner-border-sm me-1" />Exporting...</>
              : <><i className="bi bi-download me-1"></i>Export Excel</>
            }
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <select 
                className="form-select"
                value={selectedDT}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">Semua Jenis Data</option>
                {dataTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-8">
              <div className="d-flex gap-3 text-muted small">
                <span>
                  <i className="bi bi-collection text-success me-1"></i>
                  <strong>{totalData}</strong> data total
                </span>
                <span>
                  <i className="bi bi-pencil-square text-primary me-1"></i>
                  <strong>{manualEntries.length}</strong> entri manual
                </span>
                <span>
                  <i className="bi bi-inbox text-warning me-1"></i>
                  <strong>{approvedSubmissions.length}</strong> file disetujui
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success" /></div>
      ) : totalData === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-inbox display-4 text-muted mb-3"></i>
          <p className="text-muted">
            {selectedDT === 'all' 
              ? 'Belum ada data yang tersedia.'
              : 'Tidak ada data untuk jenis data ini.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="row g-3">
          {/* Manual Entries */}
          {manualEntries.map(entry => (
            <div className="col-md-6 col-lg-4" key={`manual-${entry.id}`}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary">
                      <i className="bi bi-pencil-square me-1"></i>Entri Manual
                    </span>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setDetailEntry(entry)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                  </div>
                  <h6 className="fw-semibold mb-2">{entry.data_type_name}</h6>
                  <div className="small text-muted mb-2">
                    {Object.entries(entry.data || {}).slice(0, 2).map(([k, v]) => (
                      <div key={k}>
                        <strong className="text-capitalize">{k.replace(/_/g, ' ')}:</strong> {v || '-'}
                      </div>
                    ))}
                    {Object.keys(entry.data || {}).length > 2 && (
                      <div className="text-muted fst-italic">
                        +{Object.keys(entry.data).length - 2} field lainnya
                      </div>
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    <i className="bi bi-person-circle me-1"></i>
                    {entry.entered_by_username} • {new Date(entry.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Approved Submissions */}
          {approvedSubmissions.map(sub => (
            <div className="col-md-6 col-lg-4" key={`sub-${sub.id}`}>
              <div className="card border-0 shadow-sm h-100 bg-success bg-opacity-10 border-success">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle-fill me-1"></i>Data Disetujui
                    </span>
                  </div>
                  <h6 className="fw-semibold mb-2">{sub.task_title}</h6>
                  <div className="small text-muted mb-2">
                    <div><strong>Kontributor:</strong> {sub.contributor_username}</div>
                    <div><strong>Dikirim:</strong> {new Date(sub.submitted_at).toLocaleDateString('id-ID')}</div>
                    <div><strong>Disetujui:</strong> {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString('id-ID') : '-'}</div>
                  </div>
                  <div className="alert alert-light border small mb-0 py-1 px-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Detail data tersedia di file upload asli
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table view
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Sumber</th>
                    <th>Jenis Data</th>
                    <th>Info</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {manualEntries.map((entry, i) => (
                    <tr key={`m-${entry.id}`}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <span className="badge bg-primary">
                          <i className="bi bi-pencil-square me-1"></i>Entri Manual
                        </span>
                      </td>
                      <td className="fw-semibold">{entry.data_type_name}</td>
                      <td className="text-muted small">
                        {Object.keys(entry.data || {}).length} field
                      </td>
                      <td className="text-muted">
                        {new Date(entry.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setDetailEntry(entry)}
                        >
                          <i className="bi bi-eye me-1"></i>Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {approvedSubmissions.map((sub, i) => (
                    <tr key={`s-${sub.id}`} className="table-success table-success-subtle">
                      <td className="text-muted">{manualEntries.length + i + 1}</td>
                      <td>
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle-fill me-1"></i>Disetujui
                        </span>
                      </td>
                      <td className="fw-semibold">{sub.task_title}</td>
                      <td className="text-muted small">{sub.contributor_username}</td>
                      <td className="text-muted">
                        {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td>
                        <span className="text-muted small">File upload</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Detail Data</h5>
                <button className="btn-close" onClick={() => setDetailEntry(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 small">
                  <span className="badge bg-primary me-2">{detailEntry.data_type_name}</span>
                  <span className="text-muted">
                    Diinput oleh <strong>{detailEntry.entered_by_username}</strong> •{' '}
                    {new Date(detailEntry.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <table className="table table-sm table-bordered small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '30%' }}>Field</th>
                      <th>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detailEntry.data || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className="fw-semibold text-capitalize">{k.replace(/_/g, ' ')}</td>
                        <td>{v ?? <span className="text-muted">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetailEntry(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
