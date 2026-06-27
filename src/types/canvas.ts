// Branded type factory
type Brand<T, B extends string> = T & { readonly __brand: B }

export type ShapeId = Brand<string, "ShapeId">

// Tool enum replacement
export const TOOLS = [
  "select",
  "rect",
  "ellipse",
  "text",
  "pen",
  "pan",
] as const
export type Tool = (typeof TOOLS)[number]

export type DrawTool = Exclude<Tool, "select" | "pan">

export const RESIZE_HANDLES = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
] as const
export type ResizeHandle = (typeof RESIZE_HANDLES)[number]

export type Camera = {
  x: number
  y: number
  zoom: number
}

export type Point = {
  x: number
  y: number
}

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

type BaseShape = {
  readonly id: ShapeId
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  locked: boolean
  readonly createdBy: string
  updatedAt: number
}

export type RectShape = BaseShape & { type: "rect" }

export type EllipseShape = BaseShape & { type: "ellipse" }

export type TextShape = BaseShape & {
  type: "text"
  content: string
  fontSize: number
  fontFamily: string
  textAlign: "left" | "center" | "right"
}

export type PenShape = BaseShape & {
  type: "pen"
  points: Point[]
}

export type Shape = RectShape | EllipseShape | TextShape | PenShape

// Type guards
export function isTextShape(s: Shape): s is TextShape {
  return s.type === "text"
}

export function isPenShape(s: Shape): s is PenShape {
  return s.type === "pen"
}

export type SelectionState = {
  selectedIds: Set<ShapeId>
  selectionBox: BoundingBox | null
}

// Interaction state machine — drives the canvas engine in use-canvas-engine
export type InteractionState =
  | { mode: "idle" }
  | { mode: "panning"; startCamera: Camera; startPointer: Point }
  | { mode: "drawing"; tool: DrawTool; shape: Shape; startWorld: Point }
  | {
      mode: "moving"
      shapeIds: ShapeId[]
      startPositions: Map<ShapeId, Point>
      startPointer: Point
    }
  | {
      mode: "resizing"
      shapeId: ShapeId
      handle: ResizeHandle
      startShape: Shape
      startPointer: Point
    }
  | { mode: "selecting"; startWorld: Point; currentWorld: Point }
  | { mode: "editing-text"; shapeId: ShapeId }
