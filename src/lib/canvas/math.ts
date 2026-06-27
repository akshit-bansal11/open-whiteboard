import { HANDLE_SIZE, MIN_SHAPE_SIZE } from "@/constants/canvas"
import type {
  BoundingBox,
  Camera,
  Point,
  ResizeHandle,
  Shape,
} from "@/types/canvas"

// ---------------------------------------------------------------------------
// Coordinate conversion
// ---------------------------------------------------------------------------

/**
 * Converts a screen-space point to world-space coordinates.
 *
 * @param point - The point in screen (pixel) coordinates.
 * @param camera - The current camera state (x, y offset + zoom level).
 * @returns The equivalent point in world coordinates.
 *
 * @example
 * screenToWorld({ x: 200, y: 150 }, { x: 100, y: 50, zoom: 2 })
 * // → { x: 50, y: 50 }
 */
export function screenToWorld(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  }
}

/**
 * Converts a world-space point to screen-space coordinates.
 *
 * @param point - The point in world coordinates.
 * @param camera - The current camera state.
 * @returns The equivalent point in screen (pixel) coordinates.
 *
 * @example
 * worldToScreen({ x: 50, y: 50 }, { x: 100, y: 50, zoom: 2 })
 * // → { x: 200, y: 150 }
 */
export function worldToScreen(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y,
  }
}

// ---------------------------------------------------------------------------
// Grid snapping
// ---------------------------------------------------------------------------

/**
 * Snaps a single numeric value to the nearest grid line.
 *
 * @param value - The value to snap (world-space coordinate).
 * @param gridSize - The grid cell size in world units.
 * @returns The nearest grid-aligned value.
 *
 * @example
 * snapToGrid(23, 20) // → 20
 * snapToGrid(31, 20) // → 40
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// ---------------------------------------------------------------------------
// Bounding box helpers
// ---------------------------------------------------------------------------

/**
 * Returns the axis-aligned bounding box for a shape.
 *
 * For pen shapes the bounding box is derived from the point cloud;
 * for all other variants it is the shape's own x/y/width/height.
 *
 * @param shape - Any canvas shape.
 * @returns The axis-aligned bounding box in world coordinates.
 */
