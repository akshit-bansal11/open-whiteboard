import { z } from "zod"

export const CreateRoomRequestSchema = z.object({
  password: z.string().min(4).max(64).optional().or(z.literal("")),
})

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
    passwordRequired: z.boolean(),
  }),
})

export const RoomIdParamSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/)

export const VerifyRoomRequestSchema = z.object({
  roomId: RoomIdParamSchema,
  password: z.string(),
})

export const VerifyRoomResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
  }),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>
export type GetRoomResponse = z.infer<typeof GetRoomResponseSchema>
export type RoomIdParam = z.infer<typeof RoomIdParamSchema>
export type VerifyRoomRequest = z.infer<typeof VerifyRoomRequestSchema>
export type VerifyRoomResponse = z.infer<typeof VerifyRoomResponseSchema>
