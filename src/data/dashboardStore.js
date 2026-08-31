// A tiny observable store — the single source of truth for all card data.
// Cards subscribe to slices; services push updates on their own cadence.
// This decouples rendering (AR cards) from React and from data sources.

import {
  initialTasks,
  initialMeetings,
  initialWeather,
  initialNotifications,
  initialSystem,
  initialGithub,
} from './mockData.js'

function greetingFor(date) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function createStore() {
  const state = {
    profile: { name: 'Suhas', greeting: greetingFor(new Date()) },
    clock: { time: '', date: '' },
    weather: initialWeather(),
    tasks: initialTasks(),
    meetings: initialMeetings(),
    notifications: initialNotifications(),
    system: initialSystem(),
    github: initialGithub(),
    focus: { remaining: 25 * 60, total: 25 * 60, running: false, done: false },
  }

  const listeners = new Set()

  function get() {
    return state
  }

  function emit(changedKeys) {
    for (const fn of listeners) fn(state, changedKeys)
  }

  // Shallow-merge a slice and notify. changedKey used for targeted redraws.
  function update(key, partial) {
    if (Array.isArray(partial)) {
      state[key] = partial
    } else if (typeof partial === 'object' && partial !== null) {
      state[key] = { ...state[key], ...partial }
    } else {
      state[key] = partial
    }
    emit([key])
  }

  function subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  // --- Domain actions (mutations that cards trigger) ---

  function toggleTask(id) {
    const tasks = state.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    update('tasks', tasks)
    return tasks.find((t) => t.id === id)
  }

  function markNotificationRead(id) {
    update(
      'notifications',
      state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  function setFocus(partial) {
    update('focus', partial)
  }

  return {
    get,
    update,
    subscribe,
    emit,
    toggleTask,
    markNotificationRead,
    setFocus,
    greetingFor,
  }
}
