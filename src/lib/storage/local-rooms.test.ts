import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getRecentRooms,
  recordRoomVisit,
  removeRecentRoom,
} from "./local-rooms"

describe("local-rooms", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("getRecentRooms returns empty array initially", () => {
    expect(getRecentRooms()).toEqual([])
  })

  it("recordRoomVisit saves a room", () => {
    vi.setSystemTime(new Date(1000))
    recordRoomVisit("room-1")
    expect(getRecentRooms()).toEqual([{ id: "room-1", lastVisited: 1000 }])
  })

  it("recordRoomVisit deduplicates same roomId", () => {
    vi.setSystemTime(new Date(1000))
    recordRoomVisit("room-1")

    vi.setSystemTime(new Date(2000))
    recordRoomVisit("room-2")

    vi.setSystemTime(new Date(3000))
    recordRoomVisit("room-1")

    const rooms = getRecentRooms()
    expect(rooms.length).toBe(2)
    // room-1 should be first because it was visited most recently
    expect(rooms[0]).toEqual({ id: "room-1", lastVisited: 3000 })
    expect(rooms[1]).toEqual({ id: "room-2", lastVisited: 2000 })
  })

  it("recordRoomVisit caps at 10 entries", () => {
    for (let i = 1; i <= 15; i++) {
      vi.setSystemTime(new Date(1000 * i))
      recordRoomVisit(`room-${i}`)
    }

    const rooms = getRecentRooms()
    expect(rooms.length).toBe(10)
    // The most recent ones should be room-15 down to room-6
    expect(rooms[0].id).toBe("room-15")
    expect(rooms[9].id).toBe("room-6")
  })

  it("removeRecentRoom removes the specified room", () => {
    vi.setSystemTime(new Date(1000))
    recordRoomVisit("room-1")
    vi.setSystemTime(new Date(2000))
    recordRoomVisit("room-2")

    removeRecentRoom("room-1")

    const rooms = getRecentRooms()
    expect(rooms.length).toBe(1)
    expect(rooms[0].id).toBe("room-2")
  })
})
