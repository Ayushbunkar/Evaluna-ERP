"use server";

import { user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateProfileAction(formData: FormData) {
	const reqHeaders = await headers();
	const session = await auth.api.getSession({ headers: reqHeaders });

	if (!session?.user?.id) {
		return { success: false, error: "Unauthorized. Please sign in." };
	}

	const dateOfBirth = formData.get("date_of_birth") as string | null;
	const locale = formData.get("locale") as string | null;
	const givenName = formData.get("given_name") as string | null;
	const familyName = formData.get("family_name") as string | null;

	// Server-side strict authorization barrier:
	// Normal users CANNOT modify security-sensitive fields:
	// emailVerified, role, status, is_superadmin, staff_id, etc.
	// Only safe personal details are permitted to be updated.
	const updatePayload: Record<string, any> = {};

	if (dateOfBirth !== null && dateOfBirth !== undefined) {
		const trimmedDob = dateOfBirth.trim();
		if (trimmedDob && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDob)) {
			return {
				success: false,
				error: "Invalid date of birth format. Please use YYYY-MM-DD.",
			};
		}
		updatePayload.date_of_birth = trimmedDob || null;
	}

	if (locale !== null && locale !== undefined) {
		const cleanLocale = locale.trim().slice(0, 10);
		if (cleanLocale) {
			updatePayload.locale = cleanLocale;
		}
	}

	if (
		givenName !== null &&
		givenName !== undefined &&
		givenName.trim().length > 0
	) {
		updatePayload.given_name = givenName.trim().slice(0, 100);
	}

	if (familyName !== null && familyName !== undefined) {
		updatePayload.family_name = familyName.trim().slice(0, 100) || null;
	}

	// Update full display name if given or family name changed
	if (updatePayload.given_name) {
		updatePayload.name = updatePayload.family_name
			? `${updatePayload.given_name} ${updatePayload.family_name}`
			: updatePayload.given_name;
	}

	updatePayload.updatedAt = new Date();

	try {
		await db
			.update(userTable)
			.set(updatePayload as any)
			.where(eq(userTable.id, session.user.id));

		try {
			revalidatePath("/profile");
		} catch {}

		return { success: true };
	} catch (err: any) {
		console.error("Profile update error:", err);
		return {
			success: false,
			error: err?.message || "Failed to update profile information.",
		};
	}
}
