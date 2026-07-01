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
  const { selectedIds, camera, sizeLinked } = useUIStore()
  const selected = shapes.filter((s) => selectedIds.has(s.id))
  if (selected.length === 0) return null

  const bbox = getSelectionBoundingBox(selected)
  if (!bbox) return null

  const rotation = selected.length === 1 ? selected[0].rotation : 0
  const cx = bbox.x + bbox.width / 2
  const cy = bbox.y + bbox.height / 2
  const screenCx = cx * camera.zoom + camera.x
  const screenCy = cy * camera.zoom + camera.y

  const activeHandles = sizeLinked
    ? (["nw", "ne", "sw", "se"] as ResizeHandle[])
    : HANDLES

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 20,
        transform: `rotate(${rotation}rad)`,
        transformOrigin: `${screenCx}px ${screenCy}px`,
      }}
    >
      <div
        className="absolute border border-blue-500/50"
        style={{
          left: bbox.x * camera.zoom + camera.x,
          top: bbox.y * camera.zoom + camera.y,
          width: bbox.width * camera.zoom,
          height: bbox.height * camera.zoom,
        }}
      />
      {activeHandles.map((handle) => {
        const worldPos = handlePosition(handle, bbox)
        const screenPos = worldToScreen(worldPos, camera)
        return (
          <div
            key={handle}
            className="absolute w-2.5 h-2.5 bg-white border border-blue-500 rounded-full shadow-sm"
            style={{
              left: screenPos.x - 5,
              top: screenPos.y - 5,
              pointerEvents: "none",
            }}
          />
        )
      })}
      {selected.length === 1 && (
        <>
          <div
            className="absolute bg-blue-500/50"
            style={{
              left: (bbox.x + bbox.width / 2) * camera.zoom + camera.x,
              top: (bbox.y - 30 / camera.zoom) * camera.zoom + camera.y + 5,
              width: 1,
              height: 25,
              pointerEvents: "none",
            }}
          />
          <div
            className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full shadow-sm"
            style={{
              left: (bbox.x + bbox.width / 2) * camera.zoom + camera.x - 6,
              top: (bbox.y - 30 / camera.zoom) * camera.zoom + camera.y - 6,
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </div>
  )
}
