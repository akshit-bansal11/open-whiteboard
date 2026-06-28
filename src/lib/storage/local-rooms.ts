"use client"

const LOCAL_ROOMS_KEY = "coform_recent_rooms"

export type RecentRoom = {
  id: string
  lastVisited: number
}

export function getRecentRooms(): RecentRoom[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(LOCAL_ROOMS_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.lastVisited - a.lastVisited)
    }
  } catch (_e) {
    // Ignore parse errors
  }
  return []
}

export function recordRoomVisit(id: string): void {
  if (typeof window === "undefined") return
  const rooms = getRecentRooms()
  const existing = rooms.find((r) => r.id === id)

  let updated: RecentRoom[]
  if (existing) {
    updated = rooms.map((r) =>
      r.id === id ? { ...r, lastVisited: Date.now() } : r
    )
  } else {
    updated = [{ id, lastVisited: Date.now() }, ...rooms]
  }

  // Keep only the 10 most recent
  updated = updated.sort((a, b) => b.lastVisited - a.lastVisited).slice(0, 10)
  localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(updated))
}

export function removeRecentRoom(id: string): void {
  if (typeof window === "undefined") return
  const rooms = getRecentRooms()
  const updated = rooms.filter((r) => r.id !== id)
  localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(updated))
}
