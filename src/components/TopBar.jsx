import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'

const THEME_CYCLE = { system: 'light', light: 'dark', dark: 'system' }
const THEME_ICON = { system: '🌓', light: '☀️', dark: '🌙' }

export default function TopBar({ query, setQuery, searchRef, onClock, onLate, onAdd, onData }) {
  const { state } = useDraft()
  const actions = useActions()

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-badge" aria-hidden>
          🧃
        </div>
        <div className="brand-title">
          THE JUICE BOARD
          <small>Kupp Runneth Over</small>
        </div>
      </div>

      <div className="search">
        <span className="search-icon" aria-hidden>
          🔍
        </span>
        <input
          ref={searchRef}
          className="search-input"
          type="text"
          placeholder="Search any player — walker, jad, burden, downs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label="Search players"
        />
        <span className="search-kbd" aria-hidden>
          {query ? 'esc' : '/'}
        </span>
      </div>

      <div className="topbar-actions">
        <button className="pill accent" onClick={onAdd} title="Add a player to the board">
          ➕ <span className="hide-sm">Add</span>
        </button>
        <button className="pill" onClick={onData} title="Import / export player data">
          🗂 <span className="hide-sm">Data</span>
        </button>
        <button className="pill accent" onClick={onClock} title="On The Clock mode">
          ⏱ <span className="hide-sm">On The Clock</span>
        </button>
        <button className="pill" onClick={onLate} title="Late Round upside mode">
          💎 <span className="hide-sm">Late Round</span>
        </button>
        <div className="mode-field" title="Number of teams in your league">
          <input
            className="teams-input"
            type="number"
            min={2}
            max={20}
            value={state.teams}
            onChange={(e) => actions.setTeams(Number(e.target.value) || 12)}
            aria-label="League size"
          />
        </div>
        <button
          className="pill icon-only"
          onClick={() => actions.setTheme(THEME_CYCLE[state.theme])}
          title={`Theme: ${state.theme}`}
        >
          {THEME_ICON[state.theme]}
        </button>
      </div>
    </header>
  )
}
