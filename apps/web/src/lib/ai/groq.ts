/**
 * Groq AI Client for Evaluna ERP Customer Support
 * Strict server-side inference wrapper with timeout and error resilience.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface GroqCompletionOptions {
	messages: ChatMessage[];
	model?: string;
	temperature?: number;
	maxTokens?: number;
	timeoutMs?: number;
}

export async function generateGroqCompletion({
	messages,
	model = DEFAULT_MODEL,
	temperature = 0.2,
	maxTokens = 1024,
	timeoutMs = 15000,
}: GroqCompletionOptions): Promise<{ text: string; model: string }> {
	const apiKey = process.env.GROQ_API_KEY;

	if (!apiKey) {
		throw new Error("GROQ_API_KEY is not configured.");
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(GROQ_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages,
				temperature,
				max_tokens: maxTokens,
			}),
			signal: controller.signal,
		});

		if (!res.ok) {
			const errorBody = await res.text().catch(() => "");
			throw new Error(
				`Groq API responded with status ${res.status}: ${errorBody.slice(0, 300)}`,
			);
		}

		const data = (await res.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
			model?: string;
		};

		const content = data.choices?.[0]?.message?.content?.trim();
		if (!content) {
			throw new Error("Groq API returned an empty response.");
		}

		return {
			text: content,
			model: data.model || model,
		};
	} finally {
		clearTimeout(timeout);
	}
}
