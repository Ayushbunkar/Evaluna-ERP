const fs = require("fs");
const path = require("path");

const routersDir = path.join(__dirname, "../src/lib/trpc/routers");
const files = fs.readdirSync(routersDir).filter((f) => f.endsWith(".ts"));

let changedFiles = 0;

for (const file of files) {
	const filePath = path.join(routersDir, file);
	let content = fs.readFileSync(filePath, "utf-8");
	const original = content;

	// Replace `.toLocaleString()` with `new Date(...).toLocaleString()`
	// We need to be careful with optional chaining like `tx.created_at?.toLocaleString()`
	content = content.replace(
		/([a-zA-Z0-9_.]+)\?\.toLocaleString\(\)/g,
		"(new Date($1)).toLocaleString()",
	);
	content = content.replace(
		/([a-zA-Z0-9_.]+)\.toLocaleString\(\)/g,
		"(new Date($1)).toLocaleString()",
	);

	// Replace `.toISOString()`
	content = content.replace(
		/([a-zA-Z0-9_.]+)\?\.toISOString\(\)/g,
		"(new Date($1)).toISOString()",
	);
	content = content.replace(
		/([a-zA-Z0-9_.]+)\.toISOString\(\)/g,
		"(new Date($1)).toISOString()",
	);

	// For `new Date(new Date(...))` it might become nested, so clean up:
	content = content.replace(/new Date\(new Date\((.*?)\)\)/g, "new Date($1)");
	content = content.replace(/\(new Date\(new Date\(\)\)\)/g, "new Date()");

	// Fix any `new Date(r.date ? r.date : new Date())` issues if any created

	if (content !== original) {
		fs.writeFileSync(filePath, content, "utf-8");
		console.log("Fixed dates in", file);
		changedFiles++;
	}
}

console.log("Done! Changed files:", changedFiles);
