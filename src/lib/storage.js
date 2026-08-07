// Tiny localStorage wrapper. All draft state lives here so a refresh never
// loses your board. Everything is offline — no backend, no network.

const KEY = 'juice-board:v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or unavailable — the app still works in-memory */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

// The AI API key is stored separately so it is NEVER included in an exported
// board or shared with anyone — it lives only in this browser.
const KEY_API = 'juice-board:apikey:v1'

export function loadApiKey() {
  try {
    return localStorage.getItem(KEY_API) || ''
  } catch {
    return ''
  }
}

export function saveApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_API, key)
    else localStorage.removeItem(KEY_API)
  } catch {
    /* ignore */
  }
}
