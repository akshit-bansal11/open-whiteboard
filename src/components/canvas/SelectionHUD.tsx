"use client"
import { getSelectionBoundingBox, worldToScreen } from "@/lib/canvas/math"
import { useUIStore } from "@/stores/ui-store"
import type { BoundingBox, ResizeHandle, Shape } from "@/types/canvas"

const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "w", "e", "sw", "s", "se"]

function handlePosition(
  handle: ResizeHandle,
  bbox: BoundingBox
): { x: number; y: number } {
  const cx = bbox.x + bbox.width / 2
  const cy = bbox.y + bbox.height / 2
  const map: Record<ResizeHandle, { x: number; y: number }> = {
    nw: { x: bbox.x, y: bbox.y },
    n: { x: cx, y: bbox.y },
    ne: { x: bbox.x + bbox.width, y: bbox.y },
    w: { x: bbox.x, y: cy },
    e: { x: bbox.x + bbox.width, y: cy },
    sw: { x: bbox.x, y: bbox.y + bbox.height },
    s: { x: cx, y: bbox.y + bbox.height },
    se: { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
  }
  return map[handle]
}

type SelectionHUDProps = { shapes: Shape[] }

export function SelectionHUD({ shapes }: SelectionHUDProps) {
  const { selectedIds, camera } = useUIStore()
  const selected = shapes.filter((s) => selectedIds.has(s.id))
  if (selected.length === 0) return null

  const bbox = getSelectionBoundingBox(selected)
  if (!bbox) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
    >
      {HANDLES.map((handle) => {
        const worldPos = handlePosition(handle, bbox)
        const screenPos = worldToScreen(worldPos, camera)
        return (
          <div
            key={handle}
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"
            style={{
              left: screenPos.x - 6,
              top: screenPos.y - 6,
              pointerEvents: "auto",
              cursor: `${handle}-resize`,
            }}
          />
        )
      })}
    </div>
  )
}
