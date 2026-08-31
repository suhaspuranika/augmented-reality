// Central mock data. Each service module reads/derives from here.
// Clearly separated so real APIs (Google Calendar, Firebase, GitHub, weather)
// can replace these later without touching rendering code.

export function initialTasks() {
  return [
    { id: 't1', text: 'Firebase setup', done: true },
    { id: 't2', text: 'AR detection', done: false },
    { id: 't3', text: 'API integration', done: false },
    { id: 't4', text: 'Production deploy', done: false },
    { id: 't5', text: 'Update Grooviz docs', done: false },
    { id: 't6', text: 'Fix notification bug', done: false },
    { id: 't7', text: 'Review PR #42', done: true },
  ]
}

export function initialMeetings() {
  return [
    { id: 'm1', time: '04:30 PM', title: 'Team Meeting', minutesFromNow: 45 },
    { id: 'm2', time: '06:00 PM', title: 'Project Review', minutesFromNow: 135 },
    { id: 'm3', time: '07:30 PM', title: 'Deployment', minutesFromNow: 225 },
    { id: 'm4', time: '08:15 PM', title: 'Retro', minutesFromNow: 270 },
    { id: 'm5', time: '09:00 PM', title: 'Sync', minutesFromNow: 315 },
  ]
}

export function initialWeather() {
  return {
    tempC: 28,
    condition: 'Partly Cloudy',
    icon: '⛅',
    location: 'Bengaluru',
    humidity: 68,
    windKmh: 12,
  }
}

export function initialNotifications() {
  return [
    { id: 'n1', icon: '🟢', text: 'Firebase alert', priority: 'low', read: false, ts: '2m' },
    { id: 'n2', icon: '🟣', text: 'GitHub PR merged', priority: 'normal', read: false, ts: '9m' },
    { id: 'n3', icon: '🟡', text: 'Meeting in 10 min', priority: 'high', read: false, ts: 'now' },
  ]
}

export function initialSystem() {
  return {
    services: {
      Backend: 'Online',
      Firebase: 'Online',
      GitHub: 'Online',
      Database: 'Online',
    },
    cpu: 42,
    memory: 61,
    networkMbps: 12,
  }
}

export function initialGithub() {
  return {
    commits: 12,
    prs: 3,
    issues: 7,
    lastCommit: '18 minutes ago',
  }
}
