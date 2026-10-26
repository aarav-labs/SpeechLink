// @ts-ignore
import { SpeechLinkCore } from "./speechlinkCore.js"
import { KeyboardEvent, useEffect, useRef, useState } from "react"

type Language = "hi-IN" | "en-IN"
type Persona = "casual" | "formal"
type Theme = "light" | "dark"
type Page = "setup" | "home" | "conversation" | "settings"
type IslProfile = "native" | "learning" | "text"
type VoiceGender = "female" | "male"
type Message = {
  id: number
  role: "partner" | "user"
  text: string
  spoken?: boolean
}
type Settings = {
  setupComplete: boolean
  uiLanguage: Language
  profile: "deaf-hoh" | "hearing-nonspeaking"
  isl: IslProfile
  language: Language
  persona: Persona
  voiceGender: VoiceGender
  region: string
  confirm: boolean
  rate: number
  name: string
  address: string
  phone: string
  medical: string
  theme: Theme
}

const defaults: Settings = {
  setupComplete: false,
  uiLanguage: "en-IN",
  profile: "deaf-hoh",
  isl: "text",
  language: "en-IN",
  persona: "casual",
  voiceGender: "female",
  region: "Delhi",
  confirm: false,
  rate: 1,
  name: "",
  address: "",
  phone: "",
  medical: "",
  theme: "light",
}

