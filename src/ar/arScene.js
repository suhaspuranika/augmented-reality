import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createRobot, attachBehavior } from './robot.js'
import { DeskSpace } from './deskSpace.js'
import { InteractionManager } from './interactions.js'
import { RadialMenu } from './radialMenu.js'
import { ObjectDetectionManager } from './detection.js'
import { AppState } from './states.js'
import { saveWorkspace, loadWorkspace, applyWorkspace } from './persistence.js'
import {
  makeCalendarCard,
  makeTasksCard,
  makeWeatherCard,
  makeNotificationsCard,
  makeSystemCard,
  makeGithubCard,
  makeFocusCard,
} from './cards.js'

/**
 * Starts the immersive-ar workspace. Preserves the original WebXR hit-test,
 * tap-to-place, and glTF/procedural robot fallback, then layers the spatial
 * card system, interactions, radial menu, robot states, and persistence.
 *
 * @param {Object} opts
 * @param {object} opts.store        dashboardStore instance (single source of truth)
 * @param {(s:string)=>void} opts.onState  reports AppState transitions
 * @param {()=>void} opts.onEnd
 */
export async function startARSession({ store, onState, onEnd }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  )

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2))
  const dir = new THREE.DirectionalLight(0xffffff, 1.0)
  dir.position.set(0.5, 2, 0.5)
  scene.add(dir)

  // Reticle (unchanged concept from original).
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.075, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x5eead4 })
  )
  reticle.matrixAutoUpdate = false
  reticle.visible = false
  scene.add(reticle)

  // Desk workspace + robot + cards.
  const desk = new DeskSpace({ width: 0.9, depth: 0.6 })
  scene.add(desk.anchor)

  const robot = await loadRobot()
  desk.addRobot(robot)

  const radial = new RadialMenu((id) => {
    const card = desk.getCard(id)
    if (card) {
      card.show()
      card.expanded = true
      card.markDirty()
    }
    radial.close()
  })
  robot.add(radial.group)

  // Create all cards and register them.
  ;[
    makeWeatherCard(store),
    makeCalendarCard(store),
    makeNotificationsCard(store),
    makeTasksCard(store),
    makeFocusCard(store),
    makeSystemCard(store),
    makeGithubCard(store),
  ].forEach((c) => desk.addCard(c))
  desk.layout()

  // Object detection architecture (Null backend by default — no real CV).
  const detection = new ObjectDetectionManager()
  await detection.init()

  let placed = false

  // --- Robot behavior events (Phase 20) ---
  const robotState = (s) => robot.userData.setState?.(s)
  const unsub = store.subscribe((state, changed) => {
    if (changed.includes('tasks')) {
      const done = state.tasks.every((t) => t.done)
      robotState(done ? 'celebrate' : 'happy')
    }
    if (changed.includes('focus')) {
      if (state.focus.done) robotState('celebrate')
      else if (state.focus.running) robotState('thinking')
    }
    if (changed.includes('system')) {
      const anyDown = Object.values(state.system.services).some(
        (v) => v !== 'Online'
      )
      if (anyDown) robotState('alert')
    }
  })

  // --- Overlay (Exit button) ---
  const overlayRoot = buildOverlay(() => session.end())
  document.body.appendChild(overlayRoot)

  let session
  try {
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'local-floor'],
      domOverlay: { root: overlayRoot },
    })
  } catch (err) {
    overlayRoot.remove()
    onState?.(AppState.AR_SESSION_FAILED)
    throw err
  }

  document.body.appendChild(renderer.domElement)
  renderer.xr.setReferenceSpaceType('local')
  await renderer.xr.setSession(session)

  const viewerSpace = await session.requestReferenceSpace('viewer')
  const localSpace = await session.requestReferenceSpace('local')
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

  onState?.(AppState.SCANNING)

  // --- Interaction manager (raycast taps/drag) ---
  const interactions = new InteractionManager({
    renderer,
    deskSpace: desk,
    robotRoot: robot,
    onRobotTap: () => {
      radial.toggle()
      robotState(radial.open ? 'listening' : 'idle')
    },
    onCardEvent: (result) => {
      if (!result) return
      if (result.event === 'tapEmpty') radial.close()
      if (result.event === 'taskToggled' && result.task?.done) robotState('happy')
      if (result.event === 'focusStarted') robotState('thinking')
      // persist after any interaction that changes layout/visibility
      saveWorkspace(desk)
    },
  })
  scene.add(interactions.object3d)

  // First tap places the workspace at the reticle.
  interactions.object3d.addEventListener('select', onFirstPlace)
  function onFirstPlace() {
    if (placed || !reticle.visible) return
    desk.place(reticle.matrix)
    placed = true
    reticle.visible = false
    onState?.(AppState.WORKSPACE_PLACED)
    // Restore saved layout if present.
    const saved = loadWorkspace()
    if (saved) applyWorkspace(desk, saved)
    robotState('happy')
    setTimeout(() => onState?.(AppState.ACTIVE), 600)
    interactions.object3d.removeEventListener('select', onFirstPlace)
  }

  const clock = new THREE.Clock()

  renderer.setAnimationLoop((_, frame) => {
    const dt = Math.min(clock.getDelta(), 0.05)
    const state = store.get()

    if (frame && !placed) {
      const results = frame.getHitTestResults(hitTestSource)
      if (results.length > 0) {
        const pose = results[0].getPose(localSpace)
        reticle.visible = true
        reticle.matrix.fromArray(pose.transform.matrix)
        onState?.(AppState.SURFACE_FOUND)
      } else {
        reticle.visible = false
      }
    }

    if (placed) {
      robot.userData.update?.(dt)
      radial.update(dt, camera)
      interactions.update()
      desk.forEachCard((c) => c.update(dt, state, camera))
      // Future: detection.detect(frame) -> context-aware cards.
    }

    renderer.render(scene, camera)
  })

  session.addEventListener('end', () => {
    renderer.setAnimationLoop(null)
    saveWorkspace(desk)
    hitTestSource?.cancel?.()
    unsub()
    desk.dispose()
    radial.dispose()
    renderer.domElement.remove()
    overlayRoot.remove()
    renderer.dispose()
    onState?.(AppState.SESSION_ENDED)
    onEnd?.()
  })

  window.addEventListener('resize', onResize)
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  return { end: () => session.end() }
}

/** glTF robot if present, else procedural. Behavior states attached to both. */
async function loadRobot() {
  const loader = new GLTFLoader()
  try {
    const gltf = await loader.loadAsync('/models/robot.glb')
    const model = gltf.scene
    model.scale.setScalar(0.15)
    attachBehavior(model, {}) // bob/spin only for arbitrary glTF rigs
    return model
  } catch {
    return createRobot()
  }
}

function buildOverlay(onExit) {
  const root = document.createElement('div')
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;'
  const btn = document.createElement('button')
  btn.textContent = 'Exit AR'
  btn.style.cssText =
    'position:absolute;top:16px;right:16px;pointer-events:auto;' +
    'padding:10px 16px;border:none;border-radius:10px;font-weight:600;' +
    'background:rgba(248,113,113,0.92);color:#fff;font-size:15px;'
  btn.addEventListener('click', onExit)
  root.appendChild(btn)
  return root
}
