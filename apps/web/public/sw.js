const CACHE_NAME = "evaluna-erp-v2";

const PRECACHE_ASSETS = [
	"/offline.html",
	"/manifest.json",
	"/logo.png",
	"/logo.jpg",
	"/sales",
	"/sales/pos",
	"/sales/orders",
	"/sales/customers",
	"/driver",
	"/~offline",
];

// Install: Pre-cache essential offline shell and routes
self.addEventListener("install", (event) => {
	self.skipWaiting();
	event.waitUntil(
		caches.open(CACHE_NAME).then(async (cache) => {
			console.log("[SW] Pre-caching offline assets...");
			// Cache each asset safely without failing entire installation if one 404s
			await Promise.allSettled(
				PRECACHE_ASSETS.map(async (url) => {
					try {
						const response = await fetch(url, { cache: "no-cache" });
						if (response.ok) {
							await cache.put(url, response);
							console.log("[SW] Pre-cached:", url);
						}
					} catch (err) {
						console.warn("[SW] Failed to pre-cache:", url, err);
					}
				}),
			);
		}),
	);
});

// Activate: Clean up old caches and take immediate control of clients
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.map((key) => {
						if (key !== CACHE_NAME) {
							console.log("[SW] Removing old cache:", key);
							return caches.delete(key);
						}
					}),
				),
			)
			.then(() => self.clients.claim()),
	);
});

// Fetch: Smart offline caching strategy
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// 1. Skip non-GET requests for standard caching, handle tRPC offline mutations
	if (request.method !== "GET") {
		if (url.pathname.startsWith("/api/trpc/")) {
			// If network fails for mutation, return optimistic response
			event.respondWith(
				fetch(request).catch(() => {
					return new Response(
						JSON.stringify([
							{
								result: {
									data: {
										json: {
											success: true,
											offline: true,
											temp_id: `OFF-${Date.now()}`,
										},
									},
								},
							},
						]),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					);
				}),
			);
		}
		return;
	}

	// 2. Navigation requests (Page loads & route changes)
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache fresh copy of visited pages
					if (response.status === 200) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return response;
				})
				.catch(async () => {
					// Offline fallback: Check cache first, then fallback to offline.html
					const cachedResponse = await caches.match(request);
					if (cachedResponse) {
						return cachedResponse;
					}
					// Check exact path match
					const pathCached = await caches.match(url.pathname);
					if (pathCached) {
						return pathCached;
					}
					// Fallback to offline shell
					const offlineShell = await caches.match("/offline.html");
					if (offlineShell) {
						return offlineShell;
					}
					return new Response("Offline — Please reconnect to the internet", {
						status: 503,
						headers: { "Content-Type": "text/plain" },
					});
				}),
		);
		return;
	}

	// 3. Static assets, fonts, Next.js JS/CSS chunks, and RSC payloads
	const isStaticAsset =
		url.pathname.startsWith("/_next/") ||
		url.pathname.startsWith("/fonts/") ||
		url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/i) ||
		url.search.includes("_rsc=");

	if (isStaticAsset) {
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				const fetchPromise = fetch(request)
					.then((networkResponse) => {
						if (networkResponse.status === 200) {
							const responseClone = networkResponse.clone();
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(request, responseClone);
							});
						}
						return networkResponse;
					})
					.catch(() => {
						// Network failed, return cached if available
						return cachedResponse;
					});

				// Return cached immediately if available (Stale-While-Revalidate)
				return cachedResponse || fetchPromise;
			}),
		);
		return;
	}

	// 4. API GET requests (tRPC queries)
	if (url.pathname.startsWith("/api/")) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.status === 200) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return response;
				})
				.catch(async () => {
					const cached = await caches.match(request);
					if (cached) return cached;
					return new Response(JSON.stringify({ result: { data: [] } }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}),
		);
		return;
	}

	// 5. Default: Network with cache fallback
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.status === 200) {
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, responseClone);
					});
				}
				return response;
			})
			.catch(() => caches.match(request)),
	);
});
