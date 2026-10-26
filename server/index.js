import { createServer as createHttpServer } from "node:http"

import { createReadStream, existsSync } from "node:fs"

import { extname, resolve, sep } from "node:path"

import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("../", import.meta.url))

const distRoot = resolve(projectRoot, "dist")
const maxRequestBytes = 16 * 1024
const allowedModel = "openai/gpt-oss-120b"

const contentTypes = {
  ".css": "text/css; charset=utf-8",

  ".html": "text/html; charset=utf-8",

  ".ico": "image/x-icon",

  ".js": "text/javascript; charset=utf-8",

  ".json": "application/json; charset=utf-8",

  ".png": "image/png",

  ".svg": "image/svg+xml",

  ".webmanifest": "application/manifest+json",

  ".webp": "image/webp",
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  })

  response.end(JSON.stringify(data))
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
    body: JSON.stringify(payload),
  }
}

export async function handleExpandRequest({ method, headers, body, host }) {
  if (method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." })
  }

  const origin = headers?.origin || headers?.Origin

  if (origin) {
    try {
      const requestOrigin = new URL(origin)
      if (
        !["http:", "https:"].includes(requestOrigin.protocol) ||
        requestOrigin.host !== host
      ) {
        return jsonResponse(403, { error: "Request origin is not allowed." })
      }
    } catch {
      return jsonResponse(403, { error: "Request origin is not allowed." })
    }
  }

  if (!body || Buffer.byteLength(body, "utf8") > maxRequestBytes) {
    return jsonResponse(413, { error: "Request is too large." })
  }

  let payload

  try {
    payload = JSON.parse(body)
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON." })
  }

  if (
    payload?.model !== allowedModel ||
    !Array.isArray(payload.messages) ||
    payload.messages.length < 2 ||
    payload.messages.length > 8 ||
    payload.messages.some(
      (message) =>
        !["system", "user", "assistant"].includes(message?.role) ||
        typeof message.content !== "string" ||
        message.content.length > 8000,
    )
  ) {
    return jsonResponse(400, { error: "Invalid suggestion request." })
  }

  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.error("[SpeechLink] GROQ_API_KEY is not configured.")
    return jsonResponse(503, { error: "AI suggestions are not configured." })
  }

  try {
    const upstream = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    )

    const responseText = await upstream.text()

    if (!upstream.ok) {
      console.error(`[SpeechLink] Groq returned HTTP ${upstream.status}.`)
      return jsonResponse(upstream.status, {
        error: "AI suggestions are temporarily unavailable.",
      })
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
      body: responseText,
    }
  } catch (error) {
    console.error("[SpeechLink] Groq request failed:", error)
    return jsonResponse(502, {
      error: "AI suggestions are temporarily unavailable.",
    })
  }
}

function serveStatic(request, response) {
  if (!existsSync(resolve(distRoot, "index.html"))) {
    sendJson(response, 503, {
      error: "Frontend build is missing. Run npm run build before starting.",
    })

    return
  }

  let pathname

  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    )
  } catch {
    sendJson(response, 400, { error: "Invalid request path." })

    return
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1)

  const filePath = resolve(distRoot, relativePath)

  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
    sendJson(response, 403, { error: "Forbidden." })

    return
  }

  const resolvedPath = existsSync(filePath)
    ? filePath
    : resolve(distRoot, "index.html")

  response.writeHead(200, {
    "Content-Type":
      contentTypes[extname(resolvedPath)] || "application/octet-stream",
  })

  if (request.method === "HEAD") {
    response.end()

    return
  }

  createReadStream(resolvedPath).pipe(response)
}

export function createServer({ production = false } = {}) {
  return createHttpServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname

    if (pathname.startsWith("/api/")) {
      if (pathname !== "/api/expand") {
        sendJson(response, 404, { error: "API route not found." })
        return
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed." })
        return
      }

      try {
        const chunks = []
        let size = 0

        for await (const chunk of request) {
          const buffer = Buffer.from(chunk)
          size += buffer.length

          if (size > maxRequestBytes) {
            sendJson(response, 413, { error: "Request is too large." })
            return
          }

          chunks.push(buffer)
        }

        const result = await handleExpandRequest({
          method: request.method,
          headers: request.headers,
          host: request.headers.host,
          body: Buffer.concat(chunks).toString("utf8"),
        })

        response.writeHead(result.statusCode, result.headers)
        response.end(result.body)
      } catch (error) {
        console.error("[SpeechLink] AI endpoint failed:", error)
        sendJson(response, 500, { error: "AI suggestions failed." })
      }

      return
    }

    if (production && (request.method === "GET" || request.method === "HEAD")) {
      serveStatic(request, response)

      return
    }

    sendJson(response, 404, { error: "Not found." })
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4174)

  const host = process.env.HOST || "0.0.0.0"

  const server = createServer({
    production: process.env.NODE_ENV !== "development",
  })

  server.listen(port, host, () => {
    console.log(`[SpeechLink] Static server listening on ${host}:${port}`)
  })
}
