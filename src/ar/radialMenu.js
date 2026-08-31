import * as THREE from 'three'
import { THEME } from './theme.js'

/**
 * RadialMenu — appears around the robot when tapped. Each item is a small
 * textured disc that animates outward. Tapping an item shows/focuses a card.
 * Tapping outside closes it (handled by InteractionManager -> tapEmpty).
 */
export class RadialMenu {
  constructor(onSelect) {
    this.onSelect = onSelect
    this.group = new THREE.Group()
    this.group.visible = false
    this.open = false
    this.anim = 0

    this.items = [
      { id: 'calendar', icon: '📅' },
      { id: 'system', icon: '📊' },
      { id: 'notifications', icon: '🔔' },
      { id: 'focus', icon: '🎯' },
      { id: 'tasks', icon: '✅' },
      { id: 'github', icon: '🐙' },
    ]

    this.radius = 0.11
    this._build()
  }

  _iconTexture(icon) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    ctx.beginPath()
    ctx.arc(64, 64, 58, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(20,26,38,0.9)'
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = THEME.strokeGlow
    ctx.stroke()
    ctx.font = '64px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, 64, 70)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  _build() {
    this.meshes = []
    const n = this.items.length
    this.items.forEach((item, i) => {
      const geo = new THREE.PlaneGeometry(0.05, 0.05)
      const mat = new THREE.MeshBasicMaterial({
        map: this._iconTexture(item.icon),
        transparent: true,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData.menuItem = item.id
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2
      mesh.userData.dir = new THREE.Vector2(Math.cos(ang), Math.sin(ang))
      this.group.add(mesh)
      this.meshes.push(mesh)
    })
  }

  toggle() {
    this.open = !this.open
    if (this.open) this.group.visible = true
  }

  close() {
    this.open = false
  }

  meshList() {
    return this.open ? this.meshes : []
  }

  update(dt, camera) {
    const target = this.open ? 1 : 0
    this.anim += (target - this.anim) * Math.min(1, dt * 8)
    if (this.anim < 0.01 && !this.open) {
      this.group.visible = false
      return
    }
    const ease = 1 - Math.pow(1 - this.anim, 3)
    this.meshes.forEach((m) => {
      const d = m.userData.dir
      m.position.set(d.x * this.radius * ease, 0.14, d.y * this.radius * ease)
      m.material.opacity = ease
      m.scale.setScalar(0.6 + 0.4 * ease)
      if (camera) {
        const cp = new THREE.Vector3()
        camera.getWorldPosition(cp)
        const sp = new THREE.Vector3()
        m.getWorldPosition(sp)
        cp.y = sp.y
        m.lookAt(cp)
      }
    })
  }

  dispose() {
    this.meshes.forEach((m) => {
      m.geometry.dispose()
      m.material.map?.dispose()
      m.material.dispose()
    })
  }
}