const copy = {
  "en-IN": {
    setupKicker: "First-time setup",
    setupTitle: "Make SpeechLink yours",
    setupDescription:
      "Choose the basics now. You can change every option later in Settings.",
    interfaceLanguage: "App language",
    conversationLanguage: "Conversation language",
    continue: "Finish setup",
    tagline: "Your words, spoken naturally.",
    homeDescription:
      "Turn short typed phrases into clear Hindi or Indian English speech.",
    start: "Start conversation",
    settings: "Settings",
    language: "Language",
    conversation: "Conversation",
    begin: "Start your conversation",
    beginDescription:
      "Capture the other person's speech, or type a few words below.",
    capture: "Capture speech",
    capturing: "Capturing speech…",
    captureHint: "Uses your device microphone",
    typeHint: "Or type below to speak",
    placeholder: "Type 2–3 keywords, e.g. 1 without sugar",
    sayAgain: "Please say that again.",
    sayAgainLabel: "Say again",
    replay: "Replay",
    wait: "One moment, I am thinking.",
    waitLabel: "Wait, thinking",
    yes: "Yes, please.",
    yesLabel: "Yes",
    no: "No, thank you.",
    noLabel: "No",
    casual: "Casual",
    formal: "Formal",
    tapToSpeak: "Tap to speak",
    settingsTitle: "Settings",
    settingsIntro:
      "Personalise communication, voice output, and protected facts.",
    accessibilitySection: "Accessibility & Linguistic Profile",
    auditoryProfile: "Auditory profile",
    deaf: "Deaf / Hard-of-Hearing",
    nonspeaking: "Hearing, Nonspeaking",
    isl: "ISL proficiency",
    nativeSigner: "Native Signer",
    learningIsl: "Learning ISL",
    textOnly: "Non-Signer (Text only)",
    dialect: "Regional dialect",
    selectCity: "Select city",
    voiceSection: "Voice & Audio Output Engine",
    voiceGender: "Voice",
    femaleVoice: "Female",
    maleVoice: "Male",
    voiceHelp:
      "SpeechLink uses natural Hindi and English voices available on this device.",
    aiSection: "AI sentence suggestions",
    aiHelp: "GPT-OSS 120B suggestions are provided by the app service.",
    pace: "Speaking pace",
    slowClear: "Slow & Clear",
    fast: "Fast",
    confirm: "Confirm before speaking",
    confirmHelp: "Preview each sentence before it is voiced",
    darkMode: "Dark mode",
    darkHelp: "Use a low-glare interface",
    testVoice: "Test voice",
    testGreeting: "Hello, I am ready to help you communicate.",
    protectedSection: "Protected Fact Cards",
    protectedHelp:
      "Only facts you enter are used. They are encrypted before local storage.",
    fullName: "Full name",
    namePlaceholder: "Enter your full name",
    address: "Home / city address",
    addressPlaceholder: "Enter your address",
    phone: "Emergency contact phone number",
    phonePlaceholder: "Enter a phone number",
    medical: "Medical alert & notes",
    medicalPlaceholder: "Enter only verified medical or communication notes",
    saveLock: "Save & lock",
    saved: "Protected facts saved and locked on this device.",
    saveError: "Protected facts could not be encrypted. Please try again.",
    confirmTitle: "Confirm before speaking",
    confirmIntro: "Review the sentence before it is spoken aloud.",
    sentence: "Sentence",
    cancel: "Cancel",
    speakNow: "Speak now",
    openSettings: "Open settings",
    goBack: "Go back",
    dismiss: "Dismiss",
    speakMessage: "Speak message",
    keywords: "Keyword fragments",
    displaySection: "Display & App Language",
    displayHelp: "Choose the interface language and screen appearance.",
    emergency: "Emergency information",
    emergencySetup: "Add protected facts to use the emergency action.",
    clearChat: "Clear chat",
    closeEmergency: "Close emergency information",
    islCamera: "ISL camera",
    islCameraTitle: "Record an ISL message",
    islCameraHelp:
      "Record your signing locally to show or download. SpeechLink does not automatically translate sign language.",
    startCamera: "Start camera",
    startRecording: "Record sign",
    stopRecording: "Stop recording",
    downloadRecording: "Download video",
    cameraError: "Camera could not be started. Check permission and try again.",
    closeCamera: "Close camera",
  },
  "hi-IN": {
    setupKicker: "पहली बार की सेटिंग",
    setupTitle: "SpeechLink को अपने अनुसार बनाएँ",
    setupDescription: "अभी ज़रूरी विकल्प चुनें। इन्हें बाद में सेटिंग्स में बदला जा सकता है।",
    interfaceLanguage: "ऐप की भाषा",
    conversationLanguage: "बातचीत की भाषा",
    continue: "सेटअप पूरा करें",
    tagline: "आपके शब्द, सहज आवाज़ में।",
    homeDescription: "छोटे वाक्यांशों को साफ़ हिंदी या भारतीय अंग्रेज़ी में बोलें।",
    start: "बातचीत शुरू करें",
    settings: "सेटिंग्स",
    language: "भाषा",
    conversation: "बातचीत",
    begin: "बातचीत शुरू करें",
    beginDescription: "सामने वाले की बात दर्ज करें, या नीचे कुछ शब्द लिखें।",
    capture: "बात दर्ज करें",
    capturing: "बात दर्ज हो रही है…",
    captureHint: "डिवाइस के माइक्रोफ़ोन का उपयोग होगा",
    typeHint: "या बोलने के लिए नीचे लिखें",
    placeholder: "2–3 शब्द लिखें, जैसे 1 बिना चीनी",
    sayAgain: "कृपया एक बार फिर से बोलिए।",
    sayAgainLabel: "फिर से कहें",
    replay: "दोबारा सुनें",
    wait: "एक मिनट, मैं सोच रहा हूँ।",
    waitLabel: "एक मिनट",
    yes: "हाँ, ठीक है।",
    yesLabel: "हाँ",
    no: "नहीं, धन्यवाद।",
    noLabel: "नहीं",
    casual: "सहज",
    formal: "औपचारिक",
    tapToSpeak: "बोलने के लिए चुनें",
    settingsTitle: "सेटिंग्स",
    settingsIntro: "अपनी भाषा, आवाज़ और सुरक्षित जानकारी चुनें।",
    accessibilitySection: "सुलभता और भाषा प्रोफ़ाइल",
    auditoryProfile: "सुनने और बोलने की प्रोफ़ाइल",
    deaf: "बधिर / कम सुनाई देता है",
    nonspeaking: "सुन सकते हैं, बोलते नहीं",
    isl: "भारतीय सांकेतिक भाषा का अनुभव",
    nativeSigner: "सांकेतिक भाषा में निपुण",
    learningIsl: "ISL सीख रहे हैं",
    textOnly: "सांकेतिक भाषा नहीं (केवल टेक्स्ट)",
    dialect: "क्षेत्रीय बोली",
    selectCity: "शहर चुनें",
    voiceSection: "आवाज़ और ऑडियो आउटपुट",
    voiceGender: "आवाज़",
    femaleVoice: "महिला",
    maleVoice: "पुरुष",
    voiceHelp:
      "SpeechLink इस डिवाइस पर उपलब्ध प्राकृतिक हिंदी और अंग्रेज़ी आवाज़ों का उपयोग करता है।",
    aiSection: "AI वाक्य सुझाव",
    aiHelp: "GPT-OSS 120B सुझाव ऐप सेवा के माध्यम से उपलब्ध हैं।",
    pace: "बोलने की गति",
    slowClear: "धीमी और स्पष्ट",
    fast: "तेज़",
    confirm: "बोलने से पहले पुष्टि करें",
    confirmHelp: "हर वाक्य बोलने से पहले जाँचें",
    darkMode: "डार्क मोड",
    darkHelp: "कम रोशनी वाला इंटरफ़ेस",
    testVoice: "आवाज़ जाँचें",
    testGreeting: "नमस्ते, मैं बातचीत में आपकी मदद के लिए तैयार हूँ।",
    protectedSection: "सुरक्षित जानकारी कार्ड",
    protectedHelp:
      "केवल आपकी लिखी जानकारी इस्तेमाल होती है और लोकल स्टोरेज से पहले एन्क्रिप्ट होती है।",
    fullName: "पूरा नाम",
    namePlaceholder: "अपना पूरा नाम लिखें",
    address: "घर / शहर का पता",
    addressPlaceholder: "अपना पता लिखें",
    phone: "आपातकालीन संपर्क नंबर",
    phonePlaceholder: "फ़ोन नंबर लिखें",
    medical: "मेडिकल अलर्ट और नोट्स",
    medicalPlaceholder: "केवल सत्यापित मेडिकल या बातचीत संबंधी जानकारी लिखें",
    saveLock: "सेव और लॉक करें",
    saved: "सुरक्षित जानकारी इस डिवाइस पर सेव और लॉक हो गई।",
    saveError: "जानकारी एन्क्रिप्ट नहीं हो सकी। फिर से कोशिश करें।",
    confirmTitle: "बोलने से पहले पुष्टि करें",
    confirmIntro: "बोलने से पहले वाक्य जाँच लें।",
    sentence: "वाक्य",
    cancel: "रद्द करें",
    speakNow: "अब बोलें",
    openSettings: "सेटिंग्स खोलें",
    goBack: "वापस जाएँ",
    dismiss: "हटाएँ",
    speakMessage: "संदेश बोलें",
    keywords: "मुख्य शब्द",
    displaySection: "डिस्प्ले और ऐप की भाषा",
    displayHelp: "ऐप की भाषा और स्क्रीन का रूप चुनें।",
    emergency: "आपातकालीन जानकारी",
    emergencySetup: "आपातकालीन सुविधा के लिए सुरक्षित जानकारी जोड़ें।",
    clearChat: "चैट साफ़ करें",
    closeEmergency: "आपातकालीन जानकारी बंद करें",
    islCamera: "ISL कैमरा",
    islCameraTitle: "ISL संदेश रिकॉर्ड करें",
    islCameraHelp:
      "अपने सांकेतिक संदेश को दिखाने या डाउनलोड करने के लिए रिकॉर्ड करें। SpeechLink सांकेतिक भाषा का अपने-आप अनुवाद नहीं करता।",
    startCamera: "कैमरा शुरू करें",
    startRecording: "साइन रिकॉर्ड करें",
    stopRecording: "रिकॉर्डिंग रोकें",
    downloadRecording: "वीडियो डाउनलोड करें",
    cameraError: "कैमरा शुरू नहीं हो सका। अनुमति जाँचें और फिर कोशिश करें।",
    closeCamera: "कैमरा बंद करें",
  },
}

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(
      localStorage.getItem("speechlink-settings-v1") || "{}",
    ) as Partial<Settings>
    return {
      ...defaults,
      setupComplete:
        typeof saved.setupComplete === "boolean"
          ? saved.setupComplete
          : defaults.setupComplete,
      uiLanguage:
        saved.uiLanguage === "hi-IN" || saved.uiLanguage === "en-IN"
          ? saved.uiLanguage
          : defaults.uiLanguage,
      profile:
        saved.profile === "deaf-hoh" || saved.profile === "hearing-nonspeaking"
          ? saved.profile
          : defaults.profile,
      isl:
        saved.isl === "native" ||
        saved.isl === "learning" ||
        saved.isl === "text"
          ? saved.isl
          : defaults.isl,
      language:
        saved.language === "hi-IN" || saved.language === "en-IN"
          ? saved.language
          : defaults.language,
      persona:
        saved.persona === "casual" || saved.persona === "formal"
          ? saved.persona
          : defaults.persona,
      voiceGender:
        saved.voiceGender === "male" || saved.voiceGender === "female"
          ? saved.voiceGender
          : defaults.voiceGender,
      region: typeof saved.region === "string" ? saved.region : defaults.region,
      confirm:
        typeof saved.confirm === "boolean" ? saved.confirm : defaults.confirm,
      rate:
        typeof saved.rate === "number" &&
        Number.isFinite(saved.rate) &&
        saved.rate >= 0.7 &&
        saved.rate <= 1.3
          ? saved.rate
          : defaults.rate,
      theme:
        saved.theme === "light" || saved.theme === "dark"
          ? saved.theme
          : defaults.theme,
    }
  } catch (error) {
    console.warn("[SpeechLink] Could not load saved settings:", error)
    return defaults
  }
}

