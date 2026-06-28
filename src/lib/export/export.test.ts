import { describe, expect, it } from "vitest"
import type { Shape } from "@/types/canvas"
import { getShapesBoundingBox } from "./export"

describe("getShapesBoundingBox", () => {
  it("returns default box for empty array", () => {
    const bbox = getShapesBoundingBox([], 40)
    expect(bbox).toEqual({ x: 0, y: 0, w: 800, h: 600 })
  })

  it("calculates correct bounds for standard shapes with padding", () => {
    const shapes: Shape[] = [
      { id: "1", type: "rect", x: 100, y: 100, width: 50, height: 50 } as Shape,
      {
        id: "2",
        type: "ellipse",
        x: 200,
        y: 50,
        width: 50,
        height: 50,
      } as Shape,
    ]
    // minX = 100, minY = 50, maxX = 250, maxY = 150
    // padding = 40
    const bbox = getShapesBoundingBox(shapes, 40)
    expect(bbox).toEqual({
      x: 100 - 40,
      y: 50 - 40,
      w: 250 - 100 + 80,
      h: 150 - 50 + 80,
    })
  })

  it("calculates correct bounds for line/arrow shapes (using startX/endX)", () => {
    const shapes: Shape[] = [
      {
        id: "3",
        type: "line",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        startX: 300,
        startY: 300,
        endX: 50,
        endY: 50,
      } as Shape,
    ]
    // minX = 50, minY = 50, maxX = 300, maxY = 300
    // padding = 10
    const bbox = getShapesBoundingBox(shapes, 10)
    expect(bbox).toEqual({
      x: 40,
      y: 40,
      w: 250 + 20,
      h: 250 + 20,
    })
  })
})
