"use client"
import { ArrowLeft, Info, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { ExportPanel } from "@/components/panels/ExportPanel"
import { StylePanel } from "@/components/panels/StylePanel"
import { CursorOverlay } from "@/components/presence/CursorOverlay"
import { UserList } from "@/components/presence/UserList"
import { ToolBar } from "@/components/toolbar/ToolBar"
import { useAwareness } from "@/hooks/use-awareness"
import { useCanvasEngine } from "@/hooks/use-canvas-engine"
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { clearRoomData, useYjsSync } from "@/hooks/use-yjs-sync"
import { screenToWorld } from "@/lib/canvas/math"
import { measureTextShape } from "@/lib/canvas/text"
import {
  getRecentRooms,
  recordRoomVisit,
  removeRecentRoom,
} from "@/lib/storage/local-rooms"
import { getOrCreateLocalUser } from "@/lib/user"
import { useUIStore } from "@/stores/ui-store"
import type { ImageShape, ShapeId, TextShape } from "@/types/canvas"
import { RoomHeader } from "./RoomHeader"
import { SaveBoardModal } from "./SaveBoardModal"
import { SelectionHUD } from "./SelectionHUD"
import { TextEditOverlay } from "./TextEditOverlay"
import { ZoomControls } from "./ZoomControls"

type CanvasAppProps = { roomId: string }

export function CanvasApp({ roomId }: CanvasAppProps) {
  const router = useRouter()
  const localUser = getOrCreateLocalUser()
  const { camera, selectedIds } = useUIStore()

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [hasSavedRoom, setHasSavedRoom] = useState(false)
  const [showInfographic, setShowInfographic] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isTemporarilySaved, setIsTemporarilySaved] = useState(false)

  const lastSavedShapesRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hasSavedRoom && showInfographic) {
      const timer = setTimeout(() => setShowInfographic(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [hasSavedRoom, showInfographic])

  // Check if it was already saved
  useEffect(() => {
    const saved = getRecentRooms().some((r) => r.id === roomId)
    setHasSavedRoom(saved)
  }, [roomId])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasSavedRoom || hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "" // Trigger native browser prompt
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasSavedRoom, hasUnsavedChanges])

  const { shapes, undoManager, setShape, batchSetShapes, deleteShapes } =
    useYjsSync(roomId, hasSavedRoom)

  useEffect(() => {
    const currentShapesStr = JSON.stringify(shapes)
    if (lastSavedShapesRef.current === null) {
      lastSavedShapesRef.current = currentShapesStr
      return
    }
    if (currentShapesStr !== lastSavedShapesRef.current) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [shapes])

  const handleSaveBoard = useCallback(() => {
    if (!hasUnsavedChanges && (hasSavedRoom || isTemporarilySaved)) return
    setIsTemporarilySaved(true)
    setShowInfographic(false)
    setHasUnsavedChanges(false)
    lastSavedShapesRef.current = JSON.stringify(shapes)
  }, [hasUnsavedChanges, hasSavedRoom, isTemporarilySaved, shapes])

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
          shapeOpacity: 1,
          strokeOpacity: 1,
          locked: false,
          createdBy: localUser.userId,
          updatedAt: Date.now(),
          cornerRadius: 0,
          dashArray: [],
          fillStyle: "none",
          flipX: false,
          flipY: false,
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
      const tempShape = { ...editingShape, content }
      const dims = measureTextShape(tempShape)
      setShape({ ...tempShape, ...dims, updatedAt: Date.now() })
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
        onSave={handleSaveBoard}
      />
      <StylePanel shapes={shapes} batchSetShapes={batchSetShapes} />
      <ExportPanel shapes={shapes} />
      <ZoomControls shapes={shapes} />
      <RoomHeader roomId={roomId} />

      {/* Back to Home Button */}
      <button
        type="button"
        className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-2xl z-20"
        onClick={() => {
          if (!hasSavedRoom || hasUnsavedChanges) {
            setIsSaveModalOpen(true)
          } else {
            router.push("/")
          }
        }}
        aria-label="Back to home"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-3 z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <UserList
            participants={remoteStates}
            localUserId={localUser.userId}
          />
        </div>
        {!hasSavedRoom && !isTemporarilySaved && showInfographic && (
          <div className="bg-blue-900/80 border border-blue-500/50 text-blue-100 text-sm p-3 rounded-xl shadow-lg backdrop-blur-xl max-w-sm pointer-events-auto flex items-start gap-3 animate-in fade-in slide-in-from-top-4 relative pr-10">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Your data is not saved. If you'd like to keep this data locally
              for future reference, please click on the save button.
            </p>
            <button
              type="button"
              onClick={() => setShowInfographic(false)}
              className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-200 hover:bg-blue-800/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {editingShape && (
        <TextEditOverlay
          shape={editingShape}
          camera={camera}
          onCommit={commitText}
          onCancel={() => setEditingTextId(null)}
        />
      )}
      <SaveBoardModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveAndLeave={() => {
          recordRoomVisit(roomId)
          setHasSavedRoom(true)
          router.push("/")
        }}
        onLeaveWithoutSaving={() => {
          removeRecentRoom(roomId)
          clearRoomData(roomId)
          router.push("/")
        }}
      />
    </div>
  )
}
