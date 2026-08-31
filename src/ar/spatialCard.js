import * as THREE from 'three'
import { drawGlassCard } from './theme.js'

/**
 * SpatialCard — a reusable AR widget.
 *
 * A card is a Three.js Group holding a plane textured from a 2D canvas.
 * It supports collapsed/expanded states, appear/hide animations, billboarding,
 * subtle float, and canvas-space "hit regions" for tap interaction.
 *
 * Options:
 *   id, title, icon
 *   widthM            physical width in meters (default 0.13)
 *   collapsedRatio    canvas height/width ratio when collapsed
 *   expandedRatio     canvas height/width ratio when expanded
 *   render(ctx, cw, ch, state, api)  draws the card; returns hit regions via api
 *   onTap(region)     called when a hit region is tapped
 *
 * The card only redraws when marked dirty (dirty-state optimization).
 */
export class SpatialCard {
  constructor(opts) {
    this.id = opts.id
    this.title = opts.title
    this.icon = opts.icon
    this.renderFn = opts.render
    this.onTapRegion = opts.onTap
    this.widthM = opts.widthM ?? 0.13
    this.collapsedRatio = opts.collapsedRatio ?? 0.75
    this.expandedRatio = opts.expandedRatio ?? 1.15

    this.expanded = false
    this.visible = true
    this.dirty = true
    this.hitRegions = []

    // Canvas: use expanded resolution so text stays crisp when expanded.
    this.cw = 420
    this.ch = Math.round(this.cw * this.expandedRatio)
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.cw
    this.canvas.height = this.ch
    this.ctx = this.canvas.getContext('2d')

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.minFilter = THREE.LinearFilter
    this.texture.anisotropy = 4

    this.group = new THREE.Group()
    this.group.name = 'card:' + this.id

    const geo = new THREE.PlaneGeometry(1, 1) // scaled per-frame
    this.mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.userData.card = this
    this.group.add(this.mesh)

    // Animation state
    this.appear = 0 // 0..1 grows on show
    this.floatPhase = Math.random() * Math.PI * 2
    this.basePos = new THREE.Vector3()
    this.targetScale = 1
    this.currentScale = 0.8
  }

  setBasePosition(x, y, z) {
    this.basePos.set(x, y, z)
    this.group.position.set(x, y, z)
  }

  markDirty() {
    this.dirty = true
  }

  show() {
    this.visible = true
    this.group.visible = true
    this.markDirty()
  }

  hide() {
    this.visible = false
    this.appear = 0
    this.group.visible = false
  }

  toggleExpand() {
    this.expanded = !this.expanded
    this.markDirty()
  }

  // Convert a canvas-space y into current ratio; used by render for layout.
  ratio() {
    return this.expanded ? this.expandedRatio : this.collapsedRatio
  }

  redraw(state) {
    const cw = this.cw
    const ch = Math.round(cw * this.ratio())
    if (this.canvas.height !== ch) {
      this.canvas.height = ch
    }
    drawGlassCard(this.ctx, cw, this.canvas.height)
    this.hitRegions = []
    const api = {
      addHit: (name, x, y, w, h, payload) =>
        this.hitRegions.push({ name, x, y, w, h, payload }),
    }
    this.renderFn(this.ctx, cw, this.canvas.height, {
      expanded: this.expanded,
      state,
    }, api)
    this.texture.needsUpdate = true
    this.dirty = false
  }

  /**
   * Hit test in the card's local plane. u,v are 0..1 across the plane
   * (0,0 = top-left). Returns the matching region name or null.
   */
  hitTest(u, v) {
    const px = u * this.cw
    const py = v * this.canvas.height
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const r = this.hitRegions[i]
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return r
      }
    }
    return null
  }

  update(dt, state, camera) {
    if (!this.visible) return
    if (this.dirty) this.redraw(state)

    // Appear animation: fade + scale from 0.8 -> 1, slight rise.
    if (this.appear < 1) {
      this.appear = Math.min(1, this.appear + dt * 2.2)
    }
    const ease = 1 - Math.pow(1 - this.appear, 3)
    this.currentScale = 0.8 + 0.2 * ease
    this.mat.opacity = ease

    // Subtle float.
    this.floatPhase += dt
    const floatY = Math.sin(this.floatPhase * 0.8) * 0.004
    const rise = (1 - ease) * 0.03 // rises up as it appears

    this.group.position.set(
      this.basePos.x,
      this.basePos.y + floatY - rise,
      this.basePos.z
    )

    // Size the plane in meters based on current ratio + appear scale.
    const wM = this.widthM * this.currentScale
    const hM = wM * this.ratio()
    this.mesh.scale.set(wM, hM, 1)

    // Billboard horizontally toward the camera.
    if (camera) {
      const camPos = new THREE.Vector3()
      camera.getWorldPosition(camPos)
      const selfPos = new THREE.Vector3()
      this.group.getWorldPosition(selfPos)
      camPos.y = selfPos.y
      this.group.lookAt(camPos)
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mat.dispose()
    this.texture.dispose()
  }
}
