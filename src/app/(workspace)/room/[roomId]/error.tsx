"use client"

type RoomErrorProps = { reset: () => void }

export default function RoomError({ reset }: RoomErrorProps) {
  return (
    <div className="w-screen h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4 text-white">
      <p className="text-zinc-400">Something went wrong loading this room.</p>
      <button
        type="button"
        className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600 transition-colors"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  )
}
