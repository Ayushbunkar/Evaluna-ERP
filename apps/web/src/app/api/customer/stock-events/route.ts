import { subscribeStockChanged } from "@/lib/inventory/stock-event-bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	// On Vercel serverless, holding an SSE stream open burns GB-Hours and in-memory
	// event buses are not shared across lambdas. Return 204 so clients use tRPC polling.
	if (process.env.VERCEL) {
		return new Response(null, { status: 204 });
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			// Send initial connected event
			const connectMsg = `event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`;
			controller.enqueue(encoder.encode(connectMsg));

			// Heartbeat every 15s to keep connection open
			const heartbeatInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(": ping\n\n"));
				} catch {
					clearInterval(heartbeatInterval);
				}
			}, 15000);

			// Listen for stock changes
			const unsubscribe = subscribeStockChanged((event) => {
				try {
					const payload = `event: stock_update\ndata: ${JSON.stringify(event)}\n\n`;
					controller.enqueue(encoder.encode(payload));
				} catch {
					// Client disconnected
					clearInterval(heartbeatInterval);
					unsubscribe();
				}
			});

			req.signal.addEventListener("abort", () => {
				clearInterval(heartbeatInterval);
				unsubscribe();
				try {
					controller.close();
				} catch {
					// Stream already closed
				}
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}
