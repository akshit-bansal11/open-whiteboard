"use client"
import {
  ChevronRight,
  Circle,
  Eraser,
  Hand,
  Hexagon,
  Image as ImageIcon,
  Minus,
  MousePointer,
  MoveUpRight,
  Pen,
  Sparkles,
  Square,
  Star,
  Triangle,
  Type,
} from "lucide-react"
import { useRef } from "react"
import { useUIStore } from "@/stores/ui-store"
import type { Tool } from "@/types/canvas"

export function ToolBar({
  onImagePick,
}: {
  onImagePick?: (file: File) => void
}) {
  const {
    activeTool,
    setTool,
    polygonSides,
    setPolygonSides,
    starPoints,
    setStarPoints,
    starPolygonPoints,
    setStarPolygonPoints,
    arrowHead,
    setArrowHead,
    arrowHeadStyle,
    setArrowHeadStyle,
  } = useUIStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submenu configuration
  const polygonPresets = [
    { sides: 3, label: "Triangle", Icon: Triangle },
    { sides: 4, label: "Square", Icon: Square, tool: "rect" as Tool },
    { sides: 5, label: "Pentagon", Icon: Hexagon },
    { sides: 6, label: "Hexagon", Icon: Hexagon },
  ]
  const arrowHeadPresets = [
    { val: "none", label: "Line" },
    { val: "end", label: "End" },
    { val: "start", label: "Start" },
    { val: "both", label: "Both" },
  ] as const
  const arrowStylePresets = [
    "classic",
    "triangle",
    "stealth",
    "diamond",
  ] as const

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-2 shadow-2xl z-10">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && onImagePick) onImagePick(file)
          e.target.value = "" // reset
        }}
      />

      {/* Select */}
      <ToolButton
        tool="select"
        active={activeTool}
        onClick={() => setTool("select")}
        Icon={MousePointer}
        label="Select"
        shortcut="V"
      />
      <div className="my-1 h-px w-full bg-zinc-800" />

      {/* Polygon Group */}
      <div className="relative group">
        <ToolButton
          tool="polygon"
          active={activeTool === "polygon" || activeTool === "rect"}
          onClick={() => setTool(polygonSides === 4 ? "rect" : "polygon")}
          Icon={Hexagon}
          label="Polygon"
          hasSubmenu
        />
        {/* We use pl-3 to create a hover bridge so the mouse doesn't leave the group */}
        <div className="absolute left-full top-0 hidden group-hover:flex pl-3 z-50">
          <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-700 text-white p-3 rounded-xl shadow-xl w-48">
            <div className="text-xs font-semibold text-zinc-400 mb-1">
              Polygons
            </div>
            <div className="grid grid-cols-4 gap-1">
              {polygonPresets.map((p) => (
                <button
                  type="button"
                  key={p.sides}
                  onClick={() => {
                    setPolygonSides(p.sides)
                    setTool(p.tool || "polygon")
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    (
                      p.tool
                        ? activeTool === p.tool
                        : activeTool === "polygon" && polygonSides === p.sides
                    )
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                  title={p.label + (p.sides === 4 ? " (R)" : "")}
                >
                  <p.Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400">Custom:</span>
              <input
                type="number"
                min={3}
                max={20}
                value={polygonSides}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value) || 3
                  setPolygonSides(val)
                  setTool(val === 4 ? "rect" : "polygon")
                }}
                className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Circle / Ellipse */}
      <ToolButton
        tool="ellipse"
        active={activeTool}
        onClick={() => setTool("ellipse")}
        Icon={Circle}
        label="Ellipse"
        shortcut="E"
      />

      {/* Star Group */}
      <div className="relative group">
        <ToolButton
          tool="star"
          active={activeTool === "star"}
          onClick={() => setTool("star")}
          Icon={Star}
          label="Star"
          hasSubmenu
        />
        <div className="absolute left-full top-0 hidden group-hover:flex pl-3 z-50">
          <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-700 text-white p-3 rounded-xl shadow-xl w-48">
            <div className="text-xs font-semibold text-zinc-400 mb-1">
              Star Points
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[3, 4, 5, 6].map((pts) => (
                <button
                  type="button"
                  key={pts}
                  onClick={() => {
                    setStarPoints(pts)
                    setTool("star")
                  }}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                    activeTool === "star" && starPoints === pts
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400">Custom:</span>
              <input
                type="number"
                min={3}
                max={20}
                value={starPoints}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value) || 3
                  setStarPoints(val)
                  setTool("star")
                }}
                className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Star Polygon Group */}
      <div className="relative group">
        <ToolButton
          tool="star-polygon"
          active={activeTool}
          onClick={() => setTool("star-polygon")}
          Icon={Sparkles}
          label="Star Polygon"
          hasSubmenu
        />
        <div className="absolute left-full top-0 hidden group-hover:flex pl-3 z-50">
          <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-700 text-white p-3 rounded-xl shadow-xl w-48">
            <div className="text-xs font-semibold text-zinc-400 mb-1">
              Star Polygon Points
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[5, 6, 7, 8].map((pts) => (
                <button
                  type="button"
                  key={pts}
                  onClick={() => {
                    setStarPolygonPoints(pts)
                    setTool("star-polygon")
                  }}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                    activeTool === "star-polygon" && starPolygonPoints === pts
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400">Custom:</span>
              <input
                type="number"
                min={5}
                max={20}
                value={starPolygonPoints}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value) || 5
                  setStarPolygonPoints(val)
                  setTool("star-polygon")
                }}
                className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line */}
      <ToolButton
        tool="line"
        active={activeTool}
        onClick={() => setTool("line")}
        Icon={Minus}
        label="Line"
        shortcut="N"
      />

      {/* Arrow Group */}
      <div className="relative group">
        <ToolButton
          tool="arrow"
          active={activeTool}
          onClick={() => setTool("arrow")}
          Icon={MoveUpRight}
          label="Arrow"
          shortcut="A"
          hasSubmenu
        />
        <div className="absolute left-full top-0 hidden group-hover:flex pl-3 z-50">
          <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-700 text-white p-3 rounded-xl shadow-xl w-56">
            <div className="text-xs font-semibold text-zinc-400 mb-1">
              Arrow Head
            </div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {arrowHeadPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.val}
                  onClick={() => {
                    setArrowHead(preset.val)
                    setTool("arrow")
                  }}
                  className={`text-xs p-1.5 rounded-lg transition-colors ${
                    arrowHead === preset.val
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold text-zinc-400 mb-1">
              Head Style
            </div>
            <div className="grid grid-cols-2 gap-1">
              {arrowStylePresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setArrowHeadStyle(preset)
                    setTool("arrow")
                  }}
                  className={`text-xs p-1.5 rounded-lg transition-colors capitalize ${
                    arrowHeadStyle === preset
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="my-1 h-px w-full bg-zinc-800" />
      <ToolButton
        tool="text"
        active={activeTool}
        onClick={() => setTool("text")}
        Icon={Type}
        label="Text"
        shortcut="T"
      />
      <ToolButton
        tool="image"
        active={activeTool}
        onClick={() => {
          fileInputRef.current?.click()
          setTool("select")
        }}
        Icon={ImageIcon}
        label="Image"
        shortcut="I"
      />
      <ToolButton
        tool="pen"
        active={activeTool}
        onClick={() => setTool("pen")}
        Icon={Pen}
        label="Pen"
        shortcut="P"
      />

      <div className="my-1 h-px w-full bg-zinc-800" />
      <ToolButton
        tool="eraser"
        active={activeTool}
        onClick={() => setTool("eraser")}
        Icon={Eraser}
        label="Eraser"
        shortcut="X"
      />
      <ToolButton
        tool="pan"
        active={activeTool}
        onClick={() => setTool("pan")}
        Icon={Hand}
        label="Pan"
        shortcut="H"
      />
    </div>
  )
}

function ToolButton({
  tool,
  active,
  onClick,
  Icon,
  label,
  shortcut,
  hasSubmenu,
}: {
  tool: string | Tool
  active: string | Tool | boolean
  onClick: () => void
  Icon: React.ElementType
  label: string
  shortcut?: string
  hasSubmenu?: boolean
}) {
  const isActive = typeof active === "boolean" ? active : active === tool
  return (
    <div className="relative group/btn">
      <button
        type="button"
        onClick={onClick}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-zinc-800 text-blue-400 ring-2 ring-blue-500/50 shadow-sm"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        }`}
        aria-label={label}
        aria-pressed={isActive}
      >
        <Icon className="w-[18px] h-[18px]" />
      </button>
      {!hasSubmenu && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/btn:flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-50">
          <span className="font-medium">{label}</span>
          {shortcut && (
            <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[10px] font-semibold tracking-wider">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
