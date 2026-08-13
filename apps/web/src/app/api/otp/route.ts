import { NextResponse } from "next/server";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { action, phone, code, sessionInfo, orderId } = body;

		if (!firebaseApiKey) {
			throw new Error(
				"Firebase public API key is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in the server environment.",
			);
		}

		if (!phone) {
			return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
		}

		if (action === "send") {
			const res = await fetch(
				`https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${firebaseApiKey}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						phoneNumber: phone,
					}),
				},
			);

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error?.message || "Failed to send OTP");
			}

			return NextResponse.json({
				success: true,
				phoneNumber: phone,
				sessionInfo: data.sessionInfo ?? `otp:${orderId ?? "delivery"}:${phone}`,
			});
		}

		if (action === "verify") {
			if (!code || !sessionInfo) {
				return NextResponse.json({ error: "Code and session are required." }, { status: 400 });
			}

			const res = await fetch(
				`https://identitytoolkit.googleapis.com/v1/accounts:verifyPhoneNumber?key=${firebaseApiKey}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						code,
						sessionInfo,
					}),
				},
			);

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error?.message || "OTP verification failed");
			}

			return NextResponse.json({
				success: true,
				message: "OTP verified successfully",
				orderId,
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown OTP error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
