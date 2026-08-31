import * as THREE from 'three'

/**
 * Creates a floating dashboard panel rendered from a 2D canvas onto a plane.
 * The panel billboards toward the camera and redraws when data changes.
 */
export function createDashboard() {
  const group = new THREE.Group()

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640
  const ctx = canvas.getContext('2d')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter

  // Panel plane ~16cm x 20cm.
  const geo = new THREE.PlaneGeometry(0.16, 0.2)
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  })
  const panel = new THREE.Mesh(geo, mat)
  group.add(panel)

  let lastKey = ''

  function draw(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Card background with rounded corners.
    roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 28)
    ctx.fillStyle = 'rgba(15,21,34,0.92)'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(56,189,248,0.6)'
    ctx.stroke()

    let y = 70
    ctx.textBaseline = 'alphabetic'

    // Greeting
    ctx.fillStyle = '#5eead4'
    ctx.font = 'bold 34px system-ui, sans-serif'
    ctx.fillText('🤖 ' + (data.greeting || 'Hello'), 36, y)
    y += 20

    line(ctx, y)
    y += 44

    // Pomodoro
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 30px system-ui, sans-serif'
    ctx.fillText('⏱  Pomodoro   ' + fmtTime(data.pomodoro), 36, y)
    y += 46

    // Next meeting
    ctx.fillStyle = '#9fb3c8'
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillText('📅  Next meeting: ' + (data.nextMeeting || '—'), 36, y)
    y += 44

    // Notifications
    ctx.fillText('🔔  Notifications: ' + (data.notifications ?? 0), 36, y)
    y += 30

    line(ctx, y)
    y += 42

    // Tasks
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillText('✅  Tasks', 36, y)
    y += 40
    ctx.font = '24px system-ui, sans-serif'
    ctx.fillStyle = '#9fb3c8'
    ;(data.tasks || []).slice(0, 4).forEach((task) => {
      ctx.fillText('•  ' + task, 48, y)
      y += 36
    })

    y += 8
    line(ctx, y)
    y += 42

    // System status
    ctx.fillStyle = '#e6edf3'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillText('💻  System', 36, y)
    y += 40
    const online = data.backend === 'Online'
    ctx.fillStyle = online ? '#4ade80' : '#f87171'
    ctx.font = '24px system-ui, sans-serif'
    ctx.fillText(
      (online ? '🟢' : '🔴') + '  Backend: ' + (data.backend || 'Unknown'),
      48,
      y
    )

    texture.needsUpdate = true
  }

  function update(data, camera, companion) {
    // Redraw only when something meaningful changed (cheap dirty check).
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
  ctx.moveTo(36, y)
  ctx.lineTo(476, y)
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
