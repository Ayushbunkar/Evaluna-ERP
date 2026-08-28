const fs = require("fs");
const path = "D:/Evaluna ERP/turbo.json";
const content = fs.readFileSync(path, "utf8");
const lines = content.split("\n");
// lines are 0-indexed
// we want to replace lines 6 through 11 inclusive (the env array)
// line 6: index 6 = "\t\t\t\"env\": ["
// line 7: index 7 = "\t\t\t\t\"DATABASE_URL\","
// line 8: index 8 = "\t\t\t\t\"BETTER_AUTH_SECRET\","
// line 9: index 9 = "\t\t\t\t\"BETTER_AUTH_URL\","
// line 10: index 10 = "\t\t\t\t\"NEXT_PUBLIC_APP_URL\""
// line 11: index 11 = "\t\t\t],"
const newLines = [
	'\t\t\t"env": [',
	'\t\t\t\t"DATABASE_URL",',
	'\t\t\t\t"BETTER_AUTH_SECRET",',
	'\t\t\t\t"BETTER_AUTH_URL",',
	'\t\t\t\t"NEXT_PUBLIC_APP_URL",',
	'\t\t\t\t"BASE_URL",',
	'\t\t\t\t"NODE_ENV",',
	'\t\t\t\t"FIREBASE_PROJECT_ID",',
	'\t\t\t\t"FIREBASE_CLIENT_EMAIL",',
	'\t\t\t\t"FIREBASE_PRIVATE_KEY",',
	"\t\t\t]",
];
spliceArgs = [6, 6]; // start at index 6, delete 6 lines
// Actually we want to replace 6 lines (indices 6-11) with 11 new lines.
// We'll use splice: lines.splice(6, 6, ...newLines);
lines.splice(6, 6, ...newLines);
fs.writeFileSync(path, lines.join("\n"));
