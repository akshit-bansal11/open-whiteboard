"use client"
import type { RefObject } from "react"
import { useCallback, useRef, useState } from "react"
import {
  MIN_SHAPE_SIZE,
  PEN_MIN_DISTANCE,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/constants/canvas"
import {
  applyResize,
  clamp,
  getDistanceBetweenPoints,
  getResizeHandle,
  getShapeBoundingBox,
  hitTestShape,
  screenToWorld,
  zoomToward,
} from "@/lib/canvas/math"
import { useUIStore } from "@/stores/ui-store"
import type { InteractionState, Point, Shape, ShapeId } from "@/types/canvas"

type EngineProps = {
  shapes: Shape[]
  setShape: (s: Shape) => void
  batchSetShapes: (shapes: Shape[]) => void
  deleteShapes: (ids: ShapeId[]) => void
  setLocalCursor: (pos: { x: number; y: number }) => void
  setLocalSelection: (ids: string[]) => void
  currentUserId: string
}

export function useCanvasEngine({
  shapes,
  setShape,
  batchSetShapes,
  deleteShapes,
  setLocalCursor,
  setLocalSelection,
  currentUserId,
}: EngineProps): {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerLeave: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void
  interaction: InteractionState
} {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const {
    activeTool,
    selectedIds,
    camera,
    setSelection,
    addToSelection,
    clearSelection,
    setCamera,
  } = useUIStore()
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: "idle",
  })
  const interactionRef = useRef<InteractionState>({ mode: "idle" })

  const setInteractionState = useCallback((s: InteractionState) => {
    interactionRef.current = s
    setInteraction(s)
  }, [])

  const getPointerWorld = useCallback(
    (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      return screenToWorld(screen, camera)
    },
    [camera]
  )

  const getPointerScreen = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const worldPt = getPointerWorld(e)

      // Middle mouse button or pan tool = pan
      if (e.buttons === 4 || activeTool === "pan") {
        setInteractionState({
          mode: "panning",
          startCamera: camera,
          startPointer: { x: e.clientX, y: e.clientY },
        })
        return
      }

      if (activeTool === "select") {
        // Check resize handles on selected shapes
        const selShapes = shapes.filter((s) => selectedIds.has(s.id))
        if (selShapes.length === 1) {
          const first = selShapes[0]
          if (first) {
            const bbox = getShapeBoundingBox(first)
            const handle = getResizeHandle(worldPt, bbox, camera)
            if (handle) {
              setInteractionState({
                mode: "resizing",
                shapeId: first.id,
                handle,
                startShape: first,
                startPointer: worldPt,
              })
              return
            }
          }
        }

        // Hit test shapes (reverse order — topmost first)
        const hit = [...shapes]
          .reverse()
          .find((s) => !s.locked && hitTestShape(worldPt, s))
        if (hit) {
          if (e.shiftKey) {
            if (selectedIds.has(hit.id)) {
              const next = new Set(selectedIds)
              next.delete(hit.id)
              setSelection([...next] as ShapeId[])
            } else {
              addToSelection(hit.id)
            }
          } else {
            if (!selectedIds.has(hit.id)) setSelection([hit.id])
          }
          const activeIds = e.shiftKey
            ? ([...selectedIds, hit.id] as ShapeId[])
            : ([hit.id] as ShapeId[])
          const startPositions = new Map<ShapeId, Point>(
            shapes
              .filter((s) => activeIds.includes(s.id))
              .map((s) => [s.id, { x: s.x, y: s.y }])
          )
          setInteractionState({
            mode: "moving",
            shapeIds: activeIds,
            startPositions,
            startPointer: worldPt,
          })
        } else {
          if (!e.shiftKey) clearSelection()
          setInteractionState({
            mode: "selecting",
            startWorld: worldPt,
            currentWorld: worldPt,
          })
        }
      } else {
        // Draw tool
        const id = crypto.randomUUID() as ShapeId
        const base = {
          id,
          x: worldPt.x,
          y: worldPt.y,
          width: 0,
          height: 0,
          rotation: 0,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
          opacity: 1,
          locked: false,
          createdBy: currentUserId,
          updatedAt: Date.now(),
        }
        const newShape: Shape =
          activeTool === "rect"
            ? { ...base, type: "rect" }
            : activeTool === "ellipse"
              ? { ...base, type: "ellipse" }
              : activeTool === "text"
                ? {
                    ...base,
                    type: "text",
                    content: "Text",
                    fontSize: 16,
                    fontFamily: "sans-serif",
                    textAlign: "left",
                  }
                : { ...base, type: "pen", points: [worldPt] }

        setShape(newShape)
        setInteractionState({
          mode: "drawing",
          tool: activeTool as "rect" | "ellipse" | "text" | "pen",
          shape: newShape,
          startWorld: worldPt,
        })
      }
    },
    [
      activeTool,
      camera,
      shapes,
      selectedIds,
      setSelection,
      addToSelection,
      clearSelection,
      setShape,
      getPointerWorld,
      currentUserId,
      setInteractionState,
    ]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const screenPt = getPointerScreen(e)
      setLocalCursor(screenPt)

      const state = interactionRef.current
      const worldPt = getPointerWorld(e)

      if (state.mode === "panning") {
        const dx = e.clientX - state.startPointer.x
        const dy = e.clientY - state.startPointer.y
        setCamera({
          ...state.startCamera,
          x: state.startCamera.x + dx,
          y: state.startCamera.y + dy,
        })
      } else if (state.mode === "drawing") {
        const { shape, startWorld } = state
        if (shape.type === "pen") {
          const lastPt = shape.points[shape.points.length - 1]
          if (
            lastPt &&
            getDistanceBetweenPoints(worldPt, lastPt) > PEN_MIN_DISTANCE
          ) {
            const updated = {
              ...shape,
              points: [...shape.points, worldPt],
              updatedAt: Date.now(),
            }
            setShape(updated as Shape)
            setInteractionState({ ...state, shape: updated as Shape })
          }
        } else {
          const w = worldPt.x - startWorld.x
          const h = worldPt.y - startWorld.y
          const updated = {
            ...shape,
            x: w < 0 ? worldPt.x : startWorld.x,
            y: h < 0 ? worldPt.y : startWorld.y,
            width: Math.abs(w),
            height: Math.abs(h),
            updatedAt: Date.now(),
          }
          setShape(updated as Shape)
          setInteractionState({ ...state, shape: updated as Shape })
        }
      } else if (state.mode === "moving") {
        const dx = worldPt.x - state.startPointer.x
        const dy = worldPt.y - state.startPointer.y
        const moved = shapes
          .filter((s) => state.shapeIds.includes(s.id))
          .map((s) => {
            const start = state.startPositions.get(s.id) ?? { x: s.x, y: s.y }
            return {
              ...s,
              x: start.x + dx,
              y: start.y + dy,
              updatedAt: Date.now(),
            }
          })
        batchSetShapes(moved as Shape[])
      } else if (state.mode === "selecting") {
        setInteractionState({ ...state, currentWorld: worldPt })
      } else if (state.mode === "resizing") {
        const targetShape = shapes.find((s) => s.id === state.shapeId)
        if (targetShape) {
          const delta = {
            x: worldPt.x - state.startPointer.x,
            y: worldPt.y - state.startPointer.y,
          }
          const dims = applyResize(state.startShape, state.handle, delta, false)
          setShape({ ...targetShape, ...dims, updatedAt: Date.now() })
        }
      }
    },
    [
      getPointerWorld,
      getPointerScreen,
      setLocalCursor,
      setCamera,
      setShape,
      batchSetShapes,
      shapes,
      setInteractionState,
    ]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const state = interactionRef.current
      const _worldPt = getPointerWorld(e)

      if (state.mode === "drawing") {
        const { shape } = state
        // Discard shapes that are too small (accidental clicks)
        if (
          shape.type !== "pen" &&
          shape.width < MIN_SHAPE_SIZE &&
          shape.height < MIN_SHAPE_SIZE
        ) {
          deleteShapes([shape.id])
        } else {
          setSelection([shape.id])
        }
      } else if (state.mode === "selecting") {
        const { startWorld, currentWorld } = state
        const boxX = Math.min(startWorld.x, currentWorld.x)
        const boxY = Math.min(startWorld.y, currentWorld.y)
        const boxW = Math.abs(currentWorld.x - startWorld.x)
        const boxH = Math.abs(currentWorld.y - startWorld.y)
        const selected = shapes
          .filter((s) => {
            const b = getShapeBoundingBox(s)
            return (
              b.x >= boxX &&
              b.y >= boxY &&
              b.x + b.width <= boxX + boxW &&
              b.y + b.height <= boxY + boxH
            )
          })
          .map((s) => s.id)
        setSelection(selected as ShapeId[])
        setLocalSelection(selected)
      } else if (state.mode === "moving") {
        setLocalSelection([...selectedIds] as string[])
      }

      setInteractionState({ mode: "idle" })
    },
    [
      getPointerWorld,
      shapes,
      selectedIds,
      deleteShapes,
      setSelection,
      setLocalSelection,
      setInteractionState,
    ]
  )

  const onPointerLeave = useCallback(() => {
    setLocalCursor({ x: -9999, y: -9999 })
  }, [setLocalCursor])

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const newZoom = clamp(
        camera.zoom * (1 - e.deltaY * 0.001),
        ZOOM_MIN,
        ZOOM_MAX
      )
      setCamera(zoomToward(camera, screenPt, newZoom))
    },
    [camera, setCamera]
  )

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const worldPt = screenToWorld(screenPt, camera)
      const hit = [...shapes]
        .reverse()
        .find((s) => s.type === "text" && hitTestShape(worldPt, s))
      if (hit) {
        setInteractionState({ mode: "editing-text", shapeId: hit.id })
      }
    },
    [camera, shapes, setInteractionState]
  )

  return {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onWheel,
    onDoubleClick,
    interaction,
  }
}
