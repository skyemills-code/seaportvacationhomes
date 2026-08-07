import { useMemo, useState } from 'react'
import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { enrichPlayers, isUpside, draftPosition } from '../lib/board'
import { windowStartRound, windowEndRound } from '../lib/draftWindows'
import { JuiceBadge, RoleBadge, TrendBadge, PosTag, WindowTag } from './badges'

function ClockCard({ player, tone }) {
  const actions = useActions()
  return (
    <div className={`clock-card ${tone || ''}`}>
      <JuiceBadge value={player.juice} size="xl" />
      <div className="cc-body">
        <div className="cc-name">{player.name}</div>
        <div className="cc-meta">
          <PosTag position={player.position} />
          <RoleBadge role={player.role} />
          <TrendBadge trend={player.trend} />
          <WindowTag window={player.draftWindow} />
          <span className="cell-sub" style={{ alignSelf: 'center' }}>
            {player.team} · Bye {player.bye ?? '—'}
          </span>
        </div>
        {player.why && <div className="cc-why">{player.why}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn-big primary" style={{ flex: 1 }} onClick={() => actions.draftMine(player.id)}>
            ⭐ Draft
          </button>
          <button className="btn-big danger" onClick={() => actions.markGone(player.id)}>
            ❌
          </button>
        </div>
      </div>
    </div>
  )
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'FLEX']
const ROUNDS = Array.from({ length: 14 }, (_, i) => i + 1)

export function OnTheClockMode({ onClose }) {
  const { state } = useDraft()
  const enriched = useMemo(() => enrichPlayers(state), [state])
  const live = draftPosition(state)
  const [round, setRound] = useState(Math.min(live.round, 14))
  const [position, setPosition] = useState('RB')

  const players = useMemo(() => {
    const avail = enriched.filter((p) => p.status === 'available')
    const matchPos =
      position === 'FLEX'
        ? avail.filter((p) => ['RB', 'WR', 'TE'].includes(p.position))
        : avail.filter((p) => p.position === position)
    return matchPos.sort((a, b) => b.juice - a.juice).slice(0, 9)
  }, [enriched, position])

  const inWindow = (p) => round >= windowStartRound(p.draftWindow) && round <= windowEndRound(p.draftWindow)

  return (
    <div className="mode-screen">
      <div className="mode-top">
        <h1>⏱ On The Clock</h1>
        <div className="mode-controls">
          <div className="mode-field">
            <span className="lbl">Round</span>
            <select
              className="teams-input"
              style={{ width: 64 }}
              value={round}
              onChange={(e) => setRound(Number(e.target.value))}
            >
              {ROUNDS.map((r) => (
                <option key={r} value={r}>
                  R{r}
                </option>
              ))}
            </select>
          </div>
          <div className="mode-field">
            <span className="lbl">Position</span>
            <div className="seg">
              {POSITIONS.map((pos) => (
                <button key={pos} className={position === pos ? 'on' : ''} onClick={() => setPosition(pos)}>
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <button className="pill" onClick={onClose}>
            ✕ Exit
          </button>
        </div>
      </div>
      <div className="mode-body scroll">
        {players.length === 0 ? (
          <div className="mode-empty">No available {position} players left on the board.</div>
        ) : (
          <div className="clock-grid">
            {players.map((p) => (
              <ClockCard key={p.id} player={p} tone={inWindow(p) ? 'upside' : ''} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function LateRoundMode({ onClose }) {
  const { state } = useDraft()
  const enriched = useMemo(() => enrichPlayers(state), [state])

  const players = useMemo(() => {
    const avail = enriched.filter((p) => p.status === 'available')
    // Upside (League Winner / Breakout) first, then everything else. Bench sinks.
    return avail
      .map((p) => ({
        p,
        rank: isUpside(p) ? 0 : p.role === 'Bench' ? 2 : 1,
      }))
      .sort((a, b) => a.rank - b.rank || b.p.juice - a.p.juice)
      .slice(0, 18)
      .map((x) => x.p)
  }, [enriched])

  return (
    <div className="mode-screen">
      <div className="mode-top">
        <h1>💎 Late Round — Upside Hunt</h1>
        <div className="mode-controls">
          <span className="cell-sub" style={{ fontWeight: 700 }}>
            💎 League Winners & 🚀 Breakouts up top · 🪑 Bench dimmed
          </span>
          <button className="pill" onClick={onClose}>
            ✕ Exit
          </button>
        </div>
      </div>
      <div className="mode-body scroll">
        {players.length === 0 ? (
          <div className="mode-empty">No available players left.</div>
        ) : (
          <div className="clock-grid">
            {players.map((p) => (
              <ClockCard
                key={p.id}
                player={p}
                tone={isUpside(p) ? 'upside' : p.role === 'Bench' ? 'demoted' : ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
