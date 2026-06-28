"use client"
import { Maximize, Minus, Plus } from "lucide-react"
import { ZOOM_MAX, ZOOM_MIN } from "@/constants/canvas"
import {
  calculateFitAllCamera,
  clamp,
  getSelectionBoundingBox,
} from "@/lib/canvas/math"
import { useUIStore } from "@/stores/ui-store"
import type { Camera, Shape } from "@/types/canvas"

type ZoomControlsProps = {
  shapes: Shape[]
}

export function fitAll(
  shapes: Shape[],
  canvas: HTMLCanvasElement | null,
  setCamera: (c: Camera) => void
) {
  if (shapes.length === 0 || !canvas) {
    setCamera({ x: 0, y: 0, zoom: 1 })
    return
  }
  const bbox = getSelectionBoundingBox(shapes)
  if (!bbox) return

  const camera = calculateFitAllCamera(bbox, canvas.width, canvas.height, 64)
  setCamera(camera)
}

export function ZoomControls({ shapes }: ZoomControlsProps) {
  const { camera, setCamera } = useUIStore()
  const pct = Math.round(camera.zoom * 100)

  const handleFitAll = () => {
    // ZoomControls doesn't have direct access to canvas, but we can query it
    const canvas = document.querySelector("canvas")
    fitAll(shapes, canvas, setCamera)
  }

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-1.5 text-sm text-white shadow-2xl z-10">
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl transition-colors"
        onClick={() =>
          setCamera({
            ...camera,
            zoom: clamp(camera.zoom / 1.25, ZOOM_MIN, ZOOM_MAX),
          })
        }
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="w-[60px] text-center hover:bg-zinc-800 rounded-xl py-1 text-zinc-300 font-medium transition-colors"
        onClick={() => setCamera({ ...camera, zoom: 1 })}
        aria-label="Reset zoom"
      >
        {pct}%
      </button>
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl transition-colors"
        onClick={() =>
          setCamera({
            ...camera,
            zoom: clamp(camera.zoom * 1.25, ZOOM_MIN, ZOOM_MAX),
          })
        }
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-zinc-800 mx-1" />
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl transition-colors"
        onClick={handleFitAll}
        title="Fit all (Ctrl+Shift+F)"
        aria-label="Fit all shapes"
      >
        <Maximize className="w-4 h-4" />
      </button>
    </div>
  )
}
