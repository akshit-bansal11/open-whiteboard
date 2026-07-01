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
  applyRotation,
  clamp,
  getDistanceBetweenPoints,
  getResizeHandle,
  getShapeBoundingBox,
  hitTestShape,
  screenToWorld,
  zoomToward,
} from "@/lib/canvas/math"
import { useUIStore } from "@/stores/ui-store"
import type {
  ArrowShape,
  InteractionState,
  LineShape,
  Point,
  Shape,
  ShapeId,
} from "@/types/canvas"

type EngineProps = {
  shapes: Shape[]
  setShape: (s: Shape) => void
  batchSetShapes: (shapes: Shape[]) => void
  deleteShapes: (ids: ShapeId[]) => void
  setLocalCursor: (pos: { x: number; y: number }) => void
  setLocalSelection: (ids: string[]) => void
  currentUserId: string
}

/** Shared default values for new BaseShape fields introduced in V1.2. */
const BASE_V12 = {
  cornerRadius: 0,
  dashArray: [] as number[],
  fillStyle: "solid" as const,
  shapeOpacity: 1,
  strokeOpacity: 1,
  flipX: false,
  flipY: false,
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
    polygonSides,
    starPoints,
    starPolygonPoints,
    arrowHead,
    arrowHeadStyle,
    sizeLinked,
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

      // Eraser tool — start erasing
      if (activeTool === "eraser") {
        setInteractionState({ mode: "erasing" })
        // Hit test immediately on pointer down
        const hit = [...shapes]
          .reverse()
          .find((s) => !s.locked && hitTestShape(worldPt, s))
        if (hit) {
          deleteShapes([hit.id])
          clearSelection()
        }
        return
      }

      if (activeTool === "select") {
        const screenPt = getPointerScreen(e)
        // Check resize handles on selected shapes
        const selShapes = shapes.filter((s) => selectedIds.has(s.id))
        if (selShapes.length === 1) {
          const first = selShapes[0]
          if (first) {
            const bbox = getShapeBoundingBox(first)
            const rotation = first.rotation || 0
            let handle = getResizeHandle(screenPt, bbox, camera, rotation)

            // Ignore edge handles if sizeLinked is true
            if (
              sizeLinked &&
              handle &&
              !["rotate", "nw", "ne", "sw", "se"].includes(handle)
            ) {
              handle = null
            }

            if (handle) {
              if (handle === "rotate") {
                setInteractionState({
                  mode: "rotating",
                  shapeId: first.id,
                  startShape: first,
                  startPointer: worldPt,
                })
              } else {
                setInteractionState({
                  mode: "resizing",
                  shapeId: first.id,
                  handle,
                  startShape: first,
                  startPointer: worldPt,
                })
              }
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
          const startShapes = new Map<ShapeId, Shape>(
            shapes.filter((s) => activeIds.includes(s.id)).map((s) => [s.id, s])
          )
          setInteractionState({
            mode: "moving",
            shapeIds: activeIds,
            startShapes,
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
        // Draw tool — create initial shape
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
          ...BASE_V12,
        }

        // Arrow and line use drawing-line mode (endpoint-based, not bbox-based)
        if (activeTool === "arrow") {
          const newShape: ArrowShape = {
            ...base,
            type: "arrow",
            startX: worldPt.x,
            startY: worldPt.y,
            endX: worldPt.x,
            endY: worldPt.y,
            arrowHead,
            headStyle: arrowHeadStyle,
          }
          setShape(newShape)
          setInteractionState({
            mode: "drawing-line",
            shape: newShape,
            startWorld: worldPt,
          })
          return
        }

        if (activeTool === "line") {
          const newShape: LineShape = {
            ...base,
            type: "line",
            startX: worldPt.x,
            startY: worldPt.y,
            endX: worldPt.x,
            endY: worldPt.y,
          }
          setShape(newShape)
          setInteractionState({
            mode: "drawing-line",
            shape: newShape,
            startWorld: worldPt,
          })
          return
        }

        const newShape: Shape =
          activeTool === "rect"
            ? { ...base, type: "rect" }
            : activeTool === "ellipse"
              ? { ...base, type: "ellipse" }
              : activeTool === "polygon"
                ? { ...base, type: "polygon", sides: polygonSides }
                : activeTool === "star"
                  ? { ...base, type: "star", points: starPoints }
                  : activeTool === "star-polygon"
                    ? {
                        ...base,
                        type: "star-polygon",
                        points: starPolygonPoints,
                      }
                    : activeTool === "diamond"
                      ? { ...base, type: "diamond" }
                      : activeTool === "triangle"
                        ? { ...base, type: "triangle" }
                        : activeTool === "text"
                          ? {
                              ...base,
                              type: "text",
                              content: "",
                              fontSize: 16,
                              fontFamily: "sans-serif",
                              textAlign: "left",
                              fontWeight: "normal",
                              fontStyle: "normal",
                            }
                          : { ...base, type: "pen", points: [worldPt] }

        setShape(newShape)
        setInteractionState({
          mode: "drawing",
          tool: activeTool as import("@/types/canvas").DrawTool,
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
      deleteShapes,
      getPointerWorld,
      getPointerScreen,
      currentUserId,
      setInteractionState,
      polygonSides,
      starPoints,
      starPolygonPoints,
      arrowHead,
      arrowHeadStyle,
      sizeLinked,
    ]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const screenPt = getPointerScreen(e)
      setLocalCursor(screenPt)

      const state = interactionRef.current
      const worldPt = getPointerWorld(e)
      const canvas = e.currentTarget

      if (state.mode === "idle") {
        let cursor = "default"
        if (activeTool === "pan") {
          cursor = "grab"
        } else if (activeTool === "select") {
          const selShapes = shapes.filter((s) => selectedIds.has(s.id))
          let hitHandle = false
          if (selShapes.length === 1 && selShapes[0]) {
            const bbox = getShapeBoundingBox(selShapes[0])
            const rotation = selShapes[0].rotation || 0
            let handle = getResizeHandle(screenPt, bbox, camera, rotation)

            if (
              sizeLinked &&
              handle &&
              !["rotate", "nw", "ne", "sw", "se"].includes(handle)
            ) {
              handle = null
            }

            if (handle) {
              cursor = handle === "rotate" ? "alias" : `${handle}-resize`
              hitHandle = true
            }
          }
          if (!hitHandle) {
            const hit = [...shapes]
              .reverse()
              .find((s) => !s.locked && hitTestShape(worldPt, s))
            if (hit && selectedIds.has(hit.id)) {
              cursor = "move"
            }
          }
        } else if (activeTool !== "eraser") {
          cursor = "crosshair"
        }
        canvas.style.cursor = cursor
      } else if (state.mode === "rotating") {
        canvas.style.cursor = "alias"
      } else if (state.mode === "resizing") {
        canvas.style.cursor = `${state.handle}-resize`
      } else if (state.mode === "moving") {
        canvas.style.cursor = "move"
      } else if (state.mode === "panning") {
        canvas.style.cursor = "grabbing"
      }

      if (state.mode === "panning") {
        const dx = e.clientX - state.startPointer.x
        const dy = e.clientY - state.startPointer.y
        setCamera({
          ...state.startCamera,
          x: state.startCamera.x + dx,
          y: state.startCamera.y + dy,
        })
      } else if (state.mode === "erasing") {
        // Hit test and delete any shape under the pointer while dragging
        const hit = [...shapes]
          .reverse()
          .find((s) => !s.locked && hitTestShape(worldPt, s))
        if (hit) {
          deleteShapes([hit.id])
        }
      } else if (state.mode === "drawing-line") {
        const { shape } = state
        if (shape.type === "arrow") {
          const updated: ArrowShape = {
            ...shape,
            endX: worldPt.x,
            endY: worldPt.y,
            updatedAt: Date.now(),
          }
          setShape(updated)
          setInteractionState({ ...state, shape: updated })
        } else {
          const updated: LineShape = {
            ...shape,
            endX: worldPt.x,
            endY: worldPt.y,
            updatedAt: Date.now(),
          }
          setShape(updated)
          setInteractionState({ ...state, shape: updated })
        }
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
            const startShape = state.startShapes.get(s.id)
            if (!startShape) return s

            const baseMoved = {
              ...s,
              x: startShape.x + dx,
              y: startShape.y + dy,
              updatedAt: Date.now(),
            }

            if (s.type === "pen" && startShape.type === "pen") {
              return {
                ...baseMoved,
                points: startShape.points.map((p) => ({
                  x: p.x + dx,
                  y: p.y + dy,
                })),
              }
            } else if (
              (s.type === "line" || s.type === "arrow") &&
              (startShape.type === "line" || startShape.type === "arrow")
            ) {
              return {
                ...baseMoved,
                startX: startShape.startX + dx,
                startY: startShape.startY + dy,
                endX: startShape.endX + dx,
                endY: startShape.endY + dy,
              }
            }
            return baseMoved
          })
        batchSetShapes(moved as Shape[])
      } else if (state.mode === "selecting") {
        setInteractionState({ ...state, currentWorld: worldPt })
      } else if (state.mode === "rotating") {
        const targetShape = shapes.find((s) => s.id === state.shapeId)
        if (targetShape) {
          const bbox = getShapeBoundingBox(state.startShape)
          const cx = bbox.x + bbox.width / 2
          const cy = bbox.y + bbox.height / 2

          const startAngle = Math.atan2(
            state.startPointer.y - cy,
            state.startPointer.x - cx
          )
          const currentAngle = Math.atan2(worldPt.y - cy, worldPt.x - cx)
          const delta = currentAngle - startAngle

          const { rotation } = applyRotation(
            state.startShape,
            { x: cx, y: cy },
            delta
          )
          setShape({ ...targetShape, rotation, updatedAt: Date.now() })
        }
      } else if (state.mode === "resizing") {
        const targetShape = shapes.find((s) => s.id === state.shapeId)
        if (targetShape) {
          const delta = {
            x: worldPt.x - state.startPointer.x,
            y: worldPt.y - state.startPointer.y,
          }
          const dims = applyResize(
            state.startShape,
            state.handle,
            delta,
            sizeLinked
          )
          setShape({ ...targetShape, ...dims, updatedAt: Date.now() } as Shape)
        }
      }
    },
    [
      activeTool,
      camera,
      selectedIds,
      getPointerWorld,
      getPointerScreen,
      setLocalCursor,
      setCamera,
      setShape,
      batchSetShapes,
      deleteShapes,
      shapes,
      setInteractionState,
      sizeLinked,
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
          shape.type !== "text" &&
          shape.width < MIN_SHAPE_SIZE &&
          shape.height < MIN_SHAPE_SIZE
        ) {
          deleteShapes([shape.id])
        } else {
          setSelection([shape.id])
          if (shape.type === "text") {
            if (shape.width < MIN_SHAPE_SIZE) {
              // Click-to-type: give a default width for wrapping
              setShape({
                ...shape,
                width: 250,
                height: shape.fontSize * 1.5,
              } as Shape)
            }
            setInteractionState({ mode: "editing-text", shapeId: shape.id })
            return
          }
        }
      } else if (state.mode === "drawing-line") {
        // Always keep arrow/line — even zero-length ones are finalized on click
        setSelection([state.shape.id])
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
      setShape,
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
      const hit = [...shapes].reverse().find((s) => hitTestShape(worldPt, s))
      if (hit) {
        if (hit.type === "text") {
          setInteractionState({ mode: "editing-text", shapeId: hit.id })
        } else {
          const bbox = getShapeBoundingBox(hit)
          const fontSize = 16
          const newTextShape: Shape = {
            ...BASE_V12,
            id: crypto.randomUUID() as ShapeId,
            type: "text",
            x: bbox.x,
            y: bbox.y + bbox.height / 2 - fontSize / 2,
            width: bbox.width,
            height: fontSize * 1.5,
            rotation: hit.rotation,
            fill: "#ffffff",
            stroke: "transparent",
            strokeWidth: 0,
            opacity: 1,
            locked: false,
            createdBy: currentUserId,
            updatedAt: Date.now(),
            content: "",
            fontSize,
            fontFamily: "Inter, sans-serif",
            textAlign: "center",
            fontWeight: "normal",
            fontStyle: "normal",
          }
          setShape(newTextShape)
          setSelection([newTextShape.id])
          setInteractionState({
            mode: "editing-text",
            shapeId: newTextShape.id,
          })
        }
      }
    },
    [camera, shapes, setInteractionState, currentUserId, setShape, setSelection]
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
