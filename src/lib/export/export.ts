"use client"
import { renderFrame } from "@/lib/canvas/renderer"
import type { Shape } from "@/types/canvas"

export type ExportFormat = "png" | "svg" | "pdf"

export function getShapesBoundingBox(shapes: Shape[], padding = 40) {
  if (shapes.length === 0) {
    return { x: 0, y: 0, w: 800, h: 600 }
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const shape of shapes) {
    let sx = shape.x
    let sy = shape.y
    let ex = shape.x + shape.width
    let ey = shape.y + shape.height

    if (shape.type === "arrow" || shape.type === "line") {
      sx = Math.min(shape.startX, shape.endX)
      ex = Math.max(shape.startX, shape.endX)
      sy = Math.min(shape.startY, shape.endY)
      ey = Math.max(shape.startY, shape.endY)
    }

    if (sx < minX) minX = sx
    if (sy < minY) minY = sy
    if (ex > maxX) maxX = ex
    if (ey > maxY) maxY = ey
  }

  return {
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + padding * 2,
    h: maxY - minY + padding * 2,
  }
}

export async function exportCanvas(
  shapes: Shape[],
  format: ExportFormat,
  background = "#1a1a2e"
): Promise<void> {
  const bbox = getShapesBoundingBox(shapes)

  const canvas = document.createElement("canvas")
  canvas.width = bbox.w
  canvas.height = bbox.h

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to create canvas context")

  // Fill background
  if (background && background !== "transparent") {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Render shapes using existing renderer
  renderFrame({
    ctx,
    shapes,
    camera: { x: -bbox.x, y: -bbox.y, zoom: 1 },
    selection: [],
    cursors: [],
    selectionBox: null,
  })

  // Export
  if (format === "png") {
    const dataUrl = canvas.toDataURL("image/png")
    downloadFile(dataUrl, "open-whiteboard-export.png")
  } else if (format === "svg") {
    // For V1, SVG export is a bit complex since we render via Canvas2D.
    // A true SVG export would need a dedicated shape-to-SVG mapping.
    // As a fallback for this milestone, we alert the user or embed the PNG in SVG.
    alert("SVG export is coming soon. Please use PNG.")
  } else if (format === "pdf") {
    // PDF export would typically use jsPDF.
    alert("PDF export is coming soon. Please use PNG.")
  }
}

function downloadFile(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
