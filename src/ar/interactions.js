import * as THREE from 'three'

/**
 * InteractionManager — raycasts controller "select" events against cards and
 * the robot, and routes taps to card hit-regions or expand/collapse.
 *
 * WebXR controllers give us a ray (position + direction). We intersect it with
 * card planes; the intersection UV tells us which canvas hit-region was tapped.
 *
 * Gestures supported here:
 *   - tap on a card hit-region  -> card.onTap(region)
 *   - tap on a card (no region) -> toggle expand
 *   - tap on the robot          -> toggle radial menu
 *   - tap elsewhere             -> close radial menu
 *
 * Drag is handled via selectstart/selectend + per-frame ray tracking.
 */
export class InteractionManager {
  constructor({ renderer, deskSpace, robotRoot, onRobotTap, onCardEvent }) {
    this.renderer = renderer
    this.deskSpace = deskSpace
    this.robotRoot = robotRoot
    this.onRobotTap = onRobotTap
    this.onCardEvent = onCardEvent

    this.raycaster = new THREE.Raycaster()
    this.tmpMatrix = new THREE.Matrix4()

    this.dragging = null // { card, startTime }
    this.pressStart = 0

    this.controller = renderer.xr.getController(0)
    this.controller.addEventListener('selectstart', () => this._onStart())
    this.controller.addEventListener('selectend', () => this._onEnd())
  }

  get object3d() {
    return this.controller
  }

  _ray() {
    this.tmpMatrix.identity().extractRotation(this.controller.matrixWorld)
    const origin = new THREE.Vector3().setFromMatrixPosition(
      this.controller.matrixWorld
    )
    const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(this.tmpMatrix)
    this.raycaster.set(origin, dir)
    return this.raycaster
  }

  _cardMeshes() {
    const meshes = []
    this.deskSpace.forEachCard((c) => {
      if (c.visible) meshes.push(c.mesh)
    })
    return meshes
  }

  _onStart() {
    this.pressStart = performance.now()
    const ray = this._ray()

    // Robot first (radial menu trigger).
    if (this.robotRoot) {
      const hitRobot = ray.intersectObject(this.robotRoot, true)
      if (hitRobot.length > 0) {
        this._pendingRobot = true
        return
      }
    }
    this._pendingRobot = false

    const hits = ray.intersectObjects(this._cardMeshes(), false)
    if (hits.length > 0) {
      const hit = hits[0]
      const card = hit.object.userData.card
      // Begin potential drag on this card.
      this.dragging = { card, moved: false, offset: hit.point.clone() }
      this._activeHitUV = hit.uv
    } else {
      this.dragging = null
      this._activeHitUV = null
      this._tappedEmpty = true
    }
  }

  _onEnd() {
    const heldMs = performance.now() - this.pressStart

    if (this._pendingRobot) {
      this._pendingRobot = false
      this.onRobotTap?.()
      return
    }

    if (this.dragging) {
      const { card, moved } = this.dragging
      if (!moved) {
        // It was a tap, not a drag.
        const uv = this._activeHitUV
        if (uv) {
          const region = card.hitTest(uv.x, 1 - uv.y)
          if (region && card.onTapRegion) {
            const result = card.onTapRegion(region)
            card.markDirty()
            if (result) this.onCardEvent?.(result, card)
          } else {
            card.toggleExpand()
          }
        }
      }
      this.dragging = null
      return
    }

    if (this._tappedEmpty) {
      this._tappedEmpty = false
      this.onCardEvent?.({ event: 'tapEmpty' }, null)
    }
  }

  // Called each frame to progress a drag.
  update() {
    if (!this.dragging) return
    const ray = this._ray()
    const hits = ray.intersectObject(this.dragging.card.mesh, false)
    if (hits.length === 0) return
    const p = hits[0].point
    // Move card base position in anchor space, clamped to workspace.
    const local = this.deskSpace.anchor.worldToLocal(p.clone())
    const [cx, cz] = this.deskSpace.clampToWorkspace(local.x, local.z)
    const moveDist = Math.hypot(
      cx - this.dragging.card.basePos.x,
      cz - this.dragging.card.basePos.z
    )
    if (moveDist > 0.01) this.dragging.moved = true
    this.dragging.card.basePos.x = cx
    this.dragging.card.basePos.z = cz
  }
}
