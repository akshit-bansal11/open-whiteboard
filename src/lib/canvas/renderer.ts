import { GRID_SIZE } from "@/constants/canvas"
import type {
  ArrowShape,
  BaseShape,
  Camera,
  DiamondShape,
  ImageShape,
  LineShape,
  PolygonShape,
  Shape,
  StarPolygonShape,
  StarShape,
  TriangleShape,
} from "@/types/canvas"
import type { AwarenessState } from "@/types/user"
import { getShapeBoundingBox } from "./math"

type RenderParams = {
  ctx: CanvasRenderingContext2D
  shapes: Shape[]
  camera: Camera
  selection: string[]
  cursors: AwarenessState[]
  selectionBox: { x: number; y: number; width: number; height: number } | null
  isExport?: boolean
}

// ---------------------------------------------------------------------------
// Image decode cache — avoids re-decoding base64 on every rAF
// ---------------------------------------------------------------------------
const imageCache = new Map<string, HTMLImageElement>()

// ---------------------------------------------------------------------------
// Public render entry point
// ---------------------------------------------------------------------------

export function renderFrame({
  ctx,
  shapes,
  camera,
  selection,
  cursors,
  selectionBox,
  isExport = false,
}: RenderParams): void {
  const { zoom } = camera
  const canvas = ctx.canvas

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.setTransform(zoom, 0, 0, zoom, camera.x, camera.y)

  // Grid — only draw when zoomed in enough
  if (zoom > 0.3 && !isExport) {
    ctx.strokeStyle = "rgba(255,255,255,0.05)"
    ctx.lineWidth = 1 / zoom
    const startX = Math.floor(-camera.x / zoom / GRID_SIZE) * GRID_SIZE
    const startY = Math.floor(-camera.y / zoom / GRID_SIZE) * GRID_SIZE
    const endX = startX + canvas.width / zoom + GRID_SIZE
    const endY = startY + canvas.height / zoom + GRID_SIZE
    for (let x = startX; x < endX; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }
    for (let y = startY; y < endY; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }
  }

  // Sort shapes by updatedAt so newer shapes render on top
  const sorted = [...shapes].sort((a, b) => a.updatedAt - b.updatedAt)

  for (const shape of sorted) {
    ctx.save()

    const transformBox = getShapeBoundingBox(shape)
    const shouldTransform =
      shape.rotation !== 0 || shape.flipX === true || shape.flipY === true
    if (shouldTransform) {
      const cx = transformBox.x + transformBox.width / 2
      const cy = transformBox.y + transformBox.height / 2
      ctx.translate(cx, cy)
      if (shape.rotation !== 0) ctx.rotate(shape.rotation)
      ctx.scale(shape.flipX ? -1 : 1, shape.flipY ? -1 : 1)
      ctx.translate(-cx, -cy)
    }

    switch (shape.type) {
      case "rect":
        renderRect(ctx, shape)
        break
      case "ellipse":
        renderEllipse(ctx, shape)
        break
      case "text":
        ctx.font = `${shape.fontSize}px ${shape.fontFamily}`
        ctx.fillStyle = shape.fill
        ctx.textAlign = shape.textAlign
        ctx.textBaseline = "top"
        {
          const tx =
            shape.textAlign === "center"
              ? shape.x + shape.width / 2
              : shape.textAlign === "right"
                ? shape.x + shape.width
                : shape.x
          ctx.globalAlpha = getShapeOpacity(shape)
          ctx.fillText(shape.content, tx, shape.y, shape.width)
        }
        break
      case "pen":
        if (shape.points.length >= 2) {
          ctx.strokeStyle = shape.stroke
          ctx.lineWidth = shape.strokeWidth
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          if (shape.dashArray.length) ctx.setLineDash(shape.dashArray)
          ctx.globalAlpha = getStrokeOpacity(shape)
          const path = new Path2D()
          const first = shape.points[0]
          if (first) {
            path.moveTo(first.x, first.y)
            for (let i = 1; i < shape.points.length - 1; i++) {
              const curr = shape.points[i]
              const next = shape.points[i + 1]
              if (curr && next) {
                path.quadraticCurveTo(
                  curr.x,
                  curr.y,
                  (curr.x + next.x) / 2,
                  (curr.y + next.y) / 2
                )
              }
            }
            const last = shape.points[shape.points.length - 1]
            if (last) path.lineTo(last.x, last.y)
            ctx.stroke(path)
          }
          ctx.setLineDash([])
        }
        break
      case "diamond":
        renderDiamond(ctx, shape)
        break
      case "triangle":
        renderTriangle(ctx, shape)
        break
      case "polygon":
        renderPolygon(ctx, shape)
        break
      case "star":
        renderStar(ctx, shape)
        break
      case "star-polygon":
        renderStarPolygon(ctx, shape)
        break
      case "arrow":
        renderArrow(ctx, shape)
        break
      case "line":
        renderLine(ctx, shape)
        break
      case "image":
        renderImage(ctx, shape)
        break
    }

    // Selection outline
    if (!isExport && selection.includes(shape.id)) {
      ctx.setLineDash([])
      const bbox = getShapeRenderBbox(shape)
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([4 / zoom, 2 / zoom])
      ctx.strokeRect(
        bbox.x - 1 / zoom,
        bbox.y - 1 / zoom,
        bbox.w + 2 / zoom,
        bbox.h + 2 / zoom
      )
      ctx.setLineDash([])
    }

    ctx.restore()
  }

  // Rubber-band selection box
  if (!isExport && selectionBox) {
    ctx.strokeStyle = "#3b82f6"
    ctx.fillStyle = "rgba(59,130,246,0.08)"
    ctx.lineWidth = 1 / zoom
    ctx.fillRect(
      selectionBox.x,
      selectionBox.y,
      selectionBox.width,
      selectionBox.height
    )
    ctx.strokeRect(
      selectionBox.x,
      selectionBox.y,
      selectionBox.width,
      selectionBox.height
    )
  }

  ctx.restore()

  // Remote cursors — screen space
  if (!isExport) {
    for (const cursor of cursors) {
      if (!cursor.cursor) continue
      const sx = cursor.cursor.x * zoom + camera.x
      const sy = cursor.cursor.y * zoom + camera.y
      ctx.save()
      ctx.fillStyle = cursor.color
      ctx.beginPath()
      ctx.arc(sx, sy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = "12px sans-serif"
      ctx.fillStyle = cursor.color
      ctx.fillText(cursor.name, sx + 10, sy + 4)
      ctx.restore()
    }
  }
}

// ---------------------------------------------------------------------------
// Per-shape renderers
// ---------------------------------------------------------------------------

function renderRect(
  ctx: CanvasRenderingContext2D,
  shape: BaseShape & { type: "rect" }
) {
  ctx.beginPath()
  if (shape.cornerRadius > 0) {
    ctx.roundRect(
      shape.x,
      shape.y,
      shape.width,
      shape.height,
      shape.cornerRadius
    )
  } else {
    ctx.rect(shape.x, shape.y, shape.width, shape.height)
  }
  applyFillStroke(ctx, shape)
}

function renderEllipse(
  ctx: CanvasRenderingContext2D,
  shape: BaseShape & { type: "ellipse" }
) {
  ctx.beginPath()
  ctx.ellipse(
    shape.x + shape.width / 2,
    shape.y + shape.height / 2,
    shape.width / 2,
    shape.height / 2,
    0,
    0,
    Math.PI * 2
  )
  applyFillStroke(ctx, shape)
}

function renderDiamond(ctx: CanvasRenderingContext2D, shape: DiamondShape) {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  ctx.beginPath()
  ctx.moveTo(cx, shape.y)
  ctx.lineTo(shape.x + shape.width, cy)
  ctx.lineTo(cx, shape.y + shape.height)
  ctx.lineTo(shape.x, cy)
  ctx.closePath()
  applyFillStroke(ctx, shape)
}

function renderTriangle(ctx: CanvasRenderingContext2D, shape: TriangleShape) {
  ctx.beginPath()
  ctx.moveTo(shape.x + shape.width / 2, shape.y)
  ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
  ctx.lineTo(shape.x, shape.y + shape.height)
  ctx.closePath()
  applyFillStroke(ctx, shape)
}

function renderStar(ctx: CanvasRenderingContext2D, shape: StarShape) {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  const outerR = Math.min(shape.width, shape.height) / 2
  const innerR = outerR * 0.4
  const n = shape.points
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const angle = (i * Math.PI) / n - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  applyFillStroke(ctx, shape)
}

function renderPolygon(ctx: CanvasRenderingContext2D, shape: PolygonShape) {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  const r = Math.min(shape.width, shape.height) / 2
  const n = shape.sides

  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    // start pointing up
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  applyFillStroke(ctx, shape)
}

function renderStarPolygon(
  ctx: CanvasRenderingContext2D,
  shape: StarPolygonShape
) {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  const r = Math.min(shape.width, shape.height) / 2
  const n = shape.points

  const step = n >= 5 ? Math.floor((n - 1) / 2) : 1
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const numPaths = gcd(n, step)

  ctx.beginPath()
  for (let p = 0; p < numPaths; p++) {
    const pointsInPath = n / numPaths
    for (let i = 0; i <= pointsInPath; i++) {
      const v = (p + i * step) % n
      const angle = (v * 2 * Math.PI) / n - Math.PI / 2
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  applyFillStroke(ctx, shape)
}

function renderArrow(ctx: CanvasRenderingContext2D, shape: ArrowShape) {
  const { startX, startY, endX, endY } = shape
  applyStrokeDash(ctx, shape)
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.strokeStyle = shape.stroke
  ctx.lineWidth = shape.strokeWidth
  ctx.globalAlpha = getStrokeOpacity(shape)
  ctx.stroke()
  ctx.setLineDash([])

  const angle = Math.atan2(endY - startY, endX - startX)
  const headLen = 14
  if (shape.arrowHead === "end" || shape.arrowHead === "both") {
    drawArrowHead(ctx, endX, endY, angle, headLen, shape)
  }
  if (shape.arrowHead === "start" || shape.arrowHead === "both") {
    drawArrowHead(ctx, startX, startY, angle + Math.PI, headLen, shape)
  }
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  shape: ArrowShape
) {
  ctx.beginPath()
  const style = shape.headStyle || "classic"

  if (style === "classic") {
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - len * Math.cos(angle - Math.PI / 6),
      y - len * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - len * Math.cos(angle + Math.PI / 6),
      y - len * Math.sin(angle + Math.PI / 6)
    )
    ctx.strokeStyle = shape.stroke
    ctx.lineWidth = shape.strokeWidth
    ctx.globalAlpha = getStrokeOpacity(shape)
    ctx.stroke()
  } else if (style === "triangle") {
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - len * Math.cos(angle - Math.PI / 6),
      y - len * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      x - len * Math.cos(angle + Math.PI / 6),
      y - len * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fillStyle = shape.stroke
    ctx.globalAlpha = getStrokeOpacity(shape)
    ctx.fill()
  } else if (style === "stealth") {
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - len * Math.cos(angle - Math.PI / 6),
      y - len * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(x - len * 0.6 * Math.cos(angle), y - len * 0.6 * Math.sin(angle))
    ctx.lineTo(
      x - len * Math.cos(angle + Math.PI / 6),
      y - len * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fillStyle = shape.stroke
    ctx.globalAlpha = getStrokeOpacity(shape)
    ctx.fill()
  } else if (style === "diamond") {
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - len * 0.7 * Math.cos(angle - Math.PI / 8),
      y - len * 0.7 * Math.sin(angle - Math.PI / 8)
    )
    ctx.lineTo(x - len * 1.4 * Math.cos(angle), y - len * 1.4 * Math.sin(angle))
    ctx.lineTo(
      x - len * 0.7 * Math.cos(angle + Math.PI / 8),
      y - len * 0.7 * Math.sin(angle + Math.PI / 8)
    )
    ctx.closePath()
    ctx.fillStyle = shape.stroke
    ctx.globalAlpha = getStrokeOpacity(shape)
    ctx.fill()
  }
}

function renderLine(ctx: CanvasRenderingContext2D, shape: LineShape) {
  applyStrokeDash(ctx, shape)
  ctx.beginPath()
  ctx.moveTo(shape.startX, shape.startY)
  ctx.lineTo(shape.endX, shape.endY)
  ctx.strokeStyle = shape.stroke
  ctx.lineWidth = shape.strokeWidth
  ctx.globalAlpha = getStrokeOpacity(shape)
  ctx.stroke()
  ctx.setLineDash([])
}

function renderImage(ctx: CanvasRenderingContext2D, shape: ImageShape) {
  const img = imageCache.get(shape.id)
  if (!img) {
    const newImg = new Image()
    newImg.src = shape.src
    newImg.onload = () => imageCache.set(shape.id, newImg)
    return // skip this frame — will render next rAF once decoded
  }
  if (img.complete) {
    ctx.globalAlpha = getShapeOpacity(shape)
    ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Applies fill and stroke to the current path, reading dashArray and fillStyle.
 */
function applyFillStroke(ctx: CanvasRenderingContext2D, shape: BaseShape) {
  if (shape.fillStyle !== "none" && shape.fill !== "transparent") {
    ctx.fillStyle = shape.fill
    ctx.globalAlpha = getShapeOpacity(shape)
    ctx.fill()
  }
  if (shape.strokeWidth > 0) {
    applyStrokeDash(ctx, shape)
    ctx.strokeStyle = shape.stroke
    ctx.lineWidth = shape.strokeWidth
    ctx.globalAlpha = getStrokeOpacity(shape)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

function getShapeOpacity(shape: BaseShape): number {
  return shape.shapeOpacity ?? shape.opacity ?? 1
}

function getStrokeOpacity(shape: BaseShape): number {
  return shape.strokeOpacity ?? shape.opacity ?? 1
}

function applyStrokeDash(ctx: CanvasRenderingContext2D, shape: BaseShape) {
  if (shape.dashArray.length === 0) return
  if (shape.dashArray[0] === 0) {
    ctx.lineCap = "round"
  }
  ctx.setLineDash(shape.dashArray)
}

/**
 * Returns a simple x/y/w/h for selection outline rendering.
 * Arrow and line shapes use startX/endX rather than x/width.
 */
function getShapeRenderBbox(shape: Shape): {
  x: number
  y: number
  w: number
  h: number
} {
  if (shape.type === "arrow" || shape.type === "line") {
    return {
      x: Math.min(shape.startX, shape.endX),
      y: Math.min(shape.startY, shape.endY),
      w: Math.abs(shape.endX - shape.startX),
      h: Math.abs(shape.endY - shape.startY),
    }
  }
  return { x: shape.x, y: shape.y, w: shape.width, h: shape.height }
}
