export const ZOOM_MIN = 0.05 as const
export const ZOOM_MAX = 20 as const
export const GRID_SIZE = 20 as const
export const HANDLE_SIZE = 8 as const
export const CURSOR_THROTTLE_MS = 16 as const

// Derived — useful in math lib
export const HANDLE_HALF = HANDLE_SIZE / 2

// Default shape appearance
export const DEFAULT_FILL = "#ffffff" as const
export const DEFAULT_STROKE = "#374151" as const
export const DEFAULT_STROKE_WIDTH = 2 as const
export const DEFAULT_OPACITY = 1 as const

// Capture timeout for Yjs UndoManager — batches ops within this window
export const UNDO_CAPTURE_TIMEOUT_MS = 500 as const

// Minimum shape size after resize (px in world space)
export const MIN_SHAPE_SIZE = 4 as const

// Minimum distance (px) before adding a new pen point — reduces noise
export const PEN_MIN_DISTANCE = 4 as const

// V2 agent context cap — max shapes sent to the AI in one context window
export const MAX_SHAPES_IN_CONTEXT = 100 as const
