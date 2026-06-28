import { nanoid } from "nanoid"
import { RoomIdParamSchema } from "@/lib/validations/room"

// In-memory store — rooms reset on server restart (acceptable for V1)
const rooms = new Map<string, { roomId: string; createdAt: number }>()

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
  const roomId = nanoid(10)
  const createdAt = Date.now()
  rooms.set(roomId, { roomId, createdAt })
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
  const room = rooms.get(parsed.data)
  if (!room) return errorResponse(404, "Not Found", "Room not found", req.url)
  return Response.json({ data: room })
}
