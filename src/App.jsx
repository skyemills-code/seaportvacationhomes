import { useCallback, useEffect, useRef, useState } from 'react'
import { useDraft } from './context/DraftContext'
import { useActions } from './lib/useActions'
import TopBar from './components/TopBar'
import LeftColumn from './components/LeftColumn'
import CenterColumn from './components/CenterColumn'
import RightColumn from './components/RightColumn'
import CompareMode from './components/CompareMode'
import { OnTheClockMode, LateRoundMode } from './components/FocusModes'

export default function App() {
  const { state } = useDraft()
  const actions = useActions()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('none') // 'none' | 'clock' | 'late'
  const [compareOpen, setCompareOpen] = useState(false)
  const searchRef = useRef(null)

  const onSelect = useCallback((id) => setSelectedId(id), [])

  // Close the compare modal automatically once fewer than 2 remain selected.
  useEffect(() => {
    if (compareOpen && state.compareIds.length < 2) setCompareOpen(false)
  }, [compareOpen, state.compareIds.length])

  // Global keyboard shortcuts: "/" focuses search, ESC clears / exits.
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      } else if (e.key === 'Escape') {
        if (mode !== 'none') setMode('none')
        else if (compareOpen) setCompareOpen(false)
        else if (query) {
          setQuery('')
          searchRef.current?.blur()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, compareOpen, query])

  // Loading / empty / error states.
  if (!state.loaded) {
    return (
      <div className="empty" style={{ height: '100vh' }}>
        <div className="big">🧃</div>
        <h3>Loading the board…</h3>
      </div>
    )
  }
  if (state.error) {
    return (
      <div className="empty" style={{ height: '100vh' }}>
        <div className="big">⚠️</div>
        <h3>Couldn’t load your players</h3>
        <p>{state.error}</p>
      </div>
    )
  }
  if (state.players.length === 0) {
    return (
      <div className="empty" style={{ height: '100vh' }}>
        <div className="big">🧃</div>
        <h3>No players on the board yet</h3>
        <p>
          Drop your evaluations into <code>public/players.json</code> and refresh. See the README for the
          exact format.
        </p>
      </div>
    )
  }

  const compareCount = state.compareIds.length

  return (
    <div className="app">
      <TopBar
        query={query}
        setQuery={setQuery}
        searchRef={searchRef}
        onClock={() => setMode('clock')}
        onLate={() => setMode('late')}
        compareCount={compareCount}
      />

      <div className="layout">
        <div className="col col-left scroll">
          <LeftColumn onSelect={onSelect} selectedId={selectedId} />
        </div>
        <CenterColumn query={query} selectedId={selectedId} onSelect={onSelect} />
        <div className="col col-right scroll">
          <RightColumn query={query} selectedId={selectedId} onSelect={onSelect} />
        </div>
      </div>

      {/* compare tray */}
      {compareCount > 0 && (
        <div className="tray">
          <span className="tray-names">
            ⚖ Compare · {compareCount} {compareCount === 1 ? 'player' : 'players'}
          </span>
          <button
            className="btn-tray"
            disabled={compareCount < 2}
            style={compareCount < 2 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => compareCount >= 2 && setCompareOpen(true)}
          >
            Compare
          </button>
          <button className="btn-tray ghost" onClick={actions.clearCompare}>
            Clear
          </button>
        </div>
      )}

      {compareOpen && compareCount >= 2 && <CompareMode onClose={() => setCompareOpen(false)} />}

      {mode === 'clock' && <OnTheClockMode onClose={() => setMode('none')} />}
      {mode === 'late' && <LateRoundMode onClose={() => setMode('none')} />}
    </div>
  )
}
