import * as bcrypt from "bcryptjs"
import { beforeEach, describe, expect, it } from "vitest"
import { inMemoryStore } from "./in-memory"

describe("InMemoryStore", () => {
  const roomId = "test-room-123"

  beforeEach(async () => {
    // Clean up before each test
    await inMemoryStore.deleteRoom(roomId)
  })

  it("should create a room, get the room, and then delete it", async () => {
    const room = await inMemoryStore.createRoom(roomId)
    expect(room).toBeDefined()
    expect(room.id).toBe(roomId)
    expect(room.passwordHash).toBeUndefined()

    const fetched = await inMemoryStore.getRoom(roomId)
    expect(fetched).not.toBeNull()
    expect(fetched?.id).toBe(roomId)

    await inMemoryStore.deleteRoom(roomId)
    const deleted = await inMemoryStore.getRoom(roomId)
    expect(deleted).toBeNull()
  })

  it("should verify correct password", async () => {
    const plainPassword = "secret-password"
    const hash = await bcrypt.hash(plainPassword, 10)
    await inMemoryStore.createRoom(roomId, hash)

    const room = await inMemoryStore.getRoom(roomId)
    expect(room?.passwordHash).toBeDefined()
    if (!room?.passwordHash) return

    // Verify correct password
    const isCorrect = await bcrypt.compare(plainPassword, room.passwordHash)
    expect(isCorrect).toBe(true)
  })

  it("should fail to verify wrong password", async () => {
    const hash = await bcrypt.hash("secret-password", 10)
    await inMemoryStore.createRoom(roomId, hash)

    const room = await inMemoryStore.getRoom(roomId)
    expect(room?.passwordHash).toBeDefined()
    if (!room?.passwordHash) return

    // Verify wrong password
    const isCorrect = await bcrypt.compare("wrong-password", room.passwordHash)
    expect(isCorrect).toBe(false)
  })

  it("should verify no password logic (no hash means it should be accessible)", async () => {
    await inMemoryStore.createRoom(roomId) // No password

    const room = await inMemoryStore.getRoom(roomId)
    expect(room).not.toBeNull()

    // In our app logic, if room.passwordHash is undefined, we return true (or don't ask for a password)
    const requiresPassword = room?.passwordHash !== undefined
    expect(requiresPassword).toBe(false)
  })
})
