import * as Y from "yjs"
import type { Shape } from "@/types/canvas"

export function createYDoc() {
  const doc = new Y.Doc()
  return {
    doc,
    shapes: doc.getMap<Shape>("shapes"),
    meta: doc.getMap<unknown>("meta"),
  }
}

/** Type guard — Y.Map values are typed as unknown at runtime */
export function isShape(val: unknown): val is Shape {
  return (
    typeof val === "object" &&
    val !== null &&
    "id" in val &&
    "type" in val &&
    typeof (val as { type: unknown }).type === "string" &&
    ["rect", "ellipse", "text", "pen"].includes((val as { type: string }).type)
  )
}
