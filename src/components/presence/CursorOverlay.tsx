"use client"
import { worldToScreen } from "@/lib/canvas/math"
import type { Camera } from "@/types/canvas"
import type { AwarenessState } from "@/types/user"

type CursorOverlayProps = { cursors: AwarenessState[]; camera: Camera }

export function CursorOverlay({ cursors, camera }: CursorOverlayProps) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {cursors.map((c) => {
        if (!c.cursor) return null
        const screen = worldToScreen(c.cursor, camera)
        return (
          <g key={c.userId} transform={`translate(${screen.x}, ${screen.y})`}>
            <circle r={6} fill={c.color} />
            <text
              x={10}
              y={4}
              fontSize={12}
              fill={c.color}
              style={{ userSelect: "none" }}
            >
              {c.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
