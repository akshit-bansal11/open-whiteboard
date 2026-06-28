"use client"
import { useEffect } from "react"
import type * as Y from "yjs"
import { useUIStore } from "@/stores/ui-store"
import type { Shape, ShapeId } from "@/types/canvas"

type ShortcutsProps = {
  undoManager: Y.UndoManager | undefined
  shapes: Shape[]
  deleteShapes: (ids: ShapeId[]) => void
  setShape: (s: Shape) => void
  onImagePaste?: (file: File) => void
}

export function useKeyboardShortcuts({
  undoManager,
  shapes,
  deleteShapes,
  setShape,
  onImagePaste,
}: ShortcutsProps) {
  const {
    setTool,
    selectedIds,
    setSelection,
    clearSelection,
    toggleGrid,
    setExportPanelOpen,
    setCamera,
  } = useUIStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't fire when typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      const meta = e.ctrlKey || e.metaKey

      // Tool shortcuts
      if (!meta) {
        if (e.key === "v" || e.key === "V") setTool("select")
        if (e.key === "r" || e.key === "R") setTool("rect")
        if (e.key === "e" || e.key === "E") setTool("ellipse")
        if (e.key === "t" || e.key === "T") setTool("text")
        if (e.key === "p" || e.key === "P") setTool("pen")
        if (e.key === "h" || e.key === "H") setTool("pan")
        if (e.key === "d" || e.key === "D") setTool("diamond")
        if (e.key === "n" || e.key === "N") setTool("line")
        if (e.key === "a" || e.key === "A") setTool("arrow")
        if (e.key === "i" || e.key === "I") setTool("image")
        if (e.key === "x" || e.key === "X") setTool("eraser")
        if (e.key === "g" || e.key === "G") toggleGrid()
      }

      // Undo / Redo
      if (meta && !e.shiftKey && e.key === "z") {
        e.preventDefault()
        undoManager?.undo()
      }
      if (meta && e.shiftKey && e.key === "z") {
        e.preventDefault()
        undoManager?.redo()
      }
      if (meta && e.key === "y") {
        e.preventDefault()
        undoManager?.redo()
      }

      // Delete selected
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.size > 0
      ) {
        e.preventDefault()
        deleteShapes([...selectedIds] as ShapeId[])
        clearSelection()
      }

      // Select all
      if (meta && e.key === "a") {
        e.preventDefault()
        setSelection(shapes.map((s) => s.id) as ShapeId[])
      }

      // Duplicate
      if (meta && e.key === "d") {
        e.preventDefault()
        const selected = shapes.filter((s) => selectedIds.has(s.id))
        for (const s of selected) {
          const clone = {
            ...s,
            id: crypto.randomUUID() as ShapeId,
            x: s.x + 20,
            y: s.y + 20,
            updatedAt: Date.now(),
          }
          setShape(clone)
        }
      }

      // Export
      if (meta && e.key === "e") {
        e.preventDefault()
        setExportPanelOpen(true)
      }

      // Fit All
      if (meta && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault()
        if (shapes.length > 0) {
          const {
            getSelectionBoundingBox,
            calculateFitAllCamera,
          } = require("@/lib/canvas/math")
          const canvas = document.querySelector("canvas")
          if (canvas) {
            const bbox = getSelectionBoundingBox(shapes)
            if (bbox) {
              const cam = calculateFitAllCamera(
                bbox,
                canvas.width,
                canvas.height,
                64
              )
              setCamera(cam)
            }
          }
        }
      }

      // Escape
      if (e.key === "Escape") clearSelection()
    }

    const paste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file && onImagePaste) {
            onImagePaste(file)
            e.preventDefault()
            break
          }
        }
      }
    }

    window.addEventListener("keydown", down)
    window.addEventListener("paste", paste)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("paste", paste)
    }
  }, [
    undoManager,
    shapes,
    selectedIds,
    setTool,
    setSelection,
    clearSelection,
    deleteShapes,
    setShape,
    toggleGrid,
    setExportPanelOpen,
    setCamera,
    onImagePaste,
  ])
}
