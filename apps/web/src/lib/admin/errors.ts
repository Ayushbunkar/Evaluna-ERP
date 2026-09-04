/**
 * Normalises a tRPC/react-query error into something an admin can act on.
 *
 * Every list and detail view in the admin dashboard distinguishes the failure
 * kinds below, so an expired session is never rendered as "no records found".
 */

export type ErrorKind =
	| "unauthorized"
	| "forbidden"
	| "notFound"
	| "conflict"
	| "validation"
	| "rateLimited"
	| "network"
	| "server";

export type NormalisedError = {
	kind: ErrorKind;
	title: string;
	message: string;
	/** True when the only fix is to sign in again. */
	requiresReauth: boolean;
	/** Field-level messages from a zod failure, keyed by field path. */
	fieldErrors: Record<string, string>;
};

const TITLES: Record<ErrorKind, string> = {
	unauthorized: "Your session has expired",
	forbidden: "You do not have permission",
	notFound: "Not found",
	conflict: "That change conflicts with existing data",
	validation: "Please check the highlighted fields",
	rateLimited: "Too many requests",
	network: "Cannot reach the server",
	server: "Something went wrong",
};

const FALLBACKS: Record<ErrorKind, string> = {
	unauthorized: "Please sign in again to continue.",
	forbidden: "This section is restricted to other roles.",
	notFound: "The record you asked for no longer exists.",
	conflict: "Another record already uses one of these values.",
	validation: "One or more fields were rejected by the server.",
	rateLimited: "Please wait a moment and try again.",
	network: "Check your connection and retry.",
	server: "The server could not complete the request. Please try again.",
};

function kindFromTrpcCode(code: string | undefined): ErrorKind {
	switch (code) {
		case "UNAUTHORIZED":
			return "unauthorized";
		case "FORBIDDEN":
			return "forbidden";
		case "NOT_FOUND":
			return "notFound";
		case "CONFLICT":
		case "PRECONDITION_FAILED":
			return "conflict";
		case "BAD_REQUEST":
		case "PARSE_ERROR":
		case "UNPROCESSABLE_CONTENT":
			return "validation";
		case "TOO_MANY_REQUESTS":
			return "rateLimited";
		case "TIMEOUT":
		case "CLIENT_CLOSED_REQUEST":
			return "network";
		default:
			return "server";
	}
}

function kindFromHttpStatus(status: number | undefined): ErrorKind | null {
	if (!status) return null;
	if (status === 401) return "unauthorized";
	if (status === 403) return "forbidden";
	if (status === 404) return "notFound";
	if (status === 409) return "conflict";
	if (status === 422 || status === 400) return "validation";
	if (status === 429) return "rateLimited";
	if (status >= 500) return "server";
	return null;
}

/** Extracts zod field errors out of a tRPC BAD_REQUEST message. */
function parseFieldErrors(message: string | undefined): Record<string, string> {
	if (!message) return {};
	const trimmed = message.trim();
	if (!trimmed.startsWith("[")) return {};
	try {
		const issues = JSON.parse(trimmed) as Array<{
			path?: Array<string | number>;
			message?: string;
		}>;
		const out: Record<string, string> = {};
		for (const issue of issues) {
			const key = (issue.path ?? []).join(".") || "_form";
			if (issue.message && !out[key]) out[key] = issue.message;
		}
		return out;
	} catch {
		return {};
	}
}

export function normaliseError(error: unknown): NormalisedError {
	if (!error) {
		return {
			kind: "server",
			title: TITLES.server,
			message: FALLBACKS.server,
			requiresReauth: false,
			fieldErrors: {},
		};
	}

	const anyError = error as any;
	const shape = anyError?.data ?? anyError?.shape?.data ?? null;
	const rawMessage: string | undefined = anyError?.message;

	let kind =
		kindFromHttpStatus(shape?.httpStatus) ??
		(shape?.code ? kindFromTrpcCode(shape.code) : null) ??
		("server" as ErrorKind);

	// A fetch that never reached the server has no tRPC shape at all.
	if (!shape && typeof rawMessage === "string") {
		if (
			/failed to fetch|networkerror|load failed|econnrefused/i.test(rawMessage)
		) {
			kind = "network";
		} else if (/aborted|timeout/i.test(rawMessage)) {
			kind = "network";
		}
	}

	const fieldErrors = parseFieldErrors(rawMessage);
	const isJsonIssueList = Object.keys(fieldErrors).length > 0;
	if (isJsonIssueList) kind = "validation";

	// Never surface a stack trace or a raw JSON issue array to the user.
	const looksInternal =
		!rawMessage ||
		isJsonIssueList ||
		rawMessage.length > 240 ||
		/\n\s+at\s/.test(rawMessage);

	return {
		kind,
		title: TITLES[kind],
		message: looksInternal ? FALLBACKS[kind] : rawMessage,
		requiresReauth: kind === "unauthorized",
		fieldErrors,
	};
}
