import * as THREE from 'three'

/**
 * Builds a small friendly desk robot from Three.js primitives.
 * Roughly 15cm tall in AR world units. Includes an idle bob + head sway
 * exposed via userData.update(dt).
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

  // Base / feet
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.02, 24),
    accentMat
  )
  base.position.y = 0.01
  robot.add(base)

  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.045, 0.06, 8, 16),
    bodyMat
  )
  body.position.y = 0.075
  robot.add(body)

  // Head group (so it can sway)
  const head = new THREE.Group()
  head.position.y = 0.15
  robot.add(head)

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 24, 24),
    bodyMat
  )
  head.add(headMesh)

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.008, 16, 16)
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.015, 0.005, 0.036)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.015, 0.005, 0.036)
  head.add(eyeL, eyeR)

  // Antenna
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.002, 0.002, 0.03, 8),
    accentMat
  )
  antenna.position.y = 0.055
  head.add(antenna)
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.006, 12, 12),
    eyeMat
  )
  bulb.position.y = 0.072
  head.add(bulb)

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.008, 0.03, 6, 10)
  const armL = new THREE.Mesh(armGeo, accentMat)
  armL.position.set(-0.05, 0.08, 0)
  armL.rotation.z = Math.PI / 6
  const armR = new THREE.Mesh(armGeo, accentMat)
  armR.position.set(0.05, 0.08, 0)
  armR.rotation.z = -Math.PI / 6
  robot.add(armL, armR)

  // Idle animation
  let t = 0
  robot.userData.update = (dt) => {
    t += dt
    robot.position.y = Math.sin(t * 2) * 0.006
    head.rotation.y = Math.sin(t * 0.8) * 0.25
    head.position.y = 0.15 + Math.sin(t * 2) * 0.003
    bulb.material.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.4
  }

  return robot
}
