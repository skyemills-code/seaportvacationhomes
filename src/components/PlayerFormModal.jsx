import { useState } from 'react'
import { useActions } from '../lib/useActions'
import { ROLES, TRENDS } from '../lib/roles'
import { DRAFT_WINDOWS } from '../lib/draftWindows'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K']
const TREND_OPTS = [
  { v: 'Rising', k: 'up' },
  { v: 'Stable', k: 'stable' },
  { v: 'Falling', k: 'down' },
]

const BLANK = {
  name: '',
  position: 'RB',
  team: '',
  bye: '',
  draftWindow: 'R4-6',
  role: 'Starter',
  juice: 80,
  points2025: '',
  trend: 'Stable',
  hearts: 0,
  why: '',
  notes: '',
}

// Map the internal trend key back to the display word for the <select>.
const TREND_WORD = { up: 'Rising', stable: 'Stable', down: 'Falling' }

function fromPlayer(p) {
  return {
    name: p.name || '',
    position: p.position || 'RB',
    team: p.team || '',
    bye: p.bye ?? '',
    draftWindow: p.draftWindow || 'R4-6',
    role: p.role || 'Starter',
    juice: p.juice ?? 80,
    points2025: p.points2025 ?? '',
    trend: TREND_WORD[p.trend] || p.trend || 'Stable',
    hearts: p.hearts ?? 0,
    why: p.why || '',
    notes: p.notes || '',
  }
}

export default function PlayerFormModal({ mode = 'add', initial, onClose }) {
  const actions = useActions()
  const [form, setForm] = useState(() => ({
    ...BLANK,
    ...(initial ? fromPlayer(initial) : {}),
    ...(initial && initial.name && mode === 'add' ? { name: initial.name } : {}),
  }))
  const [pasteOpen, setPasteOpen] = useState(false)
  const [paste, setPaste] = useState('')
  const [pasteErr, setPasteErr] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const applyPaste = () => {
    try {
      const obj = JSON.parse(paste)
      const rec = Array.isArray(obj) ? obj[0] : obj
      if (!rec || typeof rec !== 'object') throw new Error('Expected a player object')
      setForm((f) => ({ ...f, ...fromPlayer({ ...f, ...rec }) }))
      setPasteErr('')
      setPasteOpen(false)
    } catch (err) {
      setPasteErr(err.message || 'Invalid JSON')
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const record = {
      ...form,
      juice: Number(form.juice) || 0,
      hearts: Number(form.hearts) || 0,
      bye: form.bye === '' ? null : form.bye,
      status: 'available',
    }
    if (mode === 'edit' && initial?.id) actions.updatePlayer(initial.id, record)
    else actions.addPlayer(record)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal form-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>{mode === 'edit' ? '✏️ Edit Player' : '➕ Add Player'}</h2>
          <button type="button" className="pill" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-body">
          {mode === 'add' && (
            <div className="paste-zone">
              <button type="button" className="link-btn" onClick={() => setPasteOpen((v) => !v)}>
                {pasteOpen ? '▾ Hide paste box' : '▸ Paste a JSON record instead'}
              </button>
              {pasteOpen && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="notes-area"
                    style={{ minHeight: 120, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}
                    placeholder='{ "name": "Carnell Tate", "position": "WR", "juice": 87, ... }'
                    value={paste}
                    onChange={(e) => setPaste(e.target.value)}
                  />
                  {pasteErr && <div className="form-err">⚠ {pasteErr}</div>}
                  <button type="button" className="btn-big primary" style={{ marginTop: 8 }} onClick={applyPaste}>
                    Fill form from JSON
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="form-grid">
            <label className="field field-wide">
              <span>Name</span>
              <input value={form.name} onChange={set('name')} autoFocus placeholder="Player name" />
            </label>
            <label className="field">
              <span>Position</span>
              <select value={form.position} onChange={set('position')}>
                {POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Team</span>
              <input value={form.team} onChange={set('team')} placeholder="SEA" />
            </label>
            <label className="field">
              <span>Bye</span>
              <input value={form.bye} onChange={set('bye')} placeholder="11" />
            </label>
            <label className="field">
              <span>JUICE</span>
              <input type="number" min="0" max="100" value={form.juice} onChange={set('juice')} />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={set('role')}>
                {Object.keys(ROLES).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Draft Window</span>
              <select value={form.draftWindow} onChange={set('draftWindow')}>
                {DRAFT_WINDOWS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Trend</span>
              <select value={form.trend} onChange={set('trend')}>
                {TREND_OPTS.map((t) => (
                  <option key={t.v}>{t.v}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>2025 Points</span>
              <input value={form.points2025} onChange={set('points2025')} placeholder="164.2 or Rookie" />
            </label>
            <label className="field">
              <span>Hearts (0–3)</span>
              <input type="number" min="0" max="3" value={form.hearts} onChange={set('hearts')} />
            </label>
            <label className="field field-wide">
              <span>Why</span>
              <input value={form.why} onChange={set('why')} placeholder="One-line take" />
            </label>
            <label className="field field-wide">
              <span>Notes</span>
              <textarea className="notes-area" value={form.notes} onChange={set('notes')} />
            </label>
          </div>
        </div>

        <div className="modal-foot">
          {mode === 'edit' && initial?.isCustom && (
            <button
              type="button"
              className="btn-big danger"
              onClick={() => {
                actions.deletePlayer(initial.id)
                onClose()
              }}
            >
              🗑 Delete
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" className="btn-big ghost" style={{ gridColumn: 'auto' }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-big primary" style={{ gridColumn: 'auto' }}>
            {mode === 'edit' ? 'Save Changes' : '➕ Add to Board'}
          </button>
        </div>
      </form>
    </div>
  )
}
