import { useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { enrichPlayers } from '../lib/board'
import { JuiceBadge, RoleBadge, TrendBadge, WindowTag } from './badges'

export default function CompareMode({ onClose }) {
  const { state } = useDraft()
  const actions = useActions()
  const enriched = useMemo(() => enrichPlayers(state), [state])
  const players = state.compareIds.map((id) => enriched.find((p) => p.id === id)).filter(Boolean)

  if (players.length < 2) return null

  const bestJuice = Math.max(...players.map((p) => p.juice))
  const bestPts = Math.max(...players.map((p) => p.points2025 ?? -1))

  const rows = [
    { k: '2025 Points', render: (p) => (p.points2025 == null ? '—' : p.points2025), best: (p) => (p.points2025 ?? -1) === bestPts && bestPts >= 0 },
    { k: 'Role', render: (p) => <RoleBadge role={p.role} /> },
    { k: 'Trend', render: (p) => <TrendBadge trend={p.trend} withLabel /> },
    { k: 'Bye', render: (p) => p.bye ?? '—' },
    { k: 'Draft Window', render: (p) => <WindowTag window={p.draftWindow} /> },
    { k: 'Why', render: (p) => <span style={{ fontSize: 13, fontWeight: 600 }}>{p.why || '—'}</span> },
  ]

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>⚖ Compare Players</h2>
          <button className="pill" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="cmp-grid" style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
            {players.map((p) => (
              <div key={p.id} className="cmp-col">
                <div className="cmp-col-head">
                  <div className="n">{p.name}</div>
                  <div className="m">
                    {p.position} · {p.team}
                  </div>
                  <div style={{ marginTop: 12, display: 'grid', placeItems: 'center' }}>
                    <JuiceBadge value={p.juice} size="xl" />
                  </div>
                  {p.juice === bestJuice && (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>
                      ▲ Highest JUICE
                    </div>
                  )}
                </div>
                {rows.map((r) => (
                  <div key={r.k} className={`cmp-row ${r.best && r.best(p) ? 'best' : ''}`}>
                    <span className="k">{r.k}</span>
                    <span className="v">{r.render(p)}</span>
                  </div>
                ))}
                <div className="cmp-row">
                  <button
                    className="btn-big primary"
                    style={{ width: '100%' }}
                    onClick={() => actions.draftMine(p.id)}
                  >
                    ⭐ Draft
                  </button>
                </div>
                <div className="cmp-row" style={{ paddingTop: 0 }}>
                  <button className="link-btn" onClick={() => actions.toggleCompare(p.id)}>
                    Remove from compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
