/**
 * Standalone WebSocket + Socket.IO server.
 *
 * - Path /yjs/*  — Yjs CRDT sync via y-protocols (room-isolated, in-memory)
 * - Socket.IO    — Cursor/presence broadcast (Socket.IO namespaces per room)
 *
 * Run with: npm run ws
 */

import { createServer } from "node:http"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import { Server as IOServer, type Socket } from "socket.io"
import { type WebSocket, WebSocketServer } from "ws"
import * as awarenessProtocol from "y-protocols/awareness"
import * as syncProtocol from "y-protocols/sync"
import * as Y from "yjs"

// ── Constants ─────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? process.env.WS_PORT ?? 1234)
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000"

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

// ── In-memory room state ───────────────────────────────────────────────────────

interface YjsRoom {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  connections: Set<WebSocket>
}

const yjsRooms = new Map<string, YjsRoom>()

function getOrCreateYjsRoom(roomId: string): YjsRoom {
  const existing = yjsRooms.get(roomId)
  if (existing) return existing

  const doc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(doc)

  const room: YjsRoom = { doc, awareness, connections: new Set() }
  yjsRooms.set(roomId, room)

  // Broadcast doc updates to all connected clients in the room
  doc.on("update", (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    const message = encoding.toUint8Array(encoder)
    for (const conn of room.connections) {
      if (conn !== origin && conn.readyState === conn.OPEN) {
        conn.send(message, { binary: true })
      }
    }
  })

  // Broadcast awareness updates to all connected clients
  awareness.on(
    "update",
    ({
      added,
      updated,
      removed,
    }: {
      added: number[]
      updated: number[]
      removed: number[]
    }) => {
      const changedClients = added.concat(updated, removed)
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      )
      const message = encoding.toUint8Array(encoder)
      for (const conn of room.connections) {
        if (conn.readyState === conn.OPEN) {
          conn.send(message, { binary: true })
        }
      }
    }
  )

  return room
}

// ── Yjs WebSocket handler ──────────────────────────────────────────────────────

function handleYjsConnection(ws: WebSocket, roomId: string): void {
  const room = getOrCreateYjsRoom(roomId)
  room.connections.add(ws)

  // Send current doc state to the new client
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeSyncStep1(encoder, room.doc)
  ws.send(encoding.toUint8Array(encoder), { binary: true })

  // Send current awareness state
  const awarenessStates = room.awareness.getStates()
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder()
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    )
    ws.send(encoding.toUint8Array(awarenessEncoder), { binary: true })
  }

  ws.on("message", (data: Buffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data))
      const msgType = decoding.readVarUint(decoder)

      if (msgType === MESSAGE_SYNC) {
        const replyEncoder = encoding.createEncoder()
        encoding.writeVarUint(replyEncoder, MESSAGE_SYNC)
        const syncMessageType = syncProtocol.readSyncMessage(
          decoder,
          replyEncoder,
          room.doc,
          // Pass ws as origin so the doc.on("update") handler skips this sender
          ws
        )
        // Only send reply if there's content (step1 produces a step2 reply)
        if (
          syncMessageType === syncProtocol.messageYjsSyncStep1 &&
          encoding.length(replyEncoder) > 1
        ) {
          ws.send(encoding.toUint8Array(replyEncoder), { binary: true })
        }
      } else if (msgType === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(
          room.awareness,
          decoding.readVarUint8Array(decoder),
          ws
        )
      }
    } catch {
      // Malformed message — ignore silently
    }
  })

  ws.on("close", () => {
    room.connections.delete(ws)

    // Remove awareness state for this client
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [room.doc.clientID],
      null
    )

    // GC empty rooms
    if (room.connections.size === 0) {
      room.doc.destroy()
      yjsRooms.delete(roomId)
    }
  })
}

// ── HTTP + WebSocket server setup ─────────────────────────────────────────────

const http = createServer()
const wss = new WebSocketServer({ noServer: true })

const io = new IOServer(http, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
})

// Route upgrades: /yjs/<roomId> → Yjs; everything else → ignore
http.on("upgrade", (req, socket, head) => {
  const url = req.url ?? ""
  if (url.startsWith("/yjs/")) {
    const roomId = url.slice("/yjs/".length).split("?")[0]
    if (!roomId) {
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleYjsConnection(ws, roomId)
    })
  }
  // Socket.IO upgrade is handled internally by the IOServer
})

// ── Socket.IO presence layer ───────────────────────────────────────────────────

/** Connected user IDs per room for GC */
const presenceRooms = new Map<string, Set<string>>()

io.on("connection", (socket: Socket) => {
  const auth = socket.handshake.auth as {
    roomId?: unknown
    userId?: unknown
    name?: unknown
    color?: unknown
  }

  const roomId = typeof auth.roomId === "string" ? auth.roomId : null
  const userId = typeof auth.userId === "string" ? auth.userId : null
  const name = typeof auth.name === "string" ? auth.name : "Anonymous"
  const color = typeof auth.color === "string" ? auth.color : "#6366f1"

  if (!roomId || !userId) {
    socket.disconnect()
    return
  }

  socket.join(roomId)

  if (!presenceRooms.has(roomId)) presenceRooms.set(roomId, new Set())
  // biome-ignore lint/style/noNonNullAssertion: set above
  presenceRooms.get(roomId)!.add(userId)

  socket.to(roomId).emit("user-joined", { userId, name, color })

  socket.on("cursor", (pos: { x: number; y: number }) => {
    socket
      .to(roomId)
      .emit("cursor", { userId, name, color, x: pos.x, y: pos.y })
  })

  socket.on("selection", (ids: string[]) => {
    socket.to(roomId).emit("selection", { userId, ids })
  })

  socket.on("disconnect", () => {
    const users = presenceRooms.get(roomId)
    if (users) {
      users.delete(userId)
      if (users.size === 0) presenceRooms.delete(roomId)
    }
    io.to(roomId).emit("user-left", { userId })
  })
})

// ── Start ──────────────────────────────────────────────────────────────────────

http.listen(PORT, () => {
  // NOTE: console.log is acceptable in server entrypoints (not production browser code)
  console.log(`WS server on :${PORT}`)
})
