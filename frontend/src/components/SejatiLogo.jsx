/**
 * SejatiLogo — Logo SEJATI menggunakan file Sejati.png
 * Props:
 *   size    : number  (default 36) — ukuran logo dalam px
 *   variant : 'full' | 'compact' | 'icon'
 *             full    = logo + nama + tagline
 *             compact = logo + nama saja
 *             icon    = hanya gambar logo
 */
import React from 'react'
import sejatiImg from '/Sejati.png'

export function SejatiLogo({ size = 36, variant = 'compact', gap = 10 }) {
  const nameColor = '#ffffff'
  const subColor  = 'rgba(255,255,255,0.5)'
  const nameFontSize = Math.max(12, size * 0.44)
  const subFontSize  = Math.max(8,  size * 0.28)

  if (variant === 'icon') {
    return (
      <img
        src={sejatiImg}
        alt="SEJATI"
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <img
        src={sejatiImg}
        alt="SEJATI"
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block' }}
      />
      <div style={{ lineHeight: 1.15 }}>
        <div style={{
          color: nameColor,
          fontWeight: 800,
          fontSize: nameFontSize,
          letterSpacing: 0.3,
          fontFamily: "'Inter', sans-serif",
        }}>
          SEJATI
        </div>
        {variant === 'full' && (
          <div style={{
            color: subColor,
            fontSize: subFontSize,
            letterSpacing: 0.4,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            marginTop: 1,
          }}>
            PORTAL DATA STATISTIK
          </div>
        )}
      </div>
    </div>
  )
}

export default SejatiLogo
