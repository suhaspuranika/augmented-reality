import * as THREE from 'three'
import { THEME } from './theme.js'

/**
 * DeskSpace — the spatial workspace anchored to a detected surface.
 *
 * Holds the desk anchor (a Group placed at the reticle), a configurable
 * workspace rectangle with a subtle boundary, the robot, and all cards.
 * Everything is added as children of the anchor so it stays put relative to
 * the physical desk. Card layout is defined in anchor-local coordinates.
 *
 * NOTE ON "DETECTION": WebXR hit-test gives us trackable horizontal surfaces.
 * It does NOT know the exact physical desk edges. The workspace rectangle is a
 * practical, configurable approximation — not true boundary detection.
 */
export class DeskSpace {
  constructor({ width = 0.9, depth = 0.6 } = {}) {
    this.width = width // meters (X)
    this.depth = depth // meters (Z)
    this.anchor = new THREE.Group()
    this.anchor.visible = false

    this.cardHeight = 0.16 // cards float this high above the surface
    this.cards = new Map()

    this._buildBoundary()
  }

  _buildBoundary() {
    // Subtle rounded rectangle outline on the surface.
    const hw = this.width / 2
    const hd = this.depth / 2
    const pts = [
      new THREE.Vector3(-hw, 0.001, -hd),
      new THREE.Vector3(hw, 0.001, -hd),
      new THREE.Vector3(hw, 0.001, hd),
      new THREE.Vector3(-hw, 0.001, hd),
      new THREE.Vector3(-hw, 0.001, -hd),
    ]
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(THEME.accent),
      transparent: true,
      opacity: 0.25,
    })
    this.boundary = new THREE.Line(geo, mat)
    this.anchor.add(this.boundary)
  }

  place(matrix) {
    this.anchor.matrixAutoUpdate = false
    this.anchor.matrix.copy(matrix)
    this.anchor.visible = true
  }

  addRobot(robot) {
    this.robot = robot
    // Robot sits at center-front of the workspace.
    robot.position.set(0, 0, this.depth * 0.05)
    this.anchor.add(robot)
  }

  /**
   * Default spatial layout around the robot. Coordinates in anchor space
   * (meters). Cards float at cardHeight above the surface.
   *
   *   weather   calendar   notifications
   *              robot
   *   tasks     focus      github/system
   */
  layout() {
    const y = this.cardHeight
    const xL = -this.width * 0.34
    const xC = 0
    const xR = this.width * 0.34
    const zBack = -this.depth * 0.28
    const zMid = this.depth * 0.02
    const zFront = this.depth * 0.32

    const positions = {
      // The operable computer screen floats front-center, large and prominent.
      screen: [xC, y + 0.24, zBack - 0.04],
      weather: [xL - 0.04, y + 0.16, zBack],
      calendar: [xL - 0.02, y - 0.02, zFront],
      notifications: [xR + 0.04, y + 0.16, zBack],
      tasks: [xL - 0.06, y + 0.02, zMid],
      focus: [xC, y - 0.02, zFront + 0.02],
      system: [xR + 0.06, y + 0.02, zMid],
      github: [xR + 0.04, y - 0.02, zFront],
    }

    for (const [id, pos] of Object.entries(positions)) {
      const card = this.cards.get(id)
      if (card) card.setBasePosition(pos[0], pos[1], pos[2])
    }
  }

  addCard(card) {
    this.cards.set(card.id, card)
    this.anchor.add(card.group)
  }

  getCard(id) {
    return this.cards.get(id)
  }

  forEachCard(fn) {
    this.cards.forEach(fn)
  }

  // Clamp an anchor-local position to stay inside the workspace rectangle.
  clampToWorkspace(x, z) {
    const hw = this.width / 2 - 0.06
    const hd = this.depth / 2 - 0.06
    return [
      Math.max(-hw, Math.min(hw, x)),
      Math.max(-hd, Math.min(hd, z)),
    ]
  }

  setBoundaryVisible(v) {
    this.boundary.visible = v
  }

  dispose() {
    this.boundary.geometry.dispose()
    this.boundary.material.dispose()
    this.cards.forEach((c) => c.dispose())
  }
}
