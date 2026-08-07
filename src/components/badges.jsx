import { juiceColor } from '../lib/juice'
import { roleInfo, trendInfo } from '../lib/roles'
import { normalizeWindow } from '../lib/draftWindows'

export function JuiceBadge({ value, size }) {
  const cls = size ? `juice-badge ${size}` : 'juice-badge'
  return (
    <span className={cls} style={{ '--jc': juiceColor(value) }} title={`JUICE ${value}`}>
      {value}
    </span>
  )
}

export function RoleBadge({ role, showLabel = true }) {
  const info = roleInfo(role)
  return (
    <span className="role-badge" style={{ '--rc': info.color }}>
      <span aria-hidden>{info.emoji}</span>
      {showLabel && info.label}
    </span>
  )
}

export function TrendBadge({ trend, withLabel }) {
  const info = trendInfo(trend)
  return (
    <span className={`trend trend-${info.key}`} title={info.label}>
      <span aria-hidden>{info.symbol}</span>
      {withLabel && info.label}
    </span>
  )
}

export function PosTag({ position }) {
  return <span className={`pos-tag pos-${position}`}>{position}</span>
}

export function WindowTag({ window }) {
  const key = normalizeWindow(window)
  if (!key) return <span className="cell-sub">—</span>
  const avoid = key === 'Do not target'
  return <span className={`win-tag${avoid ? ' avoid' : ''}`}>{avoid ? 'Avoid' : key}</span>
}

export function Hearts({ count }) {
  const n = Number(count) || 0
  if (n <= 0) return <span className="cell-sub">—</span>
  return (
    <span className="hearts-inline" title={`${n} heart${n > 1 ? 's' : ''}`}>
      {'❤️'.repeat(Math.min(n, 5))}
    </span>
  )
}

export function StatusDot({ status }) {
  const label = status === 'mine' ? 'My Team' : status === 'gone' ? 'Gone' : 'Available'
  return (
    <span className={`status-dot status-${status}`}>
      <span className="dot" />
      {label}
    </span>
  )
}
