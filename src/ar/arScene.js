import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createRobot } from './robot.js'
import { createDashboard } from './dashboard.js'

/**
 * Starts an immersive-ar WebXR session and renders a 3D robot companion
 * with a floating dashboard onto a detected surface (your desk).
 *
 * @param {Object} opts
 * @param {() => object} opts.getData  Returns live dashboard data each frame.
 * @param {() => void} opts.onEnd      Called when the session ends.
 * @param {(msg:string)=>void} opts.onStatus  Status message callback.
 * @returns {Promise<{end: () => void}>}
 */
export async function startARSession({ getData, onEnd, onStatus }) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  )

  // Lighting so the robot reads well against the camera feed.
  const hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 1.2)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xffffff, 1.0)
  dir.position.set(0.5, 2, 0.5)
  scene.add(dir)

  // Reticle: shows where a detected surface is before placement.
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.075, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  )
  reticle.matrixAutoUpdate = false
  reticle.visible = false
  scene.add(reticle)

  // The companion group (robot + dashboard). Placed on first tap.
  const companion = new THREE.Group()
  companion.visible = false
  scene.add(companion)

  const robot = await loadRobot()
  companion.add(robot)

  const dashboard = createDashboard()
  dashboard.group.position.set(0.22, 0.12, 0) // sits beside the robot
  companion.add(dashboard.group)

  let dashboardExpanded = true
  let placed = false

  // Request the session with hit-test + DOM overlay for exit button.
  const overlayRoot = buildOverlay(() => session.end())
  document.body.appendChild(overlayRoot)

  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: overlayRoot },
  })

  document.body.appendChild(renderer.domElement)
  renderer.xr.setReferenceSpaceType('local')
  await renderer.xr.setSession(session)

  const viewerSpace = await session.requestReferenceSpace('viewer')
  const localSpace = await session.requestReferenceSpace('local')
  const hitTestSource = await session.requestHitTestSource({
    space: viewerSpace,
  })

  onStatus?.('Aim at your desk. Tap to place the robot.')

  // Tap handling: first tap places the companion, later taps toggle dashboard.
  const controller = renderer.xr.getController(0)
  scene.add(controller)
  controller.addEventListener('select', () => {
    if (!placed && reticle.visible) {
      companion.position.setFromMatrixPosition(reticle.matrix)
      companion.quaternion.setFromRotationMatrix(reticle.matrix)
      companion.visible = true
      placed = true
      reticle.visible = false
      onStatus?.('Placed! Tap the robot to toggle the dashboard.')
    } else if (placed) {
      // Toggle dashboard by tapping (simple: any select after placing).
      dashboardExpanded = !dashboardExpanded
      dashboard.group.visible = dashboardExpanded
    }
  })

  const clock = new THREE.Clock()

  renderer.setAnimationLoop((_, frame) => {
    const dt = clock.getDelta()

    if (frame && !placed) {
      const results = frame.getHitTestResults(hitTestSource)
      if (results.length > 0) {
        const pose = results[0].getPose(localSpace)
        reticle.visible = true
        reticle.matrix.fromArray(pose.transform.matrix)
      } else {
        reticle.visible = false
      }
    }

    if (placed) {
      // Gentle idle bob + face the camera for the robot's "head".
      robot.userData.update?.(dt)
      dashboard.update(getData(), camera, companion)
    }

    renderer.render(scene, camera)
  })

  session.addEventListener('end', () => {
    renderer.setAnimationLoop(null)
    hitTestSource?.cancel?.()
    renderer.domElement.remove()
    overlayRoot.remove()
    renderer.dispose()
    onEnd?.()
  })

  window.addEventListener('resize', onResize)
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  return {
    end: () => session.end(),
  }
}

/**
 * Loads a glTF robot from /public/models/robot.glb if present,
 * otherwise falls back to a procedurally built robot (no download needed).
 */
async function loadRobot() {
  const loader = new GLTFLoader()
  try {
    const gltf = await loader.loadAsync('/models/robot.glb')
    const model = gltf.scene
    model.scale.setScalar(0.15)
    // Simple idle animation for glTF too.
    let t = 0
    model.userData.update = (dt) => {
      t += dt
      model.position.y = 0.02 + Math.sin(t * 2) * 0.01
      model.rotation.y += dt * 0.3
    }
    return model
  } catch {
    // No model file present — use the built-in robot.
    return createRobot()
  }
}

function buildOverlay(onExit) {
  const root = document.createElement('div')
  root.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:10;'
  const btn = document.createElement('button')
  btn.textContent = 'Exit AR'
  btn.style.cssText =
    'position:absolute;top:16px;right:16px;pointer-events:auto;' +
    'padding:10px 16px;border:none;border-radius:10px;font-weight:600;' +
    'background:rgba(255,80,80,0.9);color:#fff;font-size:15px;'
  btn.addEventListener('click', onExit)
  root.appendChild(btn)
  return root
}
