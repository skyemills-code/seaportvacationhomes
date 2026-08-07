// Every player has exactly one role. Roles drive color coding and the
// upside-focused filters (League Winner / Breakout / Handcuff / Bench).

export const ROLES = {
  Stud: { key: 'Stud', label: 'Stud', emoji: '⭐', color: 'var(--role-stud)' },
  Starter: { key: 'Starter', label: 'Starter', emoji: '🟢', color: 'var(--role-starter)' },
  'League Winner': { key: 'League Winner', label: 'League Winner', emoji: '💎', color: 'var(--role-winner)' },
  Breakout: { key: 'Breakout', label: 'Breakout', emoji: '🚀', color: 'var(--role-breakout)' },
  Bench: { key: 'Bench', label: 'Bench', emoji: '🪑', color: 'var(--role-bench)' },
  Handcuff: { key: 'Handcuff', label: 'Handcuff', emoji: '🛡️', color: 'var(--role-handcuff)' },
  Injury: { key: 'Injury', label: 'Injury', emoji: '🩺', color: 'var(--role-injury)' },
  Watch: { key: 'Watch', label: 'Watch', emoji: '👀', color: 'var(--role-watch)' },
}

const FALLBACK_ROLE = { key: 'Unranked', label: 'Unranked', emoji: '•', color: 'var(--role-bench)' }

export function roleInfo(role) {
  if (!role) return FALLBACK_ROLE
  return ROLES[role] || { ...FALLBACK_ROLE, key: role, label: role }
}

// Trend indicators
export const TRENDS = {
  up: { key: 'up', label: 'Rising', symbol: '⬆', color: 'var(--trend-up)' },
  stable: { key: 'stable', label: 'Stable', symbol: '➡', color: 'var(--trend-stable)' },
  down: { key: 'down', label: 'Falling', symbol: '⬇', color: 'var(--trend-down)' },
}

export function trendInfo(trend) {
  if (!trend) return TRENDS.stable
  const t = String(trend).toLowerCase()
  if (t.startsWith('up') || t.startsWith('ris')) return TRENDS.up
  if (t.startsWith('down') || t.startsWith('fall')) return TRENDS.down
  return TRENDS.stable
}
