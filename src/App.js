import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Calculator from './Components/Calculator/calculator'

const UTILITY_OPTIONS = [
  {
    id: 'sce',
    label: 'SCE',
    description: 'Southern California Edison'
  },
  {
    id: 'ladwp',
    label: 'LADWP',
    description: 'Los Angeles Department of Water and Power'
  }
]

const UTILITY_IDS = new Set(UTILITY_OPTIONS.map((option) => option.id))

const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark'
}

const readStoredTheme = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const storedTheme = window.localStorage.getItem('theme')

  if (storedTheme && Object.values(THEME_OPTIONS).includes(storedTheme)) {
    return storedTheme
  }

  return null
}

const getInitialTheme = () => {
  const storedTheme = readStoredTheme()

  if (storedTheme) {
    return storedTheme
  }

  if (typeof window === 'undefined') {
    return THEME_OPTIONS.LIGHT
  }

  if (window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT
  }

  return THEME_OPTIONS.LIGHT
}

const getInitialUtility = () => {
  if (typeof window === 'undefined') {
    return 'sce'
  }

  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('utility')

  if (fromQuery) {
    const normalized = fromQuery.toLowerCase()

    if (UTILITY_IDS.has(normalized)) {
      return normalized
    }
  }

  const hash = window.location.hash.replace('#', '').toLowerCase()

  if (UTILITY_IDS.has(hash)) {
    return hash
  }

  return 'sce'
}

function App() {
  const [activeUtility, setActiveUtility] = useState(getInitialUtility)
  const [theme, setTheme] = useState(getInitialTheme)
  const [hasStoredThemePreference, setHasStoredThemePreference] = useState(() => readStoredTheme() !== null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handlePopState = () => {
      const nextUtility = getInitialUtility()
      setActiveUtility((prev) => (prev === nextUtility ? prev : nextUtility))
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const root = document.documentElement
    root.dataset.theme = theme

    return undefined
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasStoredThemePreference) {
      return undefined
    }

    window.localStorage.setItem('theme', theme)

    return undefined
  }, [theme, hasStoredThemePreference])

  useEffect(() => {
    if (typeof window === 'undefined' || hasStoredThemePreference) {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => {
      setTheme(event.matches ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    mediaQuery.addListener(handleChange)

    return () => {
      mediaQuery.removeListener(handleChange)
    }
  }, [hasStoredThemePreference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const currentUtility = params.get('utility')

    if (currentUtility === activeUtility) {
      return
    }

    params.set('utility', activeUtility)

    const search = params.toString()
    const hash = window.location.hash
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${hash}`

    const currentSearch = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search

    if (search !== currentSearch) {
      window.history.replaceState(null, '', nextUrl)
    }
  }, [activeUtility])

  const utilityTabs = useMemo(() => UTILITY_OPTIONS, [])
  const toggleTheme = () => {
    setHasStoredThemePreference(true)
    setTheme((prev) =>
      prev === THEME_OPTIONS.DARK ? THEME_OPTIONS.LIGHT : THEME_OPTIONS.DARK
    )
  }

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <div className="app-toolbar">
          <button
            type="button"
            className="app-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === THEME_OPTIONS.DARK}
            aria-label={`Switch to ${
              theme === THEME_OPTIONS.DARK ? 'light' : 'dark'
            } mode`}
          >
            <span className="app-theme-toggle__icon" aria-hidden="true">
              {theme === THEME_OPTIONS.DARK ? '☀️' : '🌙'}
            </span>
            <span className="app-theme-toggle__label">
              {theme === THEME_OPTIONS.DARK ? 'Switch to light' : 'Switch to dark'}
            </span>
          </button>
        </div>

        <div className="app-switcher" role="tablist" aria-label="Utility calculators">
          {utilityTabs.map((option) => {
            const isActive = option.id === activeUtility

            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`app-switcher__button${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  if (!isActive) {
                    setActiveUtility(option.id)
                  }
                }}
              >
                <span className="app-switcher__button-label">{option.label}</span>
                <span className="app-switcher__button-description">{option.description}</span>
              </button>
            )
          })}
        </div>

        <Calculator
          key={activeUtility}
          initialUtility={activeUtility}
          allowUtilitySelection={false}
          id={`${activeUtility}-calculator`}
        />
      </div>
    </div>
  )
}

export default App
