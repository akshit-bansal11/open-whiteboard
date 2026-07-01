"use client"
import { AnimatePresence, motion } from "framer-motion"
import { FlipHorizontal, FlipVertical, Link, Unlink, X } from "lucide-react"
import { useEffect } from "react"
import { flipShape, getShapeBoundingBox } from "@/lib/canvas/math"
import { measureTextShape } from "@/lib/canvas/text"
import { useUIStore } from "@/stores/ui-store"
import type { ArrowShape, BoundingBox, Shape, TextShape } from "@/types/canvas"
import { ColorSwatch } from "./ColorSwatch"

type StylePanelProps = {
  shapes: Shape[]
  batchSetShapes: (shapes: Shape[]) => void
}

export function StylePanel({ shapes, batchSetShapes }: StylePanelProps) {
  const { selectedIds, clearSelection, sizeLinked, setSizeLinked } =
    useUIStore()

  // Listen for Escape key to close panel even if an input is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) {
        // If an input is focused, blur it first, or just clear selection
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          document.activeElement.blur()
        }
        clearSelection()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIds.size, clearSelection])

  // For simplicity, we show properties of the FIRST selected shape,
  // but apply changes to ALL selected shapes.
  const activeShapes = shapes.filter((s) => selectedIds.has(s.id))
  const first = activeShapes[0]

  const updateProp = <K extends keyof Shape>(prop: K, val: Shape[K]) => {
    const updated = activeShapes.map((s) => ({
      ...s,
      [prop]: val,
      updatedAt: Date.now(),
    }))
    batchSetShapes(updated as Shape[])
  }

  const updateProps = (props: Partial<Shape>) => {
    const updated = activeShapes.map((s) => ({
      ...s,
      ...props,
      updatedAt: Date.now(),
    }))
    batchSetShapes(updated as Shape[])
  }

  const updateOpacity = (
    prop: "shapeOpacity" | "strokeOpacity" | "opacity",
    value: number
  ) => {
    updateProps({ [prop]: value } as Partial<Shape>)
  }

  const updateBox = (nextBox: Partial<BoundingBox>) => {
    const updated = activeShapes.map((shape) => {
      const current = getShapeBoundingBox(shape)
      const target = {
        ...current,
        ...nextBox,
      }
      return {
        ...applyBoxTransform(shape, current, target),
        updatedAt: Date.now(),
      }
    })
    batchSetShapes(updated as Shape[])
  }

  const updateSize = (axis: "width" | "height", value: number) => {
    if (!first) return
    const bbox = getShapeBoundingBox(first)
    if (!sizeLinked || bbox.width === 0 || bbox.height === 0) {
      updateBox({ [axis]: value })
      return
    }

    const ratio = bbox.width / bbox.height
    updateBox(
      axis === "width"
        ? { width: value, height: value / ratio }
        : { height: value, width: value * ratio }
    )
  }

  const transposeSelection = () => {
    if (!first) return
    const bbox = getShapeBoundingBox(first)
    updateBox({
      x: bbox.x + (bbox.width - bbox.height) / 2,
      y: bbox.y + (bbox.height - bbox.width) / 2,
      width: bbox.height,
      height: bbox.width,
    })
  }

  const toggleFlip = (axis: "x" | "y") => {
    const updated = activeShapes.map((shape) => flipShape(shape, axis))
    batchSetShapes(updated as Shape[])
  }

  // Arrow/line specific props
  const updateArrowHead = (val: "none" | "start" | "end" | "both") => {
    const updated = activeShapes
      .filter((s) => s.type === "arrow")
      .map((s) => ({
        ...s,
        arrowHead: val,
        updatedAt: Date.now(),
        // need to also update the line version
      }))
    batchSetShapes(updated as Shape[])
  }

  // Text specific props
  const updateTextProp = <K extends keyof Extract<Shape, { type: "text" }>>(
    prop: K,
    val: Extract<Shape, { type: "text" }>[K]
  ) => {
    const updated = activeShapes
      .filter((s) => s.type === "text")
      .map((s) => {
        const temp = { ...s, [prop]: val } as TextShape
        const dims = measureTextShape(temp)
        return {
          ...temp,
          ...dims,
          updatedAt: Date.now(),
        }
      })
    batchSetShapes(updated as Shape[])
  }

  const isText = first?.type === "text"
  const isArrow = first?.type === "arrow"
  const firstBox = first ? getShapeBoundingBox(first) : null
  const shapeOpacity = first?.shapeOpacity ?? first?.opacity ?? 1
  const strokeOpacity = first?.strokeOpacity ?? first?.opacity ?? 1

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end">
      <AnimatePresence mode="wait">
        {selectedIds.size > 0 && first ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.15 }}
            className="w-96 max-h-[calc(100vh-2rem)] overflow-hidden bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col text-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-4 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Style</h3>
                <span className="text-xs text-zinc-500 font-medium">
                  {selectedIds.size} selected
                </span>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Close Style Panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="style-panel-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* === TEXT SPECIFIC === */}
              {isText && (
                <>
                  <ColorSwatch
                    label="Text Color"
                    value={first.fill}
                    onChange={(v) => updateTextProp("fill", v)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-zinc-400 font-medium">
                      Font Family
                    </span>
                    <select
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                      value={(first as TextShape).fontFamily}
                      onChange={(e) =>
                        updateTextProp("fontFamily", e.target.value)
                      }
                    >
                      <option value="sans-serif">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="system-ui">System UI</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <span className="text-xs text-zinc-400 font-medium">
                        Weight
                      </span>
                      <select
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                        value={(first as TextShape).fontWeight || "normal"}
                        onChange={(e) =>
                          updateTextProp(
                            "fontWeight",
                            e.target.value as TextShape["fontWeight"]
                          )
                        }
                      >
                        <option value="lighter">Light</option>
                        <option value="normal">Regular</option>
                        <option value="bold">Bold</option>
                        <option value="bolder">Extra Bold</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <span className="text-xs text-zinc-400 font-medium">
                        Style
                      </span>
                      <select
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                        value={(first as TextShape).fontStyle || "normal"}
                        onChange={(e) =>
                          updateTextProp(
                            "fontStyle",
                            e.target.value as TextShape["fontStyle"]
                          )
                        }
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-zinc-400 font-medium">
                      Font Size
                    </span>
                    <input
                      type="number"
                      min="8"
                      max="200"
                      value={(first as TextShape).fontSize}
                      onChange={(e) =>
                        updateTextProp("fontSize", Number(e.target.value))
                      }
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-zinc-400 font-medium">
                      Alignment
                    </span>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateTextProp("textAlign", align)}
                          className={`flex-1 py-1 text-xs font-medium rounded-md border transition-all duration-200 ${
                            (first as TextShape).textAlign === align
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-inner"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                          }`}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* === BASIC SHAPES (Not Text, Not Image, Not Pen, Not Line/Arrow) === */}
              {!isText &&
                first.type !== "image" &&
                first.type !== "pen" &&
                first.type !== "line" &&
                first.type !== "arrow" && (
                  <>
                    <ColorSwatch
                      label="Stroke"
                      value={first.stroke}
                      onChange={(v) => updateProp("stroke", v)}
                    />
                    <ColorSwatch
                      label="Fill"
                      value={first.fill}
                      onChange={(v) => updateProp("fill", v)}
                    />
                  </>
                )}

              {/* === PEN / LINE / ARROW === */}
              {(first.type === "pen" ||
                first.type === "line" ||
                first.type === "arrow") && (
                <ColorSwatch
                  label="Stroke"
                  value={first.stroke}
                  onChange={(v) => updateProp("stroke", v)}
                />
              )}

              {/* === OPACITY (All Shapes) === */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-medium">
                  Opacity
                </span>
                {first.type === "image" ||
                first.type === "text" ||
                first.type === "pen" ? (
                  <RangeRow
                    label="Opacity"
                    value={first.opacity}
                    onChange={(value) => updateProp("opacity", value)}
                  />
                ) : (
                  <>
                    <RangeRow
                      label="Fill"
                      value={shapeOpacity}
                      onChange={(value) => updateOpacity("shapeOpacity", value)}
                    />
                    <RangeRow
                      label="Stroke"
                      value={strokeOpacity}
                      onChange={(value) =>
                        updateOpacity("strokeOpacity", value)
                      }
                    />
                  </>
                )}
              </div>

              {/* === STROKE WIDTH & STYLE (Basic Shapes, Pen, Line, Arrow) === */}
              {!isText && first.type !== "image" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
                      <span>Stroke Width</span>
                      <span>{first.strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={first.strokeWidth}
                      onChange={(e) =>
                        updateProp("strokeWidth", Number(e.target.value))
                      }
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-zinc-400 font-medium">
                      Stroke Style
                    </span>
                    <select
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                      value={
                        first.dashArray.length > 0
                          ? first.dashArray.join(",")
                          : "solid"
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        updateProp(
                          "dashArray",
                          val === "solid" ? [] : val.split(",").map(Number)
                        )
                      }}
                    >
                      <option value="solid">Solid</option>
                      <option value="10,10">Dashed</option>
                      <option value="0,6">Dotted</option>
                    </select>
                  </div>
                </>
              )}

              {/* === CORNER RADIUS (Rect only) === */}
              {first.type === "rect" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-zinc-400 font-medium">
                    Corner Radius
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="4"
                    value={first.cornerRadius}
                    onChange={(e) =>
                      updateProp("cornerRadius", Number(e.target.value))
                    }
                    className="w-full accent-blue-500"
                  />
                </div>
              )}

              {/* === ARROW HEAD (Arrow only) === */}
              {isArrow && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-zinc-400 font-medium">
                    Arrow Heads
                  </span>
                  <select
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                    value={(first as ArrowShape).arrowHead}
                    onChange={(e) =>
                      updateArrowHead(
                        e.target.value as "none" | "start" | "end" | "both"
                      )
                    }
                  >
                    <option value="none">None</option>
                    <option value="start">Start</option>
                    <option value="end">End</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              )}

              {/* === TRANSFORM (All Shapes) === */}
              {firstBox && (
                <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                  <span className="text-xs text-zinc-400 font-medium">
                    Transform
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="X"
                      value={firstBox.x}
                      onChange={(value) => updateBox({ x: value })}
                    />
                    <NumberField
                      label="Y"
                      value={firstBox.y}
                      onChange={(value) => updateBox({ y: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">
                      Size
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeLinked(!sizeLinked)}
                      className="h-7 w-7 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                      title={sizeLinked ? "Unlink size" : "Link size"}
                    >
                      {sizeLinked ? (
                        <Link className="m-auto h-3.5 w-3.5" />
                      ) : (
                        <Unlink className="m-auto h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="W"
                      value={firstBox.width}
                      min={1}
                      onChange={(value) => updateSize("width", value)}
                    />
                    <NumberField
                      label="H"
                      value={firstBox.height}
                      min={1}
                      onChange={(value) => updateSize("height", value)}
                    />
                  </div>
                  <NumberField
                    label="Rotate"
                    value={radiansToDegrees(first.rotation)}
                    onChange={(value) =>
                      updateProp("rotation", degreesToRadians(value))
                    }
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <IconButton label="Flip H" onClick={() => toggleFlip("x")}>
                      <FlipHorizontal className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="Flip V" onClick={() => toggleFlip("y")}>
                      <FlipVertical className="h-3.5 w-3.5" />
                    </IconButton>
                    <button
                      type="button"
                      onClick={transposeSelection}
                      className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-300 hover:text-white"
                      title="Transpose width and height"
                    >
                      Transpose
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pill"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-full shadow-lg text-sm text-zinc-400 font-medium cursor-default"
          >
            Select a shape
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RangeRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs text-zinc-400">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: number
  min?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      {label}
      <input
        type="number"
        min={min}
        step="1"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-white focus:border-blue-500 focus:outline-none"
      />
    </label>
  )
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center justify-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-300 hover:text-white"
      title={label}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function applyBoxTransform(
  shape: Shape,
  current: BoundingBox,
  target: BoundingBox
): Shape {
  if (shape.type === "arrow" || shape.type === "line") {
    const start = mapPointToBox(
      { x: shape.startX, y: shape.startY },
      current,
      target
    )
    const end = mapPointToBox({ x: shape.endX, y: shape.endY }, current, target)
    return {
      ...shape,
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
    } as Shape
  }

  if (shape.type === "pen") {
    return {
      ...shape,
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height,
      points: shape.points.map((point) =>
        mapPointToBox(point, current, target)
      ),
    }
  }

  return {
    ...shape,
    x: target.x,
    y: target.y,
    width: target.width,
    height: target.height,
  }
}

function mapPointToBox(
  point: { x: number; y: number },
  current: BoundingBox,
  target: BoundingBox
): { x: number; y: number } {
  const rx = current.width === 0 ? 0.5 : (point.x - current.x) / current.width
  const ry = current.height === 0 ? 0.5 : (point.y - current.y) / current.height
  return {
    x: target.x + target.width * rx,
    y: target.y + target.height * ry,
  }
}

function radiansToDegrees(value: number) {
  return Math.round((value * 180) / Math.PI)
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}
