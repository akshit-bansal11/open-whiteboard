"use client"
import type { AwarenessState } from "@/types/user"

type UserListProps = { participants: AwarenessState[]; localUserId: string }

export function UserList({ participants, localUserId }: UserListProps) {
  const others = participants.filter((p) => p.userId !== localUserId)
  return (
    <div className="flex items-center -space-x-2 z-10">
      {others.map((p) => (
        <div key={p.userId} className="relative group">
          <div
            className="w-8 h-8 rounded-full border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-white cursor-default"
            style={{ backgroundColor: p.color }}
          >
            {p.name.charAt(0)}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-800 border border-zinc-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-50">
            {p.name}
          </div>
        </div>
      ))}
    </div>
  )
}
