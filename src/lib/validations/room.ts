import { z } from "zod"

export const CreateRoomResponseSchema = z.object({
  data: z.object({
    roomId: z.string(),
    shareUrl: z.string(),
  }),
})

export const GetRoomResponseSchema = z.object({
  data: z.object({
    roomId: z.string(),
    createdAt: z.number(),
  }),
})

export const RoomIdParamSchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/)

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>
export type GetRoomResponse = z.infer<typeof GetRoomResponseSchema>
export type RoomIdParam = z.infer<typeof RoomIdParamSchema>
