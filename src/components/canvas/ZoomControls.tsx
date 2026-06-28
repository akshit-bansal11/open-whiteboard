"use client"
import { ZOOM_MAX, ZOOM_MIN } from "@/constants/canvas"
import { clamp } from "@/lib/canvas/math"
import { useUIStore } from "@/stores/ui-store"

export function ZoomControls() {
  const { camera, setCamera } = useUIStore()
  const pct = Math.round(camera.zoom * 100)

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-sm text-white shadow-lg z-10">
      <button
        type="button"
        className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded transition-colors"
        onClick={() =>
          setCamera({
            ...camera,
            zoom: clamp(camera.zoom / 1.25, ZOOM_MIN, ZOOM_MAX),
          })
        }
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className="w-14 text-center hover:bg-zinc-700 rounded px-1 transition-colors"
        onClick={() => setCamera({ ...camera, zoom: 1 })}
        aria-label="Reset zoom"
      >
        {pct}%
      </button>
      <button
        type="button"
        className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded transition-colors"
        onClick={() =>
          setCamera({
            ...camera,
            zoom: clamp(camera.zoom * 1.25, ZOOM_MIN, ZOOM_MAX),
          })
        }
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  )
}
