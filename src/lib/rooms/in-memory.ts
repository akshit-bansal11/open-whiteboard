import type { RoomConfig, RoomStore } from "./types"

class InMemoryStore implements RoomStore {
  private rooms: Map<string, RoomConfig> = new Map()

  async connect(): Promise<void> {
    // No-op for in-memory
  }

  async createRoom(id: string, passwordHash?: string): Promise<RoomConfig> {
    const config: RoomConfig = {
      id,
      passwordHash,
      createdAt: Date.now(),
    }
    this.rooms.set(id, config)
    return config
  }

  async getRoom(id: string): Promise<RoomConfig | null> {
    return this.rooms.get(id) ?? null
  }

  async disconnect(): Promise<void> {
    // No-op for in-memory
  }

  async deleteRoom(id: string): Promise<void> {
    this.rooms.delete(id)
  }
}

// Singleton instance for the in-memory store so it persists across API requests in dev
const globalForInMemory = globalThis as unknown as {
  inMemoryStore: InMemoryStore | undefined
}

export const inMemoryStore =
  globalForInMemory.inMemoryStore ?? new InMemoryStore()

if (process.env.NODE_ENV !== "production") {
  globalForInMemory.inMemoryStore = inMemoryStore
}
