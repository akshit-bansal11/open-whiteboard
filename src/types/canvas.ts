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
  "diamond",
  "triangle",
  "polygon",
  "star",
  "star-polygon",
  "arrow",
  "line",
  "image",
  "eraser",
] as const
export type Tool = (typeof TOOLS)[number]

export type DrawTool = Exclude<Tool, "select" | "pan" | "eraser">

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

export type BaseShape = {
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
  shapeOpacity: number
  strokeOpacity: number
  locked: boolean
  readonly createdBy: string
  updatedAt: number
  cornerRadius: number
  dashArray: number[]
  fillStyle: "solid" | "hachure" | "none"
  flipX: boolean
  flipY: boolean
}

export type RectShape = BaseShape & { type: "rect" }

export type EllipseShape = BaseShape & { type: "ellipse" }

export type TextShape = BaseShape & {
  type: "text"
  content: string
  fontSize: number
  fontFamily: string
  textAlign: "left" | "center" | "right"
  fontWeight:
    | "normal"
    | "bold"
    | "lighter"
    | "bolder"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"
  fontStyle: "normal" | "italic" | "oblique"
}

export type PenShape = BaseShape & {
  type: "pen"
  points: Point[]
}

export type DiamondShape = BaseShape & { type: "diamond" }

export type TriangleShape = BaseShape & { type: "triangle" }

export type PolygonShape = BaseShape & { type: "polygon"; sides: number }

export type StarShape = BaseShape & { type: "star"; points: number }

export type StarPolygonShape = BaseShape & {
  type: "star-polygon"
  points: number
}

export type ArrowShape = BaseShape & {
  type: "arrow"
  startX: number
  startY: number
  endX: number
  endY: number
  arrowHead: "none" | "start" | "end" | "both"
  headStyle: "classic" | "triangle" | "stealth" | "diamond"
}

export type LineShape = BaseShape & {
  type: "line"
  startX: number
  startY: number
  endX: number
  endY: number
}

export type ImageShape = BaseShape & {
  type: "image"
  src: string
  naturalWidth: number
  naturalHeight: number
}

export type Shape =
  | RectShape
  | EllipseShape
  | TextShape
  | PenShape
  | DiamondShape
  | TriangleShape
  | PolygonShape
  | StarShape
  | StarPolygonShape
  | ArrowShape
  | LineShape
  | ImageShape

// Type guards
export function isTextShape(s: Shape): s is TextShape {
  return s.type === "text"
}

export function isPenShape(s: Shape): s is PenShape {
  return s.type === "pen"
}

export function isPolygonShape(s: Shape): s is PolygonShape {
  return s.type === "polygon"
}

export function isArrowShape(s: Shape): s is ArrowShape {
  return s.type === "arrow"
}

export function isLineShape(s: Shape): s is LineShape {
  return s.type === "line"
}

export function isImageShape(s: Shape): s is ImageShape {
  return s.type === "image"
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
      startShapes: Map<ShapeId, Shape>
      startPointer: Point
    }
  | {
      mode: "resizing"
      shapeId: ShapeId
      handle: ResizeHandle
      startShape: Shape
      startPointer: Point
    }
  | {
      mode: "rotating"
      shapeId: ShapeId
      startShape: Shape
      startPointer: Point
    }
  | { mode: "selecting"; startWorld: Point; currentWorld: Point }
  | { mode: "editing-text"; shapeId: ShapeId }
  | { mode: "erasing" }
  | {
      mode: "drawing-line"
      shape: LineShape | ArrowShape
      startWorld: Point
    }
