// Mock OpenClaw v3 WebSocket server + HTTP control API

import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { createDefaultHandlers, type RpcHandler } from './handlers'

const WS_PORT = 18789
const HTTP_PORT = 18790

interface MockServerState {
  wss: WebSocketServer | null
  httpServer: http.Server | null
  handlers: Map<string, RpcHandler>
  clients: Set<WebSocket>
  history: Array<{ method: string; params: any; timestamp: number }>
  streamQueue: Array<{ sessionKey: string; events: any[] }>
}

const state: MockServerState = {
  wss: null,
  httpServer: null,
  handlers: createDefaultHandlers(),
  clients: new Set(),
  history: [],
  streamQueue: [],
}

function handleWsConnection(ws: WebSocket) {
  state.clients.add(ws)

  // Send connect.challenge event immediately
  ws.send(JSON.stringify({
    type: 'event',
    event: 'connect.challenge',
    payload: { nonce: 'mock-challenge-nonce' },
  }))

  ws.on('message', (data) => {
    try {
      const frame = JSON.parse(data.toString())

      if (frame.type === 'req') {
        handleRequest(ws, frame)
      }
    } catch {
      // Ignore malformed frames
    }
  })

  ws.on('close', () => {
    state.clients.delete(ws)
  })
}

function handleRequest(ws: WebSocket, frame: { type: string; id: string; method: string; params?: any }) {
  const { id, method, params } = frame

  // Record in history
  state.history.push({ method, params, timestamp: Date.now() })

  // Special handling for 'connect' — send hello-ok as event after response
  if (method === 'connect') {
    const handler = state.handlers.get('connect')
    const result = handler ? handler(params) : { ok: true, payload: {} }
    ws.send(JSON.stringify({ type: 'res', id, ...result }))

    // Send presence events for online agents after connect
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'event',
        event: 'presence',
        payload: { agentId: 'agent-1', status: 'online' },
      }))
    }, 10)

    return
  }

  // Check for custom handler
  const handler = state.handlers.get(method)
  if (handler) {
    try {
      const result = handler(params)
      ws.send(JSON.stringify({ type: 'res', id, ...result }))
    } catch (err: any) {
      ws.send(JSON.stringify({
        type: 'res',
        id,
        ok: false,
        error: { code: 'HANDLER_ERROR', message: err.message },
      }))
    }
  } else {
    ws.send(JSON.stringify({
      type: 'res',
      id,
      ok: false,
      error: { code: 'METHOD_NOT_FOUND', message: `Unknown method: ${method}` },
    }))
  }

  // Check for queued stream events after chat.send
  if (method === 'chat.send') {
    const sessionKey = params?.sessionKey || 'session-1'
    // Match exact session key or wildcard '*'
    const queued = state.streamQueue.find((q) => q.sessionKey === sessionKey || q.sessionKey === '*')
    if (queued) {
      state.streamQueue = state.streamQueue.filter((q) => q !== queued)
      let delay = 50
      for (const evt of queued.events) {
        // Replace sessionKey placeholder with actual session key
        const enrichedEvt = JSON.parse(JSON.stringify(evt))
        if (enrichedEvt.payload && (!enrichedEvt.payload.sessionKey || enrichedEvt.payload.sessionKey === '*')) {
          enrichedEvt.payload.sessionKey = sessionKey
        }
        setTimeout(() => {
          for (const client of state.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(enrichedEvt))
            }
          }
        }, delay)
        delay += 30
      }
    } else {
      // Default: stream a simple assistant response
      const responseText = 'This is a mock response from the assistant.'
      setTimeout(() => {
        broadcastEvent({
          type: 'event',
          event: 'agent',
          payload: {
            sessionKey,
            stream: 'assistant',
            data: { text: responseText, delta: responseText },
          },
        })
      }, 50)
      setTimeout(() => {
        broadcastEvent({
          type: 'event',
          event: 'agent',
          payload: {
            sessionKey,
            stream: 'lifecycle',
            data: { state: 'complete', phase: 'end' },
          },
        })
      }, 100)
      setTimeout(() => {
        broadcastEvent({
          type: 'event',
          event: 'chat',
          payload: {
            sessionKey,
            state: 'final',
            message: {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: responseText,
              timestamp: new Date().toISOString(),
            },
          },
        })
      }, 120)
    }
  }
}

function broadcastEvent(event: any) {
  const data = JSON.stringify(event)
  for (const client of state.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

// HTTP Control API
function handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    const url = new URL(req.url || '/', `http://localhost:${HTTP_PORT}`)
    const path = url.pathname

    try {
      if (path === '/reset' && req.method === 'POST') {
        state.handlers = createDefaultHandlers()
        state.history = []
        state.streamQueue = []
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      if (path === '/set-handler' && req.method === 'POST') {
        const { method, response } = JSON.parse(body)
        state.handlers.set(method, () => response)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      if (path === '/set-stream-response' && req.method === 'POST') {
        const { sessionKey, events } = JSON.parse(body)
        state.streamQueue.push({ sessionKey, events })
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      if (path === '/broadcast' && req.method === 'POST') {
        const event = JSON.parse(body)
        broadcastEvent(event)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      if (path === '/history' && req.method === 'GET') {
        const method = url.searchParams.get('method')
        const filtered = method
          ? state.history.filter((h) => h.method === method)
          : state.history
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(filtered))
        return
      }

      if (path === '/clients' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ count: state.clients.size }))
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  })
}

export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      state.wss = new WebSocketServer({ port: WS_PORT })
      state.wss.on('connection', handleWsConnection)

      state.httpServer = http.createServer(handleHttpRequest)
      state.httpServer.listen(HTTP_PORT, () => {
        console.log(`Mock WS server on ws://localhost:${WS_PORT}`)
        console.log(`Mock HTTP control on http://localhost:${HTTP_PORT}`)
        resolve()
      })

      state.httpServer.on('error', reject)
      state.wss.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    // Close all WS connections
    for (const client of state.clients) {
      client.close()
    }
    state.clients.clear()

    const closeWss = new Promise<void>((r) => {
      if (state.wss) {
        state.wss.close(() => r())
      } else {
        r()
      }
    })

    const closeHttp = new Promise<void>((r) => {
      if (state.httpServer) {
        state.httpServer.close(() => r())
      } else {
        r()
      }
    })

    Promise.all([closeWss, closeHttp]).then(() => resolve())
  })
}

// Allow running directly
if (require.main === module) {
  startServer().then(() => {
    console.log('Mock server running. Press Ctrl+C to stop.')
  })
}
