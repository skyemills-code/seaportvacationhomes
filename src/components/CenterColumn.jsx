import { useMemo, useState } from 'react'
import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { enrichPlayers, matchesFilter, searchPlayers, sortPlayers } from '../lib/board'
import { JuiceBadge, RoleBadge, TrendBadge, PosTag, WindowTag, StatusDot } from './badges'

const PRIMARY_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'QB', label: 'QB' },
  { key: 'RB', label: 'RB' },
  { key: 'WR', label: 'WR' },
  { key: 'TE', label: 'TE' },
  { key: 'FLEX', label: 'FLEX' },
]
const TAG_FILTERS = [
  { key: 'MY_GUYS', label: '❤️ My Guys' },
  { key: 'LEAGUE_WINNERS', label: '💎 League Winners' },
  { key: 'BREAKOUTS', label: '🚀 Breakouts' },
  { key: 'BENCH', label: '🪑 Bench' },
  { key: 'INJURY', label: '🩺 Injury' },
  { key: 'WATCH', label: '👀 Watch' },
]

const COLUMNS = [
  { key: 'name', label: 'Player', sortable: true },
  { key: 'position', label: 'Pos', sortable: true, num: true },
  { key: 'team', label: 'Team', sortable: true, num: true },
  { key: 'bye', label: 'Bye', sortable: true, num: true },
  { key: 'draftWindow', label: 'Window', sortable: true, num: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'juice', label: '🧃 Juice', sortable: true, num: true },
  { key: 'points2025', label: "'25 Pts", sortable: true, num: true },
  { key: 'trend', label: 'Trend', sortable: false, num: true },
  { key: 'hearts', label: '❤️', sortable: false, num: true },
  { key: 'why', label: 'Why', sortable: false, cls: 'why-col' },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'actions', label: '', sortable: false, num: true },
]

export default function CenterColumn({ query, selectedId, onSelect }) {
  const { state } = useDraft()
  const actions = useActions()
  const [filter, setFilter] = useState('ALL')
  const [toggles, setToggles] = useState({ hideGone: false, hideMine: false, hideDrafted: false })
  const [sort, setSort] = useState({ key: 'juice', dir: 'desc' })

  const enriched = useMemo(() => enrichPlayers(state), [state])

  const rows = useMemo(() => {
    let list = searchPlayers(enriched, query)
    list = list.filter((p) => matchesFilter(p, filter))
    if (toggles.hideGone) list = list.filter((p) => p.status !== 'gone')
    if (toggles.hideMine) list = list.filter((p) => p.status !== 'mine')
    if (toggles.hideDrafted) list = list.filter((p) => p.status === 'available')
    return sortPlayers(list, sort.key, sort.dir)
  }, [enriched, query, filter, toggles, sort])

  const toggleSort = (key) => {
    setSort((s) => {
      if (s.key !== key) return { key, dir: key === 'name' || key === 'team' ? 'asc' : 'desc' }
      return { key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
    })
  }
  const flip = (t) => setToggles((s) => ({ ...s, [t]: !s[t] }))

  const counts = useMemo(() => {
    const avail = enriched.filter((p) => p.status === 'available')
    return { available: avail.length, total: enriched.length }
  }, [enriched])

  return (
    <div className="panel col" style={{ flex: 1, minHeight: 0 }}>
      {/* filters */}
      <div className="filters">
        {PRIMARY_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span className="chip-sep" />
        {TAG_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'on' : ''}`}
            onClick={() => setFilter((cur) => (cur === f.key ? 'ALL' : f.key))}
          >
            {f.label}
          </button>
        ))}
        <span className="chip-sep" />
        <button className={`chip toggle ${toggles.hideGone ? 'on' : ''}`} onClick={() => flip('hideGone')}>
          Hide Gone
        </button>
        <button className={`chip toggle ${toggles.hideMine ? 'on' : ''}`} onClick={() => flip('hideMine')}>
          Hide My Team
        </button>
        <button
          className={`chip toggle ${toggles.hideDrafted ? 'on' : ''}`}
          onClick={() => flip('hideDrafted')}
        >
          Hide Drafted
        </button>
      </div>

      {/* table */}
      <div className="panel-head" style={{ borderTop: 'none' }}>
        <h2>Available Players</h2>
        <span className="count-pill tnum">
          {rows.length} shown · {counts.available} on board
        </span>
      </div>

      <div className="table-wrap scroll">
        <table className="ptable">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`${c.num ? 'num' : ''} ${c.sortable ? 'sortable' : ''} ${c.cls || ''}`}
                  onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                >
                  {c.label}
                  {c.sortable && sort.key === c.key && (
                    <span className="arrow">{sort.dir === 'desc' ? '▾' : '▴'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className={`${p.status} ${selectedId === p.id ? 'selected' : ''}`}
                onClick={() => onSelect(p.id)}
              >
                <td>
                  <div className="cell-name">{p.name}</div>
                </td>
                <td className="num">
                  <PosTag position={p.position} />
                </td>
                <td className="num cell-sub">{p.team || '—'}</td>
                <td className="num cell-sub tnum">{p.bye ?? '—'}</td>
                <td className="num">
                  <WindowTag window={p.draftWindow} />
                </td>
                <td>
                  <RoleBadge role={p.role} />
                </td>
                <td className="num">
                  <JuiceBadge value={p.juice} size="sm" />
                </td>
                <td className="num tnum cell-sub">{p.points2025 == null ? '—' : p.points2025}</td>
                <td className="num">
                  <TrendBadge trend={p.trend} />
                </td>
                <td className="num">
                  <button
                    className={`heart-btn ${p.hearts > 0 ? 'on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.cycleHearts(p.id, p.hearts)
                    }}
                    title="Cycle hearts (0–3)"
                  >
                    {p.hearts > 0 ? '❤️' : '🤍'}
                    {p.hearts > 1 && <sup className="tnum">{p.hearts}</sup>}
                  </button>
                </td>
                <td className="why-col">
                  <div className="why-text">{p.why || <span className="cell-sub">—</span>}</div>
                </td>
                <td>
                  <StatusDot status={p.status} />
                </td>
                <td className="num" onClick={(e) => e.stopPropagation()}>
                  <div className="row-actions">
                    {p.status === 'available' ? (
                      <>
                        <button
                          className="act draft"
                          title="Draft to my team"
                          onClick={() => actions.draftMine(p.id)}
                        >
                          ⭐
                        </button>
                        <button className="act gone" title="Gone (drafted by someone else)" onClick={() => actions.markGone(p.id)}>
                          ❌
                        </button>
                      </>
                    ) : (
                      <button
                        className={`act undo ${p.status === 'mine' ? 'on-mine' : 'on-gone'}`}
                        title="Return to board"
                        onClick={() => actions.makeAvailable(p.id)}
                      >
                        ↩
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty">
            <div className="big">🔍</div>
            <h3>No players match</h3>
            <p>Try clearing the search or switching filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
