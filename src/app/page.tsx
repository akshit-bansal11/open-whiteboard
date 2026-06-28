"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { z } from "zod"
import { apiPost } from "@/lib/api/client"
import type { CreateRoomResponseSchema } from "@/lib/validations/room"

export default function HomePage() {
  const router = useRouter()
  const [joinId, setJoinId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<
        Record<string, never>,
        z.infer<typeof CreateRoomResponseSchema>
      >("/api/rooms", {})
      router.push(`/room/${res.data.roomId}`)
    } catch {
      setError("Failed to create room. Is the server running?")
      setLoading(false)
    }
  }

  const joinRoom = () => {
    if (joinId.trim()) router.push(`/room/${joinId.trim()}`)
  }

  return (
    <div className="w-screen h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-6 text-white">
      <div className="flex flex-col items-center gap-2 mb-4">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Coform
        </h1>
        <p className="text-zinc-400 text-lg">
          Collaborative canvas. Real-time. No friction.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="button"
        className="px-8 py-3 bg-white text-zinc-900 rounded-xl font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-all hover:scale-105 shadow-lg shadow-white/10"
        onClick={createRoom}
        disabled={loading}
      >
        {loading ? "Creating…" : "Create a board"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px w-16 bg-zinc-700" />
        <span className="text-zinc-500 text-sm">or join existing</span>
        <div className="h-px w-16 bg-zinc-700" />
      </div>

      <div className="flex gap-2">
        <input
          id="room-id-input"
          className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500 text-white placeholder:text-zinc-500 transition-colors"
          placeholder="Paste a Room ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && joinRoom()}
        />
        <button
          type="button"
          className="px-4 py-2 bg-zinc-700 rounded-xl text-sm hover:bg-zinc-600 transition-colors"
          onClick={joinRoom}
        >
          Join
        </button>
      </div>
    </div>
  )
}
