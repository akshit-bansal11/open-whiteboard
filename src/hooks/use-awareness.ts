"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { CURSOR_THROTTLE_MS } from "@/constants/canvas"
import type { AwarenessState } from "@/types/user"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:1234"

export function useAwareness(
  roomId: string,
  localUser: Pick<AwarenessState, "userId" | "name" | "color">
) {
  const [remoteStates, setRemoteStates] = useState<AwarenessState[]>([])
  const socketRef = useRef<Socket | null>(null)
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { roomId, ...localUser },
    })
    socketRef.current = socket

    socket.on(
      "user-joined",
      (user: Pick<AwarenessState, "userId" | "name" | "color">) => {
        setRemoteStates((prev) => {
          if (prev.some((s) => s.userId === user.userId)) return prev
          return [
            ...prev,
            {
              ...user,
              cursor: null,
              selectedIds: [] as import("@/types/canvas").ShapeId[],
            },
          ]
        })
      }
    )

    socket.on("cursor", (data: AwarenessState & { x: number; y: number }) => {
      setRemoteStates((prev) =>
        prev.map((s) =>
          s.userId === data.userId
            ? { ...s, cursor: { x: data.x, y: data.y } }
            : s
        )
      )
    })

    socket.on("selection", (data: { userId: string; ids: string[] }) => {
      setRemoteStates((prev) =>
        prev.map((s) =>
          s.userId === data.userId
            ? {
                ...s,
                selectedIds: data.ids as import("@/types/canvas").ShapeId[],
              }
            : s
        )
      )
    })

    socket.on("user-left", ({ userId }: { userId: string }) => {
      setRemoteStates((prev) => prev.filter((s) => s.userId !== userId))
    })

    socket.on("disconnect", () => {
      setRemoteStates([])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      if (throttleRef.current) clearTimeout(throttleRef.current)
    }
  }, [roomId, localUser])

  const setLocalCursor = useCallback((pos: { x: number; y: number }) => {
    lastCursorRef.current = pos
    if (throttleRef.current) return
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null
      if (lastCursorRef.current && socketRef.current) {
        socketRef.current.emit("cursor", lastCursorRef.current)
      }
    }, CURSOR_THROTTLE_MS)
  }, [])

  const setLocalSelection = useCallback((ids: string[]) => {
    socketRef.current?.emit("selection", ids)
  }, [])

  return { remoteStates, setLocalCursor, setLocalSelection }
}
