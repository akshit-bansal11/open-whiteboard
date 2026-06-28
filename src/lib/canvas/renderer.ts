import { GRID_SIZE } from "@/constants/canvas"
import type { Camera, Shape } from "@/types/canvas"
import type { AwarenessState } from "@/types/user"

type RenderParams = {
  ctx: CanvasRenderingContext2D
  shapes: Shape[]
  camera: Camera
  selection: string[]
  cursors: AwarenessState[]
  selectionBox: { x: number; y: number; width: number; height: number } | null
}

export function renderFrame({
  ctx,
  shapes,
  camera,
  selection,
  cursors,
  selectionBox,
}: RenderParams): void {
  const { zoom } = camera
  const canvas = ctx.canvas

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.setTransform(zoom, 0, 0, zoom, camera.x, camera.y)

  // Grid — only draw when zoomed in enough
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

    if (shape.rotation !== 0) {
      const cx = shape.x + shape.width / 2
      const cy = shape.y + shape.height / 2
      ctx.translate(cx, cy)
      ctx.rotate(shape.rotation)
      ctx.translate(-cx, -cy)
    }

    switch (shape.type) {
      case "rect":
        ctx.fillStyle = shape.fill
        ctx.strokeStyle = shape.stroke
        ctx.lineWidth = shape.strokeWidth
        if (shape.fill !== "transparent")
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
        if (shape.strokeWidth > 0)
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
        break

      case "ellipse":
        ctx.fillStyle = shape.fill
        ctx.strokeStyle = shape.stroke
        ctx.lineWidth = shape.strokeWidth
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
        if (shape.fill !== "transparent") ctx.fill()
        if (shape.strokeWidth > 0) ctx.stroke()
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
          ctx.fillText(shape.content, tx, shape.y, shape.width)
        }
        break

      case "pen":
        if (shape.points.length >= 2) {
          ctx.strokeStyle = shape.stroke
          ctx.lineWidth = shape.strokeWidth
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
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
        }
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

  // Remote cursors — screen space
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
