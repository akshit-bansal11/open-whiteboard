"use client"
import { useEffect, useState } from "react"

type ConnectionStatusProps = {
  status: "connecting" | "connected" | "disconnected"
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const [showConnected, setShowConnected] = useState(true)

  useEffect(() => {
    if (status === "connected") {
      setShowConnected(true)
      const timer = setTimeout(() => setShowConnected(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (status === "connected" && !showConnected) return null

  let dotClass = ""
  let tooltip = ""

  if (status === "connecting") {
    dotClass =
      "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"
    tooltip = "Connecting…"
  } else if (status === "disconnected") {
    dotClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
    tooltip = "Disconnected — trying to reconnect"
  } else {
    dotClass = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
    tooltip =
      "Connected — your data syncs in real time and is never saved to our servers"
  }

  return (
    <div className="group relative flex items-center justify-center w-6 h-6 z-10">
      <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />

      {/* Tooltip */}
      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-zinc-800 border border-zinc-700 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
        {tooltip}
      </div>
    </div>
  )
}
