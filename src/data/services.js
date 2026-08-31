// Real-time update scheduler. Each domain updates on its own cadence.
// All values are MOCK/simulated. Swap the body of each refresher with a real
// API call later (Google Calendar, Firebase, GitHub, weather provider).
//
// startServices returns a stop() that clears every interval.

export function startServices(store) {
  const timers = []

  const every = (ms, fn) => {
    fn() // run once immediately
    const id = setInterval(fn, ms)
    timers.push(id)
  }

  // Clock + greeting — 1s
  every(1000, () => {
    const now = new Date()
    store.update('clock', {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    })
    store.update('profile', { greeting: store.greetingFor(now) })
  })

  // Focus timer — 1s (only counts down when running)
  every(1000, () => {
    const f = store.get().focus
    if (!f.running || f.remaining <= 0) return
    const remaining = f.remaining - 1
    if (remaining <= 0) {
      store.setFocus({ remaining: 0, running: false, done: true })
    } else {
      store.setFocus({ remaining })
    }
  })

  // System metrics — 5s (simulated jitter). Replace with real telemetry.
  every(5000, () => {
    const s = store.get().system
    const jitter = (base, spread, min, max) =>
      Math.max(min, Math.min(max, Math.round(base + (Math.random() - 0.5) * spread)))
    store.update('system', {
      cpu: jitter(s.cpu, 18, 8, 95),
      memory: jitter(s.memory, 10, 20, 92),
      networkMbps: jitter(s.networkMbps, 8, 1, 40),
    })
  })

  // Notifications — 10s (occasionally add one). Replace with push/websocket.
  every(10000, () => {
    if (Math.random() < 0.25) {
      const pool = [
        { text: 'Build passed', priority: 'low' },
        { text: 'New PR opened', priority: 'normal' },
        { text: 'Meeting soon', priority: 'high' },
        { text: 'Backend latency spike', priority: 'high' },
      ]
      const pick = pool[Math.floor(Math.random() * pool.length)]
      const list = store.get().notifications.slice(-5)
      list.unshift({
        id: 'n' + Date.now(),
        ...pick,
        read: false,
        ts: 'now',
      })
      store.update('notifications', list)
    }
  })

  // Weather — 10 min. Replace with a real weather API keyed by location.
  every(10 * 60 * 1000, () => {
    // Mock refresh: nudge temperature slightly.
    const w = store.get().weather
    store.update('weather', {
      ...w,
      tempC: Math.max(20, Math.min(38, w.tempC + (Math.random() < 0.5 ? -1 : 1))),
    })
  })

  // Calendar — 60s. Recompute "minutes until next meeting".
  every(60 * 1000, () => {
    const meetings = store.get().meetings.map((m) => ({
      ...m,
      minutesFromNow: Math.max(0, m.minutesFromNow - 1),
    }))
    store.update('meetings', meetings)
  })

  // GitHub — 60s. Replace with GitHub REST/GraphQL API.
  every(60 * 1000, () => {
    // Mock: no-op refresh; kept as a clear integration seam.
  })

  return function stop() {
    timers.forEach(clearInterval)
  }
}
