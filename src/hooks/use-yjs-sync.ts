"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import * as Y from "yjs"
import { createProvider, type ProviderStatus } from "@/lib/yjs/provider"
import { createYDoc, isShape } from "@/lib/yjs/ydoc"
import type { Shape, ShapeId } from "@/types/canvas"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:1234"

export function useYjsSync(roomId: string) {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<ProviderStatus>("connecting")

  const docRef = useRef<ReturnType<typeof createYDoc> | null>(null)
  const providerRef = useRef<ReturnType<typeof createProvider> | null>(null)

  useEffect(() => {
    const { doc, shapes: yShapes, meta } = createYDoc()
    const { provider, undoManager } = createProvider(
      doc,
      roomId,
      WS_URL,
      setConnectionStatus
    )

    docRef.current = { doc, shapes: yShapes, meta }
    providerRef.current = { provider, undoManager }

    const handleObserve = () => {
      setShapes(Array.from(yShapes.values()).filter(isShape))
    }

    yShapes.observe(handleObserve)
    provider.connect()

    return () => {
      yShapes.unobserve(handleObserve)
      provider.destroy()
      doc.destroy()
    }
  }, [roomId])

  const setShape = useCallback((shape: Shape) => {
    const d = docRef.current
    if (!d) return
    d.doc.transact(() => {
      d.shapes.set(shape.id, shape)
    }, "human")
  }, [])

  const batchSetShapes = useCallback((updatedShapes: Shape[]) => {
    const d = docRef.current
    if (!d) return
    d.doc.transact(() => {
      for (const s of updatedShapes) d.shapes.set(s.id, s)
    }, "human")
  }, [])

  const deleteShape = useCallback((id: ShapeId) => {
    const d = docRef.current
    if (!d) return
    d.doc.transact(() => {
      d.shapes.delete(id)
    }, "human")
  }, [])

  const deleteShapes = useCallback((ids: ShapeId[]) => {
    const d = docRef.current
    if (!d) return
    d.doc.transact(() => {
      for (const id of ids) d.shapes.delete(id)
    }, "human")
  }, [])

  return {
    shapes,
    yShapes: docRef.current?.shapes ?? new Y.Map<Shape>(),
    doc: docRef.current?.doc ?? new Y.Doc(),
    undoManager: providerRef.current?.undoManager,
    setShape,
    batchSetShapes,
    deleteShape,
    deleteShapes,
    connectionStatus,
  }
}
