import { inMemoryStore } from "./in-memory"
import { redisStore } from "./redis"
import type { RoomStore } from "./types"

export const roomStore: RoomStore =
  process.env.ROOM_STORE_TYPE === "redis" ? redisStore : inMemoryStore
