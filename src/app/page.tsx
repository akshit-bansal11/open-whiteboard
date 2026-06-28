"use client"
import { Clock, Code, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiPost } from "@/lib/api/client"
import {
  getRecentRooms,
  type RecentRoom,
  removeRecentRoom,
} from "@/lib/storage/local-rooms"
import type {
  CreateRoomRequest,
  CreateRoomResponse,
} from "@/lib/validations/room"

export default function HomePage() {
  const router = useRouter()
  const [joinId, setJoinId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([])

  useEffect(() => {
    setRecentRooms(getRecentRooms())
  }, [])

  const createRoom = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<CreateRoomRequest, CreateRoomResponse>(
        "/api/rooms",
        { password }
      )
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
    <div className="w-screen h-screen bg-[#1a1a2e] flex flex-col items-center justify-center text-white relative">
      <div className="w-full max-w-[480px] px-6 flex flex-col items-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
            Coform
          </h1>
          <p className="text-zinc-300 text-lg font-medium">
            Open-source collaborative canvas
          </p>
          <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mt-1">
            <span>Real-time sync</span>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>No account required</span>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Open source</span>
          </div>
        </div>

        {error && (
          <p className="w-full text-red-400 text-sm bg-red-950/40 border border-red-800 px-4 py-3 rounded-xl text-center">
            {error}
          </p>
        )}

        {/* Create Room */}
        <div className="w-full flex flex-col gap-3">
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-zinc-500 transition-all text-center shadow-inner"
            placeholder="Optional password for new room"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && createRoom()}
          />
          <button
            type="button"
            className="w-full px-8 py-3.5 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-xl shadow-white/10 active:scale-[0.98]"
            onClick={createRoom}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create a board"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full opacity-60">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-700" />
          <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            or
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-700" />
        </div>

        {/* Join Room */}
        <div className="w-full flex gap-2 relative">
          <input
            id="room-id-input"
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-white placeholder:text-zinc-500 transition-all shadow-inner"
            placeholder="Paste a Room ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
          />
          <button
            type="button"
            className="px-6 py-3 bg-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-zinc-600 shadow-sm"
            onClick={joinRoom}
          >
            Join
          </button>
        </div>

        {/* Privacy Note */}
        <div className="w-full p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 text-center">
          <p className="text-xs text-blue-200/70 leading-relaxed">
            Your canvas data lives in your browser and in-memory on the server.
            The server never writes it to disk. When the last person leaves a
            room, the data is gone.
          </p>
        </div>

        {/* Recent Boards */}
        {recentRooms.length > 0 && (
          <div className="w-full mt-2 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-zinc-500 px-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Recent Boards
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="group flex items-center bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden transition-all hover:bg-zinc-800 hover:border-zinc-700 shadow-sm"
                >
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 text-xs text-left text-zinc-400 group-hover:text-zinc-200 transition-colors truncate font-medium"
                    onClick={() => router.push(`/room/${room.id}`)}
                    title={room.id}
                  >
                    {room.id}
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors border-l border-zinc-800"
                    onClick={() => {
                      removeRecentRoom(room.id)
                      setRecentRooms(getRecentRooms())
                    }}
                    aria-label="Remove recent board"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 flex items-center justify-center w-full">
        <a
          href="https://github.com/akshit-bansal11/open-whiteboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
        >
          <Code className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </footer>
    </div>
  )
}
