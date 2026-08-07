import { useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { enrichPlayers, searchPlayers } from '../lib/board'
import PlayerCard from './PlayerCard'

export default function RightColumn({ query, selectedId, onSelect }) {
  const { state } = useDraft()
  const actions = useActions()
  const enriched = useMemo(() => enrichPlayers(state), [state])

  const trimmed = query.trim()

  // When searching, the card follows the search. Prefer an exact name match,
  // otherwise the highest-JUICE match.
  const searchResults = useMemo(() => {
    if (!trimmed) return null
    const results = searchPlayers(enriched, trimmed)
    const exact = results.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    const best = exact || [...results].sort((a, b) => b.juice - a.juice)[0]
    return { results, best }
  }, [enriched, trimmed])

  // Not searching → follow the selected row.
  const selected = useMemo(
    () => enriched.find((p) => p.id === selectedId) || null,
    [enriched, selectedId]
  )

  const onWatch = state.watchList

  // 1. Searching with no match → not on the board.
  if (trimmed && searchResults && searchResults.results.length === 0) {
    const alreadyWatching = onWatch.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())
    return (
      <div className="panel panel-pad">
        <div className="notfound">
          <div className="empty">
            <div className="big">🚫</div>
            <div className="notfound banner">NOT ON THE JUICE BOARD</div>
            <p>“{trimmed}” isn’t in your evaluations.</p>
          </div>
          {alreadyWatching ? (
            <div className="hint">✓ On your watch list</div>
          ) : (
            <button
              className="btn-big primary"
              style={{ width: '100%' }}
              onClick={() => actions.addWatch(trimmed)}
            >
              ＋ Add to Watch List
            </button>
          )}
        </div>
        <WatchList list={onWatch} onRemove={actions.removeWatch} />
      </div>
    )
  }

  // 2. Searching with a match → show best match.
  if (trimmed && searchResults && searchResults.best) {
    return (
      <div className="panel panel-pad">
        {searchResults.results.length > 1 && (
          <div className="hint" style={{ paddingTop: 0 }}>
            {searchResults.results.length} matches · showing top JUICE.{' '}
            <button className="link-btn" onClick={() => onSelect(searchResults.best.id)}>
              Pin this card
            </button>
          </div>
        )}
        <PlayerCard player={searchResults.best} />
      </div>
    )
  }

  // 3. A row is selected → show it.
  if (selected) {
    return (
      <div className="panel panel-pad">
        <PlayerCard player={selected} />
      </div>
    )
  }

  // 4. Nothing selected.
  return (
    <div className="panel panel-pad">
      <div className="empty">
        <div className="big">🧃</div>
        <h3>Pick a player</h3>
        <p>Click any row or search up top to see the full card here.</p>
      </div>
      <WatchList list={onWatch} onRemove={actions.removeWatch} />
    </div>
  )
}

function WatchList({ list, onRemove }) {
  if (!list || list.length === 0) return null
  return (
    <div style={{ marginTop: 18 }}>
      <div className="section-title">👀 Watch List</div>
      <div className="bench-chips">
        {list.map((w) => (
          <span key={w.name} className="bench-chip">
            {w.name}
            <button
              className="link-btn"
              style={{ marginLeft: 2 }}
              onClick={() => onRemove(w.name)}
              title="Remove"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
