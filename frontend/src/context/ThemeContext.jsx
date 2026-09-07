import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {}
})

const THEME_KEY = 'sejati_theme_v2'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      // Clean up legacy auto-saved theme key if present
      if (typeof window !== 'undefined' && localStorage.getItem('sejati_theme')) {
        localStorage.removeItem('sejati_theme')
      }
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'dark' || saved === 'light') return saved
    } catch (e) {
      // fallback
    }
    // Default theme is strictly white (light)
    return 'light'
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      document.body.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        document.body.classList.add('dark-theme')
      } else {
        document.body.classList.remove('dark-theme')
      }
      localStorage.setItem(THEME_KEY, theme)
    } catch (e) {}
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const isDark = theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
