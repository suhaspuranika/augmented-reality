import { useEffect, useRef, useState } from 'react'
import { startARSession } from './ar/arScene.js'
import { startPreview3D } from './ar/preview3d.js'
import { createStore } from './data/dashboardStore.js'
import { startServices } from './data/services.js'
import { AppState, messageFor } from './ar/states.js'

export default function App() {
  const [supported, setSupported] = useState(null)
  const [appState, setAppState] = useState(AppState.INITIAL)
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState(false)

  const storeRef = useRef(null)
  const stopServicesRef = useRef(null)
  const arRef = useRef(null)
  const previewRef = useRef(null)
  const mountRef = useRef(null)

  // Create the single store + start data services once.
  if (!storeRef.current) storeRef.current = createStore()
  useEffect(() => {
    stopServicesRef.current = startServices(storeRef.current)
    return () => stopServicesRef.current?.()
  }, [])

  // AR support check.
  useEffect(() => {
    if (!('xr' in navigator)) {
      setSupported(false)
      setAppState(AppState.AR_NOT_SUPPORTED)
      return
    }
    navigator.xr
      .isSessionSupported('immersive-ar')
      .then((ok) => {
        setSupported(ok)
        setAppState(ok ? AppState.AR_SUPPORTED : AppState.AR_NOT_SUPPORTED)
      })
      .catch(() => {
        setSupported(false)
        setAppState(AppState.AR_NOT_SUPPORTED)
      })
  }, [])

  async function handleStartAR() {
    try {
      setAppState(AppState.SCANNING)
      arRef.current = await startARSession({
        store: storeRef.current,
        onState: (s) => setAppState(s),
        onEnd: () => {
          setRunning(false)
          setAppState(AppState.SESSION_ENDED)
        },
      })
      setRunning(true)
    } catch (err) {
      console.error(err)
      const denied = /denied|permission/i.test(err?.message || '')
      setAppState(denied ? AppState.CAMERA_PERMISSION_DENIED : AppState.AR_SESSION_FAILED)
    }
  }

  function enterPreview() {
    setPreview(true)
  }
  function exitPreview() {
    previewRef.current?.stop()
    previewRef.current = null
    setPreview(false)
  }

  // Start the 3D preview once its mount is on screen.
  useEffect(() => {
    if (preview && mountRef.current && !previewRef.current) {
      previewRef.current = startPreview3D({
        store: storeRef.current,
        mount: mountRef.current,
      })
    }
  }, [preview])

  if (preview) {
    return (
      <div style={styles.previewWrap}>
        <div ref={mountRef} style={styles.previewCanvas} />
        <button style={styles.exitPreview} onClick={exitPreview}>
          Exit 3D Preview
        </button>
        <div style={styles.previewHint}>
          Drag to orbit · scroll to zoom · click cards to expand / toggle tasks
        </div>
      </div>
    )
  }

  if (running) return null // AR session owns the screen

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>AR Desk Companion 2.0</h1>
        <p style={styles.subtitle}>Spatial workspace for your desk</p>
        <p style={styles.status}>{messageFor(appState)}</p>

        <button
          style={{
            ...styles.button,
            opacity: supported ? 1 : 0.5,
            cursor: supported ? 'pointer' : 'not-allowed',
          }}
          onClick={handleStartAR}
          disabled={!supported}
        >
          Start AR
        </button>

        <button style={styles.secondary} onClick={enterPreview}>
          Enter 3D Preview
        </button>

        <div style={styles.hint}>
          <p style={styles.hintTitle}>How it works</p>
          <ol style={styles.list}>
            <li>Open on an AR-capable Android phone over HTTPS.</li>
            <li>Tap <b>Start AR</b>, grant camera access.</li>
            <li>Scan your desk until the ring appears, then tap to place.</li>
            <li>Cards arrange around the robot. Tap to expand, drag to move.</li>
            <li>Tap the robot for the quick-action menu.</li>
          </ol>
          <p style={styles.note}>
            No AR device? Use <b>3D Preview</b> to explore on desktop.
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    boxSizing: 'border-box',
  },
  card: {
    width: 'min(460px, 100%)',
    background: 'rgba(18,24,38,0.92)',
    border: '1px solid rgba(120,140,170,0.28)',
    borderRadius: 20,
    padding: 26,
    boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
    backdropFilter: 'blur(8px)',
  },
  title: { margin: '0 0 4px', fontSize: 25 },
  subtitle: { margin: '0 0 16px', color: '#7dd3fc', fontSize: 14 },
  status: { margin: '0 0 20px', color: '#9aa8bd', lineHeight: 1.5 },
  button: {
    width: '100%',
    padding: '14px 18px',
    fontSize: 18,
    fontWeight: 600,
    color: '#08131a',
    background: 'linear-gradient(135deg,#5eead4,#7dd3fc)',
    border: 'none',
    borderRadius: 12,
  },
  secondary: {
    width: '100%',
    marginTop: 10,
    padding: '12px 18px',
    fontSize: 15,
    fontWeight: 600,
    color: '#cfe8ff',
    background: 'transparent',
    border: '1px solid rgba(125,211,252,0.5)',
    borderRadius: 12,
    cursor: 'pointer',
  },
  hint: { marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 },
  hintTitle: { margin: '0 0 8px', color: '#e8edf5', fontWeight: 600 },
  list: { margin: 0, paddingLeft: 20, color: '#9aa8bd', lineHeight: 1.7 },
  note: { marginTop: 12, color: '#7dd3fc', fontSize: 13 },
  previewWrap: { position: 'relative', height: '100%', width: '100%' },
  previewCanvas: { position: 'absolute', inset: 0 },
  exitPreview: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: '10px 16px',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    background: 'rgba(248,113,113,0.92)',
    color: '#fff',
    cursor: 'pointer',
  },
  previewHint: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#9aa8bd',
    fontSize: 13,
    background: 'rgba(11,15,26,0.7)',
    padding: '8px 14px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
}
