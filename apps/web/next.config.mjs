import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withPWA = withPWAInit({ dest: "public", disable: process.env.NODE_ENV === "development" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || "",
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || "",
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  serverActions: {
    allowedOrigins: ["*.app.github.dev", "localhost:3000", "localhost:3001"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
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
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' wss: https:;",
          },
        ],
      },
    ];
  },
};

export default withPWA(withNextIntl(nextConfig));
