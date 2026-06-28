"use client"
import {
  Database,
  Download,
  HardDrive,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useUIStore } from "@/stores/ui-store"

type RoomHeaderProps = { roomId: string }

export function RoomHeader({ roomId }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const setExportPanelOpen = useUIStore((s) => s.setExportPanelOpen)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearLocalData = () => {
    if (
      confirm(
        "Are you sure you want to delete your local copy of this board? You will be disconnected."
      )
    ) {
      indexedDB.deleteDatabase(roomId)
      window.location.reload()
    }
  }

  // Close menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-1.5 shadow-2xl z-20">
      <div className="flex items-center px-3 gap-3 border-r border-zinc-800">
        <span className="text-zinc-300 font-mono text-sm font-medium">
          {roomId}
        </span>
        <button
          type="button"
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          onClick={copyLink}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
        onClick={() => setExportPanelOpen(true)}
      >
        <Download className="h-4 w-4" />
        Export
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
            menuOpen
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute top-full mt-2 right-0 w-72 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 text-left animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-zinc-100 font-medium">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Privacy & Storage
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-3 text-zinc-300">
                <Database className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p>
                  Syncing via WebSocket — no canvas data is written to disk on
                  our servers.
                </p>
              </div>
              <div className="flex items-start gap-3 text-zinc-300">
                <HardDrive className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <p>
                  A local copy is saved to your browser (IndexedDB) for fast
                  loading.
                </p>
              </div>
            </div>

            <div className="h-px bg-zinc-800 w-full my-1" />

            <button
              type="button"
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors w-full"
              onClick={clearLocalData}
            >
              <Trash2 className="w-4 h-4" />
              Clear local data
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
