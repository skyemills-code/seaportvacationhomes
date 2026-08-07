// JUICE is the proprietary ranking. The app NEVER calculates it — it only
// displays the stored value and maps it to a color tier.
//
//   95-100  Dark Green
//   90-94   Green
//   85-89   Lime
//   80-84   Yellow
//   75-79   Orange
//   65-74   Gray
//   < 65    Muted Red

export const JUICE_TIERS = [
  { min: 95, key: 'elite', label: 'Elite', color: 'var(--juice-elite)' },
  { min: 90, key: 'great', label: 'Great', color: 'var(--juice-great)' },
  { min: 85, key: 'good', label: 'Good', color: 'var(--juice-good)' },
  { min: 80, key: 'solid', label: 'Solid', color: 'var(--juice-solid)' },
  { min: 75, key: 'okay', label: 'Okay', color: 'var(--juice-okay)' },
  { min: 65, key: 'meh', label: 'Meh', color: 'var(--juice-meh)' },
  { min: -Infinity, key: 'low', label: 'Low', color: 'var(--juice-low)' },
]

export function juiceTier(value) {
  const v = Number(value)
  if (!Number.isFinite(v)) return JUICE_TIERS[JUICE_TIERS.length - 1]
  return JUICE_TIERS.find((t) => v >= t.min) || JUICE_TIERS[JUICE_TIERS.length - 1]
}

export function juiceColor(value) {
  return juiceTier(value).color
}