function Icon({
  name,
  size = 20,
}: {
  name: string
  size?: number
}) {
  const paths: Record<string, React.ReactNode> = {
    camera: (
      <>
        <path d="M14 5h-4l-1.5 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    mic: (
      <>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
      </>
    ),
    repeat: (
      <>
        <path d="m17 1 4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    medical: (
      <>
        <path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z" />
      </>
    ),
    id: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="11" r="2" />
        <path d="M5.5 16c.6-1.5 1.4-2 2.5-2s1.9.5 2.5 2M13 10h5M13 14h4" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
      </>
    ),
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function localFallbackExpand(
  fragment: string,
  context: string,
  language: Language,
  persona: Persona,
): string[] {
  const raw = fragment.trim()
  if (!raw) return []
  const lower = raw.toLowerCase()
  const polite = persona === "formal"

  if (language === "hi-IN") {
    if (/\d{4,6}/.test(raw) && /(guard|security|गार्ड)/i.test(raw)) {
      const otp = raw.match(/\d{4,6}/)?.[0]
      return [
        `मेरा OTP ${otp} है, कृपया पार्सल सिक्योरिटी गार्ड के पास छोड़ दीजिए।`,
        `OTP ${otp} नोट कर लीजिए और सामान गार्ड को दे दीजिए।`,
      ]
    }
    if (/पुराना|purana/i.test(raw)) {
      return [
        "भैया, पहले पुराना वाला ही ठीक करने की कोशिश करो, नया मत लाओ।",
        "नया लेने से पहले पुराने को रिपेयर करके देख लीजिए।",
      ]
    }
    return polite
      ? [`कृपया ${raw} के बारे में मेरी मदद कीजिए।`, `मैं ${raw} कहना चाहता हूँ।`]
      : [`मुझे ${raw} चाहिए।`, `कृपया ${raw} कर दीजिए।`]
  }

  if (/purana|old one|repair/i.test(lower)) {
    return [
      "Please try to repair the old one first, do not buy a new one yet.",
      "Can we please fix the old part instead of replacing it?",
    ]
  }

  return [
    `${polite ? "Yes, please" : "Yes"}, ${raw}.`,
    `Could you please help me with ${raw}?`,
  ]
}

type ProtectedFacts = Pick<Settings, "name" | "address" | "phone" | "medical">

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary)
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function getFactKey(): Promise<CryptoKey> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("speechlink-protected-facts", 1)
    request.onupgradeneeded = () => request.result.createObjectStore("keys")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction("keys", "readonly")
      const store = transaction.objectStore("keys")
      const existing = store.get("facts")
      existing.onerror = () => reject(existing.error)
      existing.onsuccess = async () => {
        if (existing.result) {
          resolve(existing.result)
          database.close()
          return
        }
        try {
          const key = await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"],
          )
          const saveTransaction = database.transaction("keys", "readwrite")
          saveTransaction.objectStore("keys").put(key, "facts")
          saveTransaction.oncomplete = () => {
            resolve(key)
            database.close()
          }
          saveTransaction.onerror = () => reject(saveTransaction.error)
        } catch (error) {
          reject(error)
        }
      }
    }
  })
}

async function encryptFacts(facts: ProtectedFacts) {
  const key = await getFactKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(facts))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  )
  localStorage.setItem(
    "speechlink-protected-facts-v1",
    JSON.stringify({
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(ciphertext)),
    }),
  )
}

async function decryptFacts(): Promise<ProtectedFacts | null> {
  const saved = localStorage.getItem("speechlink-protected-facts-v1")
  if (!saved) return null
  const payload = JSON.parse(saved)
  const key = await getFactKey()
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.data),
  )
  return JSON.parse(new TextDecoder().decode(plaintext))
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        className="sr-only"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={`toggle ${checked ? "on" : ""}`} aria-hidden="true">
        <i />
      </span>
    </label>
  )
}

