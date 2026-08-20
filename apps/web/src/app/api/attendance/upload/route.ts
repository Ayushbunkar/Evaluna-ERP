import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-guard";
import {
	ATTENDANCE_ENTITY,
	storeAttendanceImage,
} from "@/lib/attendance-storage";
import { db } from "@/lib/db";

/**
 * Live attendance image upload (check-in / check-out selfie).
 *
 * The frontend is expected to capture this from a LIVE camera stream
 * (getUserMedia), not a gallery pick — liveness cannot be fully proven
 * server-side, so we store capture metadata and let risk scoring flag
 * anomalies rather than claiming guaranteed liveness. Hardening (MIME
 * whitelist, size cap, random stored name, private root) is handled in
 * storeAttendanceImage, mirroring the Finance upload route.
 *
 * Returns { id } — the attachment id the client then passes to the
 * attendance.checkIn / checkOut mutation. Each call creates a NEW attachment;
 * images are never overwritten.
 */
export async function POST(req: Request) {
	const user = await getAuthUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let form: FormData;
	try {
		form = await req.formData();
	} catch {
		return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
	}

	const file = form.get("file");
	const kind = String(form.get("kind") || "checkIn");
	if (!(file instanceof File))
		return NextResponse.json({ error: "No image provided" }, { status: 400 });

	const entityType =
		kind === "checkOut" ? ATTENDANCE_ENTITY.checkOut : ATTENDANCE_ENTITY.checkIn;

	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		const result = await storeAttendanceImage(db, {
			buffer,
			mime: file.type,
			originalName: file.name || "attendance.jpg",
			branchId: user.branchId ?? null,
			entityType,
			uploadedBy: user.userId,
		});
		return NextResponse.json({ id: result.id });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Upload failed";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
