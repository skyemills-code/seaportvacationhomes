// Roster shape and needs logic. Everything is local and offline.

export const ROSTER_SLOTS = [
  { id: 'QB', label: 'QB', accepts: ['QB'] },
  { id: 'RB1', label: 'RB', accepts: ['RB'] },
  { id: 'RB2', label: 'RB', accepts: ['RB'] },
  { id: 'WR1', label: 'WR', accepts: ['WR'] },
  { id: 'WR2', label: 'WR', accepts: ['WR'] },
  { id: 'TE', label: 'TE', accepts: ['TE'] },
  { id: 'FLEX', label: 'FLEX', accepts: ['RB', 'WR', 'TE'] },
]

export const FLEX_POSITIONS = ['RB', 'WR', 'TE']

// Given the list of drafted players (in pick order), assign them to starter
// slots greedily, remainder go to the bench.
export function buildRoster(myPlayers) {
  const slots = ROSTER_SLOTS.map((s) => ({ ...s, player: null }))
  const bench = []

  for (const player of myPlayers) {
    // Prefer a dedicated positional slot before FLEX.
    const dedicated = slots.find(
      (s) => !s.player && s.id !== 'FLEX' && s.accepts.includes(player.position)
    )
    if (dedicated) {
      dedicated.player = player
      continue
    }
    const flex = slots.find((s) => !s.player && s.id === 'FLEX' && s.accepts.includes(player.position))
    if (flex) {
      flex.player = player
      continue
    }
    bench.push(player)
  }

  return { slots, bench }
}

// Positional requirements used for the "Roster Needs" star meter.
const REQUIRED = { QB: 1, RB: 2, WR: 2, TE: 1 }

// Returns an array of { position, filled, required, stars } sorted by urgency.
export function rosterNeeds(myPlayers) {
  const counts = { QB: 0, RB: 0, WR: 0, TE: 0 }
  for (const p of myPlayers) {
    if (counts[p.position] !== undefined) counts[p.position] += 1
  }

  const needs = Object.keys(REQUIRED).map((pos) => {
    const filled = counts[pos]
    const required = REQUIRED[pos]
    const remaining = Math.max(0, required - filled)

    // Stars scale with how much of the requirement is still open, weighted by
    // how many roster spots that position drives (RB/WR need two starters).
    let stars
    if (remaining === 0) {
      stars = filled > required ? 1 : 1 // satisfied → low priority
      stars = 1
    } else if (remaining >= required) {
      // nothing yet at a two-deep position → maximum urgency
      stars = required >= 2 ? 5 : 4
    } else {
      // partially filled two-deep position
      stars = 3
    }
    if (remaining === 0) stars = 1

    return { position: pos, filled, required, remaining, stars }
  })

  // Sort most urgent first.
  needs.sort((a, b) => b.stars - a.stars || b.remaining - a.remaining)
  return needs
}
