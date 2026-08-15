import React, { useEffect, useState } from 'react'
import { getContributorAssignmentLetters, downloadContributorAssignmentLetter } from '../../api'

const ACCENT = '#f5a623'

export default function ContributorLetters() {
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLetters = async () => {
    try {
      const res = await getContributorAssignmentLetters()
      setLetters(res.data)
    } catch (err) {
      console.error(err)
      setError('Gagal memuat daftar surat permintaan data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLetters()
  }, [])

  const handleDownload = async (letter) => {
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

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Surat Permintaan Data</h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Daftar surat permintaan data kedinasan / pengumpulan data yang didelegasikan kepada Anda</p>
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
          Belum ada surat permintaan data yang diunggah untuk kegiatan Anda saat ini.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} className="table align-middle text-start">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '45%' }}>Judul Kegiatan / Tugas</th>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '35%' }}>Nama File</th>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: '#6b7280', fontSize: 12, width: '20%', textAlign: 'center' }}>Unduh</th>
                </tr>
              </thead>
              <tbody>
                {letters.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1a1f2e' }}>{l.task_title}</td>
                    <td style={{ padding: '14px 20px', color: '#4b5563' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#ef4444', fontSize: 16 }}></i>
                        <span>{l.original_filename}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDownload(l)}
                        className="btn btn-sm btn-outline-warning"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto', fontSize: 12, fontWeight: 600 }}
                      >
                        <i className="bi bi-download"></i> Unduh PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
