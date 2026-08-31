import { THEME, roundRect } from './theme.js'
import { icon } from './icons.js'

/**
 * Screen "apps" for the AR computer screen. Each app draws into a rectangular
 * viewport (vx, vy, vw, vh) on the screen canvas and registers hit regions via
 * api.addHit(name, x, y, w, h, payload). Apps are operable: taps route back
 * through onTap, and text input flows through the shared keyboard.
 *
 * An app implements:
 *   id, title, icon
 *   draw(ctx, vp, ctxState, api)
 *   onTap(region, screen)   -> optional
 */

function text(ctx, s, x, y, color, font) {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(s, x, y)
}

// --- Notes app: type with the on-screen keyboard ---------------------------
export const NotesApp = {
  id: 'notes',
  title: 'Notes',
  icon: 'notes',
  draw(ctx, vp, s, api) {
    icon(ctx, 'notes', vp.x + 34, vp.y + 34, 26, THEME.accent)
    text(ctx, 'Notes', vp.x + 58, vp.y + 44, THEME.accent, 'bold 30px system-ui')
    // text area
    roundRect(ctx, vp.x + 20, vp.y + 64, vp.w - 40, vp.h - 200, 16)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fill()
    ctx.strokeStyle = THEME.stroke
    ctx.lineWidth = 1
    ctx.stroke()

    const value = s.screen.notes || ''
    const cursor = s.screen.focusField === 'notes' ? '|' : ''
    wrapText(ctx, value + cursor, vp.x + 36, vp.y + 104, vp.w - 72, 34, THEME.text, '24px system-ui')

    // focus region = whole text area
    api.addHit('focusNotes', vp.x + 20, vp.y + 64, vp.w - 40, vp.h - 200)
    api.keyboard(vp) // draw keyboard at bottom of viewport
  },
  onTap(region, screen) {
    if (region.name === 'focusNotes') screen.setFocusField('notes')
  },
}

// --- Calculator app --------------------------------------------------------
export const CalcApp = {
  id: 'calc',
  title: 'Calculator',
  icon: 'calc',
  draw(ctx, vp, s, api) {
    icon(ctx, 'calc', vp.x + 34, vp.y + 34, 26, THEME.accent)
    text(ctx, 'Calculator', vp.x + 58, vp.y + 44, THEME.accent, 'bold 30px system-ui')
    const disp = s.screen.calcDisplay || '0'
    roundRect(ctx, vp.x + 20, vp.y + 64, vp.w - 40, 70, 14)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fill()
    ctx.fillStyle = THEME.text
    ctx.font = 'bold 44px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText(disp.slice(-14), vp.x + vp.w - 44, vp.y + 114)
    ctx.textAlign = 'left'

    const keys = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C']
    const cols = 4
    const bw = (vp.w - 40 - (cols - 1) * 12) / cols
    const bh = 66
    let gx = vp.x + 20
    let gy = vp.y + 154
    keys.forEach((k, i) => {
      const col = i % cols
      const x = gx + col * (bw + 12)
      const y = gy + Math.floor(i / cols) * (bh + 12)
      const accent = '+-*/='.includes(k)
      roundRect(ctx, x, y, k === 'C' ? bw * 2 + 12 : bw, bh, 12)
      ctx.fillStyle = accent ? 'rgba(94,234,212,0.18)' : 'rgba(255,255,255,0.07)'
      ctx.fill()
      ctx.strokeStyle = accent ? THEME.accent : THEME.stroke
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = accent ? THEME.accent : THEME.text
      ctx.font = 'bold 30px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(k, x + (k === 'C' ? bw + 6 : bw / 2), y + 44)
      ctx.textAlign = 'left'
      api.addHit('calcKey', x, y, k === 'C' ? bw * 2 + 12 : bw, bh, { k })
    })
  },
  onTap(region, screen) {
    if (region.name !== 'calcKey') return
    screen.calcInput(region.payload.k)
  },
}

// --- Terminal app (fake but operable command echo) -------------------------
export const TerminalApp = {
  id: 'terminal',
  title: 'Terminal',
  icon: 'terminal',
  draw(ctx, vp, s, api) {
    roundRect(ctx, vp.x + 16, vp.y + 20, vp.w - 32, vp.h - 40, 14)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fill()
    const lines = s.screen.termLines || ['AR-OS terminal. Type "help".']
    let y = vp.y + 60
    lines.slice(-8).forEach((ln) => {
      text(ctx, ln, vp.x + 34, y, ln.startsWith('$') ? THEME.accent : '#b8ffcf', '22px monospace')
      y += 30
    })
    const cursor = s.screen.focusField === 'term' ? '_' : ''
    text(ctx, '$ ' + (s.screen.termInput || '') + cursor, vp.x + 34, y, THEME.accent, '22px monospace')
    api.addHit('focusTerm', vp.x + 16, vp.y + 20, vp.w - 32, vp.h - 40)
    api.keyboard(vp)
  },
  onTap(region, screen) {
    if (region.name === 'focusTerm') screen.setFocusField('term')
  },
}

// --- Media / player app ----------------------------------------------------
export const MediaApp = {
  id: 'media',
  title: 'Player',
  icon: 'media',
  draw(ctx, vp, s, api) {
    icon(ctx, 'media', vp.x + 34, vp.y + 34, 24, THEME.accent)
    text(ctx, 'Now Playing', vp.x + 58, vp.y + 44, THEME.accent, 'bold 30px system-ui')
    text(ctx, s.screen.mediaTrack || 'Focus Beats — Lo-Fi', vp.x + 24, vp.y + 90, THEME.text, '26px system-ui')
    const playing = !!s.screen.mediaPlaying
    // progress
    const p = s.screen.mediaProgress || 0
    roundRect(ctx, vp.x + 24, vp.y + 120, vp.w - 48, 12, 6)
    ctx.fillStyle = THEME.track
    ctx.fill()
    roundRect(ctx, vp.x + 24, vp.y + 120, (vp.w - 48) * p, 12, 6)
    ctx.fillStyle = THEME.accent
    ctx.fill()
    // play/pause button
    const bx = vp.x + vp.w / 2 - 45
    const by = vp.y + 160
    roundRect(ctx, bx, by, 90, 64, 16)
    ctx.fillStyle = 'rgba(94,234,212,0.18)'
    ctx.fill()
    ctx.strokeStyle = THEME.accent
    ctx.lineWidth = 2
    ctx.stroke()
    const mx = vp.x + vp.w / 2
    const my = by + 32
    ctx.fillStyle = THEME.accent
    if (playing) {
      ctx.fillRect(mx - 12, my - 14, 8, 28)
      ctx.fillRect(mx + 4, my - 14, 8, 28)
    } else {
      ctx.beginPath()
      ctx.moveTo(mx - 10, my - 15)
      ctx.lineTo(mx - 10, my + 15)
      ctx.lineTo(mx + 16, my)
      ctx.closePath()
      ctx.fill()
    }
    api.addHit('mediaToggle', bx, by, 90, 64)
  },
  onTap(region, screen) {
    if (region.name === 'mediaToggle') screen.toggleMedia()
  },
}

export const ALL_APPS = [NotesApp, CalcApp, TerminalApp, MediaApp]

// Word-wrap helper for the notes/text area.
function wrapText(ctx, str, x, y, maxW, lh, color, font) {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'left'
  const words = String(str).split(/(\s+)/)
  let line = ''
  let cy = y
  for (const w of words) {
    const test = line + w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy)
      line = w.trimStart()
      cy += lh
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}