function AppHeader({
  language,
  onBack,
  onSettings,
  onCamera,
  onClearChat,
  clearChatDisabled,
}: {
  language: Language
  onBack: () => void
  onSettings?: () => void
  onCamera?: () => void
  onClearChat?: () => void
  clearChatDisabled?: boolean
}) {
  const text = copy[language]
  return (
    <header className="app-header">
      <button className="logo-button" onClick={onBack} aria-label={text.goBack}>
        <img src="/SpeechLink Logo copy.png" alt="" />
      </button>
      {(onSettings || onCamera || onClearChat) && (
        <div className="header-actions">
          {onClearChat && (
            <button
              className="header-reset"
              onClick={onClearChat}
              disabled={clearChatDisabled}
              aria-label={text.clearChat}
              title={text.clearChat}
            >
              <Icon name="close" size={16} />
              {text.clearChat}
            </button>
          )}
          {onCamera && (
            <button
              className="header-action"
              onClick={onCamera}
              aria-label={text.islCamera}
              title={text.islCamera}
            >
              <Icon name="camera" />
            </button>
          )}
          {onSettings && (
            <button
              className="header-action"
              onClick={onSettings}
              aria-label={text.openSettings}
              title={text.openSettings}
            >
              <Icon name="settings" />
            </button>
          )}
        </div>
      )}
    </header>
  )
}

function ConfirmDialog({
  language,
  value,
  onChange,
  onCancel,
  onSpeak,
}: {
  language: Language
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  onSpeak: () => void
}) {
  const text = copy[language]
  useEffect(() => {
    const close = (event: globalThis.KeyboardEvent) =>
      event.key === "Escape" && onCancel()
    addEventListener("keydown", close)
    return () => removeEventListener("keydown", close)
  }, [onCancel])

  return (
    <div className="dialog-layer" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true">
        <h2>{text.confirmTitle}</h2>
        <p>{text.confirmIntro}</p>
        <label className="field-label">
          {text.sentence}
          <textarea
            className="confirm-text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            autoFocus
          />
        </label>
        <div className="confirm-actions">
          <button className="secondary-button" onClick={onCancel}>
            {text.cancel}
          </button>
          <button className="primary-button" onClick={onSpeak}>
            <Icon name="volume" />
            {text.speakNow}
          </button>
        </div>
      </section>
    </div>
  )
}

