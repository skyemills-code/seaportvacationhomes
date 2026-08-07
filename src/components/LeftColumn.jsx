import { useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { enrichPlayers, draftPosition } from '../lib/board'
import { buildRoster, rosterNeeds } from '../lib/roster'
import { JuiceBadge, PosTag } from './badges'

function Stars({ n }) {
  return (
    <span className="need-stars" aria-label={`${n} of 5`}>
      {'⭐'.repeat(n)}
      <span style={{ opacity: 0.25 }}>{'☆'.repeat(5 - n)}</span>
    </span>
  )
}

export default function LeftColumn({ onSelect, selectedId }) {
  const { state } = useDraft()
  const actions = useActions()

  const enriched = useMemo(() => enrichPlayers(state), [state])
  const mine = useMemo(
    () => enriched.filter((p) => p.status === 'mine').sort((a, b) => a.pick - b.pick),
    [enriched]
  )
  const { slots, bench } = useMemo(() => buildRoster(mine), [mine])
  const needs = useMemo(() => rosterNeeds(mine), [mine])
  const pos = draftPosition(state)

  const history = useMemo(
    () => mine.slice().sort((a, b) => a.pick - b.pick),
    [mine]
  )

  return (
    <>
      {/* draft status */}
      <div className="panel panel-pad">
        <div className="draftbar">
          <div className="stat-box">
            <div className="k">Round</div>
            <div className="v tnum">{pos.round}</div>
            <div className="sub">of {state.teams} teams</div>
          </div>
          <div className="stat-box">
            <div className="k">Pick</div>
            <div className="v tnum">{pos.pick}</div>
            <div className="sub">#{pos.pickInRound} this round</div>
          </div>
        </div>
      </div>

      {/* my team */}
      <div className="panel">
        <div className="panel-head">
          <h2>My Team</h2>
          <span className="count-pill tnum">{mine.length}</span>
        </div>
        <div className="panel-pad">
          <div className="roster">
            {slots.map((slot) => (
              <div key={slot.id} className={`slot ${slot.player ? 'filled' : ''}`}>
                <span className="slot-tag">{slot.label}</span>
                {slot.player ? (
                  <>
                    <div className="slot-body">
                      <div className="slot-name">{slot.player.name}</div>
                      <div className="slot-meta">
                        {slot.player.position} · {slot.player.team} · Bye {slot.player.bye ?? '—'}
                      </div>
                    </div>
                    <JuiceBadge value={slot.player.juice} size="sm" />
                  </>
                ) : (
                  <div className="slot-empty">Empty</div>
                )}
              </div>
            ))}
          </div>

          {bench.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="section-title">Bench</div>
              <div className="bench-chips">
                {bench.map((p) => (
                  <button
                    key={p.id}
                    className="bench-chip"
                    onClick={() => onSelect(p.id)}
                    title="View player"
                  >
                    {p.name} <small>{p.position}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* roster needs */}
      <div className="panel">
        <div className="panel-head">
          <h2>Roster Needs</h2>
        </div>
        <div className="panel-pad">
          <div className="needs">
            {needs.map((n) => (
              <div key={n.position} className={`need-row ${n.remaining === 0 ? 'met' : ''}`}>
                <Stars n={n.stars} />
                <span className="need-label">
                  {n.remaining === 0 ? 'Set at' : 'Need'} {n.position}
                  <small>
                    {n.filled}/{n.required}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* draft history */}
      <div className="panel">
        <div className="panel-head">
          <h2>Draft History</h2>
          {history.length > 0 && (
            <button className="link-btn" onClick={actions.undo} title="Undo last board action">
              Undo last
            </button>
          )}
        </div>
        <div className="panel-pad">
          {history.length === 0 ? (
            <div className="hint">Your picks will appear here as a timeline.</div>
          ) : (
            <div className="timeline">
              {history.map((p) => (
                <div key={p.id} className="tl-row" onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
                  <span className="tl-round">R{p.round}</span>
                  <span className="tl-dot" />
                  <div className="tl-body">
                    <div className="tl-name">{p.name}</div>
                  </div>
                  <PosTag position={p.position} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
