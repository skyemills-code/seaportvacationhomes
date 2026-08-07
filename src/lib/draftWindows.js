// Draft windows, ordered earliest → latest. Sorting by window uses this order.
// "Do not target" sorts last — it's an avoid tag, not a real window.

export const DRAFT_WINDOWS = [
  'R1',
  'R1-2',
  'R2-3',
  'R3-4',
  'R4-6',
  'R5-7',
  'R6-9',
  'R7-10',
  'R8-11',
  'R9-12',
  'R10-14',
  'Late',
  'Last',
  'Do not target',
]

// Normalize any dash style (en dash / em dash / spaces) to the canonical key.
export function normalizeWindow(win) {
  if (!win) return ''
  const raw = String(win).trim()
  if (/do\s*not\s*target/i.test(raw)) return 'Do not target'
  if (/^late$/i.test(raw)) return 'Late'
  if (/^last$/i.test(raw)) return 'Last'
  return raw
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '')
    .replace(/^r/i, 'R')
}

const ORDER = new Map(DRAFT_WINDOWS.map((w, i) => [w, i]))

export function windowOrder(win) {
  const key = normalizeWindow(win)
  const idx = ORDER.get(key)
  return idx === undefined ? DRAFT_WINDOWS.length + 1 : idx
}

// The earliest round covered by a window — used by On The Clock mode to decide
// which players are "in play" for the current round.
export function windowStartRound(win) {
  const key = normalizeWindow(win)
  if (key === 'Late') return 11
  if (key === 'Last') return 14
  if (key === 'Do not target') return 99
  const m = key.match(/R(\d+)/)
  return m ? Number(m[1]) : 99
}

export function windowEndRound(win) {
  const key = normalizeWindow(win)
  if (key === 'Late') return 14
  if (key === 'Last') return 16
  if (key === 'Do not target') return 99
  const m = key.match(/R\d+-(\d+)/)
  if (m) return Number(m[1])
  const single = key.match(/R(\d+)$/)
  return single ? Number(single[1]) : 99
}
