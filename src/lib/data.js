import { normalizeWindow } from './draftWindows'

// Turn a player name into a stable, unique id (names are unique in the board).
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeTrend(trend) {
  const t = String(trend || '').toLowerCase()
  if (t.startsWith('up') || t.startsWith('ris')) return 'up'
  if (t.startsWith('down') || t.startsWith('fall')) return 'down'
  return 'stable'
}

// Normalize a raw player record (their schema) into the app's model. We never
// alter the evaluation values — only shape them (ids, casing, dashes).
export function normalizePlayer(raw, index) {
  const baseId = slugify(raw.name || `player-${index}`)
  return {
    id: raw.id || baseId || `player-${index}`,
    name: raw.name || 'Unknown',
    position: (raw.position || '').toUpperCase(),
    team: (raw.team || '').toUpperCase(),
    bye: raw.bye ?? null,
    juice: Number(raw.juice) || 0,
    role: raw.role || '',
    trend: normalizeTrend(raw.trend),
    points2025: raw.points2025 === null || raw.points2025 === undefined ? null : Number(raw.points2025),
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
