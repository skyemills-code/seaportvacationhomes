import { windowOrder } from './draftWindows'
import { pointsValue } from './data'

// The effective base list: an imported full board overrides the file, plus any
// players you've added in-app. All offline, all persisted locally.
export function allPlayers(state) {
  const base = state.importedPlayers && state.importedPlayers.length ? state.importedPlayers : state.players
  const custom = state.customPlayers || []
  return [...base, ...custom]
}

// Merge the static player evaluations with live draft state (status, edits,
// hearts, notes, and the pick/round at which they left the board).
export function enrichPlayers(state) {
  const { statuses, heartsOverride, notesOverride, edits, events, teams } = state
  const eventIndex = new Map(events.map((id, i) => [id, i]))
  return allPlayers(state).map((p0) => {
    const edit = (edits && edits[p0.id]) || {}
    const p = { ...p0, ...edit }
    const status = statuses[p.id] || 'available'
    const idx = eventIndex.has(p.id) ? eventIndex.get(p.id) : null
    return {
      ...p,
      status,
      hearts: heartsOverride[p.id] ?? p.hearts,
      notes: notesOverride[p.id] ?? p.notes,
      isCustom: (state.customPlayers || []).some((c) => c.id === p.id),
      pick: idx === null ? null : idx + 1,
      round: idx === null ? null : Math.floor(idx / teams) + 1,
      pickInRound: idx === null ? null : (idx % teams) + 1,
    }
  })
}

// Live draft position based on how many players have left the board.
export function draftPosition(state) {
  const used = state.events.length
  const teams = state.teams || 12
  return {
    pick: used + 1,
    round: Math.floor(used / teams) + 1,
    pickInRound: (used % teams) + 1,
    used,
  }
}

const UPSIDE_ROLES = new Set(['League Winner', 'Breakout'])

export function matchesFilter(player, filter) {
  switch (filter) {
    case 'ALL':
      return true
    case 'QB':
    case 'RB':
    case 'WR':
    case 'TE':
    case 'K':
      return player.position === filter
    case 'FLEX':
      return ['RB', 'WR', 'TE'].includes(player.position)
    case 'MY_GUYS':
      return (player.hearts || 0) > 0
    case 'LEAGUE_WINNERS':
      return player.role === 'League Winner'
    case 'BREAKOUTS':
      return player.role === 'Breakout'
    case 'BENCH':
      return player.role === 'Bench'
    case 'INJURY':
      return player.role === 'Injury'
    case 'WATCH':
      return player.role === 'Watch'
    default:
      return true
  }
}

export function isUpside(player) {
  return UPSIDE_ROLES.has(player.role)
}

// Instant search: first name, last name, partial, case-insensitive.
export function searchPlayers(players, query) {
  const q = query.trim().toLowerCase()
  if (!q) return players
  return players.filter((p) => p.name.toLowerCase().includes(q))
}

export const SORTABLE = {
  juice: (a, b) => b.juice - a.juice,
  name: (a, b) => a.name.localeCompare(b.name),
  position: (a, b) => a.position.localeCompare(b.position) || b.juice - a.juice,
  team: (a, b) => a.team.localeCompare(b.team) || b.juice - a.juice,
  bye: (a, b) => (numOr(a.bye, 99) - numOr(b.bye, 99)) || b.juice - a.juice,
  draftWindow: (a, b) => windowOrder(a.draftWindow) - windowOrder(b.draftWindow) || b.juice - a.juice,
  points2025: (a, b) => pointsValue(b.points2025) - pointsValue(a.points2025),
  role: (a, b) => a.role.localeCompare(b.role) || b.juice - a.juice,
}

function numOr(v, fallback) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function sortPlayers(players, key, dir) {
  const cmp = SORTABLE[key] || SORTABLE.juice
  const sorted = [...players].sort(cmp)
  return dir === 'asc' ? sorted.reverse() : sorted
}
