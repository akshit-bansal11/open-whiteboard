export type RoomConfig = {
  id: string
  passwordHash?: string // undefined means no password
  createdAt: number
}

export interface RoomStore {
  /**
   * Initialize connection to the store if necessary
   */
  connect(): Promise<void>

  /**
   * Create a new room with an optional password hash
   */
  createRoom(id: string, passwordHash?: string): Promise<RoomConfig>

  /**
   * Get room configuration
   */
  getRoom(id: string): Promise<RoomConfig | null>

  /**
   * Close connection to the store
   */
  disconnect(): Promise<void>

  /**
   * Delete a room
   */
  deleteRoom(id: string): Promise<void>
}
