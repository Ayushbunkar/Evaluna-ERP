/**
 * Attendance image retention job.
 *
 * Deletes attendance check-in / check-out image FILES older than
 * ATTENDANCE_IMAGE_RETENTION_DAYS (default 30) while KEEPING the attachment
 * metadata rows for the audit trail. Idempotent — safe to run daily from cron
 * / a scheduled task.
 *
 * Run: cd apps/web && bun scripts/attendance-retention.ts
 */
import {
	purgeExpiredImages,
	retentionDays,
} from "../src/lib/attendance-storage";
import { db } from "../src/lib/db/index";

async function main() {
	console.log(
		`Purging attendance images older than ${retentionDays()} days (metadata retained)…`,
	);
	const purged = await purgeExpiredImages(db);
	console.log(`Done. ${purged} image file(s) removed.`);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
