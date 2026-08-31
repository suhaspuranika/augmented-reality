import * as THREE from 'three'
import { THEME, roundRect } from './theme.js'
import { ALL_APPS } from './screenApps.js'
import { icon as drawIcon } from './icons.js'

/**
 * ScreenWindow — an operable AR "computer screen".
 *
 * A high-res canvas textured onto a 3D plane, styled like a floating monitor
 * with a top bar, an app launcher (dock), a live window area, and an on-screen
 * keyboard. It is fully interactive: taps hit regions (raycast UV -> canvas),
 * apps handle their own clicks, and typing goes through the keyboard.
 *
 * Reuses the same hit-region + billboard approach as SpatialCard so it slots
 * into the existing interaction/raycast pipeline.
 */
export class ScreenWindow {
  constructor(store) {
    this.store = store
    this.id = 'screen'
    this.visible = true
    this.dirty = true
    this.expanded = true
    this.hitRegions = []

    // 16:10 screen, high resolution for crisp UI/text.
    this.cw = 1024
    this.ch = 640
    this.widthM = 0.34 // ~34cm virtual monitor

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.cw
    this.canvas.height = this.ch
    this.ctx = this.canvas.getContext('2d')

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.minFilter = THREE.LinearMipmapLinearFilter
    this.texture.generateMipmaps = true
    this.texture.anisotropy = 8

    this.group = new THREE.Group()
    this.group.name = 'screen'
    const geo = new THREE.PlaneGeometry(1, 1)
    this.mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.userData.card = this // so InteractionManager treats it like a card
    this.group.add(this.mesh)

    this.basePos = new THREE.Vector3()
    this.floatPhase = Math.random() * Math.PI * 2
    this.appear = 0

    // Operable OS state (kept on the store under `screen`).
    if (!store.get().screen) {
      store.update('screen', {
        activeApp: null, // null = home/launcher
        focusField: null,
        notes: '',
        calcDisplay: '0',
        calcPrev: null,
        calcOp: null,
        termLines: ['AR-OS terminal. Type "help".'],
        termInput: '',
        mediaPlaying: false,
        mediaProgress: 0.2,
        mediaTrack: 'Focus Beats — Lo-Fi',
        keyboardVisible: false,
      })
    }
    this.apps = ALL_APPS
  }

  setBasePosition(x, y, z) {
    this.basePos.set(x, y, z)
    this.group.position.set(x, y, z)
  }

  show() { this.visible = true; this.group.visible = true; this.markDirty() }
  hide() { this.visible = false; this.group.visible = false }
  markDirty() { this.dirty = true }

  // --- App state actions -----------------------------------------------------
  get s() { return this.store.get().screen }
  patch(p) { this.store.update('screen', { ...this.s, ...p }); this.markDirty() }

  openApp(id) { this.patch({ activeApp: id, focusField: null, keyboardVisible: false }) }
  goHome() { this.patch({ activeApp: null, focusField: null, keyboardVisible: false }) }
  setFocusField(f) { this.patch({ focusField: f, keyboardVisible: true }) }

  typeChar(ch) {
    const f = this.s.focusField
    if (f === 'notes') this.patch({ notes: (this.s.notes || '') + ch })
    else if (f === 'term') this.patch({ termInput: (this.s.termInput || '') + ch })
  }
  backspace() {
    const f = this.s.focusField
    if (f === 'notes') this.patch({ notes: (this.s.notes || '').slice(0, -1) })
    else if (f === 'term') this.patch({ termInput: (this.s.termInput || '').slice(0, -1) })
  }
  enter() {
    const f = this.s.focusField
    if (f === 'notes') this.patch({ notes: (this.s.notes || '') + '\n' })
    else if (f === 'term') this.runTerm()
  }
  runTerm() {
    const cmd = (this.s.termInput || '').trim()
    const lines = [...this.s.termLines, '$ ' + cmd]
    const out = this.termEval(cmd)
    if (out) lines.push(out)
    this.patch({ termLines: lines.slice(-20), termInput: '' })
  }
  termEval(cmd) {
    if (cmd === 'help') return 'commands: help, date, tasks, clear, whoami'
    if (cmd === 'date') return new Date().toString()
    if (cmd === 'whoami') return this.store.get().profile.name
    if (cmd === 'tasks') {
      const t = this.store.get().tasks
      return t.map((x) => (x.done ? '[x] ' : '[ ] ') + x.text).join('   ')
    }
    if (cmd === 'clear') { setTimeout(() => this.patch({ termLines: [] }), 0); return '' }
    if (cmd === '') return ''
    return 'command not found: ' + cmd
  }

