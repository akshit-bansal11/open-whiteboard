"use client"
import { Lock } from "lucide-react"
import { useState } from "react"

type PasswordGateProps = {
  roomId: string
  children: React.ReactNode
}

export function PasswordGate({ roomId, children }: PasswordGateProps) {
  const [password, setPassword] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (authorized) {
    return <>{children}</>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/rooms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, password }),
      })

      if (!res.ok) {
        throw new Error("Failed to verify password")
      }

      const { data } = await res.json()
      if (data.success) {
        setAuthorized(true)
      } else {
        setError("Incorrect password")
      }
    } catch (_err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-white">Protected Room</h2>
          <p className="mt-2 text-sm text-zinc-400">
            This room requires a password to enter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-500 animate-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Enter Room"}
          </button>
        </form>
      </div>
    </div>
  )
}
