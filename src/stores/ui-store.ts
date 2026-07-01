import { create } from "zustand"
import type { Camera, ShapeId, Tool } from "@/types/canvas"

type UIStore = {
  activeTool: Tool
  selectedIds: Set<ShapeId>
  camera: Camera
  showGrid: boolean
  stylePanelOpen: boolean
  exportPanelOpen: boolean

  polygonSides: number
  starPoints: number
  starPolygonPoints: number
  arrowHead: "none" | "start" | "end" | "both"
  arrowHeadStyle: "classic" | "triangle" | "stealth" | "diamond"

  setTool: (t: Tool) => void
  setSelection: (ids: ShapeId[]) => void
  addToSelection: (id: ShapeId) => void
  removeFromSelection: (id: ShapeId) => void
  clearSelection: () => void
  toggleGrid: () => void
  updateCamera: (patch: Partial<Camera>) => void
  setCamera: (camera: Camera) => void
  setStylePanelOpen: (open: boolean) => void
  setExportPanelOpen: (open: boolean) => void

  setPolygonSides: (sides: number) => void
  setStarPoints: (points: number) => void
  setStarPolygonPoints: (points: number) => void
  setArrowHead: (head: "none" | "start" | "end" | "both") => void
  setArrowHeadStyle: (
    style: "classic" | "triangle" | "stealth" | "diamond"
  ) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeTool: "select",
  selectedIds: new Set<ShapeId>(),
  camera: { x: 0, y: 0, zoom: 1 },
  showGrid: true,
  stylePanelOpen: false,
  exportPanelOpen: false,

  polygonSides: 5,
  starPoints: 5,
  starPolygonPoints: 5,
  arrowHead: "end",
  arrowHeadStyle: "classic",

  setTool: (t) => set({ activeTool: t }),
  setSelection: (ids) => set({ selectedIds: new Set(ids) }),
  addToSelection: (id) =>
    set((s) => ({ selectedIds: new Set([...s.selectedIds, id]) })),
  removeFromSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      next.delete(id)
      return { selectedIds: next }
    }),
  clearSelection: () => set({ selectedIds: new Set<ShapeId>() }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  updateCamera: (patch) => set((s) => ({ camera: { ...s.camera, ...patch } })),
  setCamera: (camera) => set({ camera }),
  setStylePanelOpen: (open) => set({ stylePanelOpen: open }),
  setExportPanelOpen: (open) => set({ exportPanelOpen: open }),

  setPolygonSides: (sides) => set({ polygonSides: sides }),
  setStarPoints: (points) => set({ starPoints: points }),
  setStarPolygonPoints: (points) => set({ starPolygonPoints: points }),
  setArrowHead: (head) => set({ arrowHead: head }),
  setArrowHeadStyle: (style) => set({ arrowHeadStyle: style }),
}))