  calcInput(k) {
    const s = this.s
    if (k === 'C') return this.patch({ calcDisplay: '0', calcPrev: null, calcOp: null })
    if ('+-*/'.includes(k)) {
      return this.patch({ calcPrev: parseFloat(s.calcDisplay), calcOp: k, calcDisplay: '0' })
    }
    if (k === '=') {
      if (s.calcOp == null || s.calcPrev == null) return
      const a = s.calcPrev
      const b = parseFloat(s.calcDisplay)
      let r = 0
      if (s.calcOp === '+') r = a + b
      if (s.calcOp === '-') r = a - b
      if (s.calcOp === '*') r = a * b
      if (s.calcOp === '/') r = b === 0 ? NaN : a / b
      return this.patch({ calcDisplay: String(+r.toFixed(6)), calcPrev: null, calcOp: null })
    }
    // digit or dot
    const cur = s.calcDisplay === '0' && k !== '.' ? '' : s.calcDisplay
    this.patch({ calcDisplay: cur + k })
  }

  toggleMedia() { this.patch({ mediaPlaying: !this.s.mediaPlaying }) }

  // --- Drawing ---------------------------------------------------------------
  redraw() {
    const ctx = this.ctx
    const { cw, ch } = this
    ctx.clearRect(0, 0, cw, ch)

    // Bezel + screen
    roundRect(ctx, 4, 4, cw - 8, ch - 8, 26)
    ctx.fillStyle = 'rgba(8,11,18,0.96)'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = THEME.strokeGlow
    ctx.stroke()

    this.hitRegions = []
    const api = {
      addHit: (name, x, y, w, h, payload) =>
        this.hitRegions.push({ name, x, y, w, h, payload }),
      keyboard: (vp) => this.s.keyboardVisible && this._drawKeyboard(vp),
    }

    this._drawTopBar(ctx, api)

    const vp = { x: 24, y: 64, w: cw - 48, h: ch - 64 - 56 } // window area
    const active = this.apps.find((a) => a.id === this.s.activeApp)
    if (active) {
      active.draw(ctx, vp, { screen: this.s, store: this.store.get() }, api)
    } else {
      this._drawLauncher(ctx, vp, api)
    }

    this._drawDock(ctx, api)
    this.texture.needsUpdate = true
    this.dirty = false
  }

