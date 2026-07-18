/**
 * DirectInputGrid — Tabel editable untuk "Input Data Langsung"
 *
 * Props:
 *   taskId      : number   — ID tugas
 *   onSubmitted : fn()     — callback setelah berhasil submit
 *   onCancel    : fn()     — callback untuk menutup panel
 */
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { getTaskTemplateGrid, submitTaskForm } from '../api'

const ACCENT = '#f5a623'
const LOCKED_BG = '#f9fafb'
const EDIT_BG   = '#fff'
const LOCKED_FC_BG = '#fef9c3'   // first-col locked (terisi dari template)

export default function DirectInputGrid({ taskId, onSubmitted, onCancel }) {
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [gridData, setGridData]     = useState(null)
  // rows: array of array of {value, locked}
  const [rows, setRows]             = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  // Sel yang sedang aktif: {ri, ci}
  const [activeCell, setActiveCell] = useState(null)
  const tableRef = useRef(null)

  // ── Load template grid ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)
    getTaskTemplateGrid(taskId)
      .then(res => {
        setGridData(res.data)
        // Deep-copy rows agar state terpisah dari response
        setRows(res.data.rows.map(row => row.map(cell => ({ ...cell }))))
      })
      .catch(err => {
        const status = err.response?.status
        const msg = err.response?.data?.error
        if (status === 404) {
          setError(msg || 'Template belum tersedia untuk tugas ini. Minta admin untuk mengupload template terlebih dahulu.')
        } else if (status === 401 || status === 403) {
          setError('Sesi habis. Silakan login ulang.')
        } else {
          setError(msg || `Gagal memuat template (${status || 'network error'}). Pastikan server backend berjalan.`)
        }
      })
      .finally(() => setLoading(false))
  }, [taskId])

  // ── Cell change handler ────────────────────────────────────────────────────
  const handleChange = useCallback((ri, ci, value) => {
    setRows(prev => {
      const next = prev.map(r => [...r])
      next[ri] = [...next[ri]]
      next[ri][ci] = { ...next[ri][ci], value }
      return next
    })
  }, [])

  // Keyboard navigation: Tab/Enter/Arrow
  const handleKeyDown = useCallback((e, ri, ci) => {
    if (!gridData) return
    const totalCols = gridData.total_cols
    const totalRows = rows.length

    const moveTo = (newRi, newCi) => {
      // Lewati sel locked
      let r = newRi, c = newCi
      // Cari sel yang bisa diedit
      let tries = 0
      while (r >= 0 && r < totalRows && c >= 0 && c < totalCols && tries < totalCols * totalRows) {
        if (!rows[r][c]?.locked) {
          setActiveCell({ ri: r, ci: c })
          // Focus input
          setTimeout(() => {
            const el = tableRef.current?.querySelector(`[data-cell="${r}-${c}"]`)
            if (el) el.focus()
          }, 0)
          return
        }
        // Move right or down
        c++
        if (c >= totalCols) { c = 0; r++ }
        tries++
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        // Move left
        let c = ci - 1, r = ri
        if (c < 0) { c = totalCols - 1; r-- }
        if (r >= 0) moveTo(r, c)
      } else {
        // Move right
        let c = ci + 1, r = ri
        if (c >= totalCols) { c = 0; r++ }
        if (r < totalRows) moveTo(r, c)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (ri + 1 < totalRows) moveTo(ri + 1, ci)
    } else if (e.key === 'ArrowDown' && ri + 1 < totalRows) {
      e.preventDefault()
      moveTo(ri + 1, ci)
    } else if (e.key === 'ArrowUp' && ri > 0) {
      e.preventDefault()
      moveTo(ri - 1, ci)
    }
  }, [gridData, rows])

  // Tambah baris baru
  const addRow = () => {
    if (!gridData) return
    setRows(prev => {
      const emptyRow = Array.from({ length: gridData.total_cols }, (_, ci) => ({
        value: '',
        locked: false,  // baris baru = semua bisa diedit
      }))
      return [...prev, emptyRow]
    })
  }

  // Hapus baris terakhir (hanya kalau tidak ada data locked di sana)
  const removeLastRow = () => {
    setRows(prev => {
      if (prev.length <= 1) return prev
      const last = prev[prev.length - 1]
      // Jangan hapus kalau ada sel locked di baris itu
      if (last.some(c => c.locked)) return prev
      return prev.slice(0, -1)
    })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null)
    // Validasi: harus ada minimal 1 baris data (kolom non-first_col tidak semua kosong)
    const hasData = rows.some(row => {
      const dataCells = gridData?.has_first_col ? row.slice(1) : row
      return dataCells.some(c => c.value.trim() !== '')
    })
    if (!hasData) {
      setSubmitError('Harap isi minimal satu baris data sebelum mengirim.')
      return
    }

    setSubmitting(true)
    try {
      const hasFc = gridData.has_first_col
      const leafCount = gridData.num_data_cols

      // Simpan data sebagai rows dengan key:
      //   __row_label  → nilai first_col (kolom pertama)
      //   __col_0 ... __col_N → nilai tiap kolom data (posisi-based, bukan nama field)
      // Format ini bisa dirender ulang tanpa bergantung pada fields_schema
      const formData = rows
        .filter(row => {
          const dataCells = hasFc ? row.slice(1) : row
          return dataCells.some(c => c.value.trim() !== '') ||
                 (hasFc && row[0]?.value.trim() !== '')
        })
        .map(row => {
          const obj = {}
          if (hasFc) {
            obj.__row_label = row[0]?.value ?? ''
          }
          const dataStart = hasFc ? 1 : 0
          for (let i = 0; i < leafCount; i++) {
            obj[`__col_${i}`] = row[dataStart + i]?.value ?? ''
          }
          return obj
        })

      await submitTaskForm(taskId, formData)
      onSubmitted()
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Gagal mengirim data. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '28px 0', textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT,
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ marginTop: 10, color: '#6b7280', fontSize: 13 }}>Memuat template...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
        <i className="bi bi-exclamation-triangle me-2"></i>{error}
        <button
          onClick={onCancel}
          style={{ marginLeft: 12, background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}
        >
          Tutup
        </button>
      </div>
    )
  }

  if (!gridData) return null

  const { headers, num_header_rows, has_first_col, first_col_label, total_cols } = gridData

  return (
    <div style={{ marginTop: 16, fontFamily: "'Inter', sans-serif" }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8, marginBottom: 10,
      }}>
        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-table" style={{ color: ACCENT }}></i>
          <span>
            <strong style={{ color: '#374151' }}>Input Data Langsung</strong>
            {' '}— isi sel berwarna putih, sel abu-abu &amp; kuning terkunci
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={addRow}
            title="Tambah baris baru"
            style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
              borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <i className="bi bi-plus-lg"></i>Tambah Baris
          </button>
          <button
            onClick={removeLastRow}
            title="Hapus baris terakhir"
            style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
              borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <i className="bi bi-dash-lg"></i>Hapus Baris
          </button>
        </div>
      </div>

      {/* Table wrapper */}
      <div style={{
        overflowX: 'auto',
        border: '1.5px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        background: '#fff',
        maxHeight: 480,
        overflowY: 'auto',
      }}>
        <table
          ref={tableRef}
          style={{
            borderCollapse: 'collapse',
            minWidth: '100%',
            fontSize: 12,
            tableLayout: 'fixed',
          }}
        >
          {/* Header rows — read only */}
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            {headers.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <th
                    key={ci}
                    rowSpan={cell.rowspan || 1}
                    colSpan={cell.colspan || 1}
                    style={{
                      background: cell.bg || '#1e3a5f',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 11,
                      padding: '7px 10px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.15)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      minWidth: 90,
                      maxWidth: 180,
                      userSelect: 'none',
                    }}
                  >
                    {cell.value || ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Data rows */}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                {row.map((cell, ci) => {
                  const isActive = activeCell?.ri === ri && activeCell?.ci === ci
                  const isFirstCol = has_first_col && ci === 0
                  const locked = cell.locked
                  const bg = locked
                    ? (isFirstCol ? LOCKED_FC_BG : LOCKED_BG)
                    : EDIT_BG

                  return (
                    <td
                      key={ci}
                      style={{
                        border: `1px solid ${isActive ? ACCENT : '#e5e7eb'}`,
                        padding: 0,
                        minWidth: 90,
                        maxWidth: 180,
                        background: isActive ? `${ACCENT}18` : bg,
                        transition: 'background 0.1s',
                        outline: isActive ? `2px solid ${ACCENT}` : 'none',
                        outlineOffset: -1,
                      }}
                    >
                      {locked ? (
                        // Sel terkunci — hanya tampilkan teks
                        <div style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          color: isFirstCol ? '#92400e' : '#9ca3af',
                          fontWeight: isFirstCol ? 600 : 400,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          cursor: 'not-allowed',
                          userSelect: 'none',
                          minHeight: 30,
                        }}>
                          {cell.value || <span style={{ opacity: 0.35 }}>—</span>}
                        </div>
                      ) : (
                        // Sel bisa diedit
                        <input
                          data-cell={`${ri}-${ci}`}
                          type="text"
                          value={cell.value}
                          onChange={e => handleChange(ri, ci, e.target.value)}
                          onFocus={() => setActiveCell({ ri, ci })}
                          onBlur={() => setActiveCell(null)}
                          onKeyDown={e => handleKeyDown(e, ri, ci)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            padding: '6px 10px',
                            fontSize: 12,
                            background: 'transparent',
                            color: '#1a1f2e',
                            fontFamily: "'Inter', sans-serif",
                            minHeight: 30,
                            boxSizing: 'border-box',
                          }}
                          placeholder="Isi di sini..."
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row count info */}
      <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
        <i className="bi bi-info-circle me-1"></i>
        {rows.length} baris &bull; Navigasi: Tab / Enter / Arrow Keys
      </div>

      {/* Error */}
      {submitError && (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, color: '#dc2626', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          {submitError}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: ACCENT, border: 'none', color: '#fff',
            borderRadius: 8, padding: '8px 18px',
            fontSize: 13, fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {submitting
            ? <><span className="spinner-border spinner-border-sm me-1" />Mengirim...</>
            : <><i className="bi bi-send"></i>Kirim Data</>}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          style={{
            background: '#f3f4f6', border: '1px solid #e5e7eb',
            color: '#374151', borderRadius: 8, padding: '8px 18px',
            fontSize: 13, fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Batal
        </button>
      </div>
    </div>
  )
}
