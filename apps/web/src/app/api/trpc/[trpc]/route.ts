import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { wsHandler } from "@trpc/server/adapters/ws";
import { createTRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/lib/trpc/router";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

// WebSocket handler for TRPC subscriptions
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(req: Request) {
  // Check if this is a WebSocket upgrade request
  if (req.headers.get("upgrade") === "websocket") {
    return wsHandler({
      endpoint: "/api/trpc",
      router: appRouter,
      createContext: createTRPCContext,
    })(req);
  }

  // Otherwise, handle as regular HTTP request
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}