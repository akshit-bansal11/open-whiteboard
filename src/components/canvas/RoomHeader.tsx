"use client"
import { useState } from "react"

type RoomHeaderProps = { roomId: string }

export function RoomHeader({ roomId }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-white shadow-lg z-10">
      <span className="text-zinc-400 font-mono text-xs">{roomId}</span>
      <button
        type="button"
        className="text-xs text-zinc-300 hover:text-white transition-colors"
        onClick={copyLink}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  )
}
