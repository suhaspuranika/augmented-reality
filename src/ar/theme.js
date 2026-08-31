// Restrained, professional spatial palette (Vision Pro inspired, not gaming HUD).
export const THEME = {
  bgTop: 'rgba(22,27,38,0.82)',
  bgBottom: 'rgba(13,17,26,0.82)',
  stroke: 'rgba(120,140,170,0.28)',
  strokeGlow: 'rgba(94,234,212,0.35)',
  text: '#e8edf5',
  textDim: '#9aa8bd',
  accent: '#5eead4',
  accent2: '#7dd3fc',
  good: '#4ade80',
  warn: '#fbbf24',
  bad: '#f87171',
  track: 'rgba(255,255,255,0.10)',
  fontTitle: 'bold 34px system-ui, -apple-system, Segoe UI, sans-serif',
  fontBody: '26px system-ui, -apple-system, Segoe UI, sans-serif',
  fontSmall: '22px system-ui, -apple-system, Segoe UI, sans-serif',
  fontBig: 'bold 84px system-ui, -apple-system, Segoe UI, sans-serif',
}

// Rounded rectangle path.
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Frosted-glass card background with subtle border glow.
export function drawGlassCard(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  roundRect(ctx, 8, 8, w - 16, h - 16, 34)
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, THEME.bgTop)
  grad.addColorStop(1, THEME.bgBottom)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = THEME.stroke
  ctx.stroke()
  // inner accent hairline
  roundRect(ctx, 12, 12, w - 24, h - 24, 30)
  ctx.lineWidth = 1
  ctx.strokeStyle = THEME.strokeGlow
  ctx.stroke()
}

export function drawHeader(ctx, icon, title, w) {
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = THEME.accent
  ctx.font = THEME.fontTitle
  ctx.fillText(icon + '  ' + title, 34, 66)
}

// Horizontal progress bar. pct is 0..1.
export function drawProgress(ctx, x, y, w, pct, color) {
  const h = 16
  ctx.fillStyle = THEME.track
  roundRect(ctx, x, y, w, h, 8)
  ctx.fill()
  ctx.fillStyle = color
  roundRect(ctx, x, y, Math.max(6, w * Math.max(0, Math.min(1, pct))), h, 8)
  ctx.fill()
}

export function divider(ctx, y, w) {
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(34, y)
  ctx.lineTo(w - 34, y)
  ctx.stroke()
}
