import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
import { UNDO_CAPTURE_TIMEOUT_MS } from "@/constants/canvas"

export type ProviderStatus = "connecting" | "connected" | "disconnected"

export function createProvider(
  doc: Y.Doc,
  roomId: string,
  serverUrl: string,
  onStatusChange?: (status: ProviderStatus) => void
) {
  const provider = new WebsocketProvider(
    `${serverUrl}/yjs`,
    roomId,
    doc,
    { connect: false } // connect manually — you control when sync starts
  )

  provider.on("status", ({ status }: { status: string }) => {
    if (status === "connected") onStatusChange?.("connected")
    else if (status === "disconnected") onStatusChange?.("disconnected")
    else onStatusChange?.("connecting")
  })

  // UndoManager scoped to "shapes" map only.
  // Pass origin: "human" when calling doc.transact() to make undo work.
  // Agent ops use origin: "agent" and are excluded automatically.
  const undoManager = new Y.UndoManager(doc.getMap("shapes"), {
    captureTimeout: UNDO_CAPTURE_TIMEOUT_MS,
    trackedOrigins: new Set(["human"]), // only track human ops for undo
  })

  return { provider, undoManager }
}
