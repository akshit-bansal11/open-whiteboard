import { notFound } from "next/navigation"
import { CanvasApp } from "@/components/canvas/CanvasApp"
import { PasswordGate } from "@/components/canvas/PasswordGate"
import { roomStore } from "@/lib/rooms"
import { RoomIdParamSchema } from "@/lib/validations/room"

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const parsed = RoomIdParamSchema.safeParse(roomId)
  if (!parsed.success) notFound()

  const room = await roomStore.getRoom(parsed.data)
  if (!room) notFound()

  if (room.passwordHash) {
    return (
      <PasswordGate roomId={parsed.data}>
        <CanvasApp roomId={parsed.data} />
      </PasswordGate>
    )
  }

  return <CanvasApp roomId={parsed.data} />
}
