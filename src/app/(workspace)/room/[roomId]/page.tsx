import { notFound } from "next/navigation"
import { CanvasApp } from "@/components/canvas/CanvasApp"
import { RoomIdParamSchema } from "@/lib/validations/room"

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const parsed = RoomIdParamSchema.safeParse(roomId)
  if (!parsed.success) notFound()
  return <CanvasApp roomId={parsed.data} />
}
