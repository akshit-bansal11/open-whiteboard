import type { ShapeId } from "./canvas"

export type UserId = string & { readonly __brand: "UserId" }

export type UserColor =
  | "#ef4444"
  | "#f97316"
  | "#eab308"
  | "#22c55e"
  | "#3b82f6"
  | "#8b5cf6"
  | "#ec4899"

export const USER_COLORS: UserColor[] = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

export type AwarenessState = {
  userId: UserId
  name: string
  color: UserColor
  cursor: { x: number; y: number } | null
  selectedIds: ShapeId[]
  // V2 agent fields — optional so V1 code never needs to touch them
  isAgent?: boolean
  isTyping?: boolean
}
