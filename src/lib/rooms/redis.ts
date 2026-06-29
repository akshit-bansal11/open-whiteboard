import { Redis } from "@upstash/redis"
import type { RoomConfig, RoomStore } from "./types"

/**
 * Redis store using @upstash/redis (HTTP-based, perfect for Serverless/Edge)
 */
class RedisStore implements RoomStore {
  private redis: Redis | null = null

  async connect(): Promise<void> {
    if (!this.redis) {
      this.redis = Redis.fromEnv()
    }
  }

  async createRoom(id: string, passwordHash?: string): Promise<RoomConfig> {
    await this.connect()
    
    const config: RoomConfig = {
      id,
      passwordHash,
      createdAt: Date.now(),
    }
    
    // Store in redis as JSON string. Prefix key with 'room:'
    // biome-ignore lint/style/noNonNullAssertion: initialized in connect
    await this.redis!.set(`room:${id}`, JSON.stringify(config))
    return config
  }

  async getRoom(id: string): Promise<RoomConfig | null> {
    await this.connect()
      
    // biome-ignore lint/style/noNonNullAssertion: initialized in connect
    const data = await this.redis!.get(`room:${id}`)
    
    if (!data) return null
    
    if (typeof data === "string") {
      try {
        return JSON.parse(data) as RoomConfig
      } catch {
        return null
      }
    }
    
    return data as RoomConfig
  }

  async deleteRoom(id: string): Promise<void> {
    await this.connect()
    // biome-ignore lint/style/noNonNullAssertion: initialized in connect
    await this.redis!.del(`room:${id}`)
  }

  async disconnect(): Promise<void> {
    // Upstash uses REST (HTTP), no persistent connection to close
  }
}

export const redisStore = new RedisStore()
