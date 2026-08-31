import * as THREE from 'three'

/**
 * Builds a small friendly desk robot from Three.js primitives.
 * Roughly 15cm tall in AR world units.
 *
 * Animation states (Phase 3): idle, thinking, happy, alert, celebrate,
 * sleep, listening. Set via robot.userData.setState(name).
 * The per-frame animation is exposed via robot.userData.update(dt), preserving
 * the original API used by arScene.js.
 */
export function createRobot() {
  const robot = new THREE.Group()

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8fd3ff,
    metalness: 0.4,
    roughness: 0.35,
  })
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.6,
    roughness: 0.25,
  })
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f1a,
    emissive: 0x5eead4,
    emissiveIntensity: 0.8,
  })

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.02, 24),
    accentMat
  )
  base.position.y = 0.01
  robot.add(base)

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.045, 0.06, 8, 16),
    bodyMat
  )
  body.position.y = 0.075
  robot.add(body)

  const head = new THREE.Group()
  head.position.y = 0.15
  robot.add(head)

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 24, 24),
    bodyMat
  )
  head.add(headMesh)

  const eyeGeo = new THREE.SphereGeometry(0.008, 16, 16)
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.015, 0.005, 0.036)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.015, 0.005, 0.036)
  head.add(eyeL, eyeR)

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.002, 0.002, 0.03, 8),
    accentMat
  )
  antenna.position.y = 0.055
  head.add(antenna)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 12), eyeMat.clone())
  bulb.position.y = 0.072
  head.add(bulb)

  const armGeo = new THREE.CapsuleGeometry(0.008, 0.03, 6, 10)
  const armL = new THREE.Mesh(armGeo, accentMat)
  armL.position.set(-0.05, 0.08, 0)
  armL.rotation.z = Math.PI / 6
  const armR = new THREE.Mesh(armGeo, accentMat)
  armR.position.set(0.05, 0.08, 0)
  armR.rotation.z = -Math.PI / 6
  robot.add(armL, armR)

  attachBehavior(robot, { head, bulb, eyeL, eyeR, armL, armR, eyeMat })
  return robot
}

/**
 * Attaches state-machine behavior to any robot root (procedural or glTF).
 * For glTF we only get bob/spin; the rich part targets the procedural rig.
 */
export function attachBehavior(robot, parts = {}) {
  let t = 0
  let state = 'idle'
  let stateTime = 0
  const baseEmissive = 0.7

  const setColor = (hex) => {
    if (parts.bulb) parts.bulb.material.emissive.setHex(hex)
    if (parts.eyeMat) parts.eyeMat.emissive.setHex(hex)
  }

  robot.userData.setState = (name) => {
    if (name === state) return
    state = name
    stateTime = 0
    // Eye/antenna color per mood.
    if (name === 'alert') setColor(0xf87171)
    else if (name === 'happy' || name === 'celebrate') setColor(0x4ade80)
    else if (name === 'thinking' || name === 'listening') setColor(0x7dd3fc)
    else setColor(0x5eead4)
  }
  robot.userData.getState = () => state

  robot.userData.update = (dt) => {
    t += dt
    stateTime += dt
    const { head, bulb, armL, armR } = parts

    // Base idle for every state.
    robot.position.y = Math.sin(t * 2) * 0.006
    if (head) {
      head.rotation.y = Math.sin(t * 0.8) * 0.2
      head.position.y = 0.15 + Math.sin(t * 2) * 0.003
      head.rotation.x = 0
    }
    if (bulb) bulb.material.emissiveIntensity = baseEmissive + Math.sin(t * 4) * 0.3

    switch (state) {
      case 'thinking':
        if (head) head.rotation.z = Math.sin(t * 3) * 0.12
        break
      case 'listening':
        if (head) head.rotation.x = -0.15
        if (bulb) bulb.material.emissiveIntensity = 0.6 + Math.sin(t * 10) * 0.4
        break
      case 'happy':
        robot.position.y = Math.abs(Math.sin(t * 6)) * 0.02
        if (armL) armL.rotation.z = Math.PI / 6 + Math.sin(t * 8) * 0.3
        if (armR) armR.rotation.z = -Math.PI / 6 - Math.sin(t * 8) * 0.3
        if (stateTime > 2) robot.userData.setState('idle')
        break
      case 'celebrate':
        robot.position.y = Math.abs(Math.sin(t * 8)) * 0.03
        robot.rotation.y += dt * 2
        if (armL) armL.rotation.z = Math.PI / 3 + Math.sin(t * 12) * 0.4
        if (armR) armR.rotation.z = -Math.PI / 3 - Math.sin(t * 12) * 0.4
        if (stateTime > 3) {
          robot.rotation.y = 0
          robot.userData.setState('idle')
        }
        break
      case 'alert':
        if (head) head.rotation.z = Math.sin(t * 14) * 0.1
        if (bulb) bulb.material.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 8)) * 0.9
        break
      case 'sleep':
        robot.position.y = Math.sin(t * 1) * 0.003
        if (head) head.rotation.x = 0.3
        if (bulb) bulb.material.emissiveIntensity = 0.1 + Math.sin(t * 1.2) * 0.08
        break
      default: // idle
        if (head) head.rotation.z = 0
        if (armL) armL.rotation.z = Math.PI / 6
        if (armR) armR.rotation.z = -Math.PI / 6
    }
  }
}
