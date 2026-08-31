import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createRobot, attachBehavior } from './robot.js'
import { DeskSpace } from './deskSpace.js'
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
 * Desktop / non-AR 3D preview (Phase 16). Renders the same robot + spatial
 * cards in a normal Three.js scene with mouse orbit controls, so the
 * experience can be demoed and developed without an AR device.
 * Cards raycast on click to expand/collapse and toggle tasks.
 */
export function startPreview3D({ store, mount }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(mount.clientWidth, mount.clientHeight)
  renderer.setClearColor(0x0b0f1a, 1)
  mount.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    55,
    mount.clientWidth / mount.clientHeight,
    0.01,
    50
  )
  camera.position.set(0, 0.6, 1.1)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2))
  const dir = new THREE.DirectionalLight(0xffffff, 1.0)
  dir.position.set(1, 2, 1)
  scene.add(dir)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.15, 0)
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI / 2.05

  const desk = new DeskSpace({ width: 0.9, depth: 0.6 })
  desk.anchor.visible = true
  desk.anchor.matrixAutoUpdate = true
  scene.add(desk.anchor)

  const loader = new GLTFLoader()
  let robot
  loader
    .loadAsync('/models/robot.glb')
    .then((g) => {
      robot = g.scene
      robot.scale.setScalar(0.15)
      attachBehavior(robot, {})
      desk.addRobot(robot)
    })
    .catch(() => {
      robot = createRobot()
      desk.addRobot(robot)
    })

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

  // Mouse click raycasting for cards.
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect()
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(ndc, camera)
    const meshes = []
    desk.forEachCard((c) => c.visible && meshes.push(c.mesh))
    const hits = raycaster.intersectObjects(meshes, false)
    if (hits.length) {
      const card = hits[0].object.userData.card
      const uv = hits[0].uv
      const region = uv && card.hitTest(uv.x, 1 - uv.y)
      if (region && card.onTapRegion) {
        card.onTapRegion(region)
        card.markDirty()
      } else {
        card.toggleExpand()
      }
    }
  })

  const clock = new THREE.Clock()
  let running = true
  function animate() {
    if (!running) return
    requestAnimationFrame(animate)
    const dt = Math.min(clock.getDelta(), 0.05)
    const state = store.get()
    robot?.userData.update?.(dt)
    desk.forEachCard((c) => c.update(dt, state, camera))
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  function onResize() {
    camera.aspect = mount.clientWidth / mount.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(mount.clientWidth, mount.clientHeight)
  }
  window.addEventListener('resize', onResize)

  return {
    stop() {
      running = false
      window.removeEventListener('resize', onResize)
      controls.dispose()
      desk.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
