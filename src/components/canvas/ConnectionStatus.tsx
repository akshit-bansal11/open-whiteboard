"use client"

type ConnectionStatusProps = {
  status: "connecting" | "connected" | "disconnected"
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  if (status === "connected") return null
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-amber-400 bg-zinc-900 border border-amber-700 px-3 py-1 rounded-full z-10">
      {status === "connecting"
        ? "Connecting…"
        : "Disconnected — trying to reconnect"}
    </div>
  )
}
