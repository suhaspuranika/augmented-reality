/**
 * ObjectDetectionManager — ARCHITECTURE ONLY (not real computer vision).
 *
 * This defines the interface a future ML/CV backend (MediaPipe, TensorFlow.js,
 * YOLO, ML Kit) can implement. The default implementation is a NullDetector
 * that detects nothing, so the AR app runs fine when no CV model is present.
 *
 * IMPORTANT: Object recognition is NOT implemented. Do not treat getObjects()
 * output as real until a genuine model backend is wired in. This is distinct
 * from WebXR hit-test, which DOES detect trackable surfaces.
 *
 * Detected object shape (future):
 *   { type: 'laptop'|'keyboard'|'mouse'|'phone'|'cup'|'monitor',
 *     confidence: number, bbox: {x,y,w,h}, worldPose?: Matrix4 }
 */

export class NullDetector {
  async init() {
    return false // no backend available
  }
  // eslint-disable-next-line no-unused-vars
  detect(_frame) {
    return []
  }
  getObjects() {
    return []
  }
  // eslint-disable-next-line no-unused-vars
  getObjectByType(_type) {
    return null
  }
  get available() {
    return false
  }
}

export class ObjectDetectionManager {
  constructor(backend = new NullDetector()) {
    this.backend = backend
    this.objects = []
    this.ready = false
  }

  async init() {
    this.ready = await this.backend.init()
    return this.ready
  }

  // Called per-frame with the XRFrame (or camera image) when a backend exists.
  detect(frame) {
    if (!this.ready) return []
    this.objects = this.backend.detect(frame) || []
    return this.objects
  }

  getObjects() {
    return this.objects
  }

  getObjectByType(type) {
    return this.objects.find((o) => o.type === type) || null
  }

  get available() {
    return this.ready && this.backend.available
  }
}
