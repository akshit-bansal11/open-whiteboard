"use client"
import {
  Circle,
  Diamond,
  Eraser,
  Hand,
  Image as ImageIcon,
  Minus,
  MousePointer,
  MoveUpRight,
  Pen,
  Square,
  Star,
  Triangle,
  Type,
} from "lucide-react"
import { useRef } from "react"
import { useUIStore } from "@/stores/ui-store"
import type { Tool } from "@/types/canvas"

type ToolDef = {
  tool: Tool
  Icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut: string
  divider?: boolean
  id?: string
}

const TOOLS: ToolDef[] = [
  { tool: "select", Icon: MousePointer, label: "Select", shortcut: "V" },
  {
    tool: "select",
    Icon: MousePointer,
    label: "",
    shortcut: "",
    divider: true,
    id: "divider-1",
  },
  { tool: "rect", Icon: Square, label: "Rectangle", shortcut: "R" },
  { tool: "ellipse", Icon: Circle, label: "Ellipse", shortcut: "E" },
  { tool: "diamond", Icon: Diamond, label: "Diamond", shortcut: "D" },
  { tool: "triangle", Icon: Triangle, label: "Triangle", shortcut: "" },
  { tool: "star", Icon: Star, label: "Star", shortcut: "" },
  { tool: "line", Icon: Minus, label: "Line", shortcut: "N" },
  { tool: "arrow", Icon: MoveUpRight, label: "Arrow", shortcut: "A" },
  {
    tool: "select",
    Icon: MousePointer,
    label: "",
    shortcut: "",
    divider: true,
    id: "divider-2",
  },
  { tool: "text", Icon: Type, label: "Text", shortcut: "T" },
  { tool: "image", Icon: ImageIcon, label: "Image", shortcut: "I" },
  { tool: "pen", Icon: Pen, label: "Pen", shortcut: "P" },
  {
    tool: "select",
    Icon: MousePointer,
    label: "",
    shortcut: "",
    divider: true,
    id: "divider-3",
  },
  { tool: "eraser", Icon: Eraser, label: "Eraser", shortcut: "X" },
  { tool: "pan", Icon: Hand, label: "Pan", shortcut: "H" },
]

export function ToolBar({
  onImagePick,
}: {
  onImagePick?: (file: File) => void
}) {
  const { activeTool, setTool } = useUIStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      {TOOLS.map((def, i) => {
        if (def.divider) {
          return <div key={def.id} className="my-1 h-px w-full bg-zinc-800" />
        }
        const { tool, Icon, label, shortcut } = def
        const isActive = activeTool === tool

        return (
          <div key={tool} className="relative group">
            <button
              type="button"
              onClick={() => {
                if (tool === "image") {
                  fileInputRef.current?.click()
                  setTool("select") // Revert to select after picking
                } else {
                  setTool(tool)
                }
              }}
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
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-50">
              <span className="font-medium">{label}</span>
              {shortcut && (
                <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[10px] font-semibold tracking-wider">
                  {shortcut}
                </kbd>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
