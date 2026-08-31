import * as THREE from 'three'

/**
 * Creates a floating dashboard panel rendered from a 2D canvas onto a plane.
 * The panel billboards toward the camera and redraws when data changes.
 * Shows: greeting + clock/date, weather, calendar (meetings), tasks with
 * checkboxes, notifications, and multi-service system status.
 */
export function createDashboard() {
  const group = new THREE.Group()

  const canvas = document.createElement('canvas')
  canvas.width = 560
  canvas.height = 860
  const ctx = canvas.getContext('2d')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter

  // Panel plane keeps the canvas aspect ratio (~0.65 aspect), ~18cm wide.
  const w = 0.18
  const h = w * (canvas.height / canvas.width)
  const geo = new THREE.PlaneGeometry(w, h)
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  const panel = new THREE.Mesh(geo, mat)
  group.add(panel)

  let lastKey = ''
  const PAD = 32
  const RIGHT = canvas.width - PAD

  function draw(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Card background.
    roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 32)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, 'rgba(17,24,39,0.95)')
    grad.addColorStop(1, 'rgba(11,15,26,0.95)')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(56,189,248,0.55)'
    ctx.stroke()

    let y = 64
    ctx.textBaseline = 'alphabetic'

    // Header: greeting + name
    ctx.fillStyle = '#5eead4'
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.fillText('🤖 ' + (data.greeting || 'Hello'), PAD, y)
    y += 40
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 30px system-ui, sans-serif'
    ctx.fillText(data.name || '', PAD, y)

    // Clock + date (top-right)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 40px system-ui, sans-serif'
    ctx.fillText(data.time || '', RIGHT, 60)
    ctx.fillStyle = '#9fb3c8'
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillText(data.date || '', RIGHT, 92)
    ctx.textAlign = 'left'

    y += 24
    line(ctx, y)
    y += 44

    // Weather + Pomodoro row
    ctx.fillStyle = '#e6edf3'
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillText('🌤  ' + (data.weather || '—'), PAD, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#5eead4'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillText('⏱ ' + fmtTime(data.pomodoro), RIGHT, y)
    ctx.textAlign = 'left'
    y += 30
    line(ctx, y)
    y += 46

    // Calendar
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 30px system-ui, sans-serif'
    ctx.fillText('📅  Calendar', PAD, y)
    y += 42
    ctx.font = '25px system-ui, sans-serif'
    ;(data.meetings || []).slice(0, 4).forEach((m) => {
      ctx.fillStyle = '#38bdf8'
      ctx.fillText(m.time, PAD + 8, y)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(m.title, PAD + 150, y)
      y += 36
    })

    y += 6
    line(ctx, y)
    y += 46

    // Tasks with checkboxes
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 30px system-ui, sans-serif'
    ctx.fillText('✅  Tasks', PAD, y)
    y += 42
    ctx.font = '25px system-ui, sans-serif'
    ;(data.tasks || []).slice(0, 5).forEach((t) => {
      const box = t.done ? '☑' : '☐'
      ctx.fillStyle = t.done ? '#4ade80' : '#94a3b8'
      ctx.fillText(box, PAD + 8, y)
      ctx.fillStyle = t.done ? '#6b7280' : '#cbd5e1'
      if (t.done) {
        ctx.fillText(t.text, PAD + 48, y)
        // strike-through
        const width = ctx.measureText(t.text).width
        ctx.strokeStyle = '#6b7280'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(PAD + 48, y - 8)
        ctx.lineTo(PAD + 48 + width, y - 8)
        ctx.stroke()
      } else {
        ctx.fillText(t.text, PAD + 48, y)
      }
      y += 36
    })

    y += 6
    line(ctx, y)
    y += 46

    // Notifications + System status
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillText('🔔  Notifications: ' + (data.notifications ?? 0), PAD, y)
    y += 44
    ctx.fillText('💻  System', PAD, y)
    y += 40
    ctx.font = '24px system-ui, sans-serif'
    drawStatus(ctx, PAD + 8, y, 'Backend', data.backend)
    drawStatus(ctx, PAD + 200, y, 'Firebase', data.firebase)
    y += 36
    drawStatus(ctx, PAD + 8, y, 'GitHub', data.github)

    texture.needsUpdate = true
  }

  function drawStatus(ctx, x, y, label, value) {
    const online = value === 'Online'
    ctx.fillStyle = online ? '#4ade80' : '#f87171'
    ctx.fillText(online ? '🟢' : '🔴', x, y)
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText(label, x + 34, y)
  }

  function update(data, camera) {
    // Redraw only when something changed (cheap dirty check).
    const key = JSON.stringify(data)
    if (key !== lastKey) {
      lastKey = key
      draw(data)
    }
    // Billboard: face the camera on the horizontal plane.
    const camPos = new THREE.Vector3()
    camera.getWorldPosition(camPos)
    const panelPos = new THREE.Vector3()
    group.getWorldPosition(panelPos)
    camPos.y = panelPos.y
    group.lookAt(camPos)
  }

  return { group, update, draw }
}

function fmtTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function line(ctx, y) {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(32, y)
  ctx.lineTo(528, y)
  ctx.stroke()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
