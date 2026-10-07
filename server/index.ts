import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const DIST_DIR = "dist",
  FETCH_TIMEOUT_MS = 2000,
  HTTP_BAD_GATEWAY = 502,
  HTTP_NOT_FOUND = 404,
  HTTP_NOT_IMPLEMENTED = 501,
  HTTP_OK = 200,
  MISSING_INDEX = -1,
  PORT = 5174
const CDP_ENDPOINT = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9222"

const MIME: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(payload))
}

function extensionOf(file: string): string {
  const dot = file.lastIndexOf(".")
  if (dot === MISSING_INDEX) {
    return ""
  }
  return file.slice(dot)
}

async function sendFile(response: ServerResponse, file: string, contentType: string): Promise<void> {
  const body = await readFile(file)
  response.writeHead(HTTP_OK, { "content-type": contentType })
  response.end(body)
}

async function sendFallback(response: ServerResponse): Promise<void> {
  try {
    await sendFile(response, join(DIST_DIR, "index.html"), "text/html")
  } catch {
    sendJson(response, HTTP_NOT_FOUND, { error: "not found" })
  }
}

async function serveStatic(pathname: string, response: ServerResponse): Promise<void> {
  let relative = pathname
  if (pathname === "/") {
    relative = "/index.html"
  }
  if (relative.includes("..")) {
    relative = "/index.html"
  }
  const file = join(DIST_DIR, relative)
  try {
    await sendFile(response, file, MIME[extensionOf(file)] ?? "application/octet-stream")
  } catch {
    await sendFallback(response)
  }
}

async function handleTabs(response: ServerResponse): Promise<void> {
  try {
    const upstream = await fetch(`${CDP_ENDPOINT}/json/list`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!upstream.ok) {
      throw new Error(`CDP responded ${upstream.status}`)
    }
    const targets = (await upstream.json()) as { id: string; title: string; type: string; url: string }[]
    const tabs = targets
      .filter((target) => target.type === "page")
      .map((target) => ({ id: target.id, title: target.title, url: target.url }))
    sendJson(response, HTTP_OK, { count: tabs.length, tabs })
  } catch {
    sendJson(response, HTTP_BAD_GATEWAY, {
      error: "Chrome debug is off. Run npm run chrome:debug once, then retry.",
    })
  }
}

function handleApi(pathname: string, response: ServerResponse): boolean {
  if (pathname === "/api/tabs") {
    void handleTabs(response)
    return true
  }
  if (pathname === "/api/source") {
    sendJson(response, HTTP_NOT_IMPLEMENTED, { error: "automation removed, reimplement from scratch" })
    return true
  }
  if (pathname.startsWith("/api/")) {
    sendJson(response, HTTP_NOT_FOUND, { error: "unknown api route" })
    return true
  }
  return false
}

function handleRequest(request: IncomingMessage, response: ServerResponse): void {
  const { pathname } = new URL(request.url ?? "", "http://localhost")
  if (handleApi(pathname, response)) {
    return
  }
  void serveStatic(pathname, response)
}

const server = createServer(handleRequest)

server.listen(PORT, () => {
  console.log(`opentalent pipeline server listening on http://localhost:${PORT}`)
})
