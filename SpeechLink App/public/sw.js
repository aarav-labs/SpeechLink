const CACHE_NAME = "speechlink-v3"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add("/")),
  )

  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names

            .filter(
              (name) => name.startsWith("speechlink-") && name !== CACHE_NAME,
            )

            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)

      .then((response) => {
        if (response.ok) {
          const responseCopy = response.clone()

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseCopy))
        }

        return response
      })

      .catch(async () => {
        const cached = await caches.match(event.request)

        if (cached) return cached

        if (event.request.mode === "navigate") {
          const appShell = await caches.match("/")

          if (appShell) return appShell
        }

        return new Response("This resource is unavailable offline.", {
          status: 503,

          statusText: "Offline",

          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      }),
  )
})
