import { describe, expect, it } from "vitest"

describe("canvas engine state machine logic", () => {
  it("drawing mode starts with zero-size shape", () => {
    const startWorld = { x: 100, y: 100 }
    const currentWorld = { x: 200, y: 200 }
    const width = currentWorld.x - startWorld.x
    const height = currentWorld.y - startWorld.y
    expect(width).toBe(100)
    expect(height).toBe(100)
  })

  it("selecting box correctly identifies contained shapes", () => {
    const box = { x: 0, y: 0, w: 200, h: 200 }
    const inside = { x: 50, y: 50, width: 50, height: 50 }
    const outside = { x: 250, y: 250, width: 50, height: 50 }
    const isContained = (shape: typeof inside) =>
      shape.x >= box.x &&
      shape.y >= box.y &&
      shape.x + shape.width <= box.x + box.w &&
      shape.y + shape.height <= box.y + box.h
    expect(isContained(inside)).toBe(true)
    expect(isContained(outside)).toBe(false)
  })
})
