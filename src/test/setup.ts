import "@testing-library/react"
// Mock OffscreenCanvas for jsdom/happy-dom (it doesn't exist there)
globalThis.OffscreenCanvas = class {
  getContext() {
    return null
  }
} as unknown as typeof OffscreenCanvas