  _drawTopBar(ctx, api) {
    const cw = this.cw
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, 4, 4, cw - 8, 52, 26)
    ctx.fill()
    // traffic lights
    const dots = [THEME.bad, THEME.warn, THEME.good]
    dots.forEach((c, i) => {
      ctx.beginPath()
      ctx.arc(34 + i * 26, 30, 8, 0, Math.PI * 2)
      ctx.fillStyle = c
      ctx.fill()
    })
    // close = red dot
    api.addHit('winClose', 22, 16, 28, 28)
    // title
    const active = this.apps.find((a) => a.id === this.s.activeApp)
    ctx.fillStyle = THEME.text
    ctx.font = 'bold 24px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(active ? active.title : 'AR-OS  ·  Home', cw / 2, 38)
    // clock
    ctx.textAlign = 'right'
    ctx.fillStyle = THEME.textDim
    ctx.font = '22px system-ui'
    ctx.fillText(this.store.get().clock.time || '', cw - 28, 36)
    ctx.textAlign = 'left'
    // home button (if in app) — drawn house glyph
    if (active) {
      api.addHit('goHome', cw - 124, 10, 44, 40)
      const hx = cw - 102
      const hy = 30
      ctx.strokeStyle = THEME.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(hx - 12, hy + 2)
      ctx.lineTo(hx, hy - 12)
      ctx.lineTo(hx + 12, hy + 2)
      ctx.stroke()
      ctx.strokeRect(hx - 9, hy + 2, 18, 12)
    }
  }

  _drawLauncher(ctx, vp, api) {
    ctx.fillStyle = THEME.textDim
    ctx.font = '24px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('Apps', vp.x + 12, vp.y + 40)
    const cols = 4
    const iconW = 150
    const gap = (vp.w - cols * iconW) / (cols + 1)
    this.apps.forEach((app, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = vp.x + gap + col * (iconW + gap)
      const y = vp.y + 70 + row * 150
      roundRect(ctx, x, y, iconW, 120, 22)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fill()
      ctx.strokeStyle = THEME.stroke
      ctx.lineWidth = 1
      ctx.stroke()
      drawIcon(ctx, app.icon, x + iconW / 2, y + 46, 44, THEME.accent)
      ctx.font = '22px system-ui'
      ctx.fillStyle = THEME.text
      ctx.textAlign = 'center'
      ctx.fillText(app.title, x + iconW / 2, y + 100)
      ctx.textAlign = 'left'
      api.addHit('openApp', x, y, iconW, 120, { id: app.id })
    })
  }

  _drawDock(ctx, api) {
    const cw = this.cw
    const ch = this.ch
    const dockY = ch - 50
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    roundRect(ctx, 4, dockY - 2, cw - 8, 48, 22)
    ctx.fill()
    const n = this.apps.length
    const spacing = 74
    let x = cw / 2 - ((n - 1) * spacing) / 2
    this.apps.forEach((app) => {
      const activeApp = app.id === this.s.activeApp
      drawIcon(ctx, app.icon, x, dockY + 22, 28, activeApp ? THEME.accent : THEME.textDim)
      api.addHit('openApp', x - 30, dockY - 2, 60, 46, { id: app.id })
      if (activeApp) {
        ctx.beginPath()
        ctx.arc(x, dockY + 42, 3, 0, Math.PI * 2)
        ctx.fillStyle = THEME.accent
        ctx.fill()
      }
      x += spacing
    })
    ctx.textAlign = 'left'
  }

  _drawKeyboard(vp) {
    const ctx = this.ctx
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
    const kbY = this.ch - 50 - 210
    const kw = 74
    const kh = 56
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    roundRect(ctx, vp.x, kbY - 10, vp.w, 210, 16)
    ctx.fill()
    rows.forEach((row, r) => {
      const total = row.length * (kw + 8)
      let x = vp.x + (vp.w - total) / 2
      const y = kbY + r * (kh + 8)
      for (const ch of row) {
        roundRect(ctx, x, y, kw, kh, 10)
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fill()
        ctx.fillStyle = THEME.text
        ctx.font = 'bold 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(ch, x + kw / 2, y + 37)
        ctx.textAlign = 'left'
        this.hitRegions.push({ name: 'key', x, y, w: kw, h: kh, payload: { ch } })
        x += kw + 8
      }
    })
    // bottom row: space, backspace, enter
    const by = kbY + 3 * (kh + 8)
    const mk = (label, name, x, w) => {
      roundRect(ctx, x, by, w, kh, 10)
      ctx.fillStyle = 'rgba(94,234,212,0.14)'
      ctx.fill()
      ctx.strokeStyle = THEME.accent
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = THEME.accent
      ctx.font = 'bold 22px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(label, x + w / 2, by + 36)
      ctx.textAlign = 'left'
      this.hitRegions.push({ name, x, y: by, w, h: kh })
    }
    const cx = vp.x + vp.w / 2
    mk('delete', 'kbBack', cx - 330, 140)
    mk('space', 'kbSpace', cx - 170, 340)
    mk('enter', 'kbEnter', cx + 190, 140)
  }

  // Route a canvas-space tap (u,v in 0..1, v from top).
  hitTest(u, v) {
    const px = u * this.cw
    const py = v * this.ch
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const r = this.hitRegions[i]
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r
    }
    return null
  }

  // Called by InteractionManager when a region is tapped.
  get onTapRegion() {
    return (region) => this._handleTap(region)
  }
  _handleTap(region) {
    switch (region.name) {
      case 'winClose': this.hide(); return { event: 'screenClosed' }
      case 'goHome': this.goHome(); return
      case 'openApp': this.openApp(region.payload.id); return
      case 'key': this.typeChar(region.payload.ch); return
      case 'kbSpace': this.typeChar(' '); return
      case 'kbBack': this.backspace(); return
      case 'kbEnter': this.enter(); return
      default: {
        const active = this.apps.find((a) => a.id === this.s.activeApp)
        if (active?.onTap) active.onTap(region, this)
        return
      }
    }
  }
  toggleExpand() { /* screen has no collapsed state; tap empty area = no-op */ }

  update(dt, _state, camera) {
    if (!this.visible) return
    // media progress advances while playing
    if (this.s.mediaPlaying) {
      const p = (this.s.mediaProgress + dt * 0.02) % 1
      this.patch({ mediaProgress: p })
    }
    if (this.dirty) this.redraw()

    if (this.appear < 1) this.appear = Math.min(1, this.appear + dt * 2)
    const ease = 1 - Math.pow(1 - this.appear, 3)
    this.mat.opacity = ease

    this.floatPhase += dt
    const floatY = Math.sin(this.floatPhase * 0.6) * 0.005
    this.group.position.set(this.basePos.x, this.basePos.y + floatY, this.basePos.z)

    const wM = this.widthM * (0.9 + 0.1 * ease)
    const hM = wM * (this.ch / this.cw)
    this.mesh.scale.set(wM, hM, 1)

    if (camera) {
      const cp = new THREE.Vector3()
      camera.getWorldPosition(cp)
      const sp = new THREE.Vector3()
      this.group.getWorldPosition(sp)
      cp.y = sp.y
      this.group.lookAt(cp)
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mat.dispose()
    this.texture.dispose()
  }
}
