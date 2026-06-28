"use client"
import { AnimatePresence, motion } from "framer-motion"
import { useUIStore } from "@/stores/ui-store"
import type { ArrowShape, Shape, TextShape } from "@/types/canvas"
import { ColorSwatch } from "./ColorSwatch"

type StylePanelProps = {
  shapes: Shape[]
  batchSetShapes: (shapes: Shape[]) => void
}

export function StylePanel({ shapes, batchSetShapes }: StylePanelProps) {
  const { selectedIds } = useUIStore()

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

  // Arrow/line specific props
  const updateArrowHead = (val: "none" | "start" | "end" | "both") => {
    const updated = activeShapes
      .filter((s) => s.type === "arrow")
      .map((s) => ({
        ...s,
        arrowHead: val,
        updatedAt: Date.now(),
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
      .map((s) => ({
        ...s,
        [prop]: val,
        updatedAt: Date.now(),
      }))
    batchSetShapes(updated as Shape[])
  }

  const isText = first?.type === "text"
  const isArrow = first?.type === "arrow"

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
            className="w-64 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-5 text-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold">Style</h3>
              <span className="text-xs text-zinc-500 font-medium">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Stroke */}
              <ColorSwatch
                label="Stroke"
                value={first.stroke}
                onChange={(v) => updateProp("stroke", v)}
              />

              {/* Fill (hide for lines/arrows/pens) */}
              {first.type !== "line" &&
                first.type !== "arrow" &&
                first.type !== "pen" && (
                  <ColorSwatch
                    label="Fill"
                    value={first.fill}
                    onChange={(v) => updateProp("fill", v)}
                  />
                )}

              {/* Opacity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
                  <span>Opacity</span>
                  <span>{Math.round(first.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={first.opacity}
                  onChange={(e) =>
                    updateProp("opacity", Number(e.target.value))
                  }
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Stroke Width */}
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

              {/* Dash Array */}
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
                  <option value="2,6">Dotted</option>
                </select>
              </div>

              {/* Corner Radius */}
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

              {/* Arrow Head */}
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

              {/* Text Properties */}
              {isText && (
                <>
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
