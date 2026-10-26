export class SpeechLinkCore {
  constructor(config = {}) {
    this.config = {
      groqModel: "openai/gpt-oss-120b",
      groqEndpoint: "/api/expand",

      // Preferences
      language: config.language || "hi-IN",
      persona: config.persona || "casual",
      voiceGender: config.voiceGender === "male" ? "male" : "female",
      confirmBeforeSpeaking:
        config.confirmBeforeSpeaking !== undefined
          ? config.confirmBeforeSpeaking
          : false,
      speechPace: config.speechPace ?? 1.0,

      // User's Verified Fact Cards
      userData: {
        name: config.userData?.name || "",
        address: config.userData?.address || "",
        phone: config.userData?.phone || "",
        medical: config.userData?.medical || "",
      },
    }

    this.state = {
      partnerTranscript: "",
      userFragment: "",
      generatedOptions: [],
      isListening: false,
      isSpeaking: false,
    }

    this.listeners = new Set()
    this._recognition = null
    this._shouldListen = false
    this._currentAudio = null
    this._isVoicePlaying = false
    this._lastEmittedTranscript = ""
    this._lastEmittedTime = 0

    this._initSpeechRecognition()
  }

  subscribe(callback) {
    if (typeof callback !== "function") return () => {}
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  _notify(eventName, data) {
    this.listeners.forEach((cb) => {
      try {
        cb(eventName, data)
      } catch (e) {}
    })
  }

  setLanguage(langCode) {
    if (!["hi-IN", "en-IN"].includes(langCode)) return
    this.config.language = langCode
    if (this._recognition) this._recognition.lang = langCode
  }

  setPersona(persona) {
    if (!["casual", "formal"].includes(persona)) return
    this.config.persona = persona
  }

  setVoiceGender(gender) {
    if (gender !== "male" && gender !== "female") return
    this.config.voiceGender = gender
  }

  setSpeechPace(rate) {
    if (!Number.isFinite(rate) || rate < 0.7 || rate > 1.3) return
    this.config.speechPace = rate
  }

  setUserData(data = {}) {
    this.config.userData = {
      name:
        data.name !== undefined
          ? String(data.name).trim()
          : this.config.userData.name,
      address:
        data.address !== undefined
          ? String(data.address).trim()
          : this.config.userData.address,
      phone:
        data.phone !== undefined
          ? String(data.phone).trim()
          : this.config.userData.phone,
      medical:
        data.medical !== undefined
          ? String(data.medical).trim()
          : this.config.userData.medical,
    }
  }

  // --------------------------------------------------------------------------
  // STEP 1: TRANSCRIPTION WITH DUPLICATE FILTER
  // --------------------------------------------------------------------------
  _initSpeechRecognition() {
    if (typeof window === "undefined") return
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    try {
      this._recognition = new SpeechRecognition()
      this._recognition.continuous = false
      this._recognition.interimResults = false
      this._recognition.lang = this.config.language

      this._recognition.onstart = () => {
        this.state.isListening = true
        this._notify("transcription_start", null)
      }

      this._recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || ""
        const cleaned = text.trim()
        if (cleaned) {
          // De-duplicate: Never emit the exact same text twice within 1.5s
          const now = Date.now()
          if (
            cleaned === this._lastEmittedTranscript &&
            now - this._lastEmittedTime < 1500
          ) {
            return
          }
          this._lastEmittedTranscript = cleaned
          this._lastEmittedTime = now
          this.setPartnerTranscript(cleaned)
        }
      }

      this._recognition.onerror = () => {
        this.state.isListening = false
      }

      this._recognition.onend = () => {
        this.state.isListening = false
        this._notify("transcription_end", null)

        // Auto restart mic cleanly if not speaking
        if (this._shouldListen && !this._isVoicePlaying) {
          setTimeout(() => {
            if (
              this._shouldListen &&
              !this._isVoicePlaying &&
              this._recognition
            ) {
              try {
                this._recognition.start()
              } catch (e) {}
            }
          }, 350)
        }
      }
    } catch (e) {}
  }

  startListening() {
    if (!this._recognition) return false
    if (this.state.isListening) return true
    this._shouldListen = true
    try {
      this._recognition.lang = this.config.language
      this._recognition.start()
      return true
    } catch (e) {
      this._shouldListen = false
      return false
    }
  }

  stopListening() {
    this._shouldListen = false
    if (this._recognition) {
      try {
        this._recognition.stop()
      } catch (e) {}
    }
    this.state.isListening = false
  }

  setPartnerTranscript(text) {
    const cleaned = String(text || "").trim()
    if (!cleaned) return ""
    this.state.partnerTranscript = cleaned
    this._notify("transcript_updated", { transcript: cleaned })
    return cleaned
  }

  resetConversation() {
    this.state.partnerTranscript = ""
    this.state.userFragment = ""
    this.state.generatedOptions = []
    if (this._currentAudio) {
      this._currentAudio.pause()
      this._currentAudio = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    this._isVoicePlaying = false
  }

  // --------------------------------------------------------------------------
  // STEP 2 & 3: GROQ MULTI-TURN FRAGMENT EXPANSION
  // --------------------------------------------------------------------------
  buildGroqPayload(partnerText, userFragment) {
    const lang = this.config.language
    const persona = this.config.persona
    const userData = this.config.userData || {}

    const langName =
      lang === "hi-IN"
        ? "natural everyday Hindi (Devanagari script)"
        : "natural Indian English"
    const tone =
      persona === "formal"
        ? "respectful, formal, and polite"
        : "casual, conversational, and direct"

    const userFacts = [
      userData.name ? `User Name: ${userData.name}` : null,
      userData.address ? `User Address: ${userData.address}` : null,
      userData.phone ? `Emergency Phone: ${userData.phone}` : null,
      userData.medical ? `Medical Note: ${userData.medical}` : null,
    ]
      .filter(Boolean)
      .join(", ")

    const systemPrompt = `You are SpeechLink AI, an assistive communication assistant for a nonspeaking or deaf person in India.
Your job is to expand short raw typed keyword fragments into exactly 2 natural, complete spoken sentences that answer what the speaking partner said.

CRITICAL INSTRUCTIONS:
1. Target Language: ${langName}
2. Tone: ${tone} (${persona})
${userFacts ? `User Verified Facts (use ONLY if relevant): ${userFacts}` : ""}
3. COMPOUND FRAGMENTS: If user types multiple words/ideas (e.g. "purana theek? naya mat lo" or "1 chai bina cheeni"), COMBINE ALL IDEAS into BOTH options. Do NOT split them! Both Option 1 and Option 2 must express the complete thought with slightly different natural phrasings.
4. If input has a question mark ("?"), both options MUST be questions.

OUTPUT FORMAT:
Return RAW valid JSON with this exact schema:
{"options": ["Sentence option 1 combining all user ideas", "Sentence option 2 combining all user ideas"]}`

    return {
      model: this.config.groqModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Partner context: "Flush valve ka washer kat gaya hai"\nUser keywords: "purana theek?"`,
        },
        {
          role: "assistant",
          content: `{"options": ["भैया, पहले पुराना वाला ही ठीक करने की कोशिश करो।", "पुराना वाला रिपेयर नहीं हो सकता क्या?"]}`,
        },
        {
          role: "user",
          content: `Partner context: "${partnerText || "General conversation"}"\nUser keywords: "${userFragment}"`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1200,
    }
  }

  parseGroqResponse(rawContent) {
    let cleaned = String(rawContent || "").trim()
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```[a-z]*\s*/i, "")
        .replace(/```$/g, "")
        .trim()
    }

    try {
      const parsed = JSON.parse(cleaned)
      let list = parsed.options || parsed.sentences || []
      const valid = list
        .map((s) => String(s || "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 2)
      if (valid.length === 1) valid.push(valid[0])
      if (valid.length >= 2) return valid
    } catch (e) {}

    const matches = cleaned.match(/"([^"\\]*(\\.[^"\\]*)*)"/g)
    if (matches && matches.length >= 2) {
      return matches.slice(0, 2).map((m) => m.replace(/^"|"$/g, "").trim())
    }

    throw new Error("Could not extract options from Groq response")
  }

  async expandFragment(userFragment, partnerTextOverride = null) {
    const fragment = String(userFragment || "").trim()
    if (!fragment) throw new Error("Fragment cannot be empty")

    if (partnerTextOverride) {
      this.state.partnerTranscript = String(partnerTextOverride).trim()
    }
    const partner = this.state.partnerTranscript
    this.state.userFragment = fragment

    const payload = this.buildGroqPayload(partner, fragment)
    const fetchFn = typeof fetch !== "undefined" ? fetch : globalThis.fetch

    const response = await fetchFn(this.config.groqEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq HTTP ${response.status}: ${err}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ""
    const options = this.parseGroqResponse(rawContent)

    this.state.generatedOptions = options
    return options
  }

  // --------------------------------------------------------------------------
  // STEP 4: Device speech synthesis
  // --------------------------------------------------------------------------
  speakWithNativeBrowser(text) {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return resolve()
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = this.config.language
      utterance.rate = this.config.speechPace || 1.0

      const voices = window.speechSynthesis.getVoices()
      let bestVoice = null

      const languagePrefix = this.config.language.slice(0, 2).toLowerCase()
      const languageVoices = voices.filter((voice) =>
        voice.lang.replace("_", "-").toLowerCase().startsWith(languagePrefix),
      )
      const preferredNames =
        this.config.voiceGender === "female"
          ? languagePrefix === "hi"
            ? ["swara", "kalpana", "neerja", "natural female"]
            : ["jenny", "aria", "sonia", "neerja", "natural female", "zira"]
          : languagePrefix === "hi"
            ? ["hemant", "madhur", "prabhat", "natural male"]
            : ["david", "mark", "guy", "ryan", "natural male"]
      bestVoice = preferredNames
        .map((name) =>
          languageVoices.find((voice) =>
            voice.name.toLowerCase().includes(name),
          ),
        )
        .find(Boolean)

      if (!bestVoice) {
        bestVoice = languageVoices[0]
      }

      if (bestVoice) utterance.voice = bestVoice

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      window.speechSynthesis.speak(utterance)
    })
  }

  async speakText(text) {
    const toSpeak = String(text || "").trim()
    if (!toSpeak) return

    const resumeListening = this.state.isListening
    this._isVoicePlaying = true
    if (resumeListening) this.stopListening()

    try {
      await this.speakWithNativeBrowser(toSpeak)
    } finally {
      this._isVoicePlaying = false
      if (resumeListening) this.startListening()
    }
  }

  async handleOptionSelected(optionIndex) {
    const text = this.state.generatedOptions[optionIndex]
    if (text) {
      await this.speakText(text)
    }
  }

  // Gracefully clear out old active event loops when creating a new instance
  destroy() {
    this.listeners.clear()

    if (this._recognition) {
      try {
        this._recognition.onstart = null
        this._recognition.onresult = null
        this._recognition.onerror = null
        this._recognition.onend = null
        this._recognition.stop()
      } catch (e) {}
      this._recognition = null
    }

    if (this._currentAudio) {
      try {
        this._currentAudio.pause()
        this._currentAudio.src = ""
      } catch (e) {}
      this._currentAudio = null
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel()
      } catch (e) {}
    }

    this._isVoicePlaying = false
    this.state.isListening = false
  }
}

export default SpeechLinkCore
