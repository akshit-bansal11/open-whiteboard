"use client"
import { Download, FileCode, FileImage, FileText, X } from "lucide-react"
import { useState } from "react"
import { type ExportFormat, exportCanvas } from "@/lib/export/export"
import { useUIStore } from "@/stores/ui-store"
import type { Shape } from "@/types/canvas"

type ExportPanelProps = {
  shapes: Shape[]
}

export function ExportPanel({ shapes }: ExportPanelProps) {
  const { exportPanelOpen, setExportPanelOpen } = useUIStore()
  const [background, setBackground] = useState("#1a1a2e")
  const [loading, setLoading] = useState(false)

  if (!exportPanelOpen) return null

  const handleExport = async (format: ExportFormat) => {
    setLoading(true)
    try {
      await exportCanvas(shapes, format, background)
      if (format === "png" || format === "svg") {
        setExportPanelOpen(false)
      }
    } catch (_err) {
      alert("Failed to export")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-zinc-400" />
            <h2 className="text-xl font-semibold text-white">Export Canvas</h2>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            onClick={() => setExportPanelOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-300">Background</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`flex-1 rounded-xl py-2 px-3 text-sm font-medium transition-colors border ${
                  background === "#1a1a2e"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                }`}
                onClick={() => setBackground("#1a1a2e")}
              >
                Dark
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl py-2 px-3 text-sm font-medium transition-colors border ${
                  background === "#ffffff"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                }`}
                onClick={() => setBackground("#ffffff")}
              >
                Light
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl py-2 px-3 text-sm font-medium transition-colors border ${
                  background === "transparent"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                }`}
                onClick={() => setBackground("transparent")}
              >
                Transparent
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-300">Format</div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={loading}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
                onClick={() => handleExport("png")}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <FileImage className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">PNG Image</div>
                    <div className="text-xs text-zinc-500">
                      Best for sharing
                    </div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-zinc-500" />
              </button>

              <button
                type="button"
                disabled={loading}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
                onClick={() => handleExport("svg")}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">SVG Vector</div>
                    <div className="text-xs text-zinc-500">
                      Scalable graphics
                    </div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-zinc-500" />
              </button>

              <button
                type="button"
                disabled={loading}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
                onClick={() => handleExport("pdf")}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">PDF Document</div>
                    <div className="text-xs text-zinc-500">
                      For printing (Soon)
                    </div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
