"use client"
import { renderFrame } from "@/lib/canvas/renderer"
import type {
  ArrowShape,
  ImageShape,
  LineShape,
  PenShape,
  RectShape,
  Shape,
  StarShape,
  TextShape,
} from "@/types/canvas"

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
    isExport: true,
  })

  // Export
  if (format === "png") {
    const dataUrl = canvas.toDataURL("image/png")
    downloadFile(dataUrl, "open-whiteboard-export.png")
  } else if (format === "svg") {
    const svgStr = generateSVG(shapes, bbox, background)
    const blob = new Blob([svgStr], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    downloadFile(url, "open-whiteboard-export.svg")
    URL.revokeObjectURL(url)
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

function generateSVG(
  shapes: Shape[],
  bbox: { x: number; y: number; w: number; h: number },
  background: string
): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bbox.w} ${bbox.h}" width="${bbox.w}" height="${bbox.h}">
`

  if (background && background !== "transparent") {
    svg += `  <rect width="100%" height="100%" fill="${background}" />
`
  }

  svg += `  <g transform="translate(${-bbox.x}, ${-bbox.y})">
`

  for (const shape of shapes) {
    let node = ""
    const cx = shape.x + shape.width / 2
    const cy = shape.y + shape.height / 2
    const rotation = shape.rotation
      ? ` transform="rotate(${(shape.rotation * 180) / Math.PI} ${cx} ${cy})"`
      : ""

    const commonStyle = `fill="${shape.fillStyle === "solid" ? shape.fill : "none"}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${shape.shapeOpacity ?? 1}" stroke-dasharray="${shape.dashArray?.join(",") ?? ""}"`

    switch (shape.type) {
      case "rect":
        if ((shape as RectShape).cornerRadius > 0) {
          node = `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${(shape as RectShape).cornerRadius}" ry="${(shape as RectShape).cornerRadius}" ${commonStyle}${rotation} />`
        } else {
          node = `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${commonStyle}${rotation} />`
        }
        break
      case "ellipse":
        node = `<ellipse cx="${cx}" cy="${cy}" rx="${shape.width / 2}" ry="${shape.height / 2}" ${commonStyle}${rotation} />`
        break
      case "text": {
        const textShape = shape as TextShape
        node = `<text x="${shape.x}" y="${shape.y + textShape.fontSize}" font-family="sans-serif" font-size="${textShape.fontSize}px" fill="${shape.stroke}"${rotation}>${textShape.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`
        break
      }
      case "pen": {
        const penShape = shape as PenShape
        if (penShape.points.length > 0) {
          let d = `M ${penShape.points[0].x} ${penShape.points[0].y} `
          for (let i = 1; i < penShape.points.length - 1; i++) {
            const curr = penShape.points[i]
            const next = penShape.points[i + 1]
            d += `Q ${curr.x} ${curr.y} ${(curr.x + next.x) / 2} ${(curr.y + next.y) / 2} `
          }
          const last = penShape.points[penShape.points.length - 1]
          d += `L ${last.x} ${last.y}`
          node = `<path d="${d}" ${commonStyle} fill="none" stroke-linecap="round" stroke-linejoin="round"${rotation} />`
        }
        break
      }
      case "line": {
        const lineShape = shape as LineShape
        node = `<line x1="${lineShape.startX}" y1="${lineShape.startY}" x2="${lineShape.endX}" y2="${lineShape.endY}" ${commonStyle}${rotation} />`
        break
      }
      case "arrow": {
        const arrowShape = shape as ArrowShape
        node = `<line x1="${arrowShape.startX}" y1="${arrowShape.startY}" x2="${arrowShape.endX}" y2="${arrowShape.endY}" ${commonStyle}${rotation} />`
        // Draw arrowhead at end
        const angle = Math.atan2(
          arrowShape.endY - arrowShape.startY,
          arrowShape.endX - arrowShape.startX
        )
        const headlen = 15
        const x1 = arrowShape.endX - headlen * Math.cos(angle - Math.PI / 6)
        const y1 = arrowShape.endY - headlen * Math.sin(angle - Math.PI / 6)
        const x2 = arrowShape.endX - headlen * Math.cos(angle + Math.PI / 6)
        const y2 = arrowShape.endY - headlen * Math.sin(angle + Math.PI / 6)
        node += `
    <polygon points="${arrowShape.endX},${arrowShape.endY} ${x1},${y1} ${x2},${y2}" fill="${shape.stroke}" ${rotation} />`
        break
      }
      case "diamond": {
        const d_pts = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}`
        node = `<polygon points="${d_pts}" ${commonStyle}${rotation} />`
        break
      }
      case "triangle": {
        const t_pts = `${cx},${shape.y} ${shape.x + shape.width},${shape.y + shape.height} ${shape.x},${shape.y + shape.height}`
        node = `<polygon points="${t_pts}" ${commonStyle}${rotation} />`
        break
      }
      case "star": {
        const points = (shape as StarShape).points || 5
        const outer = Math.min(shape.width, shape.height) / 2
        const inner = outer / 2
        let s_pts = ""
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outer : inner
          const a = (i * Math.PI) / points - Math.PI / 2
          s_pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `
        }
        node = `<polygon points="${s_pts.trim()}" ${commonStyle}${rotation} />`
        break
      }
      case "image": {
        const imageShape = shape as ImageShape
        node = `<image x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" href="${imageShape.src}" preserveAspectRatio="none"${rotation} />`
        break
      }
    }

    if (node) {
      svg += `    ${node}
`
    }
  }

  svg += `  </g>
</svg>`
  return svg
}
