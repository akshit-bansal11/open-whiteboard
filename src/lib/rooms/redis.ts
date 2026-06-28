import type { RoomConfig, RoomStore } from "./types"

/**
 * Mock Redis store for now.
 * In a real application, you would use a package like ioredis or @upstash/redis.
 */
class RedisStore implements RoomStore {
  private rooms: Map<string, RoomConfig> = new Map()

  async connect(): Promise<void> {
    console.log("Connecting to Redis (Mocked)...")
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

  async deleteRoom(id: string): Promise<void> {
    this.rooms.delete(id)
  }

  async disconnect(): Promise<void> {
    console.log("Disconnecting from Redis (Mocked)...")
  }
}

export const redisStore = new RedisStore()
