import { describe, expect, it } from "vitest"
import { createYDoc, isShape } from "./ydoc"

describe("createYDoc", () => {
  it("returns doc with shapes map", () => {
    const { doc, shapes } = createYDoc()
    expect(shapes).toBeDefined()
    doc.destroy()
  })
})

describe("isShape", () => {
  it("returns true for valid rect shape", () => {
    expect(isShape({ id: "a", type: "rect" })).toBe(true)
  })
  it("returns false for null", () => {
    expect(isShape(null)).toBe(false)
  })
  it("returns false for unknown type", () => {
    expect(isShape({ id: "a", type: "unknown-type" })).toBe(false)
  })
})
