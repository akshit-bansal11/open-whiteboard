"use client"
import { useCallback, useEffect, useState } from "react"
import { CursorOverlay } from "@/components/presence/CursorOverlay"
import { UserList } from "@/components/presence/UserList"
import { ToolBar } from "@/components/toolbar/ToolBar"
import { useAwareness } from "@/hooks/use-awareness"
import { useCanvasEngine } from "@/hooks/use-canvas-engine"
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useYjsSync } from "@/hooks/use-yjs-sync"
import { getOrCreateLocalUser } from "@/lib/user"
import { useUIStore } from "@/stores/ui-store"
import type { TextShape } from "@/types/canvas"
import { ConnectionStatus } from "./ConnectionStatus"
import { RoomHeader } from "./RoomHeader"
import { SelectionHUD } from "./SelectionHUD"
import { TextEditOverlay } from "./TextEditOverlay"
import { ZoomControls } from "./ZoomControls"

type CanvasAppProps = { roomId: string }

export function CanvasApp({ roomId }: CanvasAppProps) {
  const localUser = getOrCreateLocalUser()
  const { camera, selectedIds } = useUIStore()

  const {
    shapes,
    undoManager,
    setShape,
    batchSetShapes,
    deleteShapes,
    connectionStatus,
  } = useYjsSync(roomId)

  const { remoteStates, setLocalCursor, setLocalSelection } = useAwareness(
    roomId,
    localUser
  )

  const {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onWheel,
    onDoubleClick,
    interaction,
  } = useCanvasEngine({
    shapes,
    setShape,
    batchSetShapes,
    deleteShapes,
    setLocalCursor,
    setLocalSelection,
    currentUserId: localUser.userId,
  })

  // Main-thread rAF renderer — no OffscreenCanvas / transferControlToOffscreen
  useCanvasRenderer({
    canvasRef,
    shapes,
    camera,
    selection: [...selectedIds],
    cursors: remoteStates,
    interaction,
  })

  useKeyboardShortcuts({ undoManager, shapes, deleteShapes, setShape })

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const editingShape = editingTextId
    ? (shapes.find((s) => s.id === editingTextId) as TextShape | undefined)
    : undefined

  const commitText = useCallback(
    (content: string) => {
      if (!editingShape) return
      setShape({ ...editingShape, content, updatedAt: Date.now() })
      setEditingTextId(null)
    },
    [editingShape, setShape]
  )

  // Sync text-edit mode from engine interaction state
  useEffect(() => {
    if (interaction.mode === "editing-text")
      setEditingTextId(interaction.shapeId)
  }, [interaction])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        style={{ touchAction: "none" }}
      />
      <CursorOverlay cursors={remoteStates} camera={camera} />
      <SelectionHUD shapes={shapes} />
      <ToolBar />
      <UserList participants={remoteStates} localUserId={localUser.userId} />
      <ZoomControls />
      <RoomHeader roomId={roomId} />
      <ConnectionStatus status={connectionStatus} />
      {editingShape && (
        <TextEditOverlay
          shape={editingShape}
          camera={camera}
          onCommit={commitText}
          onCancel={() => setEditingTextId(null)}
        />
      )}
    </div>
  )
}
