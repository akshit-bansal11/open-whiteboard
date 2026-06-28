"use client"
import { Circle, Hand, MousePointer, Pen, Square, Type } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import type { Tool } from "@/types/canvas"

type ToolDef = {
  tool: Tool
  Icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut: string
}

const TOOLS: ToolDef[] = [
  { tool: "select", Icon: MousePointer, label: "Select", shortcut: "V" },
  { tool: "rect", Icon: Square, label: "Rectangle", shortcut: "R" },
  { tool: "ellipse", Icon: Circle, label: "Ellipse", shortcut: "E" },
  { tool: "text", Icon: Type, label: "Text", shortcut: "T" },
  { tool: "pen", Icon: Pen, label: "Pen", shortcut: "P" },
  { tool: "pan", Icon: Hand, label: "Pan", shortcut: "H" },
]

export function ToolBar() {
  const { activeTool, setTool } = useUIStore()
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 rounded-xl bg-zinc-900 border border-zinc-700 p-2 shadow-xl z-10">
      {TOOLS.map(({ tool, Icon, label, shortcut }) => (
        <div key={tool} className="relative group">
          <button
            type="button"
            onClick={() => setTool(tool)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              activeTool === tool
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            aria-label={label}
            aria-pressed={activeTool === tool}
          >
            <Icon className="w-4 h-4" />
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-50">
            {label}
            <kbd className="bg-zinc-700 px-1 rounded text-zinc-300">
              {shortcut}
            </kbd>
          </div>
        </div>
      ))}
    </div>
  )
}
