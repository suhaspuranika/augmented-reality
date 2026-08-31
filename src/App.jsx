import { useEffect, useRef, useState } from 'react'
import { startARSession } from './ar/arScene.js'

export default function App() {
  const [supported, setSupported] = useState(null) // null = checking
  const [status, setStatus] = useState('Checking device...')
  const [running, setRunning] = useState(false)
  const controllerRef = useRef(null)

  // Live dashboard data. In a real app you'd wire these to Firebase / your API.
  const dashboardRef = useRef({
    greeting: greetingFor(new Date()),
    name: 'Suhas',
    time: '',
    date: '',
    weather: '28°C  Sunny',
    tasks: [
      { text: 'Finish API integration', done: false },
      { text: 'Fix notification bug', done: false },
      { text: 'Review PR #42', done: true },
      { text: 'Update Grooviz docs', done: false },
    ],
    meetings: [
      { time: '11:00 AM', title: 'Standup' },
      { time: '2:00 PM', title: 'Design review' },
      { time: '4:30 PM', title: 'Client demo' },
    ],
    backend: 'Online',
    firebase: 'Online',
    github: 'Online',
    notifications: 3,
    pomodoro: 24 * 60 + 32, // seconds remaining
  })

  useEffect(() => {
    if (!('xr' in navigator)) {
      setSupported(false)
      setStatus('WebXR not available in this browser.')
      return
    }
    navigator.xr
      .isSessionSupported('immersive-ar')
      .then((ok) => {
        setSupported(ok)
        setStatus(
          ok
            ? 'Ready. Tap "Start AR", then aim at your desk and tap to place the robot.'
            : 'immersive-ar not supported. Use Chrome on Android with ARCore, or an AR headset browser.'
        )
      })
      .catch(() => {
        setSupported(false)
        setStatus('Could not query WebXR support.')
      })
  }, [])

  // Tick every second: countdown, live clock, date, and greeting.
  useEffect(() => {
    const id = setInterval(() => {
      const d = dashboardRef.current
      d.pomodoro = Math.max(0, d.pomodoro - 1)
      const now = new Date()
      d.time = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      d.date = now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      d.greeting = greetingFor(now)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  async function handleStart() {
    try {
      setStatus('Starting AR session...')
      const controller = await startARSession({
        getData: () => dashboardRef.current,
        onEnd: () => {
          setRunning(false)
          setStatus('AR session ended.')
        },
        onStatus: (msg) => setStatus(msg),
      })
      controllerRef.current = controller
      setRunning(true)
    } catch (err) {
      console.error(err)
      setStatus('Failed to start AR: ' + (err?.message || err))
    }
  }

  return (
    <div style={styles.wrap}>
      {!running && (
        <div style={styles.card}>
          <h1 style={styles.title}>🤖 AR Desk Companion</h1>
          <p style={styles.status}>{status}</p>

          <button
            style={{
              ...styles.button,
              opacity: supported ? 1 : 0.5,
              cursor: supported ? 'pointer' : 'not-allowed',
            }}
            onClick={handleStart}
            disabled={!supported}
          >
            Start AR
          </button>

          <div style={styles.hint}>
            <p style={styles.hintTitle}>How it works</p>
            <ol style={styles.list}>
              <li>Open this page on an AR-capable phone over HTTPS.</li>
              <li>Tap <b>Start AR</b> and grant camera access.</li>
              <li>Slowly aim at your desk. A ring shows detected surface.</li>
              <li>Tap the screen to drop the robot + dashboard on the desk.</li>
              <li>Tap the robot to expand / collapse the dashboard.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function greetingFor(date) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
    width: 'min(440px, 100%)',
    background: 'rgba(20,26,40,0.9)',
    border: '1px solid #223',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  title: { margin: '0 0 12px', fontSize: 24 },
  status: { margin: '0 0 20px', color: '#9fb3c8', lineHeight: 1.5 },
  button: {
    width: '100%',
    padding: '14px 18px',
    fontSize: 18,
    fontWeight: 600,
    color: '#0b0f1a',
    background: 'linear-gradient(135deg,#5eead4,#38bdf8)',
    border: 'none',
    borderRadius: 12,
  },
  hint: { marginTop: 24, borderTop: '1px solid #223', paddingTop: 16 },
  hintTitle: { margin: '0 0 8px', color: '#e6edf3', fontWeight: 600 },
  list: { margin: 0, paddingLeft: 20, color: '#9fb3c8', lineHeight: 1.7 },
}