export function getShapeBoundingBox(shape: Shape): BoundingBox {
  if (shape.type === "pen") {
    if (shape.points.length === 0) {
      return { x: shape.x, y: shape.y, width: 0, height: 0 }
    }

    let minX = shape.points[0]?.x ?? 0
    let minY = shape.points[0]?.y ?? 0
    let maxX = minX
    let maxY = minY

    for (const p of shape.points) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
}

/**
 * Returns the union bounding box that encloses all provided shapes.
 *
 * @param shapes - One or more shapes. Returns `null` when the array is empty.
 * @returns The smallest bounding box containing all shapes, or `null`.
 */
export function getSelectionBoundingBox(shapes: Shape[]): BoundingBox | null {
  if (shapes.length === 0) return null

  const first = getShapeBoundingBox(shapes[0] as Shape)
  let minX = first.x
  let minY = first.y
  let maxX = first.x + first.width
  let maxY = first.y + first.height

  for (let i = 1; i < shapes.length; i++) {
    const bb = getShapeBoundingBox(shapes[i] as Shape)
    if (bb.x < minX) minX = bb.x
    if (bb.y < minY) minY = bb.y
    if (bb.x + bb.width > maxX) maxX = bb.x + bb.width
    if (bb.y + bb.height > maxY) maxY = bb.y + bb.height
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

// ---------------------------------------------------------------------------
// Hit testing
// ---------------------------------------------------------------------------

/**
 * Rotates a point around a pivot by the given angle (radians).
 *
 * @param point - The point to rotate.
 * @param pivot - The center of rotation.
 * @param angle - Rotation angle in radians (positive = counter-clockwise).
 * @returns The rotated point.
 */
function rotatePoint(point: Point, pivot: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - pivot.x
  const dy = point.y - pivot.y
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  }
}

/**
 * Tests whether a world-space point falls inside a shape (including rotation).
 *
 * Strategy: inverse-rotate the test point around the shape's center by
 * `-shape.rotation`, then do a standard AABB check against the unrotated bbox.
 * This is cheaper than rotating the shape's corners.
 *
 * @param point - The world-space point to test.
 * @param shape - The shape to test against.
 * @returns `true` if the point is inside the shape's footprint.
 */
export function hitTestShape(point: Point, shape: Shape): boolean {
  const bbox = getShapeBoundingBox(shape)
  const cx = bbox.x + bbox.width / 2
  const cy = bbox.y + bbox.height / 2
  const center: Point = { x: cx, y: cy }

  // Inverse-rotate the point by -rotation so we can use a simple AABB check
  const local = rotatePoint(point, center, -shape.rotation)

  return (
    local.x >= bbox.x &&
    local.x <= bbox.x + bbox.width &&
    local.y >= bbox.y &&
    local.y <= bbox.y + bbox.height
  )
}

// ---------------------------------------------------------------------------
// Resize handles
// ---------------------------------------------------------------------------

/** The 8 handle positions as fractions of bbox width/height (0–1). */
const HANDLE_POSITIONS: Record<ResizeHandle, { rx: number; ry: number }> = {
  nw: { rx: 0, ry: 0 },
  n: { rx: 0.5, ry: 0 },
  ne: { rx: 1, ry: 0 },
  e: { rx: 1, ry: 0.5 },
  se: { rx: 1, ry: 1 },
  s: { rx: 0.5, ry: 1 },
  sw: { rx: 0, ry: 1 },
  w: { rx: 0, ry: 0.5 },
} as const

/**
 * Returns the screen-space position of a specific handle on a bounding box.
 *
 * @param handle - The handle identifier.
 * @param bbox - The world-space bounding box.
 * @param camera - Current camera for world→screen conversion.
 * @returns The handle centre in screen coordinates.
 */
function getHandleScreenPos(
  handle: ResizeHandle,
  bbox: BoundingBox,
  camera: Camera
): Point {
  const { rx, ry } = HANDLE_POSITIONS[handle]
  const worldPos: Point = {
    x: bbox.x + bbox.width * rx,
    y: bbox.y + bbox.height * ry,
  }
  return worldToScreen(worldPos, camera)
}

/**
 * Determines which resize handle (if any) a screen-space point is within.
 *
 * The hit radius is `HANDLE_SIZE / 2` pixels in screen space,
 * matching the visual handle square size.
 *
 * @param point - The pointer position in screen coordinates.
 * @param bbox - The world-space bounding box of the selection.
 * @param zoom - Current zoom level (used for world→screen conversion via camera).
 * @param camera - Current camera for coordinate conversion.
 * @returns The matching {@link ResizeHandle}, or `null` if no handle was hit.
 */
export function getResizeHandle(
  point: Point,
  bbox: BoundingBox,
  camera: Camera
): ResizeHandle | null {
  const hitRadius = HANDLE_SIZE / 2

  for (const handle of Object.keys(HANDLE_POSITIONS) as ResizeHandle[]) {
    const screenPos = getHandleScreenPos(handle, bbox, camera)
    const dx = point.x - screenPos.x
    const dy = point.y - screenPos.y
    if (Math.abs(dx) <= hitRadius && Math.abs(dy) <= hitRadius) {
      return handle
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Resize application
// ---------------------------------------------------------------------------

/**
 * Computes new shape geometry after a resize drag.
 *
 * The function respects the dragged handle's anchor point — opposite corner/edge
 * stays fixed. When `aspectLock` is `true` the aspect ratio of the original
 * shape is preserved.
 *
 * @param shape - The shape being resized (read-only; a new object is returned).
 * @param handle - Which handle is being dragged.
 * @param delta - Mouse displacement in world coordinates since drag start.
 * @param aspectLock - Whether to lock the aspect ratio.
 * @returns A partial shape containing only the mutated geometry fields.
 */
export function applyResize(
  shape: Shape,
  handle: ResizeHandle,
  delta: Point,
  aspectLock: boolean
): Pick<Shape, "x" | "y" | "width" | "height"> {
  let { x, y, width, height } = shape
  const aspect = width !== 0 ? width / height : 1

  // Apply the delta to the relevant edges based on which handle is active
  if (handle === "nw" || handle === "n" || handle === "ne") {
    y += delta.y
    height -= delta.y
  }
  if (handle === "se" || handle === "s" || handle === "sw") {
    height += delta.y
  }
  if (handle === "nw" || handle === "w" || handle === "sw") {
    x += delta.x
    width -= delta.x
  }
  if (handle === "ne" || handle === "e" || handle === "se") {
    width += delta.x
  }

  // Aspect lock — adjust the secondary axis to maintain the original ratio
  if (aspectLock && aspect !== 0) {
    const isCorner =
      handle === "nw" || handle === "ne" || handle === "se" || handle === "sw"
    if (isCorner) {
      // Drive height from width
      const newHeight = width / aspect
      if (handle === "nw" || handle === "ne") {
        y += height - newHeight // keep bottom edge fixed
      }
      height = newHeight
    }
  }

  // Clamp to minimum size, flipping anchor when dimension goes negative
  if (width < MIN_SHAPE_SIZE) {
    if (handle === "nw" || handle === "w" || handle === "sw") {
      x = x + width - MIN_SHAPE_SIZE
    }
    width = MIN_SHAPE_SIZE
  }
  if (height < MIN_SHAPE_SIZE) {
    if (handle === "nw" || handle === "n" || handle === "ne") {
      y = y + height - MIN_SHAPE_SIZE
    }
    height = MIN_SHAPE_SIZE
  }

  return { x, y, width, height }
}

// ---------------------------------------------------------------------------
// Rotation
// ---------------------------------------------------------------------------

const TWO_PI = Math.PI * 2

/**
 * Returns an updated shape with its rotation incremented by `angleDelta`.
 *
 * The resulting `rotation` is normalised to the range [0, 2π).
 *
 * @param shape - The shape to rotate (read-only; a new object is returned).
 * @param _center - The pivot point. Currently the shape's own centre is used
 *   automatically; this parameter is reserved for future multi-shape rotation.
 * @param angleDelta - The angle to add in radians.
 * @returns A partial shape with the updated `rotation` field.
 */
export function applyRotation(
  shape: Shape,
  _center: Point,
  angleDelta: number
): Pick<Shape, "rotation"> {
  const raw = shape.rotation + angleDelta
  // Normalise to [0, 2π)
  const rotation = ((raw % TWO_PI) + TWO_PI) % TWO_PI
  return { rotation }
}
