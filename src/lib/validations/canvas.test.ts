import { describe, expect, it } from "vitest"
import { ShapeSchema } from "./canvas"

describe("ShapeSchema", () => {
  it("validates a valid rect", () => {
    const result = ShapeSchema.safeParse({
      type: "rect",
      id: "abc",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      rotation: 0,
      fill: "#fff",
      stroke: "#000",
      strokeWidth: 1,
      opacity: 1,
      locked: false,
      createdBy: "user1",
      updatedAt: Date.now(),
    })
    expect(result.success).toBe(true)
  })

  it("rejects a shape with negative opacity", () => {
    const result = ShapeSchema.safeParse({
      type: "rect",
      id: "abc",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      rotation: 0,
      fill: "#fff",
      stroke: "#000",
      strokeWidth: 1,
      opacity: -1,
      locked: false,
      createdBy: "user1",
      updatedAt: Date.now(),
    })
    expect(result.success).toBe(false)
  })

  it("validates a text shape with content", () => {
    const result = ShapeSchema.safeParse({
      type: "text",
      id: "abc",
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      rotation: 0,
      fill: "transparent",
      stroke: "#000",
      strokeWidth: 1,
      opacity: 1,
      locked: false,
      createdBy: "user1",
      updatedAt: Date.now(),
      content: "Hello",
      fontSize: 16,
      fontFamily: "sans-serif",
      textAlign: "left",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a pen shape with no points", () => {
    const result = ShapeSchema.safeParse({
      type: "pen",
      id: "abc",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      fill: "none",
      stroke: "#000",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      createdBy: "user1",
      updatedAt: Date.now(),
      points: [],
    })
    expect(result.success).toBe(false)
  })
})
