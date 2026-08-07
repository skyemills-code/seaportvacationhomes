import { windowOrder } from './draftWindows'

// Merge the static player evaluations with live draft state (status, hearts,
// notes, and the pick/round at which they left the board).
export function enrichPlayers(state) {
  const { players, statuses, heartsOverride, notesOverride, events, teams } = state
  const eventIndex = new Map(events.map((id, i) => [id, i]))
  return players.map((p) => {
    const status = statuses[p.id] || 'available'
    const idx = eventIndex.has(p.id) ? eventIndex.get(p.id) : null
    return {
      ...p,
      status,
      hearts: heartsOverride[p.id] ?? p.hearts,
      notes: notesOverride[p.id] ?? p.notes,
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
  bye: (a, b) => (a.bye ?? 99) - (b.bye ?? 99) || b.juice - a.juice,
  draftWindow: (a, b) => windowOrder(a.draftWindow) - windowOrder(b.draftWindow) || b.juice - a.juice,
  points2025: (a, b) => (b.points2025 ?? -1) - (a.points2025 ?? -1),
  role: (a, b) => a.role.localeCompare(b.role) || b.juice - a.juice,
}

export function sortPlayers(players, key, dir) {
  const cmp = SORTABLE[key] || SORTABLE.juice
  const sorted = [...players].sort(cmp)
  return dir === 'asc' ? sorted.reverse() : sorted
}
