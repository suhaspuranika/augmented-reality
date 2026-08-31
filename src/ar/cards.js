import { SpatialCard } from './spatialCard.js'
import { THEME, drawHeader, drawProgress, divider, roundRect } from './theme.js'

// Shared text helpers -------------------------------------------------------

function text(ctx, str, x, y, color = THEME.text, font = THEME.fontBody) {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.fillText(str, x, y)
}

function fmtClock(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

// 1. Calendar ---------------------------------------------------------------

export function makeCalendarCard(store) {
  return new SpatialCard({
    id: 'calendar',
    title: 'CALENDAR',
    icon: '📅',
    render(ctx, cw, ch, { expanded, state }) {
      drawHeader(ctx, '📅', 'CALENDAR', cw)
      const meetings = state.meetings || []
      const next = meetings[0]
      let y = 130
      if (!expanded) {
        text(ctx, 'Next: ' + (next ? next.time : '—'), 34, y, THEME.accent2)
        y += 42
        text(ctx, next ? next.title : 'No meetings', 34, y, THEME.text)
        y += 42
        if (next) text(ctx, `in ${next.minutesFromNow} min`, 34, y, THEME.textDim, THEME.fontSmall)
      } else {
        text(ctx, state.clock?.date || 'Today', 34, y, THEME.textDim, THEME.fontSmall)
        y += 40
        meetings.slice(0, 5).forEach((m) => {
          text(ctx, m.time, 34, y, THEME.accent2, THEME.fontSmall)
          text(ctx, m.title, 170, y, THEME.text, THEME.fontSmall)
          y += 40
        })
      }
    },
  })
}

// 2. Tasks (interactive checkboxes) -----------------------------------------

export function makeTasksCard(store) {
  return new SpatialCard({
    id: 'tasks',
    title: 'TASKS',
    icon: '✅',
    expandedRatio: 1.25,
    render(ctx, cw, ch, { expanded, state }, api) {
      const tasks = state.tasks || []
      const done = tasks.filter((t) => t.done).length
      drawHeader(ctx, '✅', 'TASKS', cw)
      ctx.textAlign = 'right'
      ctx.fillStyle = THEME.accent
      ctx.font = THEME.fontBody
      ctx.fillText(`${done}/${tasks.length}`, cw - 34, 66)
      ctx.textAlign = 'left'

      let y = 120
      const rows = expanded ? tasks : tasks.slice(0, 3)
      rows.forEach((t) => {
        const boxX = 34
        const boxY = y - 26
        // interactive checkbox region
        api.addHit('toggleTask', boxX - 6, boxY - 6, 48, 44, { id: t.id })
        ctx.font = '30px system-ui, sans-serif'
        ctx.fillStyle = t.done ? THEME.good : THEME.textDim
        ctx.fillText(t.done ? '☑' : '☐', boxX, y)
        ctx.font = THEME.fontSmall
        ctx.fillStyle = t.done ? '#7c8798' : THEME.text
        ctx.fillText(t.text, boxX + 46, y)
        if (t.done) {
          const w = ctx.measureText(t.text).width
          ctx.strokeStyle = '#7c8798'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(boxX + 46, y - 8)
          ctx.lineTo(boxX + 46 + w, y - 8)
          ctx.stroke()
        }
        y += 44
      })

      const pct = tasks.length ? done / tasks.length : 0
      const barY = ch - 70
      drawProgress(ctx, 34, barY, cw - 68, pct, THEME.accent)
      text(ctx, Math.round(pct * 100) + '%', 34, barY + 46, THEME.textDim, THEME.fontSmall)
    },
    onTap(region) {
      if (region.name === 'toggleTask') {
        const t = store.toggleTask(region.payload.id)
        return { event: 'taskToggled', task: t }
      }
    },
  })
}

// 3. Weather ----------------------------------------------------------------

export function makeWeatherCard(store) {
  return new SpatialCard({
    id: 'weather',
    title: 'WEATHER',
    icon: '⛅',
    render(ctx, cw, ch, { expanded, state }) {
      const w = state.weather || {}
      drawHeader(ctx, w.icon || '⛅', 'WEATHER', cw)
      let y = 140
      ctx.fillStyle = THEME.text
      ctx.font = 'bold 68px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${w.tempC ?? '--'}°C`, 34, y)
      y += 46
      text(ctx, w.condition || '', 34, y, THEME.textDim)
      y += 42
      text(ctx, w.location || '', 34, y, THEME.accent2, THEME.fontSmall)
      if (expanded) {
        y += 46
        text(ctx, `Humidity ${w.humidity ?? '--'}%`, 34, y, THEME.text, THEME.fontSmall)
        y += 38
        text(ctx, `Wind ${w.windKmh ?? '--'} km/h`, 34, y, THEME.text, THEME.fontSmall)
      }
    },
  })
}

// 4. Notifications ----------------------------------------------------------

export function makeNotificationsCard(store) {
  return new SpatialCard({
    id: 'notifications',
    title: 'ALERTS',
    icon: '🔔',
    render(ctx, cw, ch, { expanded, state }, api) {
      const list = state.notifications || []
      const unread = list.filter((n) => !n.read).length
      drawHeader(ctx, '🔔', 'ALERTS', cw)
      ctx.textAlign = 'right'
      ctx.fillStyle = unread ? THEME.warn : THEME.textDim
      ctx.font = THEME.fontBody
      ctx.fillText(String(unread), cw - 34, 66)
      ctx.textAlign = 'left'

      let y = 120
      const rows = expanded ? list.slice(0, 6) : list.slice(0, 3)
      rows.forEach((n) => {
        api.addHit('openNotif', 28, y - 28, cw - 56, 40, { id: n.id })
        ctx.font = '26px system-ui, sans-serif'
        ctx.fillStyle = THEME.text
        ctx.fillText(n.icon + '  ' + n.text, 34, y)
        ctx.font = THEME.fontSmall
        ctx.fillStyle = n.read ? '#6b7686' : THEME.accent
        ctx.textAlign = 'right'
        ctx.fillText(n.ts || '', cw - 34, y)
        ctx.textAlign = 'left'
        y += 44
      })
    },
    onTap(region) {
      if (region.name === 'openNotif') {
        store.markNotificationRead(region.payload.id)
        return { event: 'notifOpened' }
      }
    },
  })
}

// 5. System Monitor ---------------------------------------------------------

export function makeSystemCard(store) {
  return new SpatialCard({
    id: 'system',
    title: 'SYSTEM',
    icon: '🖥',
    expandedRatio: 1.3,
    render(ctx, cw, ch, { expanded, state }) {
      const s = state.system || { services: {} }
      drawHeader(ctx, '🖥', 'SYSTEM', cw)
      let y = 120
      Object.entries(s.services).forEach(([name, status]) => {
        const online = status === 'Online'
        text(ctx, name, 34, y, THEME.text, THEME.fontSmall)
        ctx.textAlign = 'right'
        ctx.fillStyle = online ? THEME.good : THEME.bad
        ctx.font = '24px system-ui, sans-serif'
        ctx.fillText(online ? '🟢' : '🔴', cw - 34, y)
        ctx.textAlign = 'left'
        y += 38
      })
      y += 8
      const metric = (label, val, unit, color) => {
        text(ctx, label, 34, y, THEME.textDim, THEME.fontSmall)
        drawProgress(ctx, 190, y - 16, cw - 300, val / 100, color)
        ctx.textAlign = 'right'
        text(ctx, val + unit, cw - 34, y, THEME.text, THEME.fontSmall)
        ctx.textAlign = 'left'
        y += 40
      }
      metric('CPU', s.cpu, '%', THEME.accent2)
      metric('Memory', s.memory, '%', THEME.accent)
      metric('Network', s.networkMbps, 'MB/s', THEME.warn)
    },
  })
}

// 6. GitHub -----------------------------------------------------------------

export function makeGithubCard(store) {
  return new SpatialCard({
    id: 'github',
    title: 'GITHUB',
    icon: '🐙',
    render(ctx, cw, ch, { expanded, state }) {
      const g = state.github || {}
      drawHeader(ctx, '🐙', 'GITHUB', cw)
      let y = 130
      const row = (label, val) => {
        text(ctx, label, 34, y, THEME.textDim, THEME.fontSmall)
        ctx.textAlign = 'right'
        text(ctx, String(val), cw - 34, y, THEME.text, THEME.fontBody)
        ctx.textAlign = 'left'
        y += 42
      }
      row('Commits', g.commits ?? 0)
      row('PRs', g.prs ?? 0)
      row('Issues', g.issues ?? 0)
      if (expanded) {
        y += 8
        text(ctx, 'Last commit', 34, y, THEME.textDim, THEME.fontSmall)
        y += 36
        text(ctx, g.lastCommit || '—', 34, y, THEME.accent2, THEME.fontSmall)
      }
    },
  })
}

// 7. Focus / Pomodoro (central) ---------------------------------------------

export function makeFocusCard(store) {
  return new SpatialCard({
    id: 'focus',
    title: 'FOCUS',
    icon: '🎯',
    widthM: 0.14,
    render(ctx, cw, ch, { state }, api) {
      const f = state.focus || {}
      drawHeader(ctx, '🎯', 'FOCUS', cw)

      ctx.textAlign = 'center'
      ctx.fillStyle = f.done ? THEME.good : THEME.text
      ctx.font = THEME.fontBig
      ctx.fillText(fmtClock(f.remaining), cw / 2, 210)
      ctx.textAlign = 'left'

      const pct = f.total ? 1 - f.remaining / f.total : 0
      drawProgress(ctx, 34, 250, cw - 68, pct, THEME.accent)

      // Control button (Start/Pause/Resume/Reset)
      const label = f.done ? 'RESET' : f.running ? 'PAUSE' : f.remaining < f.total ? 'RESUME' : 'START'
      const bx = cw / 2 - 90
      const by = 300
      const bw = 180
      const bh = 60
      api.addHit('focusToggle', bx, by, bw, bh, {})
      roundRect(ctx, bx, by, bw, bh, 30)
      ctx.fillStyle = 'rgba(94,234,212,0.16)'
      ctx.fill()
      ctx.strokeStyle = THEME.accent
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = THEME.accent
      ctx.font = 'bold 30px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(label, cw / 2, by + 40)
      ctx.textAlign = 'left'

      // secondary reset region below
      api.addHit('focusReset', cw / 2 - 60, by + 76, 120, 40, {})
      ctx.fillStyle = THEME.textDim
      ctx.font = THEME.fontSmall
      ctx.textAlign = 'center'
      ctx.fillText('reset', cw / 2, by + 104)
      ctx.textAlign = 'left'
    },
    onTap(region) {
      const f = store.get().focus
      if (region.name === 'focusToggle') {
        if (f.done) {
          store.setFocus({ remaining: f.total, running: false, done: false })
          return { event: 'focusReset' }
        }
        const running = !f.running
        store.setFocus({ running })
        return { event: running ? 'focusStarted' : 'focusPaused' }
      }
      if (region.name === 'focusReset') {
        store.setFocus({ remaining: f.total, running: false, done: false })
        return { event: 'focusReset' }
      }
    },
  })
}
