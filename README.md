# SpeechLink

SpeechLink turns short typed phrases into spoken suggestions and can display
saved emergency information on screen. Its ISL camera can record a signing
video for local review or download; it does not automatically translate signs.

## AI sentence suggestions

SpeechLink uses Groq's `openai/gpt-oss-120b` model through a Netlify Function.
In Netlify, open **Site configuration → Environment variables** and set
`GROQ_API_KEY` to your Groq key. Do not put the key in
`src/speechlinkCore.js`: files under `src` are bundled and sent to each
browser. The function reads the key on the server.

Deploy the project through a Git-connected Netlify site or Netlify CLI so the
function in `netlify/functions/expand.js` is included. A static drag-and-drop
deployment of only the `dist` folder cannot run the function. Without the
environment variable, the app uses its built-in sentence fallback.

## Speech

SpeechLink uses the Hindi or English voices provided by the current browser and
device. Voice quality and availability depend on the installed voices. No
Murf account or speech API is used.

## Local development

Copy `.env.example` to `.env.local`, replace the placeholder with your Groq
API key, and restart the dev server. The key is read by the Vite development
server and is not included in browser code. Do not commit `.env.local`.
Then run `npm run dev`. Run `npm test` for the tests and `npm run build` to
create the production bundle.
