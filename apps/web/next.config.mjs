import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	fallbacks: {
		document: "/offline.html",
	},
	cacheOnFrontEndNav: true,
	aggressiveFrontEndNavCaching: true,
	reloadOnOnline: true,
	workboxOptions: {
		navigateFallback: "/offline.html",
		navigateFallbackDenylist: [/^\/api\//],
		exclude: [/\/api\//],
		runtimeCaching: [
			{
				// Cache fonts with a long TTL - fonts never change
				urlPattern: /\/fonts\//i,
				handler: "CacheFirst",
				options: {
					cacheName: "fonts-cache",
					expiration: {
						maxEntries: 30,
						maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
					},
				},
			},
			{
				// Cache static images
				urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
				handler: "StaleWhileRevalidate",
				options: {
					cacheName: "static-images",
					expiration: {
						maxEntries: 150,
						maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
					},
				},
			},
			{
				// Cache Next.js App Router RSC data payloads and JS chunks
				urlPattern: /\/_next\/data\/|.*[?&]_rsc=|\/_next\/static\//i,
				handler: "StaleWhileRevalidate",
				options: {
					cacheName: "rsc-static-chunks",
					expiration: {
						maxEntries: 300,
						maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
					},
				},
			},
			{
				// Cache pages with StaleWhileRevalidate to guarantee offline availability
				urlPattern: /^(?!.*\/api\/).*/i,
				handler: "StaleWhileRevalidate",
				options: {
					cacheName: "offlineCache",
					expiration: {
						maxEntries: 300,
						maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
					},
				},
			},
		],
	},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	basePath: process.env.BASE_PATH || "",
	env: {
		NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || "",
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "**" },
			{ protocol: "http", hostname: "**" },
		],
		unoptimized: true,
	},
	serverExternalPackages: ["@electric-sql/pglite", "postgres", "bcryptjs"],
	experimental: {
		optimizePackageImports: [
			"lucide-react",
			"@evaluna/ui",
			"framer-motion",
			"@react-pdf/renderer",
			"date-fns",
			"@tanstack/react-query",
			"@trpc/client",
			"@trpc/react-query",
			"recharts",
		],
	},
	compiler: {
		// Remove console.log in production for better performance
		removeConsole:
			process.env.NODE_ENV === "production"
				? { exclude: ["error", "warn"] }
				: false,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	async headers() {
		return [
			{
				// Cache our custom fonts for 1 year (immutable)
				source: "/fonts/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains; preload",
					},
				],
			},
		];
	},
};

export default withPWA(withNextIntl(nextConfig));
