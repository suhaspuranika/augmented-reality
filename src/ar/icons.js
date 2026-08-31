// Minimal vector glyphs drawn on canvas — no emoji, for a clean realistic UI.
// Each icon draws centered at (cx, cy) within a box of side `s`, using stroke
// color `color`. Line width scales with size.

function setup(ctx, color, s) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(1.5, s * 0.06)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
}

export function icon(ctx, name, cx, cy, s, color = '#e8edf5') {
  const h = s / 2
  setup(ctx, color, s)
  switch (name) {
    case 'notes': {
      ctx.strokeRect(cx - h * 0.6, cy - h * 0.8, h * 1.2, h * 1.6)
      ctx.beginPath()
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(cx - h * 0.35, cy + i * h * 0.4)
        ctx.lineTo(cx + h * 0.35, cy + i * h * 0.4)
      }
      ctx.stroke()
      break
    }
    case 'calc': {
      ctx.strokeRect(cx - h * 0.7, cy - h * 0.8, h * 1.4, h * 1.6)
      ctx.strokeRect(cx - h * 0.5, cy - h * 0.6, h * 1.0, h * 0.4)
      ctx.beginPath()
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 3; c++) {
          const x = cx - h * 0.4 + c * h * 0.4
          const y = cy + h * 0.15 + r * h * 0.35
          ctx.moveTo(x, y)
          ctx.arc(x, y, s * 0.03, 0, Math.PI * 2)
        }
      ctx.stroke()
      break
    }
    case 'terminal': {
      ctx.strokeRect(cx - h * 0.8, cy - h * 0.65, h * 1.6, h * 1.3)
      ctx.beginPath()
      ctx.moveTo(cx - h * 0.5, cy - h * 0.2)
      ctx.lineTo(cx - h * 0.2, cy + h * 0.05)
      ctx.lineTo(cx - h * 0.5, cy + h * 0.3)
      ctx.moveTo(cx + h * 0.05, cy + h * 0.3)
      ctx.lineTo(cx + h * 0.45, cy + h * 0.3)
      ctx.stroke()
      break
    }
    case 'media': {
      ctx.beginPath()
      ctx.moveTo(cx - h * 0.35, cy - h * 0.5)
      ctx.lineTo(cx - h * 0.35, cy + h * 0.5)
      ctx.lineTo(cx + h * 0.5, cy)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'monitor': {
      ctx.strokeRect(cx - h * 0.85, cy - h * 0.7, h * 1.7, h * 1.2)
      ctx.beginPath()
      ctx.moveTo(cx - h * 0.3, cy + h * 0.5)
      ctx.lineTo(cx + h * 0.3, cy + h * 0.5)
      ctx.moveTo(cx, cy + h * 0.5)
      ctx.lineTo(cx, cy + h * 0.75)
      ctx.stroke()
      break
    }
    case 'calendar': {
      ctx.strokeRect(cx - h * 0.7, cy - h * 0.6, h * 1.4, h * 1.3)
      ctx.beginPath()
      ctx.moveTo(cx - h * 0.7, cy - h * 0.25)
      ctx.lineTo(cx + h * 0.7, cy - h * 0.25)
      ctx.moveTo(cx - h * 0.35, cy - h * 0.6)
      ctx.lineTo(cx - h * 0.35, cy - h * 0.85)
      ctx.moveTo(cx + h * 0.35, cy - h * 0.6)
      ctx.lineTo(cx + h * 0.35, cy - h * 0.85)
      ctx.stroke()
      break
    }
    case 'tasks': {
      ctx.strokeRect(cx - h * 0.75, cy - h * 0.75, h * 1.5, h * 1.5)
      ctx.beginPath()
      ctx.moveTo(cx - h * 0.35, cy)
      ctx.lineTo(cx - h * 0.1, cy + h * 0.3)
      ctx.lineTo(cx + h * 0.45, cy - h * 0.35)
      ctx.stroke()
      break
    }
    case 'bell': {
      ctx.beginPath()
      ctx.moveTo(cx - h * 0.5, cy + h * 0.35)
      ctx.quadraticCurveTo(cx - h * 0.5, cy - h * 0.5, cx, cy - h * 0.6)
      ctx.quadraticCurveTo(cx + h * 0.5, cy - h * 0.5, cx + h * 0.5, cy + h * 0.35)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy + h * 0.55, s * 0.05, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'focus': {
      ctx.beginPath()
      ctx.arc(cx, cy, h * 0.7, 0, Math.PI * 2)
      ctx.moveTo(cx + h * 0.35, cy)
      ctx.arc(cx, cy, h * 0.35, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, s * 0.04, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'system': {
      ctx.strokeRect(cx - h * 0.65, cy - h * 0.65, h * 1.3, h * 1.3)
      ctx.beginPath()
      for (const p of [-0.65, 0.65]) {
        for (let i = -1; i <= 1; i++) {
          ctx.moveTo(cx + p, cy + i * h * 0.35)
          ctx.lineTo(cx + p + Math.sign(p) * h * 0.22, cy + i * h * 0.35)
        }
        for (let i = -1; i <= 1; i++) {
          ctx.moveTo(cx + i * h * 0.35, cy + p)
          ctx.lineTo(cx + i * h * 0.35, cy + p + Math.sign(p) * h * 0.22)
        }
      }
      ctx.stroke()
      break
    }
    case 'git': {
      ctx.beginPath()
      ctx.arc(cx, cy - h * 0.4, s * 0.06, 0, Math.PI * 2)
      ctx.arc(cx - h * 0.4, cy + h * 0.4, s * 0.06, 0, Math.PI * 2)
      ctx.arc(cx + h * 0.4, cy + h * 0.4, s * 0.06, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - h * 0.4)
      ctx.lineTo(cx - h * 0.4, cy + h * 0.4)
      ctx.moveTo(cx, cy - h * 0.4)
      ctx.lineTo(cx + h * 0.4, cy + h * 0.4)
      ctx.stroke()
      break
    }
    case 'weather': {
      ctx.beginPath()
      ctx.arc(cx + h * 0.2, cy - h * 0.2, h * 0.35, Math.PI * 0.2, Math.PI * 1.6)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx - h * 0.25, cy + h * 0.25, h * 0.35, Math.PI, Math.PI * 2)
      ctx.arc(cx + h * 0.2, cy + h * 0.25, h * 0.28, Math.PI * 1.2, Math.PI * 2.2)
      ctx.lineTo(cx - h * 0.6, cy + h * 0.25)
      ctx.stroke()
      break
    }
    default:
      ctx.strokeRect(cx - h * 0.5, cy - h * 0.5, s * 0.5, s * 0.5)
  }
  ctx.restore()
}

// A small filled status dot (green/amber/red).
export function statusDot(ctx, cx, cy, r, color) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}
