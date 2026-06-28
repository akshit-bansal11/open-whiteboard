"use client"
import { useCallback, useEffect, useState } from "react"
import { ExportPanel } from "@/components/panels/ExportPanel"
import { StylePanel } from "@/components/panels/StylePanel"
import { CursorOverlay } from "@/components/presence/CursorOverlay"
import { UserList } from "@/components/presence/UserList"
import { ToolBar } from "@/components/toolbar/ToolBar"
import { useAwareness } from "@/hooks/use-awareness"
import { useCanvasEngine } from "@/hooks/use-canvas-engine"
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useYjsSync } from "@/hooks/use-yjs-sync"
import { screenToWorld } from "@/lib/canvas/math"
import { recordRoomVisit } from "@/lib/storage/local-rooms"
import { getOrCreateLocalUser } from "@/lib/user"
import { useUIStore } from "@/stores/ui-store"
import type { ImageShape, ShapeId, TextShape } from "@/types/canvas"
import { ConnectionStatus } from "./ConnectionStatus"
import { RoomHeader } from "./RoomHeader"
import { SelectionHUD } from "./SelectionHUD"
import { TextEditOverlay } from "./TextEditOverlay"
import { ZoomControls } from "./ZoomControls"

type CanvasAppProps = { roomId: string }

export function CanvasApp({ roomId }: CanvasAppProps) {
  const localUser = getOrCreateLocalUser()
  const { camera, selectedIds } = useUIStore()

  useEffect(() => {
    recordRoomVisit(roomId)
  }, [roomId])

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

  const handleImageFile = useCallback(
    async (file: File, screenPt: { x: number; y: number }) => {
      try {
        const { fileToBase64, getImageDimensions } = await import(
          "@/lib/canvas/image"
        )
        const src = await fileToBase64(file)
        const dims = await getImageDimensions(src)
        const worldPt = screenToWorld(screenPt, camera)

        const newShape: ImageShape = {
          id: crypto.randomUUID() as ShapeId,
          type: "image",
          x: worldPt.x - dims.width / 2,
          y: worldPt.y - dims.height / 2,
          width: dims.width,
          height: dims.height,
          rotation: 0,
          fill: "transparent",
          stroke: "transparent",
          strokeWidth: 0,
          opacity: 1,
          locked: false,
          createdBy: localUser.userId,
          updatedAt: Date.now(),
          cornerRadius: 0,
          dashArray: [],
          fillStyle: "none",
          src,
          naturalWidth: dims.width,
          naturalHeight: dims.height,
        }
        setShape(newShape)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to load image")
      }
    },
    [camera, localUser.userId, setShape]
  )

  useKeyboardShortcuts({
    undoManager,
    shapes,
    deleteShapes,
    setShape,
    onImagePaste: (file) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      const screenPt = rect
        ? { x: rect.width / 2, y: rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      handleImageFile(file, screenPt)
    },
  })

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

  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith("image/")) {
      const rect = canvasRef.current?.getBoundingClientRect()
      const x = rect ? e.clientX - rect.left : e.clientX
      const y = rect ? e.clientY - rect.top : e.clientY
      handleImageFile(file, { x, y })
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: App wrapper drag-drop
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
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
      <ToolBar
        onImagePick={(file) => {
          const rect = canvasRef.current?.getBoundingClientRect()
          const screenPt = rect
            ? { x: rect.width / 2, y: rect.height / 2 }
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
          handleImageFile(file, screenPt)
        }}
      />
      <StylePanel shapes={shapes} batchSetShapes={batchSetShapes} />
      <ExportPanel shapes={shapes} />
      <ZoomControls shapes={shapes} />
      <RoomHeader roomId={roomId} />
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <ConnectionStatus status={connectionStatus} />
        <UserList participants={remoteStates} localUserId={localUser.userId} />
      </div>
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
