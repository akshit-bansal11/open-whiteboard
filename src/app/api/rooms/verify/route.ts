import * as bcrypt from "bcryptjs"
import { roomStore } from "@/lib/rooms"
import { VerifyRoomRequestSchema } from "@/lib/validations/room"

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
  try {
    const body = await req.json()
    const parsed = VerifyRoomRequestSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(400, "Bad Request", "Invalid request body", req.url)
    }

    const { roomId, password } = parsed.data
    const room = await roomStore.getRoom(roomId)

    if (!room) {
      return errorResponse(404, "Not Found", "Room not found", req.url)
    }

    if (!room.passwordHash) {
      return Response.json({ data: { success: true } })
    }

    const isValid = await bcrypt.compare(password, room.passwordHash)
    return Response.json({ data: { success: isValid } })
  } catch (_e) {
    return errorResponse(
      500,
      "Internal Error",
      "Failed to verify room",
      req.url
    )
  }
}
