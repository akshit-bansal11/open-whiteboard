import { describe, expect, it } from "vitest"
import { ShapeSchema } from "./canvas"

/** Minimal base fields shared by all shape test fixtures. */
const BASE = {
  id: "test-id",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  fill: "#fff",
  stroke: "#000",
  strokeWidth: 1,
  opacity: 1,
  locked: false,
  createdBy: "user1",
  updatedAt: Date.now(),
}

describe("ShapeSchema", () => {
  it("validates a valid rect", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "rect" })
    expect(result.success).toBe(true)
  })

  it("applies default cornerRadius/dashArray/fillStyle for rect", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "rect" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cornerRadius).toBe(0)
      expect(result.data.dashArray).toEqual([])
      expect(result.data.fillStyle).toBe("solid")
    }
  })

  it("rejects a shape with negative opacity", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "rect",
      opacity: -1,
    })
    expect(result.success).toBe(false)
  })

  it("validates a text shape with content", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "text",
      content: "Hello",
      fontSize: 16,
      fontFamily: "sans-serif",
      textAlign: "left",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a pen shape with no points", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "pen",
      points: [],
    })
    expect(result.success).toBe(false)
  })

  // ── V1.2 new shape types ─────────────────────────────────────────────────

  it("validates a diamond shape", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "diamond" })
    expect(result.success).toBe(true)
  })

  it("validates a triangle shape", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "triangle" })
    expect(result.success).toBe(true)
  })

  it("validates a 5-point star", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "star", points: 5 })
    expect(result.success).toBe(true)
  })

  it("rejects a star with fewer than 3 points", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "star", points: 2 })
    expect(result.success).toBe(false)
  })

  it("rejects a star with more than 20 points", () => {
    const result = ShapeSchema.safeParse({ ...BASE, type: "star", points: 21 })
    expect(result.success).toBe(false)
  })

  it("validates an arrow shape", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "arrow",
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      arrowHead: "end",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an arrow with invalid arrowHead", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "arrow",
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      arrowHead: "invalid",
    })
    expect(result.success).toBe(false)
  })

  it("validates a line shape", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "line",
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
    })
    expect(result.success).toBe(true)
  })

  it("validates an image shape", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "image",
      src: "data:image/png;base64,abc123",
      naturalWidth: 800,
      naturalHeight: 600,
    })
    expect(result.success).toBe(true)
  })

  it("rejects an image shape with missing src", () => {
    const result = ShapeSchema.safeParse({
      ...BASE,
      type: "image",
      src: "",
      naturalWidth: 800,
      naturalHeight: 600,
    })
    expect(result.success).toBe(false)
  })
})
