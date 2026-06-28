import type { Camera, Shape } from "@/types/canvas"
import type { AwarenessState } from "@/types/user"

export type WorkerInMsg =
  | { type: "init"; canvas: OffscreenCanvas }
  | { type: "resize"; width: number; height: number }
  | {
      type: "render"
      shapes: Shape[]
      camera: Camera
      selection: string[]
      cursors: AwarenessState[]
      selectionBox: {
        x: number
        y: number
        width: number
        height: number
      } | null
    }

export type WorkerOutMsg =
  | { type: "ready" }
  | { type: "error"; message: string }
