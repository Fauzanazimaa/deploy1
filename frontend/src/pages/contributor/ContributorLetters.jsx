import React, { useEffect, useState, useRef } from 'react'
import api, {
  getContributorAssignmentLetters,
  downloadContributorAssignmentLetter,
  getContributorSignedCoverLetters,
  submitSignedCoverLetter,
  getMyTasks
} from '../../api'

const ACCENT = '#f5a623'

export default function ContributorLetters() {
  const [letters, setLetters] = useState([])
  const [signedLetters, setSignedLetters] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State modals
  const [signingLetter, setSigningLetter] = useState(null)
  const [signerForm, setSignerForm] = useState({ signerRole: '', agencyName: '', signerName: '' })
  
  const [previewLetter, setPreviewLetter] = useState(null)
  const [previewSignatureUrl, setPreviewSignatureUrl] = useState('')

  const fetchLetters = async () => {
    try {
      const [lettersRes, signedRes, tasksRes] = await Promise.all([
        getContributorAssignmentLetters(),
        getContributorSignedCoverLetters(),
        getMyTasks()
      ])
      setLetters(lettersRes.data)
      setSignedLetters(signedRes.data)
      setTasks(tasksRes.data)
    } catch (err) {
      console.error(err)
      setError('Gagal memuat data surat pengantar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLetters()
  }, [])

  const handleDownloadOriginal = async (letter) => {
    try {
      const res = await downloadContributorAssignmentLetter(letter.id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', letter.original_filename)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal mengunduh surat permintaan data')
    }
  }

  const handleOpenSignModal = (letter) => {
    setSigningLetter(letter)
    setSignerForm({ signerRole: '', agencyName: '', signerName: '' })
  }

  const handleSubmitSignature = async (base64Signature) => {
    try {
      await submitSignedCoverLetter({
        task_title: signingLetter.task_title,
        signer_role: signerForm.signerRole,
        agency_name: signerForm.agencyName,
        signer_name: signerForm.signerName,
        signature_base64: base64Signature
      })
      setSigningLetter(null)
      fetchLetters()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengirim tanda tangan surat pengantar')
    }
  }

  const handleOpenPreview = async (signedLetter) => {
    setPreviewLetter(signedLetter)
    setPreviewSignatureUrl('')
    try {
      const res = await api.get(`/contributor/signed-cover-letters/${signedLetter.id}/signature/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      setPreviewSignatureUrl(url)
    } catch (err) {
      console.error('Gagal memuat gambar tanda tangan:', err)
    }
  }

  const handlePrintCoverLetter = () => {
    const printArea = document.getElementById('cover-letter-print-area')
    if (!printArea) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Surat Pengantar Kesesuaian Data</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; background: #fff; }
            .letter-container { max-width: 800px; margin: 0 auto; line-height: 1.6; }
            .header-title { font-weight: 800; text-align: center; text-transform: uppercase; font-size: 18px; margin-bottom: 30px; text-decoration: underline; }
            .content-section { margin-top: 20px; margin-bottom: 20px; }
            .table-data { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
            .table-data th, .table-data td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            .signature-block { margin-top: 50px; display: flex; justify-content: flex-end; }
            .signature-wrapper { text-align: left; width: 300px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="letter-container">
            ${printArea.innerHTML}
          </div>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Surat Permintaan & Pengantar</h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Kelola surat permintaan data resmi serta kirimkan surat pengantar kesesuaian data yang telah ditandatangani</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : letters.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <i className="bi bi-file-earmark-text" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.4 }}></i>
          Belum ada surat permintaan data yang diunggah oleh admin untuk Anda saat ini.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} className="table align-middle text-start">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '25%' }}>Judul Kegiatan / Tugas</th>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '25%' }}>Surat Permintaan (Admin)</th>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '25%' }}>Surat Pengantar Saya</th>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '25%', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {letters.map((l) => {
                  const signed = signedLetters.find(sl => sl.task_title === l.task_title)
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1a1f2e' }}>{l.task_title}</td>
                      <td style={{ padding: '14px 20px', color: '#4b5563' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#ef4444', fontSize: 16 }}></i>
                          <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.original_filename}>{l.original_filename}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadOriginal(l)}
                          className="btn btn-link p-0 text-decoration-none"
                          style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}
                        >
                          <i className="bi bi-download"></i> Unduh Surat Permintaan
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {signed ? (
                          <div>
                            <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                              <i className="bi bi-check-circle-fill me-1"></i>Sudah TTD
                            </span>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Oleh: {signed.signer_name}</div>
                          </div>
                        ) : (
                          <span style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#f5a623', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                            Belum TTD
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {signed ? (
                          <button
                            onClick={() => handleOpenPreview(signed)}
                            className="btn btn-sm btn-outline-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                          >
                            <i className="bi bi-printer"></i> Cetak Surat Pengantar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSignModal(l)}
                            className="btn btn-sm btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                          >
                            <i className="bi bi-pen-fill"></i> Tanda Tangan
                          </button>
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

      {/* Signature drawing modal */}
      {signingLetter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Kirim Surat Pengantar Kesesuaian Data</span>
              <button onClick={() => setSigningLetter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            
            <form onSubmit={e => e.preventDefault()} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#1e40af' }}>
                  <i className="bi bi-info-circle me-1"></i> Anda akan menandatangani surat pengantar kesesuaian data untuk kegiatan <strong>{signingLetter.task_title}</strong>.
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>JABATAN PENANDATANGAN <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className="form-control" required placeholder="contoh: Kepala Dinas Pertanian" value={signerForm.signerRole} onChange={e => setSignerForm({ ...signerForm, signerRole: e.target.value })} style={{ fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>NAMA DINAS / INSTANSI <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className="form-control" required placeholder="contoh: Dinas Pertanian Kabupaten Sijunjung" value={signerForm.agencyName} onChange={e => setSignerForm({ ...signerForm, agencyName: e.target.value })} style={{ fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>NAMA LENGKAP PENANDATANGAN <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className="form-control" required placeholder="contoh: Budi Santoso, M.Si" value={signerForm.signerName} onChange={e => setSignerForm({ ...signerForm, signerName: e.target.value })} style={{ fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>GAMBAR TANDA TANGAN DIGITAL <span style={{ color: '#dc2626' }}>*</span></label>
                  <SignaturePad 
                    onSave={handleSubmitSignature} 
                    disabled={!signerForm.signerRole || !signerForm.agencyName || !signerForm.signerName} 
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print modal */}
      {previewLetter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>Pratinjau Cetak Surat Pengantar</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handlePrintCoverLetter} className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><i className="bi bi-printer"></i> Cetak</button>
                <button onClick={() => setPreviewLetter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
              </div>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f5f6fa' }}>
              <div id="cover-letter-print-area" style={{ padding: '40px', background: '#fff', color: '#000', fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 8, minHeight: '600px', lineHeight: 1.6 }}>
                <div style={{ textAlign: 'center', fontWeight: 800, textTransform: 'uppercase', fontSize: 16, textDecoration: 'underline', marginBottom: 28, letterSpacing: 0.5 }}>
                  SURAT PENGANTAR
                </div>
                <div style={{ marginBottom: 20 }}>
                  Kepada Yth.<br/>
                  <strong>Kepala BPS Kabupaten Sijunjung</strong><br/>
                  Di tempat
                </div>
                <div style={{ marginBottom: 16, textAlign: 'justify' }}>
                  Menindaklanjuti surat Kepala BPS Kabupaten Sijunjung No. <strong>{letters.find(l => l.task_title === previewLetter.task_title)?.reference_number || '—'}</strong>, berikut dikirimkan data untuk keperluan <strong>{letters.find(l => l.task_title === previewLetter.task_title)?.activity_name || '—'}</strong> rincian sebagai berikut:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 15, marginBottom: 15 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #000', padding: '8px 12px', width: '60px', textAlign: 'center', fontWeight: 700 }}>No.</th>
                      <th style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 700 }}>Data / Tabel yang Dikirim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .filter(t => t.title === previewLetter.task_title)
                      .map((t, idx) => (
                        <tr key={t.id}>
                          <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '8px 12px' }}>{t.data_type_name}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div style={{ marginBottom: 30, textAlign: 'justify' }}>
                  Data pada tabel-tabel tersebut sudah benar dan sudah bisa disajikan pada <strong>{letters.find(l => l.task_title === previewLetter.task_title)?.activity_name || '—'}</strong>. Demikian surat ini disampaikan, untuk dipergunakan sebagaimana mestinya.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
                  <div style={{ textAlign: 'left', width: 280 }}>
                    <div>Sijunjung, {new Date(previewLetter.signed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    <div style={{ textTransform: 'capitalize' }}>{previewLetter.signer_role}</div>
                    <div style={{ fontWeight: 600 }}>{previewLetter.agency_name}</div>
                    <div style={{ height: 90, margin: '10px 0', display: 'flex', alignItems: 'center' }}>
                      {previewSignatureUrl ? (
                        <img src={previewSignatureUrl} alt="Tanda Tangan" style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain' }} />
                      ) : (
                        <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>(Mengunduh tanda tangan...)</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, textDecoration: 'underline' }}>{previewLetter.signer_name}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── Digital Signature Pad Component ─── */
function SignaturePad({ onSave, disabled }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000000'
  }, [])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    // Support mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Scale coordinate based on canvas CSS size vs actual drawing buffer size
    const x = ((clientX - rect.left) / rect.width) * canvas.width
    const y = ((clientY - rect.top) / rect.height) * canvas.height
    
    return { x, y }
  }

  const startDrawing = (e) => {
    if (disabled) return
    e.preventDefault()
    const coords = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || disabled) return
    e.preventDefault()
    const coords = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    
    // Create a temporary blank canvas to check if drawing area is untouched
    const blank = document.createElement('canvas')
    blank.width = canvas.width
    blank.height = canvas.height
    
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert('Silakan coret tanda tangan Anda pada bidang gambar terlebih dahulu.')
      return
    }

    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div>
      <div style={{ border: '2.5px dashed #cbd5e1', borderRadius: 10, background: '#f8fafc', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={450}
          height={180}
          style={{ display: 'block', width: '100%', height: 180, cursor: disabled ? 'not-allowed' : 'crosshair', touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={clearCanvas} className="btn btn-sm btn-outline-secondary" disabled={disabled}>
          <i className="bi bi-eraser"></i> Bersihkan
        </button>
        <button type="button" onClick={handleSave} className="btn btn-sm btn-primary ms-auto" disabled={disabled}>
          <i className="bi bi-send-fill"></i> Kirim Surat Pengantar
        </button>
      </div>
    </div>
  )
}
