import { normalizeWindow } from './draftWindows'

// Turn a player name into a stable, unique id (names are unique on the board).
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeTrend(trend) {
  const t = String(trend || '').toLowerCase()
  if (t.startsWith('up') || t.startsWith('ris')) return 'up'
  if (t.startsWith('down') || t.startsWith('fall')) return 'down'
  return 'stable'
}

// 2025 points may be a real number, a label like "Rookie", or empty ("—").
export function normalizePoints(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s || s === '—' || s === '-') return null
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) && /\d/.test(s) ? n : s // keep "Rookie"/"DNP" as text
}

// Sortable numeric value for a points field (text/blank sink to the bottom).
export function pointsValue(v) {
  return typeof v === 'number' ? v : -1
}

// Normalize a raw player record (their schema) into the app's model. We never
// alter the evaluation values — only shape them (ids, casing, dashes).
export function normalizePlayer(raw, index = 0) {
  const baseId = raw.id || slugify(raw.name || `player-${index}`)
  return {
    id: baseId || `player-${index}`,
    name: raw.name || 'Unknown',
    position: (raw.position || '').toUpperCase(),
    team: (raw.team || '').toUpperCase(),
    bye: raw.bye ?? null,
    juice: Number(raw.juice) || 0,
    role: raw.role || '',
    trend: normalizeTrend(raw.trend),
    points2025: normalizePoints(raw.points2025),
    draftWindow: normalizeWindow(raw.draftWindow),
    why: raw.why || '',
    notes: raw.notes || '',
    hearts: Number(raw.hearts) || 0,
    seedStatus: (raw.status || 'available').toLowerCase(),
  }
}

export function normalizePlayers(list) {
  if (!Array.isArray(list)) return []
  const seen = new Map()
  return list.map((raw, i) => {
    const player = normalizePlayer(raw, i)
    // Guarantee id uniqueness even if two names collide after slugifying.
    if (seen.has(player.id)) {
      const n = seen.get(player.id) + 1
      seen.set(player.id, n)
      player.id = `${player.id}-${n}`
    } else {
      seen.set(player.id, 1)
    }
    return player
  })
}

// Ensure an id is unique against a set of taken ids (for newly added players).
export function uniqueId(base, taken) {
  let id = base || 'player'
  let n = 1
  while (taken.has(id)) {
    n += 1
    id = `${base}-${n}`
  }
  return id
}

const TREND_OUT = { up: 'Rising', stable: 'Stable', down: 'Falling' }

// Convert an enriched player back into the on-disk schema for Export.
export function denormalizePlayer(p) {
  return {
    name: p.name,
    position: p.position,
    team: p.team,
    bye: p.bye ?? null,
    draftWindow: p.draftWindow,
    role: p.role,
    juice: p.juice,
    points2025: p.points2025 ?? null,
    trend: TREND_OUT[p.trend] || 'Stable',
    hearts: p.hearts || 0,
    why: p.why || '',
    notes: p.notes || '',
    status: p.status || 'available',
  }
}
