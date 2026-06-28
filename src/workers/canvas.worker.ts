import { GRID_SIZE } from "@/constants/canvas"
import type { Camera, Shape } from "@/types/canvas"
import type { AwarenessState } from "@/types/user"
import type { WorkerInMsg } from "./canvas.worker.types"

let ctx: OffscreenCanvasRenderingContext2D | null = null
let pendingRender: Parameters<typeof render>[0] | null = null
let rafScheduled = false

function scheduleRender(params: Parameters<typeof render>[0]) {
  pendingRender = params
  if (!rafScheduled) {
    rafScheduled = true
    self.requestAnimationFrame(() => {
      rafScheduled = false
      if (pendingRender) {
        render(pendingRender)
        pendingRender = null
      }
    })
  }
}

function render(params: {
  shapes: Shape[]
  camera: Camera
  selection: string[]
  cursors: AwarenessState[]
  selectionBox: { x: number; y: number; width: number; height: number } | null
}) {
  if (!ctx) return
  const { shapes, camera, selection, cursors, selectionBox } = params
  const { zoom } = camera
  const canvas = ctx.canvas

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.setTransform(zoom, 0, 0, zoom, camera.x, camera.y)

  // Grid — only draw when zoomed in enough to see it
  if (zoom > 0.3) {
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
    ctx.globalAlpha = shape.opacity

    // Apply rotation around shape center
    if (shape.rotation !== 0) {
      const cx = shape.x + shape.width / 2
      const cy = shape.y + shape.height / 2
      ctx.translate(cx, cy)
      ctx.rotate(shape.rotation)
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
        renderText(ctx, shape)
        break
      case "pen":
        renderPen(ctx, shape)
        break
    }

    // Selection outline
    if (selection.includes(shape.id)) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([4 / zoom, 2 / zoom])
      ctx.strokeRect(
        shape.x - 1 / zoom,
        shape.y - 1 / zoom,
        shape.width + 2 / zoom,
        shape.height + 2 / zoom
      )
      ctx.setLineDash([])
    }

    ctx.restore()
  }

  // Rubber-band selection box
  if (selectionBox) {
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

  // Cursor layer — screen space, so reset transform first
  for (const cursor of cursors) {
    if (!cursor.cursor) continue
    const { x, y } = cursor.cursor

    ctx.save()
    ctx.fillStyle = cursor.color
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = "12px sans-serif"
    ctx.fillStyle = cursor.color
    ctx.fillText(cursor.name, x + 10, y + 4)
    ctx.restore()
  }
}

// ── Shape renderers ─────────────────────────────────────────────────────────

function renderRect(
  context: OffscreenCanvasRenderingContext2D,
  shape: import("@/types/canvas").RectShape
) {
  context.fillStyle = shape.fill
  context.strokeStyle = shape.stroke
  context.lineWidth = shape.strokeWidth
  if (shape.fill !== "transparent")
    context.fillRect(shape.x, shape.y, shape.width, shape.height)
  if (shape.strokeWidth > 0)
    context.strokeRect(shape.x, shape.y, shape.width, shape.height)
}

function renderEllipse(
  context: OffscreenCanvasRenderingContext2D,
  shape: import("@/types/canvas").EllipseShape
) {
  context.fillStyle = shape.fill
  context.strokeStyle = shape.stroke
  context.lineWidth = shape.strokeWidth
  context.beginPath()
  context.ellipse(
    shape.x + shape.width / 2,
    shape.y + shape.height / 2,
    shape.width / 2,
    shape.height / 2,
    0,
    0,
    Math.PI * 2
  )
  if (shape.fill !== "transparent") context.fill()
  if (shape.strokeWidth > 0) context.stroke()
}

function renderText(
  context: OffscreenCanvasRenderingContext2D,
  shape: import("@/types/canvas").TextShape
) {
  context.font = `${shape.fontSize}px ${shape.fontFamily}`
  context.fillStyle = shape.fill
  context.textAlign = shape.textAlign
  context.textBaseline = "top"
  const x =
    shape.textAlign === "center"
      ? shape.x + shape.width / 2
      : shape.textAlign === "right"
        ? shape.x + shape.width
        : shape.x
  context.fillText(shape.content, x, shape.y, shape.width)
}

function renderPen(
  context: OffscreenCanvasRenderingContext2D,
  shape: import("@/types/canvas").PenShape
) {
  if (shape.points.length < 2) return
  context.strokeStyle = shape.stroke
  context.lineWidth = shape.strokeWidth
  context.lineCap = "round"
  context.lineJoin = "round"
  const path = new Path2D()
  const first = shape.points[0]
  if (!first) return
  path.moveTo(first.x, first.y)
  for (let i = 1; i < shape.points.length - 1; i++) {
    const curr = shape.points[i]
    const next = shape.points[i + 1]
    if (!curr || !next) continue
    const mx = (curr.x + next.x) / 2
    const my = (curr.y + next.y) / 2
    path.quadraticCurveTo(curr.x, curr.y, mx, my)
  }
  const last = shape.points[shape.points.length - 1]
  if (last) path.lineTo(last.x, last.y)
  context.stroke(path)
}

// ── Message handler ─────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<WorkerInMsg>) => {
  const msg = e.data
  if (msg.type === "init") {
    ctx = msg.canvas.getContext("2d")
    self.postMessage({ type: "ready" })
  } else if (msg.type === "resize") {
    if (ctx) {
      ctx.canvas.width = msg.width
      ctx.canvas.height = msg.height
    }
  } else if (msg.type === "render") {
    scheduleRender(msg)
  }
}
