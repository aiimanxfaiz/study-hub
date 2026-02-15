import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem('study-hub-theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('study-hub-theme', theme)
  }, [theme])

  return (
    <button
      className="ghost-btn"
      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      aria-label="Toggle color theme"
      type="button"
    >
      {theme === 'light' ? 'Dark' : 'Light'} mode
    </button>
  )
}
