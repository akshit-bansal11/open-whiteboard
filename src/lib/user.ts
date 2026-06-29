import type { AwarenessState, UserColor } from "@/types/user"

const COLORS: UserColor[] = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

function randomColor(): UserColor {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function randomName(): string {
  const adjectives = ["Swift", "Calm", "Bold", "Keen", "Bright"]
  const nouns = ["Panda", "Fox", "Hawk", "Wolf", "Lynx"]
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`
}

export function getOrCreateLocalUser(): Pick<
  AwarenessState,
  "userId" | "name" | "color"
> {
  if (typeof window === "undefined") {
    return {
      userId: "ssr" as AwarenessState["userId"],
      name: "Anonymous",
      color: COLORS[0],
    }
  }
  const stored = localStorage.getItem("open-whiteboard-user")
  if (stored) {
    try {
      return JSON.parse(stored) as Pick<
        AwarenessState,
        "userId" | "name" | "color"
      >
    } catch {
      // ignore corrupt storage — fall through to create a new user
    }
  }
  const user: Pick<AwarenessState, "userId" | "name" | "color"> = {
    userId: crypto.randomUUID() as AwarenessState["userId"],
    name: randomName(),
    color: randomColor(),
  }
  localStorage.setItem("open-whiteboard-user", JSON.stringify(user))
  return user
}
