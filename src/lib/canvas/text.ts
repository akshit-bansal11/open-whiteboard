import type { TextShape } from "@/types/canvas"

let offscreenCtx: CanvasRenderingContext2D | null = null

function getOffscreenContext(): CanvasRenderingContext2D {
  if (!offscreenCtx) {
    const canvas = document.createElement("canvas")
    offscreenCtx = canvas.getContext("2d")
    if (!offscreenCtx) {
      throw new Error("Could not create offscreen canvas context")
    }
  }
  return offscreenCtx
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (maxWidth <= 0) return text.split("\n")

  const lines: string[] = []
  const paragraphs = text.split("\n")

  for (const p of paragraphs) {
    if (p === "") {
      lines.push("")
      continue
    }
    const words = p.split(" ")
    let currentLine = words[0] || ""

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const testLine = `${currentLine} ${word}`
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
  }

  return lines
}

export function measureTextShape(shape: TextShape): {
  width: number
  height: number
} {
  const ctx = getOffscreenContext()
  const weight = shape.fontWeight || "normal"
  const style = shape.fontStyle || "normal"
  ctx.font = `${style} ${weight} ${shape.fontSize}px ${shape.fontFamily}`

  const content = shape.content === "" ? "Type something..." : shape.content

  // Use a minimum width for wrapping to avoid infinite loops or vertical letters
  const wrapWidth = Math.max(shape.width, 50)
  const lines = wrapText(ctx, content, wrapWidth)

  let maxLineWidth = 0
  for (const line of lines) {
    const metrics = ctx.measureText(line)
    if (metrics.width > maxLineWidth) {
      maxLineWidth = metrics.width
    }
  }

  const lineHeight = shape.fontSize * 1.2 // standard line height approximation
  const finalHeight = Math.max(shape.fontSize, lines.length * lineHeight)

  // If the user hasn't drawn a wide box (e.g. click-to-type), we auto-expand up to wrapWidth.
  // Wait, if wrapWidth is 50, it will wrap at 50, making it very tall!
  // If shape.width < MIN_SHAPE_SIZE (like 10), then maybe we should let it grow indefinitely?
  // Let's just return shape.width if it was explicitly drawn, or maxLineWidth if it was not.
  const finalWidth =
    shape.width > 20 ? shape.width : Math.max(200, maxLineWidth)

  return { width: finalWidth, height: finalHeight }
}
