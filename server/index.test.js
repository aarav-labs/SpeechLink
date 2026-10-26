import assert from "node:assert/strict"

import { once } from "node:events"

import test from "node:test"

import { createServer, handleExpandRequest } from "./index.js"

const payload = {
  model: "openai/gpt-oss-120b",
  messages: [
    { role: "system", content: "Return two short sentences." },
    { role: "user", content: "Say please wait." },
  ],
}

test("forwards valid suggestion requests using the server-side Groq key", async () => {
  const originalKey = process.env.GROQ_API_KEY
  const originalFetch = globalThis.fetch
  process.env.GROQ_API_KEY = "test-server-key"

  let upstreamRequest
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, options }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"options":["One.","Two."]}' } }],
      }),
      { status: 200 },
    )
  }

  try {
    const result = await handleExpandRequest({
      method: "POST",
      headers: { origin: "https://speechlink.example" },
      host: "speechlink.example",
      body: JSON.stringify(payload),
    })

    assert.equal(result.statusCode, 200)
    assert.equal(
      upstreamRequest.url,
      "https://api.groq.com/openai/v1/chat/completions",
    )
    assert.equal(
      upstreamRequest.options.headers.Authorization,
      "Bearer test-server-key",
    )
    assert.deepEqual(
      JSON.parse(result.body).choices[0].message.content,
      '{"options":["One.","Two."]}',
    )
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalKey
  }
})

test("rejects suggestion requests from a different origin", async () => {
  const result = await handleExpandRequest({
    method: "POST",
    headers: { origin: "https://other.example" },
    host: "speechlink.example",
    body: JSON.stringify(payload),
  })

  assert.equal(result.statusCode, 403)
})

test("rejects invalid or unexpected Groq payloads", async () => {
  const result = await handleExpandRequest({
    method: "POST",
    headers: {},
    body: JSON.stringify({ ...payload, model: "other-model" }),
  })

  assert.equal(result.statusCode, 400)
})

test("serves the AI endpoint through the production Node server", async () => {
  const originalKey = process.env.GROQ_API_KEY
  const originalFetch = globalThis.fetch
  process.env.GROQ_API_KEY = "test-server-key"
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ choices: [] }), { status: 200 })

  const server = createServer({ production: true })
  server.listen(0, "127.0.0.1")
  await once(server, "listening")

  try {
    const origin = `http://127.0.0.1:${server.address().port}`
    const response = await fetch(`${origin}/api/expand`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify(payload),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { choices: [] })
  } finally {
    server.close()
    await once(server, "close")
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalKey
  }
})

test("returns 404 for unknown API routes", async () => {
  const server = createServer()

  server.listen(0, "127.0.0.1")

  await once(server, "listening")

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/tts/local`,
    )

    assert.equal(response.status, 404)

    assert.deepEqual(await response.json(), { error: "API route not found." })
  } finally {
    server.close()

    await once(server, "close")
  }
})

test("serves the built app for production routes", async () => {
  const server = createServer({ production: true })
  server.listen(0, "127.0.0.1")
  await once(server, "listening")

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/conversation`,
    )
    assert.equal(response.status, 200)
    assert.match(await response.text(), /SpeechLink/)
  } finally {
    server.close()
    await once(server, "close")
  }
})
