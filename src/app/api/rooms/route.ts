import * as bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { roomStore } from "@/lib/rooms"
import {
  CreateRoomRequestSchema,
  RoomIdParamSchema,
} from "@/lib/validations/room"

function errorResponse(
  status: number,
  title: string,
  detail: string,
  url: string
) {
  return Response.json(
    { type: "about:blank", title, status, detail, instance: url },
    { status }
  )
}

export async function POST(req: Request) {
  let passwordHash: string | undefined

  try {
    const body = await req.json()
    const parsed = CreateRoomRequestSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(400, "Bad Request", "Invalid request body", req.url)
    }

    if (parsed.data.password && parsed.data.password.length > 0) {
      passwordHash = await bcrypt.hash(parsed.data.password, 10)
    }
  } catch (_e) {
    // Empty body is fine, just means no password
  }

  const roomId = nanoid(10)
  await roomStore.createRoom(roomId, passwordHash)

  const shareUrl = `${new URL(req.url).origin}/room/${roomId}`
  return Response.json({ data: { roomId, shareUrl } }, { status: 201 })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const roomIdRaw = url.searchParams.get("roomId")
  const parsed = RoomIdParamSchema.safeParse(roomIdRaw)
  if (!parsed.success) {
    return errorResponse(
      400,
      "Bad Request",
      "Invalid or missing roomId",
      req.url
    )
  }

  const room = await roomStore.getRoom(parsed.data)
  if (!room) {
    return errorResponse(404, "Not Found", "Room not found", req.url)
  }

  return Response.json({
    data: {
      roomId: room.id,
      createdAt: room.createdAt,
      passwordRequired: room.passwordHash !== undefined,
    },
  })
}
