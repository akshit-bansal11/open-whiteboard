"use client"
import { useEffect, useRef } from "react"
import { worldToScreen } from "@/lib/canvas/math"
import type { Camera, TextShape } from "@/types/canvas"

type TextEditOverlayProps = {
  shape: TextShape
  camera: Camera
  onCommit: (content: string) => void
  onCancel: () => void
}

export function TextEditOverlay({
  shape,
  camera,
  onCommit,
  onCancel,
}: TextEditOverlayProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const screen = worldToScreen({ x: shape.x, y: shape.y }, camera)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <textarea
      ref={ref}
      defaultValue={shape.content}
      className="absolute bg-transparent border border-blue-400 outline-none resize-none text-white"
      style={{
        left: screen.x,
        top: screen.y,
        width: shape.width * camera.zoom,
        fontSize: shape.fontSize * camera.zoom,
        fontFamily: shape.fontFamily,
        zIndex: 30,
      }}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          onCommit(e.currentTarget.value)
        }
      }}
    />
  )
}
