import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { JuiceBadge, RoleBadge, TrendBadge, PosTag, WindowTag, StatusDot } from './badges'

export default function PlayerCard({ player, onEdit, onAiEval }) {
  const { state } = useDraft()
  const actions = useActions()
  const inCompare = state.compareIds.includes(player.id)

  return (
    <div className="pcard">
      {/* hero */}
      <div className="pcard-hero">
        {onEdit && (
          <button className="card-edit" onClick={() => onEdit(player)} title="Edit player">
            ✏️
          </button>
        )}
        <div className="pcard-name">{player.name}</div>
        <div className="pcard-meta">
          <PosTag position={player.position} />
          <span>{player.team || '—'}</span>
          <span>·</span>
          <span>Bye {player.bye ?? '—'}</span>
          <span>·</span>
          <StatusDot status={player.status} />
        </div>
        <div className="pcard-juicewrap">
          <JuiceBadge value={player.juice} size="xl" />
          <div className="col-tags">
            <RoleBadge role={player.role} />
            <TrendBadge trend={player.trend} withLabel />
            <WindowTag window={player.draftWindow} />
          </div>
        </div>
      </div>

      {/* quick stats */}
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="k">2025 Points</div>
          <div className="v tnum">{player.points2025 == null ? '—' : player.points2025}</div>
        </div>
        <div className="stat-cell">
          <div className="k">Hearts</div>
          <div className="v">
            <button
              className={`heart-btn ${player.hearts > 0 ? 'on' : ''}`}
              style={{ fontSize: 22 }}
              onClick={() => actions.cycleHearts(player.id, player.hearts)}
              title="Cycle hearts (0–3)"
            >
              {player.hearts > 0 ? '❤️'.repeat(player.hearts) : '🤍'}
            </button>
          </div>
        </div>
      </div>

      {/* why */}
      <div className="why-block">
        <div className="k">Why</div>
        <div className="v">{player.why || '—'}</div>
      </div>

      {/* notes (editable) */}
      <div className="notes-block">
        <div className="k">Notes</div>
        <textarea
          className="notes-area"
          placeholder="Add your own notes…"
          value={player.notes || ''}
          onChange={(e) => actions.setNotes(player.id, e.target.value)}
        />
      </div>

      {/* actions */}
      <div className="pcard-actions">
        {player.status === 'available' ? (
          <>
            <button className="btn-big primary" onClick={() => actions.draftMine(player.id)}>
              ⭐ Draft To My Team
            </button>
            <button className="btn-big danger" onClick={() => actions.markGone(player.id)}>
              ❌ Gone
            </button>
          </>
        ) : (
          <button className="btn-big ghost" onClick={() => actions.makeAvailable(player.id)}>
            ↩ Return to Board ({player.status === 'mine' ? 'My Team' : 'Gone'})
          </button>
        )}
        <button
          className={`btn-big ghost ${inCompare ? 'primary' : ''}`}
          onClick={() => actions.toggleCompare(player.id)}
        >
          {inCompare ? '✓ In Compare' : '⚖ Add to Compare'}
        </button>
        {onAiEval && (
          <button className="btn-big ghost" onClick={() => onAiEval(player.name, player)}>
            🤖 Re-evaluate & fix with AI
          </button>
        )}
      </div>
    </div>
  )
}
