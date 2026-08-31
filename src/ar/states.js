/**
 * AR experience states (Phase 15) with user-friendly messages.
 */
export const AppState = {
  INITIAL: 'INITIAL',
  AR_SUPPORTED: 'AR_SUPPORTED',
  AR_NOT_SUPPORTED: 'AR_NOT_SUPPORTED',
  SCANNING: 'SCANNING',
  SURFACE_FOUND: 'SURFACE_FOUND',
  WORKSPACE_PLACED: 'WORKSPACE_PLACED',
  ACTIVE: 'ACTIVE',
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  AR_SESSION_FAILED: 'AR_SESSION_FAILED',
  SESSION_ENDED: 'SESSION_ENDED',
}

export const STATE_MESSAGE = {
  INITIAL: 'Checking device…',
  AR_SUPPORTED: 'Ready. Tap Start AR, then scan your desk.',
  AR_NOT_SUPPORTED:
    'AR not supported here. Use Chrome on Android with ARCore, or try 3D Preview.',
  SCANNING: 'Scanning desk…  ━━━━━━━░░░░░',
  SURFACE_FOUND: 'Desk surface detected. Tap to create your workspace.',
  WORKSPACE_PLACED: 'Workspace placed. Setting things up…',
  ACTIVE: 'Workspace active. Tap the robot for the quick menu.',
  CAMERA_PERMISSION_DENIED:
    'Camera permission denied. Enable camera access and reload to use AR.',
  AR_SESSION_FAILED: 'Could not start the AR session. Please try again.',
  SESSION_ENDED: 'AR session ended.',
}

export function messageFor(state) {
  return STATE_MESSAGE[state] || ''
}
