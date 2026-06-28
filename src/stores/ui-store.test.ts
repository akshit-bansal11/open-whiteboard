import { beforeEach, describe, expect, it } from "vitest"
import type { ShapeId } from "@/types/canvas"
import { useUIStore } from "./ui-store"

beforeEach(() => {
  useUIStore.setState({
    activeTool: "select",
    selectedIds: new Set(),
    camera: { x: 0, y: 0, zoom: 1 },
    showGrid: true,
  })
})

describe("useUIStore", () => {
  it("setTool changes active tool", () => {
    useUIStore.getState().setTool("rect")
    expect(useUIStore.getState().activeTool).toBe("rect")
  })

  it("setSelection replaces selection", () => {
    useUIStore.getState().setSelection(["a" as ShapeId, "b" as ShapeId])
    expect(useUIStore.getState().selectedIds.size).toBe(2)
    useUIStore.getState().setSelection(["c" as ShapeId])
    expect(useUIStore.getState().selectedIds.size).toBe(1)
  })

  it("addToSelection appends without replacing", () => {
    useUIStore.getState().setSelection(["a" as ShapeId])
    useUIStore.getState().addToSelection("b" as ShapeId)
    expect(useUIStore.getState().selectedIds.size).toBe(2)
  })

  it("removeFromSelection removes one id", () => {
    useUIStore.getState().setSelection(["a" as ShapeId, "b" as ShapeId])
    useUIStore.getState().removeFromSelection("a" as ShapeId)
    expect(useUIStore.getState().selectedIds.has("a" as ShapeId)).toBe(false)
    expect(useUIStore.getState().selectedIds.has("b" as ShapeId)).toBe(true)
  })

  it("clearSelection empties the set", () => {
    useUIStore.getState().setSelection(["a" as ShapeId])
    useUIStore.getState().clearSelection()
    expect(useUIStore.getState().selectedIds.size).toBe(0)
  })

  it("toggleGrid flips showGrid", () => {
    expect(useUIStore.getState().showGrid).toBe(true)
    useUIStore.getState().toggleGrid()
    expect(useUIStore.getState().showGrid).toBe(false)
  })

  it("updateCamera patches camera", () => {
    useUIStore.getState().updateCamera({ zoom: 2 })
    expect(useUIStore.getState().camera).toEqual({ x: 0, y: 0, zoom: 2 })
  })
})
