import React from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ darkNav = false, compact = true, className = '', style = {} }) {
  const { isDark, toggleTheme } = useTheme()

  const defaultBg = isDark
    ? 'rgba(245, 166, 35, 0.12)'
    : darkNav
      ? 'rgba(255, 255, 255, 0.1)'
      : '#f1f5f9'

  const defaultBorder = isDark
    ? 'rgba(245, 166, 35, 0.35)'
    : darkNav
      ? 'rgba(255, 255, 255, 0.2)'
      : '#e2e8f0'

  const iconColor = isDark
    ? '#f5a623'
    : darkNav
      ? '#ffffff'
      : '#475569'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 34,
        minWidth: compact ? 34 : 'auto',
        padding: compact ? '0 9px' : '0 12px',
        borderRadius: 8,
        background: defaultBg,
        border: `1px solid ${defaultBorder}`,
        color: iconColor,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars'}`} style={{ fontSize: 15, color: iconColor }}></i>
      {!compact && <span>{isDark ? 'Terang' : 'Gelap'}</span>}
    </button>
  )
}