function IslCameraDialog({
  language,
  onClose,
}: {
  language: Language
  onClose: () => void
}) {
  const text = copy[language]
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const objectUrlRef = useRef("")
  const [streamReady, setStreamReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState("")
  const [recordingExtension, setRecordingExtension] = useState("webm")
  const [error, setError] = useState("")

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch((playError: unknown) => {
        console.warn("[SpeechLink] Could not preview the camera:", playError)
        setError(text.cameraError)
      })
    }
  }, [streamReady, text.cameraError])

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  useEffect(
    () => () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  const startCamera = async () => {
    setError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(text.cameraError)
      return
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      })
      setStreamReady(true)
    } catch (cameraError) {
      console.error("[SpeechLink] Could not start the ISL camera:", cameraError)
      setError(text.cameraError)
    }
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream) return

    try {
      const preferredType = [
        "video/webm;codecs=vp9",
        "video/webm",
        "video/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onerror = (event) => {
        console.error("[SpeechLink] ISL recording failed:", event)
        setError(text.cameraError)
        setRecording(false)
      }
      recorder.onstop = () => {
        setRecording(false)
        if (!chunksRef.current.length) return
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        const mimeType = recorder.mimeType || "video/webm"
        const blob = new Blob(chunksRef.current, { type: mimeType })
        objectUrlRef.current = URL.createObjectURL(blob)
        setRecordingUrl(objectUrlRef.current)
        setRecordingExtension(mimeType.includes("mp4") ? "mp4" : "webm")
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecordingUrl("")
    } catch (recordingError) {
      console.error(
        "[SpeechLink] Could not record the ISL video:",
        recordingError,
      )
      setError(text.cameraError)
    }
  }

  return (
    <div className="dialog-layer recorder-layer">
      <section
        className="recorder-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="isl-camera-title"
      >
        <div className="recorder-heading">
          <div>
            <span className="recorder-kicker">{text.islCamera}</span>
            <h2 id="isl-camera-title">{text.islCameraTitle}</h2>
          </div>
          <button
            className="recorder-close"
            onClick={onClose}
            aria-label={text.closeCamera}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="recorder-preview">
          {streamReady ? (
            <video
              ref={videoRef}
              className="recorder-video"
              autoPlay
              playsInline
              muted
              aria-label={text.islCameraTitle}
            />
          ) : null}
          {recording && (
            <span className="recorder-complete" role="status">
              {text.stopRecording}
            </span>
          )}
        </div>
        <p className="recorder-notice">{text.islCameraHelp}</p>
        {error && (
          <p className="recorder-error" role="alert">
            {error}
          </p>
        )}
        {recordingUrl && (
          <video
            className="recorder-video-result"
            src={recordingUrl}
            controls
            playsInline
          />
        )}
        <div className="recorder-actions">
          {!streamReady ? (
            <button className="primary-button" onClick={startCamera}>
              {text.startCamera}
            </button>
          ) : recording ? (
            <button
              className="primary-button"
              onClick={() => recorderRef.current?.stop()}
            >
              {text.stopRecording}
            </button>
          ) : (
            <>
              <button className="primary-button" onClick={startRecording}>
                {text.startRecording}
              </button>
              {recordingUrl && (
                <a
                  className="secondary-button"
                  href={recordingUrl}
                  download={`speechlink-isl-message.${recordingExtension}`}
                >
                  {text.downloadRecording}
                </a>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function getPage(): Page {
  if (location.hash === "#/setup") return "setup"
  if (location.hash === "#/conversation") return "conversation"
  if (location.hash === "#/settings") return "settings"
  return "home"
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const coreRef = useRef<any>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // Initialize the speech engine once; setting changes are synchronized below.
  useEffect(() => {
    const initialSettings = settingsRef.current
    const engine = new SpeechLinkCore({
      language: initialSettings.language,
      persona: initialSettings.persona,
      voiceGender: initialSettings.voiceGender,
      confirmBeforeSpeaking: initialSettings.confirm,
      speechPace: initialSettings.rate,
      userData: {
        name: initialSettings.name,
        address: initialSettings.address,
        phone: initialSettings.phone,
        medical: initialSettings.medical,
      },
    })

    coreRef.current = engine

    const unsub = engine.subscribe((event: string, data: any) => {
      if (event === "transcript_updated" && data && data.transcript) {
        const cleaned = data.transcript.trim()
        if (cleaned) {
          setMessages((current) => {
            if (
              current.length > 0 &&
              current[current.length - 1].role === "partner" &&
              current[current.length - 1].text === cleaned
            ) {
              return current
            }
            return [
              ...current,
              { id: Date.now(), role: "partner", text: cleaned },
            ]
          })
        }
      }
      if (event === "transcription_end") {
        setListening(false)
      }
      if (event === "transcription_start") {
        setListening(true)
      }
    })

    return () => {
      unsub()
      if (typeof engine.destroy === "function") {
        engine.destroy()
      }
      coreRef.current = null
    }
  }, [])

  useEffect(() => {
    const engine = coreRef.current
    if (!engine) return
    engine.setLanguage(settings.language)
    engine.setPersona(settings.persona)
    engine.setVoiceGender(settings.voiceGender)
    engine.setSpeechPace(settings.rate)
    engine.setUserData({
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      medical: settings.medical,
    })
  }, [
    settings.language,
    settings.persona,
    settings.voiceGender,
    settings.rate,
    settings.name,
    settings.address,
    settings.phone,
    settings.medical,
  ])

  const [page, setPage] = useState<Page>(() =>
    settings.setupComplete ? getPage() : "setup",
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState("")
  const [pending, setPending] = useState("")
  const [listening, setListening] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("")
  const [emergencyPrompt, setEmergencyPrompt] = useState(false)
  const [emergencyDisplay, setEmergencyDisplay] = useState("")
  const [showIslCamera, setShowIslCamera] = useState(false)
  const [expansions, setExpansions] = useState<string[]>([])

  const feedRef = useRef<HTMLDivElement>(null)
  const text = copy[settings.uiLanguage]
  const speechText = copy[settings.language]
  const lastPartner =
    [...messages].reverse().find((message) => message.role === "partner")
      ?.text || ""

  // Synchronize incoming partner speech to backend core
  useEffect(() => {
    if (coreRef.current && lastPartner) {
      coreRef.current.setPartnerTranscript(lastPartner)
    }
  }, [lastPartner])

  // Submit on Enter / Send
  const submit = async () => {
    const raw = fragment.trim()
    if (!raw) return

    // Immediately clear input so double-press cannot happen
    setFragment("")

    try {
      if (coreRef.current) {
        const aiOptions = await coreRef.current.expandFragment(raw, lastPartner)
        if (aiOptions?.length) {
          setExpansions(aiOptions)
          if (!settings.confirm) handleSpeakChoice(aiOptions[0])
          return
        }
      }
    } catch (err: any) {
      console.warn("[SpeechLink] Groq request notice:", err)
    }

    // Deterministic fallback
    const fallback = localFallbackExpand(
      raw,
      lastPartner,
      settings.language,
      settings.persona,
    )
    setExpansions(fallback)
    if (fallback.length && !settings.confirm) {
      handleSpeakChoice(fallback[0])
    }
  }

  // Tapping an expansion card immediately speaks and dismisses cards
  const handleSpeakChoice = (sentence: string) => {
    setExpansions([])
    requestSpeak(sentence)
  }

  const isQuestion = /\?|should|would|can i|do you|क्या|चाहिए|है ना/i.test(
    lastPartner,
  )

  useEffect(() => {
    if (!settings.setupComplete) {
      history.replaceState(null, "", "#/setup")
      setPage("setup")
    } else if (!location.hash || location.hash === "#/setup") {
      history.replaceState(null, "", "#/")
      setPage("home")
    }
    const handleNavigation = () =>
      setPage(settings.setupComplete ? getPage() : "setup")
    addEventListener("hashchange", handleNavigation)
    return () => removeEventListener("hashchange", handleNavigation)
  }, [settings.setupComplete])

  useEffect(() => {
    const { name, address, phone, medical, ...preferences } = settings
    try {
      localStorage.setItem(
        "speechlink-settings-v1",
        JSON.stringify(preferences),
      )
    } catch (error) {
      console.error("[SpeechLink] Could not save settings:", error)
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.removeItem("sl_murf_key")
      localStorage.removeItem("sl_groq_key")
    } catch (error) {
      console.warn("[SpeechLink] Could not remove old saved API keys:", error)
    }
  }, [])

  useEffect(() => {
    decryptFacts()
      .then(
        (facts) =>
          facts && setSettings((current) => ({ ...current, ...facts })),
      )
      .catch((error) => {
        console.error("[SpeechLink] Could not decrypt protected facts:", error)
      })
  }, [])

  useEffect(() => {
    if (!emergencyDisplay) return
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setEmergencyDisplay("")
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [emergencyDisplay])

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages.length])

  const navigate = (destination: Page) => {
    const hash = destination === "home" ? "#/" : `#/${destination}`
    if (location.hash === hash) setPage(destination)
    else location.hash = hash
  }

  const goBack = () => {
    if (history.length > 1) history.back()
    else navigate("home")
  }

  const update = <Key extends keyof Settings>(key: Key, value: Settings[Key]) =>
    setSettings((current) => ({ ...current, [key]: value }))

  // Speak voice once through mutex lock
  const speak = async (sentence: string, post = true, urgent = false) => {
    const textToSpeak = sentence.trim()
    if (!textToSpeak) return

    if (urgent && "speechSynthesis" in window) {
      speechSynthesis.cancel()
    }

    try {
      if (coreRef.current) {
        await coreRef.current.speakText(textToSpeak)
      }
    } catch (err: any) {
      console.warn("Speech playback error:", err)
    }

    if (post) {
      setMessages((current) => [
        ...current,
        { id: Date.now(), role: "user", text: textToSpeak, spoken: true },
      ])
    }
  }

  const requestSpeak = (sentence: string, urgent = false) =>
    settings.confirm && !urgent
      ? setPending(sentence)
      : speak(sentence, true, urgent)

  // Mic toggle without adding duplicate listeners
  const toggleListening = () => {
    if (coreRef.current) {
      if (!listening) {
        coreRef.current.startListening()
      } else {
        coreRef.current.stopListening()
      }
    }
  }

  const completeSetup = () => {
    setSettings((current) => ({ ...current, setupComplete: true }))
    history.replaceState(null, "", "#/")
    setPage("home")
  }

  const useEmergencyFacts = () => {
    const factEntries: Array<[string, string]> = [
      [text.fullName, settings.name],
      [text.address, settings.address],
      [text.phone, settings.phone],
      [text.medical, settings.medical],
    ]
    const facts = factEntries.filter(([, value]) => Boolean(value.trim()))
    if (!facts.length) {
      setEmergencyPrompt(true)
      navigate("settings")
      return
    }
    setEmergencyDisplay(
      facts.map(([label, value]) => `${label}: ${value}`).join("\n"),
    )
    const sentence =
      settings.language === "hi-IN"
        ? `आपातकालीन जानकारी: ${facts.map(([, value]) => value).join("। ")}`
        : `Emergency information: ${facts.map(([, value]) => value).join(". ")}`
    speak(sentence, false, true)
  }

  const clearChat = () => {
    setMessages([])
    setFragment("")
    setPending("")
    setExpansions([])
    coreRef.current?.resetConversation()
  }

  const saveProtectedFacts = async () => {
    setSaveStatus("")
    try {
      await encryptFacts({
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        medical: settings.medical,
      })
      setSaveStatus("saved")
      setEmergencyPrompt(false)
    } catch (error) {
      console.error("[SpeechLink] Could not encrypt protected facts:", error)
      setSaveStatus("error")
    }
  }

  return (
    <main className={`app-shell theme-${settings.theme}`}>
      <div className="phone">
        {page === "setup" && (
          <section className="setup-page" aria-label={text.setupTitle}>
            <div className="setup-brand">
              <img src="/SpeechLink Logo copy.png" alt="" />
              <span>SpeechLink</span>
            </div>
            <div className="setup-content">
              <span className="setup-kicker">{text.setupKicker}</span>
              <h1>{text.setupTitle}</h1>
              <p>{text.setupDescription}</p>
              <div className="setup-fields">
                <fieldset>
                  <legend>{text.interfaceLanguage}</legend>
                  <div className="setup-options">
                    <button
                      className={
                        settings.uiLanguage === "en-IN" ? "selected" : ""
                      }
                      onClick={() => update("uiLanguage", "en-IN")}
                    >
                      English
                    </button>
                    <button
                      className={
                        settings.uiLanguage === "hi-IN" ? "selected" : ""
                      }
                      onClick={() => update("uiLanguage", "hi-IN")}
                    >
                      हिंदी
                    </button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>{text.auditoryProfile}</legend>
                  <div className="setup-options">
                    <button
                      className={
                        settings.profile === "deaf-hoh" ? "selected" : ""
                      }
                      onClick={() => update("profile", "deaf-hoh")}
                    >
                      {text.deaf}
                    </button>
                    <button
                      className={
                        settings.profile === "hearing-nonspeaking"
                          ? "selected"
                          : ""
                      }
                      onClick={() => update("profile", "hearing-nonspeaking")}
                    >
                      {text.nonspeaking}
                    </button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>{text.conversationLanguage}</legend>
                  <div className="setup-options">
                    <button
                      className={
                        settings.language === "en-IN" ? "selected" : ""
                      }
                      onClick={() => update("language", "en-IN")}
                    >
                      English
                    </button>
                    <button
                      className={
                        settings.language === "hi-IN" ? "selected" : ""
                      }
                      onClick={() => update("language", "hi-IN")}
                    >
                      हिंदी
                    </button>
                  </div>
                </fieldset>
              </div>
            </div>
            <button className="setup-continue" onClick={completeSetup}>
              {text.continue}
              <Icon name="chevron" />
            </button>
          </section>
        )}

        {page === "home" && (
          <section className="home-page" aria-label="SpeechLink">
            <button
              className="home-emergency"
              onClick={useEmergencyFacts}
              aria-label={text.emergency}
            >
              <Icon name="medical" size={19} />
            </button>
            <div className="home-language">
              <button
                onClick={() =>
                  update(
                    "uiLanguage",
                    settings.uiLanguage === "en-IN" ? "hi-IN" : "en-IN",
                  )
                }
                aria-label={text.interfaceLanguage}
              >
                {settings.uiLanguage === "en-IN" ? "EN" : "हि"}
              </button>
            </div>
            <div className="home-hero">
              <div className="home-logo">
                <img src="/SpeechLink Logo copy.png" alt="" />
              </div>
              <h1>SpeechLink</h1>
              <p className="home-tagline">{text.tagline}</p>
              <p className="home-description">{text.homeDescription}</p>
            </div>
            <div className="home-actions">
              <button
                className="home-start"
                onClick={() => navigate("conversation")}
              >
                {text.start}
                <span>
                  <Icon name="chevron" />
                </span>
              </button>
              <button
                className="home-settings"
                onClick={() => navigate("settings")}
              >
                <Icon name="settings" size={18} />
                {text.settings}
              </button>
            </div>
          </section>
        )}

        {page === "conversation" && (
          <section className="app-page conversation-page">
            <AppHeader
              language={settings.uiLanguage}
              onBack={goBack}
              onSettings={() => navigate("settings")}
              onCamera={() => setShowIslCamera(true)}
              onClearChat={clearChat}
              clearChatDisabled={
                !messages.length && !fragment && !pending && !expansions.length
              }
            />
            <div className="conversation-controls">
              <div className="segment" aria-label={text.language}>
                <button
                  className={settings.language === "en-IN" ? "active" : ""}
                  onClick={() => update("language", "en-IN")}
                >
                  English
                </button>
                <button
                  className={settings.language === "hi-IN" ? "active" : ""}
                  onClick={() => update("language", "hi-IN")}
                >
                  हिंदी
                </button>
              </div>
              <div className="segment" aria-label="Tone">
                <button
                  className={settings.persona === "casual" ? "active" : ""}
                  onClick={() => update("persona", "casual")}
                >
                  {text.casual}
                </button>
                <button
                  className={settings.persona === "formal" ? "active" : ""}
                  onClick={() => update("persona", "formal")}
                >
                  {text.formal}
                </button>
              </div>
            </div>

            <div className="conversation" ref={feedRef} aria-live="polite">
              {!messages.length ? (
                <div className="conversation-empty">
                  <div className="empty-copy">
                    <span className="empty-kicker">{text.conversation}</span>
                    <h1>{text.begin}</h1>
                    <p>{text.beginDescription}</p>
                  </div>
                  <button
                    className={`capture-button ${listening ? "listening" : ""}`}
                    onClick={toggleListening}
                  >
                    <span className="capture-icon">
                      <Icon name={listening ? "pause" : "mic"} size={27} />
                    </span>
                    <span>
                      <strong>
                        {listening ? text.capturing : text.capture}
                      </strong>
                      <small>{text.captureHint}</small>
                    </span>
                    <Icon name="chevron" size={18} />
                  </button>
                  <div className="type-divider">
                    <span>{text.typeHint}</span>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message-wrap ${message.role}`}
                  >
                    <div className="message">{message.text}</div>
                    <button
                      className="message-action"
                      onClick={() =>
                        message.role === "partner"
                          ? requestSpeak(speechText.sayAgain, true)
                          : speak(message.text, false)
                      }
                    >
                      <Icon
                        name={message.role === "partner" ? "repeat" : "volume"}
                        size={15}
                      />
                      {message.role === "partner"
                        ? text.sayAgainLabel
                        : text.replay}
                    </button>
                  </article>
                ))
              )}
            </div>

            <section className="smart-tray" aria-label={text.keywords}>
              <div className="quick-strip">
                {isQuestion ? (
                  <>
                    <button onClick={() => requestSpeak(speechText.yes, true)}>
                      <span className="quick-symbol yes">✓</span>
                      {text.yesLabel}
                    </button>
                    <button onClick={() => requestSpeak(speechText.no, true)}>
                      <span className="quick-symbol no">×</span>
                      {text.noLabel}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => requestSpeak(speechText.wait, true)}>
                      <Icon name="pause" size={17} />
                      {text.waitLabel}
                    </button>
                    <button
                      onClick={() => requestSpeak(speechText.sayAgain, true)}
                    >
                      <Icon name="repeat" size={17} />
                      {text.sayAgainLabel}
                    </button>
                  </>
                )}
              </div>
              {expansions.length > 0 && (
                <div className="expansions" aria-label="Sentence choices">
                  <p>
                    <small>{text.tapToSpeak}</small>
                  </p>
                  {expansions.map((sentence) => (
                    <button
                      key={sentence}
                      onClick={() => handleSpeakChoice(sentence)}
                    >
                      <span>{sentence}</span>
                      <span className="suggestion-arrow">
                        <Icon name="chevron" size={17} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="composer">
                <textarea
                  value={fragment}
                  onChange={(event) => setFragment(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      submit()
                    }
                  }}
                  placeholder={speechText.placeholder}
                  rows={1}
                  aria-label={text.keywords}
                />
                <button
                  className="send"
                  onClick={submit}
                  disabled={!fragment.trim()}
                  aria-label={text.speakMessage}
                >
                  <Icon name="send" />
                </button>
              </div>
            </section>
          </section>
        )}

        {page === "settings" && (
          <section className="app-page settings-page">
            <AppHeader language={settings.uiLanguage} onBack={goBack} />
            <div className="settings-scroll">
              <div className="settings-heading">
                <h1>{text.settingsTitle}</h1>
                <p>{text.settingsIntro}</p>
              </div>

              <section className="settings-card">
                <div className="settings-section-head">
                  <h2>{text.voiceSection}</h2>
                </div>
                <p className="settings-help">{text.voiceHelp}</p>
                <fieldset>
                  <legend>{text.voiceGender}</legend>
                  <div className="setup-options">
                    <button
                      className={
                        settings.voiceGender === "female" ? "selected" : ""
                      }
                      aria-pressed={settings.voiceGender === "female"}
                      onClick={() => update("voiceGender", "female")}
                    >
                      {text.femaleVoice}
                    </button>
                    <button
                      className={
                        settings.voiceGender === "male" ? "selected" : ""
                      }
                      aria-pressed={settings.voiceGender === "male"}
                      onClick={() => update("voiceGender", "male")}
                    >
                      {text.maleVoice}
                    </button>
                  </div>
                </fieldset>
                <div className="pace-control">
                  <div>
                    <span>{text.pace}</span>
                    <output>{settings.rate.toFixed(1)}×</output>
                  </div>
                  <input
                    type="range"
                    min=".7"
                    max="1.3"
                    step=".1"
                    value={settings.rate}
                    onChange={(event) => update("rate", +event.target.value)}
                  />
                  <div className="range-labels">
                    <small>{text.slowClear}</small>
                    <small>{text.fast}</small>
                  </div>
                </div>
                <div className="settings-toggles">
                  <Toggle
                    checked={settings.confirm}
                    onChange={(value) => update("confirm", value)}
                    label={text.confirm}
                    description={text.confirmHelp}
                  />
                </div>
                <button
                  className="test-voice-button"
                  onClick={() => speak(speechText.testGreeting, false)}
                >
                  <Icon name="volume" />
                  {text.testVoice}
                </button>
              </section>

              <section className="settings-card">
                <div className="settings-section-head">
                  <div>
                    <h2>{text.aiSection}</h2>
                    <p>{text.aiHelp}</p>
                  </div>
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-section-head">
                  <h2>{text.accessibilitySection}</h2>
                </div>
                <fieldset>
                  <legend>{text.auditoryProfile}</legend>
                  <div className="option-grid" role="radiogroup">
                    <button
                      className={
                        settings.profile === "deaf-hoh" ? "selected" : ""
                      }
                      onClick={() => update("profile", "deaf-hoh")}
                      aria-pressed={settings.profile === "deaf-hoh"}
                    >
                      {text.deaf}
                    </button>
                    <button
                      className={
                        settings.profile === "hearing-nonspeaking"
                          ? "selected"
                          : ""
                      }
                      onClick={() => update("profile", "hearing-nonspeaking")}
                      aria-pressed={settings.profile === "hearing-nonspeaking"}
                    >
                      {text.nonspeaking}
                    </button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>{text.isl}</legend>
                  <div className="option-stack" role="radiogroup">
                    {([
                      ["native", text.nativeSigner],
                      ["learning", text.learningIsl],
                      ["text", text.textOnly],
                    ] as [IslProfile, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        className={settings.isl === value ? "selected" : ""}
                        onClick={() => update("isl", value)}
                        aria-pressed={settings.isl === value}
                      >
                        <i />
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="field-label">
                  {text.dialect}
                  <select
                    value={settings.region}
                    onChange={(event) => update("region", event.target.value)}
                  >
                    <option value="" disabled>
                      {text.selectCity}
                    </option>
                    {[
                      "Jaipur",
                      "Delhi",
                      "Mumbai",
                      "Bengaluru",
                      "Kolkata",
                      "Chennai",
                    ].map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="settings-card display-card">
                <div className="settings-section-head">
                  <div>
                    <h2>{text.displaySection}</h2>
                    <p>{text.displayHelp}</p>
                  </div>
                </div>
                <div className="language-setting-row">
                  <span>{text.interfaceLanguage}</span>
                  <button
                    onClick={() =>
                      update(
                        "uiLanguage",
                        settings.uiLanguage === "en-IN" ? "hi-IN" : "en-IN",
                      )
                    }
                    aria-label={text.interfaceLanguage}
                  >
                    {settings.uiLanguage === "en-IN" ? "EN" : "हि"}
                  </button>
                </div>
                <div className="standalone-toggle">
                  <Toggle
                    checked={settings.theme === "dark"}
                    onChange={(value) =>
                      update("theme", value ? "dark" : "light")
                    }
                    label={text.darkMode}
                    description={text.darkHelp}
                  />
                </div>
              </section>

              <section className="settings-card protected-card">
                <div className="settings-section-head">
                  <div>
                    <h2>{text.protectedSection}</h2>
                    <p>{text.protectedHelp}</p>
                  </div>
                </div>
                {emergencyPrompt && (
                  <p className="emergency-prompt" role="status">
                    <Icon name="medical" size={16} />
                    {text.emergencySetup}
                  </p>
                )}
                <label className="field-label">
                  {text.fullName}
                  <input
                    value={settings.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder={text.namePlaceholder}
                    autoComplete="name"
                  />
                </label>
                <label className="field-label">
                  {text.address}
                  <input
                    value={settings.address}
                    onChange={(event) => update("address", event.target.value)}
                    placeholder={text.addressPlaceholder}
                    autoComplete="street-address"
                  />
                </label>
                <label className="field-label">
                  {text.phone}
                  <input
                    value={settings.phone}
                    onChange={(event) =>
                      update(
                        "phone",
                        event.target.value.replace(/[^\d+ ()-]/g, ""),
                      )
                    }
                    placeholder={text.phonePlaceholder}
                    inputMode="tel"
                  />
                </label>
                <label className="field-label">
                  {text.medical}
                  <textarea
                    value={settings.medical}
                    onChange={(event) => update("medical", event.target.value)}
                    placeholder={text.medicalPlaceholder}
                    rows={4}
                  />
                </label>
                {saveStatus && (
                  <p className={`save-status ${saveStatus}`} role="status">
                    {saveStatus === "saved" ? text.saved : text.saveError}
                  </p>
                )}
                <button
                  className="save-lock-button"
                  onClick={saveProtectedFacts}
                >
                  <Icon name="shield" />
                  {text.saveLock}
                </button>
              </section>
            </div>
          </section>
        )}

        {emergencyDisplay && (
          <section
            className="emergency-display"
            role="alertdialog"
            aria-modal="true"
            aria-label={text.emergency}
          >
            <button
              className="emergency-display-close"
              onClick={() => setEmergencyDisplay("")}
              aria-label={text.closeEmergency}
              autoFocus
            >
              <Icon name="close" />
            </button>
            <span>{text.emergency}</span>
            <p>{emergencyDisplay}</p>
          </section>
        )}
        {showIslCamera && (
          <IslCameraDialog
            language={settings.uiLanguage}
            onClose={() => setShowIslCamera(false)}
          />
        )}
      </div>

      {pending && (
        <ConfirmDialog
          language={settings.uiLanguage}
          value={pending}
          onChange={setPending}
          onCancel={() => setPending("")}
          onSpeak={() => {
            speak(pending)
            setPending("")
          }}
        />
      )}
    </main>
  )
}
