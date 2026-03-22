import type { SavedRoster } from '../models/types'

const ROSTER_KEY = 'coachtime_rosters'

export function loadRosters(): SavedRoster[] {
  try {
    const data = localStorage.getItem(ROSTER_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveRoster(roster: SavedRoster): void {
  const rosters = loadRosters()
  const idx = rosters.findIndex(r => r.id === roster.id)
  if (idx >= 0) {
    rosters[idx] = roster
  } else {
    rosters.push(roster)
  }
  localStorage.setItem(ROSTER_KEY, JSON.stringify(rosters))
}

export function deleteRoster(id: string): void {
  const rosters = loadRosters().filter(r => r.id !== id)
  localStorage.setItem(ROSTER_KEY, JSON.stringify(rosters))
}
