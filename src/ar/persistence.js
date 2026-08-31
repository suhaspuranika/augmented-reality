/**
 * Workspace persistence via localStorage (Phase 18).
 * Saves card positions, visibility, and expansion so the layout is restored
 * next session. Safe no-ops if storage is unavailable.
 */
const KEY = 'arDeskWorkspace'

export function saveWorkspace(deskSpace) {
  try {
    const cards = {}
    deskSpace.forEachCard((c) => {
      cards[c.id] = {
        x: c.basePos.x,
        y: c.basePos.y,
        z: c.basePos.z,
        visible: c.visible,
        expanded: c.expanded,
      }
    })
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, cards, savedAt: Date.now() })
    )
  } catch {
    /* storage blocked; ignore */
  }
}

export function loadWorkspace() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.version !== 1) return null
    return data
  } catch {
    return null
  }
}

export function applyWorkspace(deskSpace, data) {
  if (!data || !data.cards) return
  deskSpace.forEachCard((c) => {
    const s = data.cards[c.id]
    if (!s) return
    c.setBasePosition(s.x, s.y, s.z)
    c.expanded = !!s.expanded
    if (s.visible === false) c.hide()
    else c.show()
  })
}

export function clearWorkspace() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
