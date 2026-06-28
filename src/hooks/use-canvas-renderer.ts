"use client"
import type { RefObject } from "react"
import { useEffect, useRef } from "react"
import { renderFrame } from "@/lib/canvas/renderer"
import type { Camera, InteractionState, Shape } from "@/types/canvas"
import type { AwarenessState } from "@/types/user"

type RendererProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  shapes: Shape[]
  camera: Camera
  selection: string[]
  cursors: AwarenessState[]
  interaction: InteractionState
}

export function useCanvasRenderer({
  canvasRef,
  shapes,
  camera,
  selection,
  cursors,
  interaction,
}: RendererProps): void {
  // Keep latest values in refs so rAF closure always reads current state
  const stateRef = useRef({ shapes, camera, selection, cursors, interaction })
  stateRef.current = { shapes, camera, selection, cursors, interaction }

  // Size the canvas once and whenever the container resizes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const sync = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    sync()

    const ro = new ResizeObserver(sync)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [canvasRef])

  // Drive a rAF render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let rafId = 0
    let cancelled = false

    const loop = () => {
      if (cancelled) return
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const {
          shapes: s,
          camera: c,
          selection: sel,
          cursors: cur,
          interaction: ix,
        } = stateRef.current

        const selectionBox =
          ix.mode === "selecting"
            ? {
                x: Math.min(ix.startWorld.x, ix.currentWorld.x),
                y: Math.min(ix.startWorld.y, ix.currentWorld.y),
                width: Math.abs(ix.currentWorld.x - ix.startWorld.x),
                height: Math.abs(ix.currentWorld.y - ix.startWorld.y),
              }
            : null

        renderFrame({
          ctx,
          shapes: s,
          camera: c,
          selection: sel,
          cursors: cur,
          selectionBox,
        })
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [canvasRef])
}
