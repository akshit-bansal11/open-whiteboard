# Coform

Coform is an open-source, real-time collaborative canvas built with Next.js, Yjs, and HTML5 Canvas. It provides a frictionless whiteboard experience that works instantly in the browser without requiring any accounts or logins.

## Features

- **Infinite Canvas:** Pan and zoom freely (`Space` to pan, `Ctrl/Cmd` + `Scroll` to zoom).
- **13 Shape Types:** Draw rectangles, ellipses, diamonds, triangles, stars, lines, and arrows.
- **Rich Text & Images:** Add text annotations or drag-and-drop images directly onto the canvas.
- **Real-Time Collaboration:** See cursors, live edits, and presence of other users instantly via WebSockets and Yjs CRDTs.
- **Local-First Speed:** Canvas state is cached in your browser's IndexedDB for instant reloads.
- **Exporting:** Export your canvas to PNG. SVG and PDF exporting are coming soon.
- **Privacy-First:** Canvas data lives only in memory on the server and is never written to disk. Once everyone leaves, the room is destroyed.
- **Password Protection:** Secure rooms with optional passwords.

## Architecture

Coform uses a CRDT-based architecture for seamless conflict resolution and real-time multiplayer editing:

- **Client:** React (Next.js App Router) + custom raw HTML5 Canvas engine for rendering. State is managed by Yjs and Zustand.
- **Network:** WebSocket sync powered by `y-websocket`.
- **Server:** Custom Node.js WebSocket server (`src/server/ws-server.ts`) that keeps Yjs documents in memory. 
- **Storage:** Data is intentionally **not** persisted to disk on the server by default (Privacy-First approach). However, an optional Redis adapter can be configured.

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the WebSocket server (Terminal 1):
   ```bash
   npm run ws
   ```
4. Start the Next.js dev server (Terminal 2):
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port for the Next.js application |
| `WS_PORT` | `1234` | Port for the WebSocket synchronization server |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:1234` | WebSocket URL for the client to connect to |
| `ROOM_STORE` | `memory` | Set to `redis` to enable persistent room metadata |
| `REDIS_URL` | `redis://localhost:6379` | Required if `ROOM_STORE=redis` |

## Room Storage

By default, Coform operates entirely **in-memory**. When you create a room, its metadata and canvas data are kept in the Node process's memory. If the server restarts, all rooms are wiped.

If you want persistent room configurations (e.g. passwords and metadata), you can opt-in to Redis storage by setting `ROOM_STORE=redis` and `REDIS_URL`. Note: The actual *canvas drawing data* (Yjs documents) always remains in memory on the WebSocket server to ensure maximum privacy.

## Privacy

**Coform is designed with privacy as a core feature.**

Your canvas data lives locally in your browser (via IndexedDB) and in memory on the server for real-time synchronization. **The server never writes canvas drawings or text to disk or to a database.** 

When the last person leaves a room, the server's in-memory copy is immediately deleted. Your data only persists in your own browser's cache for quick reloading. You can clear this at any time from the room header's `...` menu.

## Image Size Limits

To keep synchronization fast and reduce memory load on the server, image uploads are restricted to a maximum size of **2MB per image**. Because images are embedded directly into the Yjs document as Base64 strings, large images can cause high latency and memory usage.

If you are self-hosting and need to support larger images, you can modify the `MAX_IMAGE_SIZE` constant in `src/lib/canvas/image.ts`, but doing so may impact performance.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `R` | Rectangle tool |
| `E` | Ellipse tool |
| `D` | Diamond tool |
| `N` | Line tool |
| `A` | Arrow tool |
| `T` | Text tool |
| `I` | Image tool |
| `P` | Pen tool |
| `X` | Eraser tool |
| `H` / `Space` | Pan tool |
| `G` | Toggle grid |
| `Ctrl+E` | Open export panel |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Duplicate selection |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+Shift+F` | Fit all shapes into view |
| `Delete` / `Backspace` | Delete selected shapes |
| `Esc` | Clear selection / Cancel tool |

## Contributing

We welcome contributions! Before submitting a Pull Request, please ensure you pass the quality gate:

```bash
npm run quality-gate
```

This command runs Biome (formatting and linting), TypeScript type-checking, and Next.js builds. **All checks must pass (exit code 0).**

## License

This project is open-sourced under the MIT License.
