import { useRef, useState } from 'react'
import { useActions } from '../lib/useActions'

// Export / Import the whole board as JSON — the sync bridge between your
// online board and the offline draft-day build (and for round-tripping to me).
export default function DataModal({ onClose }) {
  const actions = useActions()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null) // parsed array awaiting merge/replace
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  const board = actions.exportBoard()
  const json = JSON.stringify(board, null, 2)

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'juice-board-players.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setErr('Clipboard blocked — use Download instead.')
    }
  }

  const parse = (text) => {
    try {
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) throw new Error('File must be a JSON array of players')
      setPending(arr)
      setErr('')
      setMsg(`Loaded ${arr.length} players. Choose how to apply them:`)
    } catch (e) {
      setErr(e.message || 'Invalid JSON')
      setPending(null)
      setMsg('')
    }
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => parse(String(reader.result))
    reader.readAsText(file)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-head">
          <h2>🗂 Player Data</h2>
          <button className="pill" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="data-section">
            <div className="section-title">⬇️ Export</div>
            <p className="hint" style={{ textAlign: 'left', padding: 0 }}>
              Save your whole board ({board.length} players) as JSON — load it into the offline draft build, or
              send it back to have JUICE/roles refreshed.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn-big primary" style={{ flex: 1 }} onClick={download}>
                ⬇️ Download JSON
              </button>
              <button className="btn-big" onClick={copy}>
                {copied ? '✓ Copied' : '⧉ Copy'}
              </button>
            </div>
          </div>

          <div className="data-section">
            <div className="section-title">⬆️ Import</div>
            <p className="hint" style={{ textAlign: 'left', padding: 0 }}>
              Load a refreshed players file. <b>Merge</b> adds new players and updates matching ones;
              <b> Replace</b> swaps in the whole board.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn-big" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
                📂 Choose JSON file…
              </button>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
            </div>
            <textarea
              className="notes-area"
              style={{ marginTop: 8, minHeight: 90, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}
              placeholder="…or paste JSON here, then Merge / Replace"
              onChange={(e) => e.target.value.trim() && parse(e.target.value)}
            />
            {err && <div className="form-err">⚠ {err}</div>}
            {msg && <div className="hint" style={{ textAlign: 'left', padding: '6px 0', color: 'var(--green-600)' }}>{msg}</div>}
            {pending && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  className="btn-big primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    actions.importMerge(pending)
                    onClose()
                  }}
                >
                  Merge ({pending.length})
                </button>
                <button
                  className="btn-big danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    actions.importReplace(pending)
                    onClose()
                  }}
                >
                  Replace all
                </button>
              </div>
            )}
          </div>

          <div className="data-section">
            <div className="section-title" style={{ color: 'var(--role-injury)' }}>Reset</div>
            <button
              className="link-btn"
              onClick={() => {
                if (confirm('Reset players back to the built-in file? Your draft picks are kept.')) {
                  actions.clearData()
                  onClose()
                }
              }}
            >
              Clear imported / added players
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
