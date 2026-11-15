#!/usr/bin/env node
// Dreamcaster MCP stdio bridge.
// Claude Desktop, Cursor and other MCP clients launch this as a local process.
// It reads newline-delimited JSON-RPC messages from stdin, forwards each one to
// Dreamcaster's hosted MCP endpoint with your agent token, and writes the
// responses to stdout. Nothing is stored on disk. Logs go to stderr only,
// because stdout is reserved for the protocol.

import { createInterface } from 'node:readline'

const VERSION = '0.1.0'
const DEFAULT_ENDPOINT = 'https://dreamcaster.xyz/api/mcp'
const REQUEST_TIMEOUT_MS = 150_000 // image renders can take a while

const endpoint = (process.env.DREAMCASTER_MCP_URL || DEFAULT_ENDPOINT).trim()
const apiKey = (process.env.DREAMCASTER_API_KEY || '').trim()

function log(...parts) {
  process.stderr.write(`[dreamcaster-mcp] ${parts.join(' ')}\n`)
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function rpcError(id, code, message, data) {
  return { jsonrpc: '2.0', id, error: data ? { code, message, data } : { code, message } }
}

if (process.argv.includes('--version')) {
  process.stdout.write(`${VERSION}\n`)
  process.exit(0)
}

let parsedEndpoint
try {
  parsedEndpoint = new URL(endpoint)
} catch {
  log(`DREAMCASTER_MCP_URL is not a valid URL: ${endpoint}`)
  process.exit(1)
}
const isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsedEndpoint.hostname)
if (parsedEndpoint.protocol !== 'https:' && !isLocal) {
  log('Refusing to send your agent token over plain HTTP. Use an https:// endpoint.')
  process.exit(1)
}

if (!apiKey) {
  log('DREAMCASTER_API_KEY is not set. Create a key at https://dreamcaster.xyz/settings (Agent Bridge).')
  log('Tool discovery still works, but tool calls will be rejected until a key is provided.')
} else if (!apiKey.startsWith('dc_live_')) {
  log('DREAMCASTER_API_KEY should start with dc_live_. Check that you pasted the full key.')
}

async function forward(message) {
  const isNotification = message.id === undefined
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': `dreamcaster-mcp/${VERSION}`,
    }
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`

    const response = await fetch(parsedEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
      signal: controller.signal,
    })

    if (isNotification) return

    const text = await response.text()
    let payload
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }

    if (payload && typeof payload === 'object' && payload.jsonrpc === '2.0') {
      send(payload)
      return
    }

    send(rpcError(message.id, -32603, `Dreamcaster returned HTTP ${response.status} without a JSON-RPC body`))
  } catch (err) {
    if (isNotification) return
    const reason = err?.name === 'AbortError' ? 'Request to Dreamcaster timed out' : `Could not reach Dreamcaster: ${err?.message || err}`
    send(rpcError(message.id, -32603, reason))
  } finally {
    clearTimeout(timer)
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
const inFlight = new Set()

rl.on('line', (line) => {
  const trimmed = line.trim()
  if (!trimmed) return

  let message
  try {
    message = JSON.parse(trimmed)
  } catch {
    send(rpcError(null, -32700, 'Parse error'))
    return
  }

  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    send(rpcError(null, -32600, 'Invalid Request'))
    return
  }

  const task = forward(message).finally(() => inFlight.delete(task))
  inFlight.add(task)
})

rl.on('close', async () => {
  await Promise.allSettled([...inFlight])
  process.exit(0)
})

log(`v${VERSION} ready, forwarding to ${parsedEndpoint.origin}`)
