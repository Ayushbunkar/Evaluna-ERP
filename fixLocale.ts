import { readFileSync, writeFileSync } from "fs";

const files = [
	"apps/web/src/app/(dashboards)/admin/dashboard/page.tsx",
	"apps/web/src/app/(dashboards)/admin/finance/page.tsx",
	"apps/web/src/app/(dashboards)/admin/settings/activity-log/page.tsx",
	"apps/web/src/app/(dashboards)/admin/settings/page.tsx",
];

for (const f of files) {
	let c = readFileSync(f, "utf8");
	// Remove the import line
	c = c.replace(
		/import\s*\{\s*useLocale\s*\}\s*from\s*["']next-intl["'];\n?/g,
		"",
	);
	// Replace the hook call with hardcoded value
	c = c.replace(
		/const locale = useLocale\(\);/g,
		`const locale = "en"; // hardcoded — no next-intl provider in admin layout`,
	);
	writeFileSync(f, c);
	console.log("Fixed:", f);
}
