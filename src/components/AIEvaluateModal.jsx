import { useEffect, useRef, useState } from 'react'
import { useDraft } from '../context/DraftContext'
import { useActions } from '../lib/useActions'
import { normalizePlayer } from '../lib/data'
import { evaluatePlayer, describeAiError } from '../lib/ai'
import { JuiceBadge, RoleBadge, TrendBadge, PosTag, WindowTag } from './badges'

// Optional online feature: ask Claude to produce a JUICE record for a name,
// then Add it (or apply it to an existing player). Runs only with the user's
// own key, only on demand.
export default function AIEvaluateModal({ name, existing, onClose, onEditRecord }) {
  const { state } = useDraft()
  const actions = useActions()
  const hasKey = !!state.apiKey
  const [keyInput, setKeyInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [record, setRecord] = useState(null) // raw record from AI
  const [error, setError] = useState('')
  const ran = useRef(false)

  const run = async () => {
    setStatus('loading')
    setError('')
    try {
      const rec = await evaluatePlayer(state.apiKey, name, { existing })
      setRecord(rec)
      setStatus('done')
    } catch (err) {
      setError(describeAiError(err))
      setStatus('error')
    }
  }

  // Auto-run once a key is present.
  useEffect(() => {
    if (hasKey && !ran.current) {
      ran.current = true
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey])

  const preview = record ? normalizePlayer(record) : null

  const commit = () => {
    if (!record) return
    if (existing) actions.updatePlayer(existing.id, record)
    else actions.addPlayer(record)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <h2>🤖 {existing ? 'Re-evaluate' : 'Evaluate'} with AI</h2>
          <button className="pill" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-body">
          {/* Key setup */}
          {!hasKey && (
            <div className="data-section" style={{ paddingTop: 0 }}>
              <div className="section-title">Connect your Anthropic API key</div>
              <p className="hint" style={{ textAlign: 'left', padding: 0 }}>
                AI evaluation runs online using your own Anthropic key. It's stored{' '}
                <b>only in this browser</b> — never uploaded, never in your Export. Get one at{' '}
                <span style={{ color: 'var(--green-600)', fontWeight: 700 }}>console.anthropic.com</span> →
                API Keys.
              </p>
              <input
                className="key-input"
                type="password"
                placeholder="sk-ant-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                autoFocus
              />
              <button
                className="btn-big primary"
                style={{ width: '100%', marginTop: 10 }}
                disabled={!keyInput.trim()}
                onClick={() => {
                  actions.setApiKey(keyInput.trim())
                  ran.current = false // allow auto-run once key lands
                }}
              >
                Save key & evaluate
              </button>
            </div>
          )}

          {hasKey && (
            <>
              {status === 'loading' && (
                <div className="empty" style={{ height: 'auto', padding: '30px 10px' }}>
                  <div className="big spin">🧃</div>
                  <h3>Evaluating {name}…</h3>
                  <p>Scoring usage, upside, risk & environment.</p>
                </div>
              )}

              {status === 'error' && (
                <div className="data-section" style={{ paddingTop: 0 }}>
                  <div className="form-err" style={{ fontSize: 14 }}>
                    ⚠ {error}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn-big primary" style={{ flex: 1 }} onClick={run}>
                      Try again
                    </button>
                    <button
                      className="btn-big"
                      onClick={() => actions.setApiKey('')}
                      title="Forget the stored key"
                    >
                      Change key
                    </button>
                  </div>
                </div>
              )}

              {status === 'done' && preview && (
                <>
                  <div className="pcard-hero" style={{ marginBottom: 14 }}>
                    <div className="pcard-name">{preview.name}</div>
                    <div className="pcard-meta">
                      <PosTag position={preview.position} />
                      <span>{preview.team || '—'}</span>
                      <span>·</span>
                      <span>Bye {preview.bye ?? '—'}</span>
                    </div>
                    <div className="pcard-juicewrap">
                      <JuiceBadge value={preview.juice} size="xl" />
                      <div className="col-tags">
                        <RoleBadge role={preview.role} />
                        <TrendBadge trend={preview.trend} withLabel />
                        <WindowTag window={preview.draftWindow} />
                      </div>
                    </div>
                  </div>

                  <div className="stat-grid" style={{ marginBottom: 12 }}>
                    <div className="stat-cell">
                      <div className="k">2025 Points</div>
                      <div className="v">{preview.points2025 == null ? '—' : preview.points2025}</div>
                    </div>
                    <div className="stat-cell">
                      <div className="k">Draft Window</div>
                      <div className="v" style={{ fontSize: 16 }}>
                        {preview.draftWindow}
                      </div>
                    </div>
                  </div>

                  <div className="why-block">
                    <div className="k">Why</div>
                    <div className="v">{preview.why || '—'}</div>
                  </div>
                  {preview.notes && (
                    <div className="why-block" style={{ marginTop: 10 }}>
                      <div className="k">AI Notes</div>
                      <div className="v" style={{ fontSize: 14, fontWeight: 500 }}>
                        {preview.notes}
                      </div>
                    </div>
                  )}

                  <p className="hint" style={{ textAlign: 'left', padding: '10px 0 0' }}>
                    AI-generated — sanity-check it. It won't invent 2025 point totals.
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {hasKey && status === 'done' && (
          <div className="modal-foot">
            <button className="btn-big" style={{ padding: '0 16px' }} onClick={run}>
              ↻ Re-run
            </button>
            {onEditRecord && (
              <button
                className="btn-big"
                style={{ padding: '0 16px' }}
                onClick={() => {
                  onEditRecord(record, existing)
                  onClose()
                }}
              >
                ✏️ Edit first
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn-big primary" style={{ padding: '0 18px' }} onClick={commit}>
              {existing ? 'Apply Changes' : '➕ Add to Board'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
