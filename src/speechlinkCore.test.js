import assert from "node:assert/strict"

import test from "node:test"

import { SpeechLinkCore } from "./speechlinkCore.js"

test("uses GPT-OSS 120B without a client-side API key", () => {
  const core = new SpeechLinkCore()

  assert.equal(core.buildGroqPayload("", "hello").model, "openai/gpt-oss-120b")
  assert.equal("groqApiKey" in core.config, false)

  assert.equal("murfApiKey" in core.config, false)

  assert.equal(typeof core.speakWithMurf, "undefined")

  core.destroy()
})

test("uses the server endpoint and parses GPT-OSS suggestions", async () => {
  const originalFetch = globalThis.fetch

  let request

  globalThis.fetch = async (url, options) => {
    request = { url, options }

    return {
      ok: true,

      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                options: ["First sentence.", "Second sentence."],
              }),
            },
          },
        ],
      }),
    }
  }

  try {
    const core = new SpeechLinkCore()

    const suggestions = await core.expandFragment("please wait")

    assert.deepEqual(suggestions, ["First sentence.", "Second sentence."])

    assert.equal(
      request.url,

      "/api/expand",
    )

    assert.equal("Authorization" in request.options.headers, false)

    assert.equal(
      JSON.parse(request.options.body).model,

      "openai/gpt-oss-120b",
    )

    core.destroy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("selects the configured male voice while preserving the female default", async () => {
  const originalWindow = globalThis.window
  const originalUtterance = globalThis.SpeechSynthesisUtterance
  const voices = [
    { name: "Microsoft Kalpana", lang: "hi-IN" },
    { name: "Microsoft Hemant", lang: "hi-IN" },
    { name: "Microsoft Zira", lang: "en-US" },
    { name: "Microsoft David", lang: "en-US" },
  ]

  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text
    }
  }

  try {
    for (const [language, gender, expectedName] of [
      ["hi-IN", "female", "Microsoft Kalpana"],
      ["hi-IN", "male", "Microsoft Hemant"],
      ["en-IN", "female", "Microsoft Zira"],
      ["en-IN", "male", "Microsoft David"],
    ]) {
      let selectedVoice
      globalThis.window = {
        speechSynthesis: {
          cancel() {},
          getVoices: () => voices,
          speak(utterance) {
            selectedVoice = utterance.voice
            setImmediate(() => utterance.onend())
          },
        },
      }

      const core = new SpeechLinkCore({ language, voiceGender: gender })
      await core.speakWithNativeBrowser("Test voice")
      assert.equal(selectedVoice.name, expectedName)
      core.destroy()
    }
  } finally {
    globalThis.window = originalWindow
    globalThis.SpeechSynthesisUtterance = originalUtterance
  }
})

test("prefers the installed natural Hindi and English voices", async () => {
  const originalWindow = globalThis.window

  const originalUtterance = globalThis.SpeechSynthesisUtterance

  const voices = [
    { name: "Microsoft David", lang: "en-US" },

    { name: "Microsoft Swara Online (Natural)", lang: "hi-IN" },

    { name: "Microsoft Kalpana", lang: "hi-IN" },

    { name: "Microsoft Zira", lang: "en-US" },

    { name: "Microsoft Jenny Online (Natural)", lang: "en-US" },
  ]

  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text
    }
  }

  try {
    for (const [language, expectedName] of [
      ["hi-IN", "Microsoft Swara Online (Natural)"],

      ["en-IN", "Microsoft Jenny Online (Natural)"],
    ]) {
      let selectedVoice

      globalThis.window = {
        speechSynthesis: {
          cancel() {},

          getVoices: () => voices,

          speak(utterance) {
            selectedVoice = utterance.voice

            setImmediate(() => utterance.onend())
          },
        },
      }

      const core = new SpeechLinkCore({ language })

      await core.speakWithNativeBrowser("Test voice")

      assert.equal(selectedVoice.name, expectedName)

      core.destroy()
    }
  } finally {
    globalThis.window = originalWindow

    globalThis.SpeechSynthesisUtterance = originalUtterance
  }
})

test("falls back to an available language-matching browser voice", async () => {
  const originalWindow = globalThis.window

  const originalUtterance = globalThis.SpeechSynthesisUtterance

  let selectedVoice

  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text
    }
  }

  globalThis.window = {
    speechSynthesis: {
      cancel() {},

      getVoices: () => [
        { name: "Microsoft David", lang: "en-US" },

        { name: "Microsoft Hemant", lang: "hi-IN" },
      ],

      speak(utterance) {
        selectedVoice = utterance.voice

        setImmediate(() => utterance.onend())
      },
    },
  }

  try {
    const core = new SpeechLinkCore({ language: "hi-IN" })

    await core.speakWithNativeBrowser("नमस्ते")

    assert.equal(selectedVoice.name, "Microsoft Hemant")

    core.destroy()
  } finally {
    globalThis.window = originalWindow

    globalThis.SpeechSynthesisUtterance = originalUtterance
  }
})

test("clears conversation context and cancels current browser speech", () => {
  const originalWindow = globalThis.window

  let cancelled = false

  globalThis.window = {
    speechSynthesis: {
      cancel() {
        cancelled = true
      },
    },
  }

  try {
    const core = new SpeechLinkCore()

    core.setPartnerTranscript("Old context")

    core.state.userFragment = "old fragment"

    core.state.generatedOptions = ["old option"]

    core.resetConversation()

    assert.equal(core.state.partnerTranscript, "")

    assert.equal(core.state.userFragment, "")

    assert.deepEqual(core.state.generatedOptions, [])

    assert.equal(cancelled, true)

    core.destroy()
  } finally {
    globalThis.window = originalWindow
  }
})
