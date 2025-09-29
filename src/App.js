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
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    params.set('utility', activeUtility)

    const search = params.toString()
    const hash = window.location.hash
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${hash}`

    window.history.replaceState(null, '', nextUrl)
  }, [activeUtility])

  const utilityTabs = useMemo(() => UTILITY_OPTIONS, [])

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
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
