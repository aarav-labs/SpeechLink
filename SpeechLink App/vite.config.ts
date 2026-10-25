import { defineConfig } from "vite"
import { loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { handleExpandRequest } from "./server/index.js"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "GROQ_API_KEY")
  if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "speechlink-expand-function",
        configureServer(server) {
          server.middlewares.use("/api/expand", async (request, response) => {
            try {
              const chunks: Buffer[] = []
              let size = 0
              for await (const chunk of request) {
                const buffer = Buffer.from(chunk)
                size += buffer.length
                if (size > 16 * 1024) {
                  response.writeHead(413, {
                    "Content-Type": "application/json; charset=utf-8",
                  })
                  response.end(
                    JSON.stringify({ error: "Request is too large." }),
                  )
                  return
                }
                chunks.push(buffer)
              }

              const result = await handleExpandRequest({
                method: request.method || "",
                headers: request.headers,
                host: request.headers.host,
                body: Buffer.concat(chunks).toString("utf8"),
              })

              response.writeHead(result.statusCode, result.headers)
              response.end(result.body)
            } catch (error) {
              console.error("[SpeechLink] Local AI function failed:", error)
              response.writeHead(500, {
                "Content-Type": "application/json; charset=utf-8",
              })
              response.end(JSON.stringify({ error: "AI suggestions failed." }))
            }
          })
        },
      },
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      allowedHosts: true,
    },
  }
})
